import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Gambatte from '../lib/components/gambatte';

class GameView extends React.Component {
  constructor(props)
  {
    super(props);

    this.state = {
      romData: null
    };
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
    return (
      <div>
        <Gambatte romData={this.state.romData} />
        <input type="file" onChange={e => this.handleROMSelect(e.target.files)} />
      </div>
    );
  }
};

storiesOf('Gambatte', module)
  .add('Gambatte', () => (<GameView />));
