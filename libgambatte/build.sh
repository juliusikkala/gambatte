#! /bin/bash

cd "${0%/*}"
meson build --cross-file emscripten_cross_file.txt
ninja -C build
cp build/gambatte.js build/gambatte.wasm ../lib/

