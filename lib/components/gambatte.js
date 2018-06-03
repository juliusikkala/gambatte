import React from 'react';
import Module from '../wasm/gambatte.js';
import Wasm from '../wasm/gambatte.wasm';

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
        gambatte_get_title: m.cwrap('gambatte_get_title', 'number', null),
        gambatte_allocate_rom: m.cwrap(
          'gambatte_allocate_rom',
          'number',
          ['number']
        ),
        gambatte_upload_rom: m.cwrap('gambatte_upload_rom', 'reset', null),
      };
      this.setState({ module: m, api });
      this.state.api.gambatte_boot();
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(this.props.romData !== prevProps.romData) {
      console.log('Rom changed! Load and reset!');
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
      }
    }
  }

  render() {
    return (<p>{this.state.error ? this.state.error : this.state.title}</p>);
  }
};

export default Gambatte;
