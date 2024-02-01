let wasm;

export default async function init(input) {
	if (wasm !== undefined) return wasm;

	if (typeof input === "undefined") {
		input = new URL("zig_fmt.wasm", import.meta.url);
	}

	if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
		input = fetch(input);
	}

	const imports = get_imports();

	const { instance, module } = await load(await input, imports);

	return finalize_init(instance, module);
}

async function load(module, imports) {
	if (typeof Response === "function" && module instanceof Response) {
		if (typeof WebAssembly.instantiateStreaming === "function") {
			try {
				return await WebAssembly.instantiateStreaming(module, imports);
			} catch (e) {
				if (module.headers.get("Content-Type") != "application/wasm") {
					console.warn(
						"`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
						e,
					);
				} else {
					throw e;
				}
			}
		}

		const bytes = await module.arrayBuffer();
		return await WebAssembly.instantiate(bytes, imports);
	} else {
		const instance = await WebAssembly.instantiate(module, imports);

		if (instance instanceof WebAssembly.Instance) {
			return { instance, module };
		} else {
			return instance;
		}
	}
}

function finalize_init(instance, module) {
	wasm = instance.exports;

	return wasm;
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const WASI_ESUCCESS = 0;
const WASI_EBADF = 8;

function get_imports() {
	return {
		wasi_snapshot_preview1: {
			fd_write(fd, iovs_ptr, iovs_len, nwritten_ptr) {
				switch (fd) {
					case 1:
					case 2: {
						const buffer = new DataView(wasm.memory.buffer);
						const buffer8 = new Uint8Array(wasm.memory.buffer);

						const iovecs = read_bytes_array(buffer, iovs_ptr, iovs_len);

						const nwritten = fds[fd].fd_write(buffer8, iovecs);
						buffer.setUint32(nwritten_ptr, nwritten, true);
						return WASI_ESUCCESS;
					}
					default:
						return WASI_EBADF;
				}
			},
			fd_read(fd, iovs_ptr, iovs_len, nread_ptr) {
				if (fd !== 0) {
					return WASI_EBADF;
				}

				const buffer = new DataView(wasm.memory.buffer);
				const buffer8 = new Uint8Array(wasm.memory.buffer);

				const iovecs = read_bytes_array(buffer, iovs_ptr, iovs_len);

				const nread = fds[fd].fd_read(buffer8, iovecs);
				buffer.setUint32(nread_ptr, nread, true);
				return WASI_ESUCCESS;
			},
			proc_exit(rval) {
				return_value = rval;
				return WASI_ESUCCESS;
			},
		},
	};
}

function read_bytes(view, ptr) {
	const buf = view.getUint32(ptr, true);
	const len = view.getUint32(ptr + 4, true);
	return [buf, len];
}

function read_bytes_array(view, iovs_ptr, iovs_len) {
	const iovecs = [];
	for (let i = 0; i < iovs_len; i++) {
		iovecs.push(read_bytes(view, iovs_ptr + 8 * i));
	}
	return iovecs;
}

class StdIO {
	data = new Uint8Array();
	position = 0;

	set string(input) {
		this.data = encoder.encode(input);
		this.position = 0;
	}

	get string() {
		return decoder.decode(this.data);
	}

	fd_read(view8, iovs) {
		let nread = 0;

		for (const [ptr, len] of iovs) {
			const buf = new Uint8Array(view8.buffer, ptr, len);
			const data = this.data.subarray(this.position, this.position + len);
			buf.set(data);
			this.position += data.length;
			nread += data.length;
		}

		return nread;
	}

	fd_write(view8, iovs) {
		const total_len = iovs.reduce((acc, [_, len]) => acc + len, 0);
		const data = new Uint8Array(total_len);

		let nwritten = 0;
		for (const [ptr, len] of iovs) {
			const buf = new Uint8Array(view8.buffer, ptr, len);
			data.set(buf, nwritten);
			nwritten += buf.length;
		}

		if (this.data) {
			const new_data = new Uint8Array(this.data.length + data.length);
			new_data.set(this.data);
			new_data.set(data, this.data.length);
			this.data = new_data;
		} else {
			this.data = data;
		}

		return nwritten;
	}

	dispose() {
		this.data = undefined;
		this.position = 0;
	}
}

const fds = [
	new StdIO(), // stdin
	new StdIO(), // stdout
	new StdIO(), // stderr
];

let return_value = 0;

export function format(input) {
	fds[0].string = input;
	let stdout, stderr, error;

	try {
		wasm._start();
	} catch (err) {
		error = err;
	} finally {
		stdout = fds[1].string;
		stderr = fds[2].string;
		fds.forEach((fd) => fd.dispose());
	}

	if (return_value !== 0) {
		throw Error(stderr);
	}

	return stdout;
}
