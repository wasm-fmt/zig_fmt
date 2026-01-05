const std = @import("std");
const builtin = @import("builtin");

const is_wasm = builtin.cpu.arch == .wasm32;
const backing_allocator = if (is_wasm) std.heap.wasm_allocator else std.heap.page_allocator;

var arena_instance: ?std.heap.ArenaAllocator = null;

fn getArena() std.mem.Allocator {
    if (arena_instance == null) {
        arena_instance = std.heap.ArenaAllocator.init(backing_allocator);
    }
    return arena_instance.?.allocator();
}

/// Core formatting function.
pub fn formatSource(allocator: std.mem.Allocator, source: [:0]const u8) ![]const u8 {
    var tree = try std.zig.Ast.parse(allocator, source, .zig);
    defer tree.deinit(allocator);
    return try tree.renderAlloc(allocator);
}

// Wasm exports
export fn alloc(len: usize) ?[*]u8 {
    const arena = getArena();
    const slice = arena.alloc(u8, len) catch return null;
    return slice.ptr;
}

export fn free_all() void {
    if (arena_instance) |*arena| {
        arena.deinit();
        arena_instance = null;
    }
}

/// Data layout: [u32: length][u8... data]
/// Returns pointer to formatted output or null on error.
export fn format(input_ptr: [*]const u8) ?[*]u8 {
    const arena = getArena();

    const input_len = std.mem.readInt(u32, input_ptr[0..4], .little);
    const source = arena.allocSentinel(u8, input_len, 0) catch return null;
    @memcpy(source, input_ptr[4 .. 4 + input_len]);

    const output = formatSource(arena, source) catch return null;

    const result = arena.alloc(u8, 4 + output.len) catch return null;
    std.mem.writeInt(u32, result[0..4], @intCast(output.len), .little);
    @memcpy(result[4..], output);

    return result.ptr;
}
