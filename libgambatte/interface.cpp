#include "gambatte.h"
#include <emscripten.h>
#include <cstdio>

using namespace gambatte;

struct Context
{
    GB gb;
}* ctx;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void gambatte_boot()
{
    ctx = new Context();
    printf("Rom title: %s\n", ctx->gb.romTitle().c_str());
}

}
