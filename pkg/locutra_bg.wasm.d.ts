/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const get_geo_data: () => [number, number];
export const BrotliDecoderCreateInstance: (a: number, b: number, c: number) => number;
export const BrotliDecoderSetParameter: (a: number, b: number, c: number) => void;
export const BrotliDecoderDecompressPrealloc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
export const BrotliDecoderDecompressWithReturnInfo: (a: number, b: number, c: number, d: number, e: number) => void;
export const BrotliDecoderDecompress: (a: number, b: number, c: number, d: number) => number;
export const BrotliDecoderDecompressStream: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
export const BrotliDecoderDecompressStreaming: (a: number, b: number, c: number, d: number, e: number) => number;
export const BrotliDecoderMallocU8: (a: number, b: number) => number;
export const BrotliDecoderFreeU8: (a: number, b: number, c: number) => void;
export const BrotliDecoderMallocUsize: (a: number, b: number) => number;
export const BrotliDecoderFreeUsize: (a: number, b: number, c: number) => void;
export const BrotliDecoderDestroyInstance: (a: number) => void;
export const BrotliDecoderHasMoreOutput: (a: number) => number;
export const BrotliDecoderTakeOutput: (a: number, b: number) => number;
export const BrotliDecoderIsUsed: (a: number) => number;
export const BrotliDecoderIsFinished: (a: number) => number;
export const BrotliDecoderGetErrorCode: (a: number) => number;
export const BrotliDecoderGetErrorString: (a: number) => number;
export const BrotliDecoderErrorString: (a: number) => number;
export const BrotliDecoderVersion: () => number;
export const __wbindgen_export_0: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_start: () => void;
