import fs from "node:fs/promises";
import initAsync from "./zig_fmt.js";

const wasm = new URL("./zig_fmt.wasm", import.meta.url);

export default function __wbg_init(init = fs.readFile(wasm)) {
	return initAsync(init);
}

export * from "./zig_fmt.js";
