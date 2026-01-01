import type { InitOutput, SyncInitInput } from "./zig_fmt.js";

export type { default } from "./zig_fmt.js";
export type * from "./zig_fmt.js";

/**
* Instantiates the given `module`, which can either be bytes or a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module?: SyncInitInput): InitOutput;
