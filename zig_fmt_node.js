import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import initAsync, { initSync as initSyncImpl } from "./zig_fmt.js";

const wasm = new URL("./zig_fmt.wasm", import.meta.url);

export default function __wbg_init(init = readFile(wasm)) {
	return initAsync(init);
}

export function initSync(module = readFileSync(wasm)) {
	return initSyncImpl(module);
}

export * from "./zig_fmt.js";
