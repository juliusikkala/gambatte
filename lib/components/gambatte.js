import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
// eslint-disable-next-line
import Module from '../wasm/gambatte.js';
import Wasm from '../wasm/gambatte.wasm';

const Wrapper = styled.div`
  width: ${props => props.width};
  > canvas {
    width: 100%;
  }
`;

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

const VIDEO_BUFFER_BYTES = 4 * 160 * 144;

class Gambatte extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      module: null,
      api: {},
    };

    this.canvas = null;
    this.audioContext = null;
    this.pcmPlayer = null;
    this.buttonsBuffer = null;
    this.blitter = null;
    this.gainNode = null;
  }

  componentWillMount() {
    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: this.props.samplerate,
    });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.props.volume;
    this.gainNode.connect(this.audioContext.destination);

    this.buflen = this.props.bufferLength;

    const module = Module({
      locateFile: (file) => {
        if (file.endsWith('.wasm')) return Wasm;
        return null;
      },
    });

    module.then((m) => {
      const api = {
        gambatte_boot: m.cwrap('gambatte_boot', null, ['number', 'number']),
        gambatte_reset: m.cwrap('gambatte_reset', null, null),
        gambatte_consume_video_buffer: m.cwrap(
          'gambatte_consume_video_buffer',
          'number',
          null,
        ),
        gambatte_get_audio_buffer: m.cwrap(
          'gambatte_get_audio_buffer',
          'number',
          null,
        ),
        gambatte_get_title: m.cwrap('gambatte_get_title', 'number', null),
        gambatte_get_buttons: m.cwrap('gambatte_get_buttons', 'number', null),
        gambatte_run_for: m.cwrap('gambatte_run_for', 'number', ['number']),
        gambatte_allocate_rom: m.cwrap(
          'gambatte_allocate_rom',
          'number',
          ['number'],
        ),
        gambatte_upload_rom: m.cwrap('gambatte_upload_rom', 'reset', null),
      };
      this.setState({ module: m, api });
      this.state.api.gambatte_boot(this.audioContext.sampleRate, this.buflen);

      this.audioBuffer = new Float32Array(
        m.HEAP32.buffer,
        this.state.api.gambatte_get_audio_buffer(),
        this.buflen * 2,
      );

      this.buttonsBuffer = new Uint8Array(
        m.HEAP8.buffer,
        this.state.api.gambatte_get_buttons(),
        8,
      );
    });
  }

  componentDidUpdate(prevProps) {
    // Update ROM
    if (this.props.romData !== prevProps.romData) {
      this.pause();

      const buf = this.state.api.gambatte_allocate_rom(this.props.romData.byteLength);
      this.state.module.HEAP8.set(this.props.romData, buf);

      this.state.api.gambatte_reset();
      const result = this.state.api.gambatte_upload_rom();
      this.audioReadIndex = 0;

      if (result !== 0) {
        if (this.props.onError) {
          this.props.onError(`Invalid ROM! Error: ${result}`);
        }
      } else {
        const title = this.state.api.gambatte_get_title();
        if (this.props.onTitle) {
          this.props.onTitle(this.state.module.Pointer_stringify(title));
        }

        if (!this.props.paused) {
          this.start();
        }
      }
    }

    // Update buttons
    if (this.buttonsBuffer) {
      for (let i = 0; i < 8; i += 1) {
        this.buttonsBuffer[i] = this.props.buttons && this.props.buttons.has(i);
      }
    }

    // Update volume
    this.gainNode.gain.value = this.props.volume;

    // Pause/resume
    if (this.props.paused && !prevProps.paused) this.pause();
    else if (!this.props.paused && prevProps.paused) this.start();
  }

  componentWillUnmount() {
    this.pause();

    if (this.audioContext !== null) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  step(e) {
    const frames = this.state.api.gambatte_run_for(this.buflen);
    if (frames > 0) {
      if (this.blitter !== null) {
        window.cancelAnimationFrame(this.blitter);
        this.blitter = null;
      }
      this.runFrame();
      if (frames > 1) {
        this.blitter = window.requestAnimationFrame(() => this.runFrame());
      }
    }

    const left = e.outputBuffer.getChannelData(0);
    const right = e.outputBuffer.getChannelData(1);
    for (let i = 0; i < this.buflen; i += 1) {
      left[i] = this.audioBuffer[i * 2];
      right[i] = this.audioBuffer[(i * 2) + 1];
    }
  }

  start() {
    this.pause();

    if (this.props.romData) {
      this.pcmPlayer = this.audioContext.createScriptProcessor(this.buflen, 2, 2);
      this.pcmPlayer.onaudioprocess = e => this.step(e);
      this.pcmPlayer.connect(this.gainNode);
    }
  }

  pause() {
    if (this.pcmPlayer !== null) {
      this.pcmPlayer.disconnect();
      this.pcmPlayer = null;
    }
    if (this.blitter !== null) {
      window.cancelAnimationFrame(this.blitter);
      this.blitter = null;
    }
  }

  runFrame() {
    const ptr = this.state.api.gambatte_consume_video_buffer();
    if (ptr === 0) return;

    const videoBuffer = new Uint8ClampedArray(
      this.state.module.HEAP8.buffer,
      ptr,
      VIDEO_BUFFER_BYTES,
    );

    // Get a copy of the video buffer in its current state for display
    const ctx = this.canvas.getContext('2d');
    const image = new ImageData(videoBuffer, 160, 144);
    ctx.putImageData(image, 0, 0);

    this.blitter = window.requestAnimationFrame(() => this.runFrame());
  }

  render() {
    return (
      <Wrapper width={this.props.width}>
        <canvas width="160" height="144" ref={(e) => { this.canvas = e; }} />
      </Wrapper>
    );
  }
}

Gambatte.propTypes = {
  paused: PropTypes.bool,
  samplerate: PropTypes.number,
  bufferLength: PropTypes.number,
  buttons: PropTypes.instanceOf(Set),
  romData: PropTypes.instanceOf(Uint8Array),
  volume: PropTypes.number,
  width: PropTypes.string,
  onError: PropTypes.func,
  onTitle: PropTypes.func,
};

Gambatte.defaultProps = {
  paused: false,
  samplerate: 44100,
  bufferLength: 512,
  buttons: new Set([]),
  romData: null,
  volume: 0.5,
  width: '160px',
  onError: null,
  onTitle: null,
};

export default Gambatte;
