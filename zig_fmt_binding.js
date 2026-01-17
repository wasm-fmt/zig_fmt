/**
 * @import * as WASM from "./zig_fmt.d.wasm.ts"
 */

/**
 * @param {WASM} wasm
 * @param {string} source
 * @return {string}
 */
export function format(wasm, source) {
	const in_ptr = writeString(wasm, source);
	try {
		const out_ptr = wasm.format(in_ptr);
		return readString(wasm, out_ptr);
	} finally {
		wasm.free_all();
	}
}

/**
 * @param {WASM} wasm
 * @param {string} str
 * @returns {number}
 */
function writeString(wasm, str) {
	const bytes = encoder.encode(str);
	const ptr = wasm.alloc(4 + bytes.length);
	if (ptr === 0) {
		throw new Error("Failed to allocate memory");
	}
	new DataView(wasm.memory.buffer).setUint32(ptr, bytes.length, true);
	new Uint8Array(wasm.memory.buffer, ptr + 4, bytes.length).set(bytes);
	return ptr;
}

/**
 * @param {WASM} wasm
 * @param {number} ptr
 * @returns {string}
 */
function readString(wasm, ptr) {
	if (ptr === 0) {
		throw new Error("Format failed");
	}
	const len = new DataView(wasm.memory.buffer).getUint32(ptr, true);
	return decoder.decode(new Uint8Array(wasm.memory.buffer, ptr + 4, len));
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
