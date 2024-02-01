import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import init, { format } from "../zig_fmt_node.js";

await init();

const test_root = fileURLToPath(new URL("../test_data", import.meta.url));

for await (const dirent of await fs.opendir(test_root, { recursive: true })) {
	if (!dirent.isFile()) {
		continue;
	}

	const input_path = dirent.path;
	const ext = path.extname(input_path);

	switch (ext) {
		case ".input":
			break;

		default:
			continue;
	}

	const expect_path = input_path.replace(ext, ".expect");

	const [input, expected] = await Promise.all([
		fs.readFile(input_path, "utf-8"),
		fs.readFile(expect_path, "utf-8"),
	]);

	const test_name = path.relative(test_root, input_path);

	test(test_name, () => {
		const actual = format(input);
		assert.equal(actual, expected);
	});
}
