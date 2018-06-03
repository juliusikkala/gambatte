#ifndef CONTEXT_H
#define CONTEXT_H
#include "gambatte.h"

#define VIDEO_BUFFER_SIZE (sizeof(uint32_t)*160*144)
#define VIDEO_PITCH 160

struct Context
{
    gambatte::GB gb;
    uint8_t* video_buffer;

    int16_t* audio_buffer;
    size_t audio_buffer_size;
    size_t audio_buffer_alloc_size;
    float* audio_output;
    size_t audio_size;

    uint8_t* rom_data;
    size_t rom_size;
    char title[16];
};

extern struct Context* ctx;

#endif
