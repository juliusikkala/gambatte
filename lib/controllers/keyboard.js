import { BUTTON } from '../components/gambatte.js';

export const defaultKeyboardBinds = new Map([
  // Left handed
  [87, BUTTON.UP], // w
  [83, BUTTON.DOWN], // s
  [65, BUTTON.LEFT], // a
  [68, BUTTON.RIGHT], // d

  [78, BUTTON.A], // n
  [77, BUTTON.B], // m

  [69, BUTTON.START], // e
  [81, BUTTON.SELECT], // q

  // Right handed
  [38, BUTTON.UP], // up arrow
  [40, BUTTON.DOWN], // down arrow
  [37, BUTTON.LEFT], // left arrow
  [39, BUTTON.RIGHT], // right arrow

  [90, BUTTON.A], // z
  [88, BUTTON.B], // x

  [13, BUTTON.START], // enter
  [8, BUTTON.SELECT], // select
]);

class KeyboardController {
  constructor(onButtonsChanged, autoAttach = true, binds = defaultKeyboardBinds) {
    this.buttons = new Set([]);

    this.keydownHandler = event => {
      if(binds.has(event.keyCode))
      {
        const button = binds.get(event.keyCode);
        if(!this.buttons.has(button))
        {
          this.buttons.add(binds.get(event.keyCode));
          onButtonsChanged(this.buttons);
        }
      }
    };

    this.keyupHandler = event => {
      if(binds.has(event.keyCode))
      {
        this.buttons.delete(binds.get(event.keyCode));
        onButtonsChanged(this.buttons);
      }
    };

    if(autoAttach) this.attach();
  }

  attach() {
    this.detach();
    window.addEventListener('keydown', this.keydownHandler, true);
    window.addEventListener('keyup', this.keyupHandler, true);
  }

  detach() {
    window.removeEventListener('keydown', this.keydownHandler, true);
    window.removeEventListener('keyup', this.keyupHandler, true);
  }

  getButtons() {
    return this.buttons;
  }
};

export default KeyboardController;
