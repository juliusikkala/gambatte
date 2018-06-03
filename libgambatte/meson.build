project('gambatte', 'cpp', default_options : ['buildtype=debugoptimized'])

src = [
  'src/bitmap_font.cpp',
  'src/cpu.cpp',
  'src/gambatte.cpp',
  'src/initstate.cpp',
  'src/interrupter.cpp',
  'src/interruptrequester.cpp',
  'src/loadres.cpp',
  'src/memory.cpp',
  'src/sound.cpp',
  'src/state_osd_elements.cpp',
  'src/statesaver.cpp',
  'src/tima.cpp',
  'src/video.cpp',
  'src/mem/cartridge.cpp',
  'src/mem/memptrs.cpp',
  'src/mem/pakinfo.cpp',
  'src/mem/rtc.cpp',
  'src/sound/channel1.cpp',
  'src/sound/channel2.cpp',
  'src/sound/channel3.cpp',
  'src/sound/channel4.cpp',
  'src/sound/duty_unit.cpp',
  'src/sound/envelope_unit.cpp',
  'src/sound/length_counter.cpp',
  'src/video/ly_counter.cpp',
  'src/video/lyc_irq.cpp',
  'src/video/next_m0_time.cpp',
  'src/video/ppu.cpp',
  'src/video/sprite_mapper.cpp',
  'src/file/file.cpp',
  'interface.cpp',
]

inc = include_directories(['src', 'include', 'common'])

executable(
  'gambatte',
  src,
  include_directories: inc,
  install: true,
  name_suffix: 'js'
)
