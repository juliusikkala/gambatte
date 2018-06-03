import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Gambatte from '../lib/components/gambatte';

storiesOf('Gambatte', module)
  .add('Gambatte', () => (<Gambatte />));
