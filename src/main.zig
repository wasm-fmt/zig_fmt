const std = @import("std");
const builtin = @import("builtin");

const io = std.io;
const fs = std.fs;
const mem = std.mem;
const Allocator = mem.Allocator;
const process = std.process;

pub fn main() !void {
    const stdin = io.getStdIn();
    const stdout = io.getStdOut().writer();

    const allocator = gpa: {
        if (builtin.os.tag == .wasi) {
            break :gpa std.heap.wasm_allocator;
        }
        // We would prefer to use raw libc allocator here, but cannot
        // use it if it won't support the alignment we need.
        if (@alignOf(std.c.max_align_t) < @alignOf(i128)) {
            break :gpa std.heap.c_allocator;
        }
        break :gpa std.heap.raw_c_allocator;
    };

    const source_code = try readSourceFileToEndAlloc(allocator, &stdin, null);

    var tree = try std.zig.Ast.parse(allocator, source_code, .zig);
    defer tree.deinit(allocator);

    const formatted = try tree.render(allocator);
    defer allocator.free(formatted);
    try stdout.writeAll(formatted);
}

const max_src_size = std.math.maxInt(u32);

fn readSourceFileToEndAlloc(
    allocator: Allocator,
    input: *const fs.File,
    size_hint: ?usize,
) ![:0]u8 {
    const source_code = input.readToEndAllocOptions(
        allocator,
        max_src_size,
        size_hint,
        @alignOf(u16),
        0,
    ) catch |err| switch (err) {
        error.ConnectionResetByPeer => unreachable,
        error.ConnectionTimedOut => unreachable,
        error.NotOpenForReading => unreachable,
        else => |e| return e,
    };
    errdefer allocator.free(source_code);

    // Detect unsupported file types with their Byte Order Mark
    const unsupported_boms = [_][]const u8{
        "\xff\xfe\x00\x00", // UTF-32 little endian
        "\xfe\xff\x00\x00", // UTF-32 big endian
        "\xfe\xff", // UTF-16 big endian
    };
    for (unsupported_boms) |bom| {
        if (mem.startsWith(u8, source_code, bom)) {
            return error.UnsupportedEncoding;
        }
    }

    // If the file starts with a UTF-16 little endian BOM, translate it to UTF-8
    if (mem.startsWith(u8, source_code, "\xff\xfe")) {
        const source_code_utf16_le = mem.bytesAsSlice(u16, source_code);
        const source_code_utf8 = std.unicode.utf16leToUtf8AllocZ(allocator, source_code_utf16_le) catch |err| switch (err) {
            error.DanglingSurrogateHalf => error.UnsupportedEncoding,
            error.ExpectedSecondSurrogateHalf => error.UnsupportedEncoding,
            error.UnexpectedSecondSurrogateHalf => error.UnsupportedEncoding,
            else => |e| return e,
        };

        allocator.free(source_code);
        return source_code_utf8;
    }

    return source_code;
}
