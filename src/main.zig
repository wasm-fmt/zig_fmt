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

/// Returns (ptr << 32) | len, or 0 on error.
export fn format(input_ptr: [*]const u8, input_len: usize) u64 {
    const arena = getArena();

    const source = arena.allocSentinel(u8, input_len, 0) catch return 0;
    @memcpy(source, input_ptr[0..input_len]);

    const output = formatSource(arena, source) catch return 0;

    // wasm32 uses 32-bit pointers; on native this will fail at comptime
    const ptr = @as(u32, @intCast(@intFromPtr(output.ptr)));
    const len = @as(u32, @intCast(output.len));
    return (@as(u64, ptr) << 32) | len;
}
