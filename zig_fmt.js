/* @ts-self-types="./zig_fmt.d.ts" */
let wasm, wasmModule;

export default async function init(input) {
	if (wasm !== void 0) return wasm;

	if (input === void 0) {
		input = new URL("zig_fmt.wasm", import.meta.url);
	}

	if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
		input = fetch(input);
	}

	const { instance, module } = await load(await input);

	return finalize_init(instance, module);
}

export function initSync(module) {
	if (wasm !== void 0) return wasm;

	if (!(module instanceof WebAssembly.Module)) {
		module = new WebAssembly.Module(module);
	}
	const instance = new WebAssembly.Instance(module);
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
	wasm = instance.exports, wasmModule = module;
	return wasm;
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function writeString(str) {
	const bytes = encoder.encode(str);
	const ptr = wasm.alloc(4 + bytes.length);
	if (ptr === 0) {
		throw new Error("Failed to allocate memory");
	}
	new DataView(wasm.memory.buffer).setUint32(ptr, bytes.length, true);
	new Uint8Array(wasm.memory.buffer, ptr + 4, bytes.length).set(bytes);
	return ptr;
}

function readString(ptr) {
	if (ptr === 0) {
		throw new Error("Format failed");
	}
	const len = new DataView(wasm.memory.buffer).getUint32(ptr, true);
	return decoder.decode(new Uint8Array(wasm.memory.buffer, ptr + 4, len));
}

export function format(input) {
	const in_ptr = writeString(input);
	try {
		const out_ptr = wasm.format(in_ptr);
		return readString(out_ptr);
	} finally {
		wasm.free_all();
	}
}
