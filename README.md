[![Test](https://github.com/wasm-fmt/zig_fmt/actions/workflows/test.yml/badge.svg)](https://github.com/wasm-fmt/zig_fmt/actions/workflows/test.yml)

# Install

[![npm](https://img.shields.io/npm/v/@wasm-fmt/zig_fmt?color=ec915c)](https://www.npmjs.com/package/@wasm-fmt/zig_fmt)

```bash
npm install @wasm-fmt/zig_fmt
```

[![jsr.io](https://jsr.io/badges/@fmt/zig-fmt?color=ec915c)](https://jsr.io/@fmt/zig-fmt)

```bash
npx jsr add @fmt/zig-fmt
```

# Usage

## Node.js / Deno / Bun / Bundler

```javascript
import { format } from "@wasm-fmt/zig_fmt";

const source = `
const std = @import("std");
pub fn main() !void {
    std.debug.print("Hello, 世界", .{});
}
`;

const formatted = format(source);
console.log(formatted);
```

## Web

For web environments, you need to initialize WASM module manually:

```javascript
import init, { format } from "@wasm-fmt/zig_fmt/web";

await init();

const source = `
const std = @import("std");
pub fn main() !void {
    std.debug.print("Hello, 世界", .{});
}
`;

const formatted = format(source);
console.log(formatted);
```

### Vite

```JavaScript
import init, { format } from "@wasm-fmt/zig_fmt/vite";

await init();
// ...
```

## Entry Points

- `.` - Auto-detects environment (Node.js uses node, Webpack uses bundler, default is ESM)
- `./node` - Node.js environment (no init required)
- `./esm` - ESM environments like Deno (no init required)
- `./bundler` - Bundlers like Webpack (no init required)
- `./web` - Web browsers (requires manual init)
- `./vite` - Vite bundler (requires manual init)

# Build from source

```bash
# 1. install Zig https://ziglang.org/download/

# 2. clone this repo
git clone https://github.com/wasm-fmt/zig_fmt.git

# 3. build
npm run build

# 4. test
npm run test:node
```
