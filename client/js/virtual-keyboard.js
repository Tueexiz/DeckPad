/**
 * DeckPad - Clavier Virtuel (AZERTY)
 */

class VirtualKeyboard {
  constructor() {
    this.container = document.getElementById('keyboard-keys');
    this.modifiers = { ctrl: false, shift: false, alt: false, win: false };
    this._buildKeyboard();
    this._setupShortcuts();
  }

  _buildKeyboard() {
    // Layout AZERTY (Type TKL)
    const rows = [
      [
        { key: 'escape', label: 'Esc', class: 'special' },
        { key: 'f1', label: 'F1', class: 'special' }, { key: 'f2', label: 'F2', class: 'special' },
        { key: 'f3', label: 'F3', class: 'special' }, { key: 'f4', label: 'F4', class: 'special' },
        { key: 'f5', label: 'F5', class: 'special' }, { key: 'f6', label: 'F6', class: 'special' },
        { key: 'f7', label: 'F7', class: 'special' }, { key: 'f8', label: 'F8', class: 'special' },
        { key: 'f9', label: 'F9', class: 'special' }, { key: 'f10', label: 'F10', class: 'special' },
        { key: 'f11', label: 'F11', class: 'special' }, { key: 'f12', label: 'F12', class: 'special' }
      ],
      [
        { key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' },
        { key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' },
        { key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' },
        { key: '0', label: '0' },
        { key: 'backspace', label: '⌫', class: 'wide special' }
      ],
      [
        { key: 'tab', label: 'Tab', class: 'wide special' },
        { key: 'a', label: 'A' }, { key: 'z', label: 'Z' }, { key: 'e', label: 'E' },
        { key: 'r', label: 'R' }, { key: 't', label: 'T' }, { key: 'y', label: 'Y' },
        { key: 'u', label: 'U' }, { key: 'i', label: 'I' }, { key: 'o', label: 'O' },
        { key: 'p', label: 'P' },
        { key: 'enter', label: '↵', class: 'wide special' }
      ],
      [
        { key: 'capslock', label: 'Caps', class: 'wide special' },
        { key: 'q', label: 'Q' }, { key: 's', label: 'S' }, { key: 'd', label: 'D' },
        { key: 'f', label: 'F' }, { key: 'g', label: 'G' }, { key: 'h', label: 'H' },
        { key: 'j', label: 'J' }, { key: 'k', label: 'K' }, { key: 'l', label: 'L' },
        { key: 'm', label: 'M' }
      ],
      [
        { key: 'shift', label: '⇧', class: 'wider special', modifier: true },
        { key: 'w', label: 'W' }, { key: 'x', label: 'X' }, { key: 'c', label: 'C' },
        { key: 'v', label: 'V' }, { key: 'b', label: 'B' }, { key: 'n', label: 'N' },
        { key: 'up', label: '↑', class: 'special' },
        { key: 'shift', label: '⇧', class: 'wider special', modifier: true }
      ],
      [
        { key: 'ctrl', label: 'Ctrl', class: 'wide special', modifier: true },
        { key: 'win', label: '⊞', class: 'special', modifier: true },
        { key: 'alt', label: 'Alt', class: 'wide special', modifier: true },
        { key: 'space', label: '', class: 'space' },
        { key: 'alt', label: 'Alt', class: 'wide special', modifier: true },
        { key: 'left', label: '←', class: 'special' },
        { key: 'down', label: '↓', class: 'special' },
        { key: 'right', label: '→', class: 'special' }
      ]
    ];

    this.container.innerHTML = '';
    for (const row of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';
      for (const key of row) {
        const btn = document.createElement('button');
        btn.className = `key-btn ${key.class || ''}`;
        btn.textContent = key.label;
        btn.dataset.key = key.key;

        if (key.modifier) {
          btn.dataset.modifier = 'true';
          btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._toggleModifier(key.key, btn);
          });
        } else {
          btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._pressKey(key.key);
            // Feedback visuel
            btn.classList.add('active-modifier');
            setTimeout(() => btn.classList.remove('active-modifier'), 150);
            // Vibration
            if (navigator.vibrate) navigator.vibrate(15);
          });
        }

        rowEl.appendChild(btn);
      }
      this.container.appendChild(rowEl);
    }
  }

  _toggleModifier(key, btn) {
    if (key === 'shift') {
      this.modifiers.shift = !this.modifiers.shift;
    } else if (key === 'ctrl') {
      this.modifiers.ctrl = !this.modifiers.ctrl;
    } else if (key === 'alt') {
      this.modifiers.alt = !this.modifiers.alt;
    } else if (key === 'win') {
      this.modifiers.win = !this.modifiers.win;
    }

    // Mettre à jour le visuel de TOUS les boutons du même modifier
    const allBtns = this.container.querySelectorAll(`[data-key="${key}"][data-modifier="true"]`);
    allBtns.forEach(b => {
      if (this.modifiers[key]) {
        b.classList.add('active-modifier');
      } else {
        b.classList.remove('active-modifier');
      }
    });

    if (navigator.vibrate) navigator.vibrate(20);
  }

  _pressKey(key) {
    const conn = window.deckpadConnection;
    if (!conn.isReady()) return;

    const mods = [];
    if (this.modifiers.ctrl) mods.push('ctrl');
    if (this.modifiers.shift) mods.push('shift');
    if (this.modifiers.alt) mods.push('alt');
    if (this.modifiers.win) mods.push('win');

    conn.send({ type: 'key_press', key: key, modifiers: mods });

    // Reset modifiers après usage
    this._resetModifiers();
  }

  _resetModifiers() {
    this.modifiers = { ctrl: false, shift: false, alt: false, win: false };
    const allMods = this.container.querySelectorAll('[data-modifier="true"]');
    allMods.forEach(b => b.classList.remove('active-modifier'));
  }

  _setupShortcuts() {
    const shortcuts = document.querySelectorAll('.shortcut-btn');
    shortcuts.forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const keys = btn.dataset.keys;
        this._execShortcut(keys);
        if (navigator.vibrate) navigator.vibrate(20);
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);
      });
      // Fallback click pour les appareils sans touch
      btn.addEventListener('click', (e) => {
        const keys = btn.dataset.keys;
        this._execShortcut(keys);
      });
    });
  }

  _execShortcut(shortcut) {
    const conn = window.deckpadConnection;
    if (!conn.isReady()) return;

    const parts = shortcut.split('+');
    const key = parts.pop();
    const modifiers = parts;

    conn.send({ type: 'key_press', key: key, modifiers: modifiers });
  }
}

window.virtualKeyboard = null;
document.addEventListener('DOMContentLoaded', () => {
  window.virtualKeyboard = new VirtualKeyboard();
});
