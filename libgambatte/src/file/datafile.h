#ifndef GAMBATTE_DATA_FILE_H
#define GAMBATTE_DATA_FILE_H

#include "file.h"
#include <cstring>
#include <cstdio>
#include "context.h"

namespace gambatte {

// Loader for the global ROM data defined in interface.
class DataFile : public File {
public:
	explicit DataFile(char const *)
	: rom_data(nullptr), offset(0), rom_size(ctx->rom_size)
	{
        rom_data = (std::uint8_t*)malloc(rom_size);
        std::memcpy(rom_data, ctx->rom_data, rom_size);
	}

	virtual void rewind()
    {
        offset = 0;
    }

	virtual std::size_t size() const
    {
        return rom_size;
    }

	virtual void read(char *buffer, std::size_t amount)
    {
        memcpy(buffer, rom_data + offset, amount);
        offset += amount;
    }

	virtual bool fail() const
    {
        return false;
    }

private:
    std::uint8_t* rom_data;
    std::size_t offset;
    std::size_t rom_size;
};

}

#endif
