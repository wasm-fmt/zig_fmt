const std = @import("std");

pub fn main() !void {
    var arena_instance = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena_instance.deinit();
    const arena = arena_instance.allocator();
    const gpa = arena;

    const stdin = std.io.getStdIn();
    const source_code = try std.zig.readSourceFileToEndAlloc(gpa, stdin, null);
    defer gpa.free(source_code);

    var tree = try std.zig.Ast.parse(gpa, source_code, .zig);
    defer tree.deinit(gpa);

    const formatted = try tree.render(gpa);
    defer gpa.free(formatted);
    return std.io.getStdOut().writeAll(formatted);
}
