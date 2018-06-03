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

const VIDEO_BUFFER_BYTES = 4*160*144;

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

    this.canvas = React.createRef();
    this.frameInterval = null;
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
        gambatte_boot: m.cwrap('gambatte_boot', null, null),
        gambatte_reset: m.cwrap('gambatte_reset', null, null),
        gambatte_get_video_buffer: m.cwrap(
          'gambatte_get_video_buffer',
          'number',
          null
        ),
        gambatte_get_audio_buffer: m.cwrap(
          'gambatte_get_audio_buffer',
          'number',
          null
        ),
        gambatte_get_title: m.cwrap('gambatte_get_title', 'number', null),
        gambatte_run_frame: m.cwrap('gambatte_run_frame', 'number', null),
        gambatte_allocate_rom: m.cwrap(
          'gambatte_allocate_rom',
          'number',
          ['number']
        ),
        gambatte_upload_rom: m.cwrap('gambatte_upload_rom', 'reset', null),
      };
      this.setState({ module: m, api });
      this.state.api.gambatte_boot();

      this.videoBuffer = new Uint8ClampedArray(
        m.HEAP8.buffer,
        this.state.api.gambatte_get_video_buffer(),
        VIDEO_BUFFER_BYTES
      );

      this.audioBuffer = new Int16Array(
        m.HEAP16.buffer,
        this.state.api.gambatte_get_audio_buffer(),
        (35112+2046)*2
      );
    });
  }

  start() {
    this.pause();
    if(!this.error)
      this.frameInterval = setInterval(() => this.drawFrame(), 17);
  }

  pause() {
    if(this.frameInterval !== null) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  }

  drawFrame() {
    this.state.api.gambatte_run_frame();
    // Get a copy of the video buffer in its current state for display
    let ctx = this.canvas.current.getContext('2d');
    const image = new ImageData(this.videoBuffer, 160, 144);
    ctx.putImageData(image, 0, 0);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(this.props.romData !== prevProps.romData) {
      console.log('Rom changed! Load and reset!');
      this.pause();

      const buf = this.state.api.gambatte_allocate_rom(
        this.props.romData.byteLength
      );
      this.state.module.HEAP8.set(this.props.romData, buf);

      const result = this.state.api.gambatte_upload_rom();
      this.state.api.gambatte_reset();

      if(result !== 0) {
        this.setState({ error: `Invalid ROM! Error: ${result}` });
      } else {
        const title = this.state.api.gambatte_get_title();
        this.setState({
          error: null,
          title: this.state.module.Pointer_stringify(title),
        });
        if(!this.props.paused) this.start();
      }
    }

    if(this.props.paused && !prevProps.paused) this.pause();
    else if(!this.props.paused && prevProps.paused) this.start();
  }

  render() {
    return (
      <Wrapper>
        <p>{this.state.error ? this.state.error : this.state.title}</p>
        <canvas width="160" height="144" ref={this.canvas} />
      </Wrapper>
    );
  }
};

export default Gambatte;
