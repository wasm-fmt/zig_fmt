/* @ts-self-types="./zig_fmt.d.ts" */
import * as wasm from "./zig_fmt.wasm";
import { format as _format } from "./zig_fmt_binding.js";

export function format(source, filepath) {
	return _format(wasm, source, filepath);
}
