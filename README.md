[![Test](https://github.com/wasm-fmt/zig_fmt/actions/workflows/test.yml/badge.svg)](https://github.com/wasm-fmt/zig_fmt/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/@wasm-fmt/zig_fmt)](https://www.npmjs.com/package/@wasm-fmt/zig_fmt)

# Install

```bash
npm install @wasm-fmt/zig_fmt
```

# Usage

```javascript
import init, { format } from "@wasm-fmt/zig_fmt";

await init();

const input = `
const std = @import("std");

pub fn main() !void 
{
  const stdout = std.io.getStdOut().writer();
  var i: usize = 1;
  while (i <= 16) : (i += 1) 
    {
        if (i % 15 == 0) 
      {
        try stdout.writeAll("ZiggZagg\\n");
      } else 
        if (i % 3 == 0) 
      {
        try stdout.writeAll("Zigg\\n");
      } else 
        if (i % 5 == 0) 
      {
        try stdout.writeAll("Zagg\\n");
      }
        else 
      {
        try stdout.print("{d}\\n", .{i});
      }
    }
}
`;

const formatted = format(input);
console.log(formatted);
```

For Vite users:

```JavaScript
import init, { format } from "@wasm-fmt/zig_fmt/vite";

// ...
```
