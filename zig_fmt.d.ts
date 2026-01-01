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

export type SyncInitInput = BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly format: (a: number, b: number) => [number, number];
}

/**
 * If `init` is {RequestInfo} or {URL}, makes a request and 
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {InitInput | Promise<InitInput>} init
 *
 * @returns {Promise<void>}
 */
export default function init(init?: InitInput | Promise<InitInput>): Promise<InitOutput>;

/**
* Instantiates the given `module`, which can either be bytes or a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;
