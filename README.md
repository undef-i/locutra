# LOCUTRA

A geography quiz game for learning Chinese administrative divisions.

## Quick Start

Requirements:
- Node.js >= 18
- Modern browser

Quick start with pre-compiled WebAssembly:
```bash
SKIP_RUST=true npm install
npm run build:web
npm run dev
```

For WebAssembly development:
```bash
npm install
npm run build
```
> The current WASM implementation unnecessarily bundles Brotli-compressed data with decompression logic. This adds complexity without tangible benefits, as compression should be handled at the server level. This flawed approach will be removed in future versions.

## License

[GNU AGPL v3.0](LICENSE)
