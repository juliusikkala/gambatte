#ifndef CONTEXT_H
#define CONTEXT_H
#include "gambatte.h"
#include "resample/resampler.h"
#include "resample/resamplerinfo.h"

#define VIDEO_BUFFER_SIZE (sizeof(uint32_t)*160*144)
#define VIDEO_PITCH 160

enum button {
    BUTTON_A = 0,
    BUTTON_B,
    BUTTON_SELECT,
    BUTTON_START,
    BUTTON_RIGHT,
    BUTTON_LEFT,
    BUTTON_UP,
    BUTTON_DOWN
};

struct Context
{
    gambatte::GB gb;

    uint8_t* video_buffers[4];
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

    // Essentially booleans, but guaranteed single byte.
    uint8_t buttons[8];
};

extern struct Context* ctx;

class ContextInputGetter: public gambatte::InputGetter
{
public:
	unsigned operator()() {
        unsigned buttons = 0;
        ctx->buttons[BUTTON_A] && (buttons|=A);
        ctx->buttons[BUTTON_B] && (buttons|=B);
        ctx->buttons[BUTTON_SELECT] && (buttons|=SELECT);
        ctx->buttons[BUTTON_START] && (buttons|=START);
        ctx->buttons[BUTTON_RIGHT] && (buttons|=RIGHT);
        ctx->buttons[BUTTON_LEFT] && (buttons|=LEFT);
        ctx->buttons[BUTTON_UP] && (buttons|=UP);
        ctx->buttons[BUTTON_DOWN] && (buttons|=DOWN);
        return buttons;
    }
};

#endif
