/* @ts-self-types="./zig_fmt.d.ts" */
// prettier-ignore
import source wasmModule from "./zig_fmt.wasm";
import { format as _format } from "./zig_fmt_binding.js";

/**
 * @import * as WASM from "./zig_fmt.d.wasm.ts"
 */

const instance = new WebAssembly.Instance(wasmModule);

/**
 * @type {WASM}
 */
const wasm = instance.exports;

export function format(source) {
	return _format(wasm, source);
}
