import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Gambatte from '../lib/components/gambatte';
import KeyboardController from '../lib/controllers/keyboard';
import GamepadController from '../lib/controllers/gamepad';

class GameView extends React.Component {
  constructor(props)
  {
    super(props);

    this.keyboard = new KeyboardController(
      buttons => this.setState({ keyboardButtons: buttons }),
      false
    );

    this.gamepad = new GamepadController(
      buttons => this.setState({ gamepadButtons: buttons}),
      false
    );

    this.state = {
      romData: null,
      keyboardButtons: new Set([]),
      gamepadButtons: new Set([]),
    };
  }

  componentWillMount() {
    this.keyboard.attach();
    this.gamepad.attach();
  }

  componentWillUnmount() {
    this.keyboard.detach();
    this.gamepad.detach();
  }

  handleROMSelect(files) {
    let fr = new FileReader();
    fr.onload = completion => {
      this.setState({
        romData: new Uint8Array(completion.target.result)
      });
    };
    fr.readAsArrayBuffer(files[0]);
  }

  render() {
    const { romData, keyboardButtons, gamepadButtons } = this.state;
    return (
      <div>
        <Gambatte
          romData={romData}
          buttons={new Set([...keyboardButtons, ...gamepadButtons])}
        />
        <input type="file" onChange={e => this.handleROMSelect(e.target.files)} />
      </div>
    );
  }
};

storiesOf('Gambatte', module)
  .add('Gambatte', () => (<GameView />));
