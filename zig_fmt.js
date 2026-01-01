/* @ts-self-types="./zig_fmt.d.ts" */
let wasm;

export default async function init(input) {
	if (wasm !== undefined) return wasm;

	if (typeof input === "undefined") {
		input = new URL("zig_fmt.wasm", import.meta.url);
	}

	if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
		input = fetch(input);
	}

	const { instance, module } = await load(await input, {});

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

export function format(input) {
	const bytes = encoder.encode(input);

	const inputPtr = wasm.alloc(bytes.length);
	if (inputPtr === 0) {
		throw new Error("Failed to allocate memory");
	}

	new Uint8Array(wasm.memory.buffer, inputPtr, bytes.length).set(bytes);

	const [outPtr, outLen] = wasm.format(inputPtr, bytes.length);

	if (outPtr === 0) {
		wasm.free_all();
		throw new Error("Format failed");
	}

	const output = decoder.decode(
		new Uint8Array(wasm.memory.buffer, outPtr, outLen),
	);

	wasm.free_all();
	return output;
}
