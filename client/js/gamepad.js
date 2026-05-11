/**
 * DeckPad - Contrôleur Gamepad Virtuel
 * Gère le D-Pad et les boutons d'action (A,B,X,Y)
 */

class GamepadController {
  constructor() {
    this._setupEvents();
  }

  _setupEvents() {
    const conn = window.deckpadConnection;
    const buttons = document.querySelectorAll('.dpad-btn, .pad-btn, .trigger-btn, .small-btn');

    // Mappage simplifié (touches)
    const keyMap = {
      'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right',
      'a': 'enter', 'b': 'escape', 'x': 'x', 'y': 'y',
      'l1': 'q', 'r1': 'e', 'start': 'escape', 'select': 'tab'
    };

    buttons.forEach(btn => {
      const handlePress = (e) => {
        if(e) e.preventDefault();
        btn.classList.add('active');
        if (navigator.vibrate) navigator.vibrate(15);
        const key = keyMap[btn.dataset.key];
        if (key && conn.isReady()) conn.send({ type: 'key_down', key: key });
      };

      const handleRelease = (e) => {
        if(e) e.preventDefault();
        btn.classList.remove('active');
        const key = keyMap[btn.dataset.key];
        if (key && conn.isReady()) conn.send({ type: 'key_up', key: key });
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', () => {
        if (btn.classList.contains('active')) handleRelease();
      });
    });

    // Initialisation Nipple.js (Joysticks)
    setTimeout(() => {
      if (typeof nipplejs === 'undefined') return;

      const leftZone = document.getElementById('joystick-left');
      if (leftZone) {
        const leftJoy = nipplejs.create({
          zone: leftZone,
          mode: 'static',
          position: { left: '50%', top: '50%' },
          color: 'var(--accent-primary)',
          size: 100
        });

        // ... event handlers for leftJoy ...
      }

      const rightZone = document.getElementById('joystick-right');
      if (rightZone) {
        const rightJoy = nipplejs.create({
          zone: rightZone,
          mode: 'static',
          position: { left: '50%', top: '50%' },
          color: 'var(--accent-secondary)',
          size: 100
        });

        // ... event handlers for rightJoy ...
      }

      // Gestion Joystick Gauche (Simulation touches ZQSD)
      let activeKeys = new Set();
      leftJoy.on('move', (evt, data) => {
        if (!conn.isReady()) return;
        const keysToPress = new Set();
        
        if (data.direction) {
          if (data.direction.y === 'up') keysToPress.add('w');
          if (data.direction.y === 'down') keysToPress.add('s');
          if (data.direction.x === 'left') keysToPress.add('a');
          if (data.direction.x === 'right') keysToPress.add('d');
        }

        // Relâcher les anciennes touches
        for (const k of activeKeys) {
          if (!keysToPress.has(k)) conn.send({ type: 'key_up', key: k });
        }
        // Appuyer les nouvelles
        for (const k of keysToPress) {
          if (!activeKeys.has(k)) conn.send({ type: 'key_down', key: k });
        }
        activeKeys = keysToPress;
      });

      leftJoy.on('end', () => {
        for (const k of activeKeys) conn.send({ type: 'key_up', key: k });
        activeKeys.clear();
      });

      // Gestion Joystick Droit (Simulation souris)
      let mouseInterval = null;
      rightJoy.on('move', (evt, data) => {
        if (!conn.isReady()) return;
        if (mouseInterval) clearInterval(mouseInterval);
        
        // La distance donne la vitesse
        const speed = (data.distance / 50) * 15; 
        const dx = Math.cos(data.angle.radian) * speed;
        const dy = -Math.sin(data.angle.radian) * speed;

        mouseInterval = setInterval(() => {
          conn.send({ type: 'mouse_move_relative', dx: Math.round(dx), dy: Math.round(dy) });
        }, 16); // ~60fps
      });

      rightJoy.on('end', () => {
        if (mouseInterval) clearInterval(mouseInterval);
      });

    }, 500); // Wait for DOM / Library load
  }
}

window.gamepadController = null;
document.addEventListener('DOMContentLoaded', () => {
  window.gamepadController = new GamepadController();
});
