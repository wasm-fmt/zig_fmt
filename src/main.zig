const std = @import("std");

var arena_instance: ?std.heap.ArenaAllocator = null;

fn getArena() std.mem.Allocator {
    if (arena_instance == null) {
        arena_instance = std.heap.ArenaAllocator.init(std.heap.wasm_allocator);
    }
    return arena_instance.?.allocator();
}

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

    var tree = std.zig.Ast.parse(arena, source, .zig) catch return 0;
    defer tree.deinit(arena);

    const output = tree.renderAlloc(arena) catch return 0;

    const ptr: u64 = @intFromPtr(output.ptr);
    const len: u64 = output.len;
    return (ptr << 32) | len;
}
