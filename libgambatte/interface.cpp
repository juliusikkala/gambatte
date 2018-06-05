#include "context.h"
#include <emscripten.h>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <cmath>
#define max(a, b) ((a) > (b)?(a):(b))

using namespace gambatte;

struct Context* ctx = nullptr;

#define IN_FRAME_SAMPLES 35112
#define MAX_IN_FRAME_SAMPLES (IN_FRAME_SAMPLES + 2064)
#define IN_SAMPLERATE 2097152

uint8_t* next_frame()
{
    return ctx->video_buffers[ctx->video_buffers_write_head];
}

uint8_t* push_frame()
{
    unsigned prev = ctx->video_buffers_write_head;
    ctx->video_buffers_write_head++;

    if(
        ctx->video_buffers_write_head ==
        sizeof(ctx->video_buffers)/sizeof(uint8_t*)
    ) ctx->video_buffers_write_head = 0;

    return ctx->video_buffers[prev];
}

uint8_t* pop_frame()
{
    if(ctx->video_buffers_read_head == ctx->video_buffers_write_head)
        return nullptr;

    unsigned prev = ctx->video_buffers_read_head;
    ctx->video_buffers_read_head++;

    if(
        ctx->video_buffers_read_head ==
        sizeof(ctx->video_buffers)/sizeof(uint8_t*)
    ) ctx->video_buffers_read_head = 0;

    return ctx->video_buffers[prev];
}

void postprocess_frame(uint8_t* frame)
{
    for(unsigned i = 0; i < VIDEO_BUFFER_SIZE; i+=4)
    {
        uint8_t tmp = frame[i];
        frame[i] = frame[i+2];
        frame[i+2] = tmp;
        frame[i+3] = 0xFF;
    }
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
void gambatte_boot(int out_samplerate, int out_max_samples)
{
    ctx = new Context();
    for(unsigned i = 0; i < sizeof(ctx->video_buffers)/sizeof(uint8_t*); ++i)
    {
        ctx->video_buffers[i] = (uint8_t*)malloc(VIDEO_BUFFER_SIZE);
    }
    ctx->video_buffers_write_head = 0;
    ctx->video_buffers_read_head = 0;

    ctx->out_samplerate = out_samplerate;

    ctx->resampler = ResamplerInfo::get(1).create(
        IN_SAMPLERATE,
        out_samplerate,
        MAX_IN_FRAME_SAMPLES
    );

    ctx->in_size = MAX_IN_FRAME_SAMPLES;
    ctx->in = (int16_t*)malloc(ctx->in_size*2*sizeof(int16_t));

    ctx->resampled_size =
        out_max_samples + ctx->resampler->maxOut(MAX_IN_FRAME_SAMPLES);
    ctx->resampled_head = 0;
    ctx->resampled = (int16_t*)malloc(ctx->resampled_size*2*sizeof(int16_t));

    ctx->out_size = out_max_samples;
    ctx->out = (float*)malloc(ctx->out_size*2*sizeof(float));

    memset(ctx->out, 0, ctx->out_size*2*sizeof(float));

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
uint8_t* gambatte_consume_video_buffer()
{
    return pop_frame();
}

EMSCRIPTEN_KEEPALIVE
float* gambatte_get_audio_buffer()
{
    return ctx->out;
}

EMSCRIPTEN_KEEPALIVE
char* gambatte_get_title()
{
    return ctx->title;
}

EMSCRIPTEN_KEEPALIVE
int gambatte_run_for(int required_samples)
{
    int frames = 0;
    while(ctx->resampled_head < required_samples)
    {
        uint8_t* video_buffer = next_frame();

        size_t tmp_samples = IN_FRAME_SAMPLES;
        std::ptrdiff_t diff = ctx->gb.runFor(
            (std::uint_least32_t*)video_buffer, VIDEO_PITCH,
            (std::uint_least32_t*)ctx->in, tmp_samples
        );

        std::size_t outlen =
            ctx->resampler->resample(
                ctx->resampled + ctx->resampled_head * 2,
                ctx->in,
                tmp_samples
            );
        ctx->resampled_head += outlen;
        
        if(diff > 0)
        {
            frames++;
            postprocess_frame(video_buffer);
            push_frame();
        }
    }

    for(unsigned i = 0; i < required_samples*2; ++i)
    {
        ctx->out[i] = ctx->resampled[i]/32768.0f;
    }

    ctx->resampled_head -= required_samples;
    std::memmove(
        ctx->resampled,
        ctx->resampled + required_samples * 2,
        ctx->resampled_head*2*sizeof(int16_t)
    );

    return frames;
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
    ctx->resampled_head = 0;
    ctx->video_buffers_write_head = 0;
    ctx->video_buffers_read_head = 0;

    memset(ctx->out, 0, ctx->out_size*2*sizeof(float));

    ctx->gb.reset();
}

}
