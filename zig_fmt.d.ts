/**
 * @param {string} input
 * @returns {string}
 */
export function format(input: string): string;

export type InitInput =
	| RequestInfo
	| URL
	| Response
	| BufferSource
	| WebAssembly.Module;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {InitInput | Promise<InitInput>} module_or_path
 *
 * @returns {Promise<void>}
 */
export default function init(module_or_path?: InitInput | Promise<InitInput>): Promise<void>;
