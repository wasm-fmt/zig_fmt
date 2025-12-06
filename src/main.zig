const std = @import("std");

pub fn main() !void {
    var arena_instance = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena_instance.deinit();
    const arena = arena_instance.allocator();
    const gpa = arena;

    var stdin = std.fs.File.stdin().reader(&.{});
    const source_code = try std.zig.readSourceFileToEndAlloc(gpa, &stdin);
    defer gpa.free(source_code);

    var tree = try std.zig.Ast.parse(gpa, source_code, .zig);
    defer tree.deinit(gpa);

    var stdout = std.fs.File.stdout().writer(&.{});
    try tree.render(gpa, &stdout.interface, .{});
    try stdout.interface.flush();
}
