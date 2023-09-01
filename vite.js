import init from "./zig.js";
import wasm from "./zig_bg.wasm?url";

export default function vite_init(input = wasm) {
	return init(input);
}

export * from "./zig.js";
