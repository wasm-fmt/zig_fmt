const std = @import("std");

pub fn build(b: *std.Build) void {
    const exe = b.addExecutable(.{
        .name = "zig_fmt",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/main.zig"),
            .target = b.resolveTargetQuery(.{
                .cpu_arch = .wasm32,
                .os_tag = .freestanding,
            }),
            .optimize = .ReleaseSmall,
        }),
    });
    exe.entry = .disabled;
    exe.rdynamic = true;

    b.installArtifact(exe);

    const wasm_merge = b.addSystemCommand(&.{
        "wasm-merge",
        "--enable-bulk-memory-opt",
        "--enable-multivalue",
        "zig-out/bin/zig_fmt.wasm",
        "zig_fmt",
        "src/binding.wat",
        "binding",
        "-o",
        "zig_fmt.wasm",
    });
    wasm_merge.step.dependOn(&exe.step);
    const install_step = b.getInstallStep();
    install_step.dependOn(&wasm_merge.step);

    const update = b.option(bool, "update", "Update snapshot expectations") orelse false;

    // Native tests (runs on host, not wasm)
    const unit_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/test.zig"),
            .target = b.graph.host,
            .imports = &.{
                .{ .name = "config.zig", .module = blk: {
                    const options = b.addOptions();
                    options.addOption(bool, "update", update);
                    break :blk options.createModule();
                } },
            },
        }),
    });

    const run_unit_tests = b.addRunArtifact(unit_tests);
    const test_step = b.step("test", "Run snapshot tests");
    test_step.dependOn(&run_unit_tests.step);
}
