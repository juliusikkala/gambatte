import React from 'react';

import { storiesOf } from '@storybook/react';

import { Gambatte, KeyboardController } from '../lib';

class GameView extends React.Component {
  constructor(props) {
    super(props);

    this.keyboard = new KeyboardController(
      buttons => this.setState({ keyboardButtons: buttons }),
      false,
    );

    this.state = {
      romData: null,
      keyboardButtons: new Set([]),
      error: null,
      title: 'No game loaded',
    };
  }

  componentWillMount() {
    this.keyboard.attach();
  }

  componentWillUnmount() {
    this.keyboard.detach();
  }

  handleROMSelect(files) {
    const fr = new FileReader();
    fr.onload = (completion) => {
      this.setState({
        romData: new Uint8Array(completion.target.result),
      });
    };
    fr.readAsArrayBuffer(files[0]);
  }

  render() {
    const {
      romData,
      keyboardButtons,
      error,
      title,
    } = this.state;

    return (
      <div>
        <p>{title || error}</p>
        <Gambatte
          romData={romData}
          buttons={keyboardButtons}
          onError={e => this.setState({ error: e, title: null })}
          onTitle={t => this.setState({ error: null, title: t })}
          width="40rem"
        />
        <input type="file" onChange={e => this.handleROMSelect(e.target.files)} />
      </div>
    );
  }
}

storiesOf('Gambatte', module)
  .add('Gambatte', () => (<GameView />));
