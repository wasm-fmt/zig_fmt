const std = @import("std");
const main = @import("main.zig");
const config = @import("config.zig");
const update = config.update;
const io = std.testing.io;

// Use `zig build test -Dupdate=true` to update snapshots.
test "format test_data files" {
    const allocator = std.testing.allocator;

    var test_dir = std.Io.Dir.cwd().openDir(io, "test_data", .{ .iterate = true }) catch |err| {
        std.debug.print("Failed to open test_data directory: {}\n", .{err});
        return err;
    };
    defer test_dir.close(io);

    var iter = test_dir.iterate();
    var test_count: usize = 0;

    while (try iter.next(io)) |entry| {
        if (entry.kind != .file) continue;
        const is_zig = std.mem.endsWith(u8, entry.name, ".zig");
        const is_zon = std.mem.endsWith(u8, entry.name, ".zon");
        if (!is_zig and !is_zon) continue;

        const expect_name = try std.fmt.allocPrint(allocator, "{s}.expect", .{entry.name});
        defer allocator.free(expect_name);

        // Read input file (with sentinel for Ast.parse)
        const input = test_dir.readFileAllocOptions(io, entry.name, allocator, .limited(1024 * 1024), .@"1", 0) catch |err| {
            std.debug.print("Failed to read {s}: {}\n", .{ entry.name, err });
            return err;
        };
        defer allocator.free(input);
        const mode: std.zig.Ast.Mode = if (is_zon) .zon else .zig;

        // Format
        const actual = main.formatSource(allocator, input, mode) catch |err| {
            std.debug.print("Failed to format {s}: {}\n", .{ entry.name, err });
            return err;
        };
        defer allocator.free(actual);

        if (update) {
            // Update mode: write actual output to expect file
            test_dir.writeFile(io, .{ .sub_path = expect_name, .data = actual }) catch |err| {
                std.debug.print("Failed to write {s}: {}\n", .{ expect_name, err });
                return err;
            };
        } else {
            // Test mode: compare with expected
            const expected = test_dir.readFileAlloc(io, expect_name, allocator, .limited(1024 * 1024)) catch |err| {
                std.debug.print("Failed to read {s}: {}\n", .{ expect_name, err });
                return err;
            };
            defer allocator.free(expected);

            if (!std.mem.eql(u8, actual, expected)) {
                std.debug.print("\n=== MISMATCH in {s} ===\n", .{entry.name});
                std.debug.print("Expected:\n{s}\n", .{expected});
                std.debug.print("Actual:\n{s}\n", .{actual});
                return error.TestExpectedEqual;
            }
        }

        test_count += 1;
    }

    try std.testing.expect(test_count > 0);
}
