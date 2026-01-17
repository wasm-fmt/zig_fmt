/* @ts-self-types="./zig_fmt_web.d.ts" */
import init from "./zig_fmt.wasm?init";
import initAsync from "./zig_fmt_web.js";
import { format as _format } from "./zig_fmt_binding.js";

let wasm, wasmModule;

function finalize_init(instance, module) {
	wasm = instance.exports;
	wasmModule = module;
	return wasm;
}

export default async function initAsync() {
	if (wasm !== void 0) return wasm;
	const instance = await init();
	return finalize_init(instance);
}

export function initSync(module) {
	if (wasm !== void 0) return wasm;

	if (!(module instanceof WebAssembly.Module)) {
		module = new WebAssembly.Module(module);
	}
	const instance = new WebAssembly.Instance(module);
	return finalize_init(instance, module);
}

export function format(source, path, options) {
	return _format(wasm, source, path, options);
}
