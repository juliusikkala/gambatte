#ifndef CONTEXT_H
#define CONTEXT_H
#include "gambatte.h"

struct Context
{
    gambatte::GB gb;
    uint8_t* rom_data;
    size_t rom_size;
};

extern struct Context* ctx;

#endif
