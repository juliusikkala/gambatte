import React from 'react';
import Module from '../wasm/gambatte.js';
import Wasm from '../wasm/gambatte.wasm';

class Gambatte extends React.Component {
  componentWillMount() {
    this.module = Module({
      locateFile: file => {
        if(file === 'gambatte.wasm') return Wasm;
        else return null;
      }
    });
    this.module.then(({ asm }) => asm._gambatte_boot());
    this.api = this.module.asm;
  }

  render() {
    return (<p>Whoa</p>);
  }
};

export default Gambatte;
