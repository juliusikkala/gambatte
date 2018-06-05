#ifndef CONTEXT_H
#define CONTEXT_H
#include "gambatte.h"
#include "resample/resampler.h"
#include "resample/resamplerinfo.h"

#define VIDEO_BUFFER_SIZE (sizeof(uint32_t)*160*144)
#define VIDEO_PITCH 160

struct Context
{
    gambatte::GB gb;
    uint8_t* video_buffers[5];
    size_t video_buffers_write_head;
    size_t video_buffers_read_head;

    size_t out_samplerate;

    Resampler* resampler;

    // Audio from the emulator
    int16_t* in;
    size_t in_size;

    // Resampled audio
    int16_t* resampled;
    size_t resampled_head;
    size_t resampled_size;

    float* out;
    size_t out_size;

    uint8_t* rom_data;
    size_t rom_size;
    char title[16];
};

extern struct Context* ctx;

#endif
