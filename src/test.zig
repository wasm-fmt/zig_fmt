const std = @import("std");
const main = @import("main.zig");
const config = @import("config.zig");
const update = config.update;

// Use `zig build test -Dupdate=true` to update snapshots.
test "format test_data files" {
    const allocator = std.testing.allocator;

    var test_dir = std.fs.cwd().openDir("test_data", .{ .iterate = true }) catch |err| {
        std.debug.print("Failed to open test_data directory: {}\n", .{err});
        return err;
    };
    defer test_dir.close();

    var iter = test_dir.iterate();
    var test_count: usize = 0;

    while (try iter.next()) |entry| {
        if (entry.kind != .file) continue;
        if (!std.mem.endsWith(u8, entry.name, ".input")) continue;

        const basename = entry.name[0 .. entry.name.len - ".input".len];
        const expect_name = try std.fmt.allocPrint(allocator, "{s}.expect", .{basename});
        defer allocator.free(expect_name);

        // Read input file (with sentinel for Ast.parse)
        const input = test_dir.readFileAllocOptions(allocator, entry.name, 1024 * 1024, null, .@"1", 0) catch |err| {
            std.debug.print("Failed to read {s}: {}\n", .{ entry.name, err });
            return err;
        };
        defer allocator.free(input);

        // Format
        const actual = main.formatSource(allocator, input) catch |err| {
            std.debug.print("Failed to format {s}: {}\n", .{ entry.name, err });
            return err;
        };
        defer allocator.free(actual);

        if (update) {
            // Update mode: write actual output to expect file
            test_dir.writeFile(.{ .sub_path = expect_name, .data = actual }) catch |err| {
                std.debug.print("Failed to write {s}: {}\n", .{ expect_name, err });
                return err;
            };
            std.debug.print("Updated {s}\n", .{expect_name});
        } else {
            // Test mode: compare with expected
            const expected = test_dir.readFileAlloc(allocator, expect_name, 1024 * 1024) catch |err| {
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

    if (update) {
        std.debug.print("Updated {d} snapshot(s)\n", .{test_count});
    } else {
        std.debug.print("Passed {d} test(s)\n", .{test_count});
    }
    try std.testing.expect(test_count > 0);
}
