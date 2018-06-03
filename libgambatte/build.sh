#! /bin/bash

cd "${0%/*}"
meson build --cross-file emscripten_cross_file.txt
ninja -C build || exit 1
mkdir -p ../lib/wasm
cp build/gambatte.js build/gambatte.wasm ../lib/wasm

