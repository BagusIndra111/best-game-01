// Starfall Salvage — keyboard and mouse input. The game loop polls this
// module once per frame: held keys for steering, and edge-triggered presses
// (justPressed / justClicked) for menu actions, cleared at the end of the frame.

export function createInput(canvas, toLogicalX) {
  const held = new Set();
  const pressed = new Set();
  const input = {
    mouseX: null, // logical x the pointer is over, or null when it never moved
    clicked: false, // a pointer press happened since the last frame
    has(key) {
      return held.has(key);
    },
    justPressed(key) {
      return pressed.has(key);
    },
    get left() {
      return held.has('ArrowLeft') || held.has('KeyA');
    },
    get right() {
      return held.has('ArrowRight') || held.has('KeyD');
    },
    endFrame() {
      pressed.clear();
      input.clicked = false;
    },
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    held.add(event.code);
    pressed.add(event.code);
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => {
    held.clear();
  });

  canvas.addEventListener('pointermove', (event) => {
    input.mouseX = toLogicalX(event.clientX);
  });
  canvas.addEventListener('pointerdown', (event) => {
    input.mouseX = toLogicalX(event.clientX);
    input.clicked = true;
  });

  return input;
}
