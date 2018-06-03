#include "context.h"
#include <emscripten.h>
#include <cstdlib>
#include <cstdio>

using namespace gambatte;

struct Context* ctx = nullptr;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void gambatte_boot()
{
    ctx = new Context();
    ctx->rom_data = nullptr;
    ctx->rom_size = 0;
}

EMSCRIPTEN_KEEPALIVE
uint8_t* gambatte_allocate_rom(size_t rom_size)
{
    if(ctx->rom_data != nullptr)
        free(ctx->rom_data);
    ctx->rom_data = (uint8_t*)malloc(rom_size);
    ctx->rom_size = rom_size;
    return ctx->rom_data;
}

EMSCRIPTEN_KEEPALIVE
int gambatte_upload_rom()
{
    LoadRes res = ctx->gb.load("This text should not matter, at all.");
    printf("Rom title: %s\n", ctx->gb.romTitle().c_str());
    return res;
}

EMSCRIPTEN_KEEPALIVE
void gambatte_reset()
{
    ctx->gb.reset();
}

}
