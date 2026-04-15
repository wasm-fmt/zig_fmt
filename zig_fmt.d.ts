/**
 * A wasm based zig formatter
 *
 * @example
 * ```javascript
 * import { format } from "@wasm-fmt/zig_fmt";
 *
 * const source = `
 * const std = @import("std");
 * pub fn main() !void {
 *     std.debug.print("Hello, 世界", .{});
 * }
 * `;
 *
 * const formatted = format(source);
 * ```
 *
 * @module
 */

/**
 * Formats a Zig source code.
 * @param {string} input - The Zig source code to format
 * @param {string} [filename] - Optional file name used to infer format rules (for example, .zig or .zon)
 * @returns {string} The formatted Zig source code
 */
export declare function format(input: string, filename?: string): string;
