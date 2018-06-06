import React from 'react';
import styled from 'styled-components';
import Module from '../wasm/gambatte.js';
import Wasm from '../wasm/gambatte.wasm';

const Wrapper = styled.div`
  width: 40rem;
  > canvas {
    width: 100%;
  }
`;

const SAMPLERATE = 48000;
const VIDEO_BUFFER_BYTES = 4*160*144;
const AUDIO_BUFFER_SIZE = 512;

export const BUTTON = Object.freeze({
  A: 0,
  B: 1,
  SELECT: 2,
  START: 3,
  RIGHT: 4,
  LEFT: 5,
  UP: 6,
  DOWN: 7,
});

class Gambatte extends React.Component {
  constructor(props)
  {
    super(props);

    this.state = {
      module: null,
      api: {},
      error: null,
      title: 'Please choose a ROM to play'
    };

    this.canvas = null;
    this.audioContext = null;
    this.pcmPlayer = null;
    this.buttonsBuffer = null;
  }

  componentWillMount() {

    const module = Module({
      locateFile: file => {
        if(file === 'gambatte.wasm') return Wasm;
        else return null;
      }
    });

    module.then(m => {
      const api = {
        gambatte_boot: m.cwrap('gambatte_boot', null, ['number', 'number']),
        gambatte_reset: m.cwrap('gambatte_reset', null, null),
        gambatte_consume_video_buffer: m.cwrap(
          'gambatte_consume_video_buffer',
          'number',
          null
        ),
        gambatte_get_audio_buffer: m.cwrap(
          'gambatte_get_audio_buffer',
          'number',
          null
        ),
        gambatte_get_title: m.cwrap('gambatte_get_title', 'number', null),
        gambatte_get_buttons: m.cwrap('gambatte_get_buttons', 'number', null),
        gambatte_run_for: m.cwrap('gambatte_run_for', 'number', ['number']),
        gambatte_allocate_rom: m.cwrap(
          'gambatte_allocate_rom',
          'number',
          ['number']
        ),
        gambatte_upload_rom: m.cwrap('gambatte_upload_rom', 'reset', null),
      };
      this.setState({ module: m, api });
      this.state.api.gambatte_boot(SAMPLERATE, AUDIO_BUFFER_SIZE);

      this.audioBuffer = new Float32Array(
        m.HEAP32.buffer,
        this.state.api.gambatte_get_audio_buffer(),
        AUDIO_BUFFER_SIZE*2
      );

      this.buttonsBuffer = new Uint8Array(
        m.HEAP8.buffer,
        this.state.api.gambatte_get_buttons(),
        8
      );
    });
  }

  componentWillUnmount()
  {
    this.pause();
  }

  step(e) {
    const frames = this.state.api.gambatte_run_for(AUDIO_BUFFER_SIZE);
    if(frames > 0) window.requestAnimationFrame(() => this.runFrame());

    const left = e.outputBuffer.getChannelData(0);
    const right = e.outputBuffer.getChannelData(1);
    for(let i = 0; i < AUDIO_BUFFER_SIZE; ++i)
    {
      left[i] = this.audioBuffer[i*2];
      right[i] = this.audioBuffer[i*2+1];
    }
  }

  start() {
    this.pause();

    if(!this.error)
    {
      this.audioContext = new AudioContext({
        latencyHint: 'interactive',
        sampleRate: SAMPLERATE,
      });
      this.pcmPlayer = this.audioContext.createScriptProcessor(
        AUDIO_BUFFER_SIZE, 2, 2
      );
      this.pcmPlayer.onaudioprocess = (e) => this.step(e);
      this.pcmPlayer.connect(this.audioContext.destination);
    }
  }

  pause() {
    if(this.audioContext !== null) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if(this.pcmPlayer !== null) {
      this.pcmPlayer.disconnect();
      this.pcmPlayer = null;
    }
  }

  runFrame() {
    const ptr = this.state.api.gambatte_consume_video_buffer();
    if(ptr === 0) return;

    const videoBuffer = new Uint8ClampedArray(
      this.state.module.HEAP8.buffer,
      ptr,
      VIDEO_BUFFER_BYTES
    );

    // Get a copy of the video buffer in its current state for display
    let ctx = this.canvas.getContext('2d');
    const image = new ImageData(videoBuffer, 160, 144);
    ctx.putImageData(image, 0, 0);

    window.requestAnimationFrame(() => this.runFrame());
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Update ROM
    if(this.props.romData !== prevProps.romData) {
      this.pause();

      const buf = this.state.api.gambatte_allocate_rom(
        this.props.romData.byteLength
      );
      this.state.module.HEAP8.set(this.props.romData, buf);

      const result = this.state.api.gambatte_upload_rom();
      this.state.api.gambatte_reset();
      this.audioReadIndex = 0;

      if(result !== 0) {
        this.setState({ error: `Invalid ROM! Error: ${result}` });
      } else {
        const title = this.state.api.gambatte_get_title();
        this.setState({
          error: null,
          title: this.state.module.Pointer_stringify(title),
        });
        if(!this.props.paused)
          this.start();
      }
    }

    // Update buttons
    if(this.buttonsBuffer)
    {
      for(let i = 0; i < 8; ++i)
        this.buttonsBuffer[i] = this.props.buttons && this.props.buttons.has(i);
    }

    // Pause/resume
    if(this.props.paused && !prevProps.paused) this.pause();
    else if(!this.props.paused && prevProps.paused) this.start();
  }

  render() {
    return (
      <Wrapper>
        <p>{this.state.error ? this.state.error : this.state.title}</p>
        <canvas width="160" height="144" ref={e => this.canvas = e} />
      </Wrapper>
    );
  }
};

export default Gambatte;
