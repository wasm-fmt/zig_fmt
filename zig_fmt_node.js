/* @ts-self-types="./zig_fmt.d.ts" */
import { readFileSync } from "node:fs";
import { format as _format } from "./zig_fmt_binding.js";

const wasmUrl = new URL("zig_fmt.wasm", import.meta.url);
const wasmBytes = readFileSync(wasmUrl);
const wasmModule = new WebAssembly.Module(wasmBytes);

/**
 * @import * as WASM from "./zig_fmt.d.wasm.ts"
 */

const instance = new WebAssembly.Instance(wasmModule);
/**
 * @type {WASM}
 */
const wasm = instance.exports;

export function format(source, filepath) {
	return _format(wasm, source, filepath);
}
