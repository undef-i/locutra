use wasm_bindgen::prelude::*;
use lazy_static::lazy_static;

const GEO_DATA: &[u8] = include_bytes!("../data/GeoCN.br");

lazy_static! {
    static ref DECOMPRESSED_DATA: String = {
        let mut decompressed = Vec::new();
        let mut compressed = std::io::Cursor::new(GEO_DATA);
        brotli_decompressor::BrotliDecompress(&mut compressed, &mut decompressed).unwrap();
        String::from_utf8(decompressed).unwrap()
    };
}

#[wasm_bindgen]
pub fn get_geo_data() -> String {
    DECOMPRESSED_DATA.clone()
}