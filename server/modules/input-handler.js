/**
 * DeckPad - Module de simulation d'entrées (souris/clavier)
 * Utilise koffi pour appeler directement les API Windows (user32.dll)
 * Zéro compilation nécessaire
 */

let koffi, user32;
let SetCursorPos, GetCursorPos, mouse_event, keybd_event, GetSystemMetrics, SendInput;
let POINT;

// Flags mouse_event
const MOUSEEVENTF_MOVE = 0x0001;
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0020;
const MOUSEEVENTF_MIDDLEUP = 0x0040;
const MOUSEEVENTF_WHEEL = 0x0800;
const MOUSEEVENTF_ABSOLUTE = 0x8000;

// Flags keybd_event
const KEYEVENTF_KEYUP = 0x0002;

// Virtual Key Codes
const VK_CODES = {
  'backspace': 0x08, 'tab': 0x09, 'enter': 0x0D, 'shift': 0x10,
  'ctrl': 0x11, 'alt': 0x12, 'pause': 0x13, 'capslock': 0x14,
  'escape': 0x1B, 'space': 0x20, 'pageup': 0x21, 'pagedown': 0x22,
  'end': 0x23, 'home': 0x24, 'left': 0x25, 'up': 0x26,
  'right': 0x27, 'down': 0x28, 'printscreen': 0x2C, 'insert': 0x2D,
  'delete': 0x2E, 'win': 0x5B, 'apps': 0x5D,
  '0': 0x30, '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34,
  '5': 0x35, '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39,
  'a': 0x41, 'b': 0x42, 'c': 0x43, 'd': 0x44, 'e': 0x45,
  'f': 0x46, 'g': 0x47, 'h': 0x48, 'i': 0x49, 'j': 0x4A,
  'k': 0x4B, 'l': 0x4C, 'm': 0x4D, 'n': 0x4E, 'o': 0x4F,
  'p': 0x50, 'q': 0x51, 'r': 0x52, 's': 0x53, 't': 0x54,
  'u': 0x55, 'v': 0x56, 'w': 0x57, 'x': 0x58, 'y': 0x59, 'z': 0x5A,
  'f1': 0x70, 'f2': 0x71, 'f3': 0x72, 'f4': 0x73, 'f5': 0x74,
  'f6': 0x75, 'f7': 0x76, 'f8': 0x77, 'f9': 0x78, 'f10': 0x79,
  'f11': 0x7A, 'f12': 0x7B,
  'numlock': 0x90, 'scrolllock': 0x91,
  'volume_mute': 0xAD, 'volume_down': 0xAE, 'volume_up': 0xAF,
  'media_next': 0xB0, 'media_prev': 0xB1, 'media_stop': 0xB2, 'media_play': 0xB3,
};

// Screen metrics
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;

let screenWidth = 1920;
let screenHeight = 1080;
let initialized = false;

/**
 * Initialise koffi et charge les fonctions Windows
 */
function init() {
  if (initialized) return true;
  try {
    koffi = require('koffi');
    user32 = koffi.load('user32.dll');

    // Définir la structure POINT
    POINT = koffi.struct('POINT', { x: 'long', y: 'long' });

    // Charger les fonctions
    SetCursorPos = user32.func('bool SetCursorPos(int x, int y)');
    GetCursorPos = user32.func('bool GetCursorPos(_Out_ POINT *lpPoint)');
    mouse_event = user32.func('void mouse_event(uint32_t dwFlags, int dx, int dy, uint32_t dwData, uintptr_t dwExtraInfo)');
    keybd_event = user32.func('void keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)');
    GetSystemMetrics = user32.func('int GetSystemMetrics(int nIndex)');

    // Récupérer la résolution de l'écran
    screenWidth = GetSystemMetrics(SM_CXSCREEN);
    screenHeight = GetSystemMetrics(SM_CYSCREEN);
    console.log(`[InputHandler] Résolution écran: ${screenWidth}x${screenHeight}`);

    initialized = true;
    return true;
  } catch (err) {
    console.error('[InputHandler] Erreur init koffi:', err.message);
    return false;
  }
}

/**
 * Récupère la position actuelle du curseur
 */
function getCursorPosition() {
  if (!init()) return { x: 0, y: 0 };
  const point = { x: 0, y: 0 };
  GetCursorPos(point);
  return point;
}

/**
 * Déplace le curseur à une position absolue
 */
function moveMouse(x, y) {
  if (!init()) return;
  x = Math.max(0, Math.min(screenWidth - 1, Math.round(x)));
  y = Math.max(0, Math.min(screenHeight - 1, Math.round(y)));
  SetCursorPos(x, y);
}

/**
 * Déplace le curseur relativement
 */
function moveMouseRelative(dx, dy) {
  if (!init()) return;
  const pos = getCursorPosition();
  moveMouse(pos.x + dx, pos.y + dy);
}

/**
 * Clic souris
 */
function mouseClick(button = 'left') {
  if (!init()) return;
  const downFlag = button === 'right' ? MOUSEEVENTF_RIGHTDOWN
    : button === 'middle' ? MOUSEEVENTF_MIDDLEDOWN
    : MOUSEEVENTF_LEFTDOWN;
  const upFlag = button === 'right' ? MOUSEEVENTF_RIGHTUP
    : button === 'middle' ? MOUSEEVENTF_MIDDLEUP
    : MOUSEEVENTF_LEFTUP;
  mouse_event(downFlag, 0, 0, 0, 0);
  mouse_event(upFlag, 0, 0, 0, 0);
}

/**
 * Bouton souris enfoncé
 */
function mouseDown(button = 'left') {
  if (!init()) return;
  const flag = button === 'right' ? MOUSEEVENTF_RIGHTDOWN
    : button === 'middle' ? MOUSEEVENTF_MIDDLEDOWN
    : MOUSEEVENTF_LEFTDOWN;
  mouse_event(flag, 0, 0, 0, 0);
}

/**
 * Bouton souris relâché
 */
function mouseUp(button = 'left') {
  if (!init()) return;
  const flag = button === 'right' ? MOUSEEVENTF_RIGHTUP
    : button === 'middle' ? MOUSEEVENTF_MIDDLEUP
    : MOUSEEVENTF_LEFTUP;
  mouse_event(flag, 0, 0, 0, 0);
}

/**
 * Scroll souris
 */
function mouseScroll(delta) {
  if (!init()) return;
  // delta positif = scroll up, négatif = scroll down
  // Windows utilise des multiples de 120
  mouse_event(MOUSEEVENTF_WHEEL, 0, 0, delta * 120, 0);
}

/**
 * Double clic
 */
function mouseDoubleClick(button = 'left') {
  mouseClick(button);
  setTimeout(() => mouseClick(button), 50);
}

/**
 * Appui sur une touche (down + up)
 */
function keyPress(key, modifiers = []) {
  if (!init()) return;
  const vk = VK_CODES[key.toLowerCase()];
  if (!vk) {
    console.warn(`[InputHandler] Touche inconnue: ${key}`);
    return;
  }

  // Appuyer sur les modificateurs
  for (const mod of modifiers) {
    const modVk = VK_CODES[mod.toLowerCase()];
    if (modVk) keybd_event(modVk, 0, 0, 0);
  }

  // Appuyer et relâcher la touche
  keybd_event(vk, 0, 0, 0);
  keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);

  // Relâcher les modificateurs
  for (const mod of modifiers.reverse()) {
    const modVk = VK_CODES[mod.toLowerCase()];
    if (modVk) keybd_event(modVk, 0, KEYEVENTF_KEYUP, 0);
  }
}

/**
 * Touche enfoncée
 */
function keyDown(key) {
  if (!init()) return;
  const vk = VK_CODES[key.toLowerCase()];
  if (vk) keybd_event(vk, 0, 0, 0);
}

/**
 * Touche relâchée
 */
function keyUp(key) {
  if (!init()) return;
  const vk = VK_CODES[key.toLowerCase()];
  if (vk) keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
}

/**
 * Taper du texte caractère par caractère
 */
function typeText(text) {
  if (!init()) return;
  for (const char of text) {
    const key = char.toLowerCase();
    if (VK_CODES[key]) {
      const needShift = char !== key && char === char.toUpperCase() && /[a-z]/.test(key);
      if (needShift) {
        keyPress(key, ['shift']);
      } else {
        keyPress(key);
      }
    }
  }
}

/**
 * Retourne les dimensions de l'écran
 */
function getScreenSize() {
  if (!init()) return { width: 1920, height: 1080 };
  return { width: screenWidth, height: screenHeight };
}

/**
 * Traite un message d'entrée WebSocket
 */
function handleInputMessage(msg) {
  switch (msg.type) {
    case 'mouse_move':
      moveMouse(msg.x, msg.y);
      break;
    case 'mouse_move_relative':
      moveMouseRelative(msg.dx, msg.dy);
      break;
    case 'mouse_click':
      mouseClick(msg.button || 'left');
      break;
    case 'mouse_double_click':
      mouseDoubleClick(msg.button || 'left');
      break;
    case 'mouse_down':
      mouseDown(msg.button || 'left');
      break;
    case 'mouse_up':
      mouseUp(msg.button || 'left');
      break;
    case 'mouse_scroll':
      mouseScroll(msg.delta || 0);
      break;
    case 'key_press':
      keyPress(msg.key, msg.modifiers || []);
      break;
    case 'key_down':
      keyDown(msg.key);
      break;
    case 'key_up':
      keyUp(msg.key);
      break;
    case 'type_text':
      typeText(msg.text || '');
      break;
    default:
      break;
  }
}

module.exports = {
  init,
  moveMouse,
  moveMouseRelative,
  mouseClick,
  mouseDoubleClick,
  mouseDown,
  mouseUp,
  mouseScroll,
  keyPress,
  keyDown,
  keyUp,
  typeText,
  getScreenSize,
  getCursorPosition,
  handleInputMessage,
  VK_CODES
};
