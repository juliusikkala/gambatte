#ifndef CONTEXT_H
#define CONTEXT_H
#include "gambatte.h"

#define AUDIO_BUFFER_LENGTH (35112+2046)
#define AUDIO_BUFFER_SIZE (sizeof(int16_t)*2*AUDIO_BUFFER_LENGTH)

#define VIDEO_BUFFER_SIZE (sizeof(uint32_t)*160*144)
#define VIDEO_PITCH 160

struct Context
{
    gambatte::GB gb;
    uint8_t* video_buffer;
    int16_t* audio_buffer;

    uint8_t* rom_data;
    size_t rom_size;
    char title[16];
};

extern struct Context* ctx;

#endif
