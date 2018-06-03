#include "context.h"
#include <emscripten.h>
#include <cstdlib>
#include <cstdio>
#include <cstring>

using namespace gambatte;

struct Context* ctx = nullptr;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void gambatte_boot()
{
    ctx = new Context();
    ctx->video_buffer = (uint8_t*)malloc(VIDEO_BUFFER_SIZE);
    ctx->audio_buffer = (int16_t*)malloc(AUDIO_BUFFER_SIZE);
    for(unsigned i = 0; i < VIDEO_BUFFER_SIZE; ++i)
    {
        unsigned off = i%4;
        if(off == 3) ctx->video_buffer[i] = 0xFF;
        else ctx->video_buffer[i] = 0x00;
    }
    ctx->rom_data = nullptr;
    ctx->rom_size = 0;
    memset(ctx->title, 0, sizeof(ctx->title));
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
uint8_t* gambatte_get_video_buffer()
{
    return ctx->video_buffer;
}

EMSCRIPTEN_KEEPALIVE
int16_t* gambatte_get_audio_buffer()
{
    return ctx->audio_buffer;
}

EMSCRIPTEN_KEEPALIVE
char* gambatte_get_title()
{
    return ctx->title;
}

EMSCRIPTEN_KEEPALIVE
int gambatte_run_frame()
{
    std::size_t samples = AUDIO_BUFFER_LENGTH;
    std::ptrdiff_t diff = ctx->gb.runFor(
        (std::uint_least32_t*)ctx->video_buffer, VIDEO_PITCH,
        (std::uint_least32_t*)ctx->audio_buffer, samples
    );
    for(unsigned i = 0; i < VIDEO_BUFFER_SIZE; i+=4)
    {
        uint8_t tmp = ctx->video_buffer[i];
        ctx->video_buffer[i] = ctx->video_buffer[i+2];
        ctx->video_buffer[i+2] = tmp;
        ctx->video_buffer[i+3] = 0xFF;
    }
    return diff;
}

EMSCRIPTEN_KEEPALIVE
int gambatte_upload_rom()
{
    LoadRes res = ctx->gb.load("This text should not matter, at all.");
    strcpy(ctx->title, ctx->gb.romTitle().c_str());
    return res;
}

EMSCRIPTEN_KEEPALIVE
void gambatte_reset()
{
    ctx->gb.reset();
}

}
