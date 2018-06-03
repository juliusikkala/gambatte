#include "context.h"
#include <emscripten.h>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <cmath>

using namespace gambatte;

struct Context* ctx = nullptr;

#define SAMPLERATE 44100

const int decimate_size = 43;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void gambatte_boot(int max_audio_size)
{
    ctx = new Context();
    ctx->video_buffer = (uint8_t*)malloc(VIDEO_BUFFER_SIZE);
    ctx->audio_buffer_alloc_size = (35112+2046+decimate_size)*2;
    ctx->audio_buffer_size = 0;
    ctx->audio_buffer = (int16_t*)malloc(
        sizeof(int16_t)*ctx->audio_buffer_alloc_size
    );
    max_audio_size *= 2; // Stereo samples
    ctx->audio_output = (float*)malloc(sizeof(float)*max_audio_size);
    ctx->audio_size = max_audio_size;

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
float* gambatte_get_audio_buffer()
{
    return ctx->audio_output;
}

EMSCRIPTEN_KEEPALIVE
char* gambatte_get_title()
{
    return ctx->title;
}

EMSCRIPTEN_KEEPALIVE
int gambatte_run_for(int audio_size)
{
    // Ensure audio buffer can contain the new samples
    std::size_t desired_frames = audio_size * decimate_size;
    std::size_t needed_size = (2064 + decimate_size + desired_frames) * 2;
    if(needed_size > ctx->audio_buffer_alloc_size)
    {
        ctx->audio_buffer = (int16_t*)realloc(ctx->audio_buffer, needed_size);
    }

    std::size_t received_frames = ctx->audio_buffer_size;
    bool got_video_frame = false;

    // Get new frames if necessary
    if(ctx->audio_buffer_size < desired_frames)
    {
        // Run the emulator until either enough samples have been generated or a 
        // frame is outputted.
        std::size_t tmp_samples = desired_frames - ctx->audio_buffer_size;

        std::ptrdiff_t diff = ctx->gb.runFor(
            (std::uint_least32_t*)ctx->video_buffer, VIDEO_PITCH,
            (std::uint_least32_t*)(ctx->audio_buffer + ctx->audio_buffer_size),
            tmp_samples
        );

        if(diff > 0)
        {
            got_video_frame = true;
            // Postprocess video (fix colors & alpha)
            for(unsigned i = 0; i < VIDEO_BUFFER_SIZE; i+=4)
            {
                uint8_t tmp = ctx->video_buffer[i];
                ctx->video_buffer[i] = ctx->video_buffer[i+2];
                ctx->video_buffer[i+2] = tmp;
                ctx->video_buffer[i+3] = 0xFF;
            }
        }

        received_frames += tmp_samples;
    }

    // Compute overrun to be returned on next frame
    std::size_t used_frames = received_frames;
    if(received_frames > desired_frames)
        used_frames = desired_frames;

    std::size_t output_frames = used_frames / decimate_size;
    used_frames = output_frames * decimate_size;

    for(unsigned i = 0; i < output_frames; ++i)
    {
        unsigned off = i * decimate_size;
        int32_t avg_left = 0, avg_right = 0;
        for(unsigned j = 0; j < decimate_size; ++j)
        {
            avg_left += ctx->audio_buffer[((off + j)<<1)];
            avg_right += ctx->audio_buffer[((off + j)<<1) + 1];
        }
        ctx->audio_output[(i<<1)] = (avg_left / decimate_size)/32768.0f;
        ctx->audio_output[(i<<1) + 1] = (avg_right / decimate_size)/32768.0f;
    }

    // Move overrun to the beginning
    ctx->audio_buffer_size = received_frames - used_frames;
    memmove(
        ctx->audio_buffer,
        ctx->audio_buffer + used_frames * 2,
        ctx->audio_buffer_size * 2 * sizeof(int16_t)
    );

    // Negative value when no new frame, positive for new frames
    return got_video_frame ? (int)output_frames : -(int)output_frames;
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
