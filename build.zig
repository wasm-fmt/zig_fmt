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
}
