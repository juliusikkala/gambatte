import { BUTTON } from '../components/gambatte.js';

class GamepadController {
  constructor(onButtonsChanged, autoAttach = true) {
    this.gamepads = new Map([]);
    this.buttons = new Set([]);

    this.gamepadStateHandler = index => {
      const gp = navigator.getGamepads()[index];
      this.buttons.clear();
      onButtonsChanged();
    };

    this.connectHandler = e => {
      this.gamepads.set(
        e.gamepad.index,
        setInterval(() => this.gamepadStateHandler(e.gamepad.index), 16)
      );
    };

    this.disconnectHandler = e => {
      if(this.gamepads.has(e.gamepad.index))
      {
        clearInterval(this.gamepads.get(e.gamepad.index));
        this.gamepads.delete(e.gamepad.index);
      }
    };

    if(autoAttach) this.attach();
  }

  attach() {
    this.detach();
    window.addEventListener('gamepadconnected', this.connectHandler);
    window.addEventListener('gamepaddisconnected', this.disconnectHandler);
  }

  detach() {
    window.removeEventListener('gamepadconnected', this.connectHandler);
    window.removeEventListener('gamepaddisconnected', this.disconnectHandler);
    this.gamepads.forEach((index, interval) => clearInterval(interval));
    this.gamepads.clear();
  }

  getButtons() {
    return this.buttons;
  }
};

export default GamepadController;

