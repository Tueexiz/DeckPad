#!/usr/bin/env node
/**
 * DeckPad — Build Script
 *
 * Bundle + minification CSS/JS sans aucune dépendance externe.
 *
 * Stratégie :
 *  - Concatène les fichiers dans l'ordre de chargement de index.html
 *  - Minifie CSS : strip commentaires + collapse whitespace + remove unused space
 *  - Minifie JS : strip commentaires (préserve strings & regex) + collapse whitespace
 *  - Génère client/dist/{deckpad.min.css, deckpad.min.js, index.html}
 *  - Calcule un hash de cache (8 chars) à injecter dans les URLs
 *
 * Usage :  node scripts/build.js
 *          npm run build
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const CLIENT = path.join(ROOT, 'client');
const DIST = path.join(CLIENT, 'dist');

const CSS_ORDER = [
  'css/design-system.css',
  'css/main.css',
  'css/stream-deck.css',
  'css/global-3d.css',
  'css/components.css',
  'css/premium.css',
];

const JS_ORDER = [
  'js/connection.js',
  'js/app.js',
  'js/system-dashboard.js',
  'js/spectrum.js',
  'js/screen-viewer.js',
  'js/virtual-keyboard.js',
  'js/gamepad.js',
  'js/premium.js',
];

/* ─── CSS minifier (zero-dep) ─── */
function minifyCSS(src) {
  return src
    // Supprime commentaires /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Collapse blancs autour des séparateurs
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Supprime ; superflu avant }
    .replace(/;}/g, '}')
    // Collapse espaces multiples
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/* ─── JS minifier (zero-dep, conservateur) ─── */
function minifyJS(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];

    // Commentaires bloc
    if (c === '/' && c2 === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // Commentaires ligne (avec /// et //!)
    if (c === '/' && c2 === '/') {
      const nl = src.indexOf('\n', i + 2);
      i = nl === -1 ? n : nl;
      continue;
    }
    // Strings
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === quote) { j++; break; }
        if (quote === '`' && src[j] === '$' && src[j + 1] === '{') {
          // Template expression — saute jusqu'au }
          let depth = 1;
          j += 2;
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            j++;
          }
          continue;
        }
        j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    // Regex literal (heuristique : / précédé d'opérateur ou début)
    if (c === '/') {
      // Cherche le dernier non-blanc dans out
      let k = out.length - 1;
      while (k >= 0 && /\s/.test(out[k])) k--;
      const prev = k >= 0 ? out[k] : '';
      const isRegex = !prev || /[=(,!&|?{};:[\n+\-*<>~%^]/.test(prev) ||
                      /\b(return|typeof|in|of|delete|throw|new|instanceof)$/.test(out.slice(Math.max(0, k - 12), k + 1));
      if (isRegex) {
        let j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') {
            // Charset : / ne termine pas dedans
            j++;
            while (j < n && src[j] !== ']') {
              if (src[j] === '\\') { j += 2; continue; }
              j++;
            }
            j++;
            continue;
          }
          if (src[j] === '/') { j++; break; }
          if (src[j] === '\n') break;
          j++;
        }
        // Flags
        while (j < n && /[gimsuy]/.test(src[j])) j++;
        out += src.slice(i, j);
        i = j;
        continue;
      }
    }
    out += c;
    i++;
  }

  // Collapse espaces hors strings (déjà fait grâce à la copie above)
  // On fait un second pass simple : tabs/CR + multi-LF/spaces -> 1 espace,
  // mais on doit préserver les newlines après instructions (heuristique : laisser \n).
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*([{};,()=<>?:!&|+\-*\/%^~\[\]])\s*/g, (m, p) => {
      // Préserve : et ? et = quand entourés d'espaces dans contextes utiles
      // Heuristique sûre : on garde le caractère sans espace
      return p;
    })
    .trim();
}

/* ─── IO helpers ─── */
function readFile(rel) {
  return fs.readFileSync(path.join(CLIENT, rel), 'utf-8');
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function hashShort(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function fmtSize(b) {
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(2) + ' MB';
  if (b > 1024)        return (b / 1024).toFixed(1) + ' KB';
  return b + ' B';
}

/* ─── Build ─── */
function build() {
  console.log('🔨 DeckPad — Build commencé\n');
  ensureDir(DIST);

  // CSS
  let cssRaw = '';
  for (const f of CSS_ORDER) {
    const src = readFile(f);
    cssRaw += `/* ${f} */\n${src}\n`;
  }
  const cssMin = minifyCSS(cssRaw);
  const cssHash = hashShort(cssMin);
  const cssFile = `deckpad.${cssHash}.min.css`;
  fs.writeFileSync(path.join(DIST, cssFile), cssMin, 'utf-8');
  console.log(`✓ CSS  ${fmtSize(cssRaw.length).padEnd(10)} → ${fmtSize(cssMin.length).padEnd(10)} (${(cssMin.length / cssRaw.length * 100).toFixed(1)}%)  ${cssFile}`);

  // JS
  let jsRaw = '';
  for (const f of JS_ORDER) {
    const src = readFile(f);
    jsRaw += `/* ${f} */\n${src}\n;`;
  }
  const jsMin = minifyJS(jsRaw);
  const jsHash = hashShort(jsMin);
  const jsFile = `deckpad.${jsHash}.min.js`;
  fs.writeFileSync(path.join(DIST, jsFile), jsMin, 'utf-8');
  console.log(`✓ JS   ${fmtSize(jsRaw.length).padEnd(10)} → ${fmtSize(jsMin.length).padEnd(10)} (${(jsMin.length / jsRaw.length * 100).toFixed(1)}%)  ${jsFile}`);

  // index.html (réécrit avec les bundles + dist paths absolus depuis client/)
  const htmlSrc = readFile('index.html');
  let html = htmlSrc;

  // Supprime tous les <link rel="stylesheet" href="css/...">
  html = html.replace(/\s*<link\s+rel="stylesheet"\s+href="css\/[^"]+"\s*>/g, '');
  // Insère le bundle CSS unique avant </head>
  html = html.replace(
    /<\/head>/,
    `  <link rel="stylesheet" href="dist/${cssFile}">\n</head>`
  );
  // Supprime tous les <script src="js/..."> (sauf le inline lucide)
  html = html.replace(/\s*<script\s+src="js\/[^"]+"\s*><\/script>/g, '');
  // Insère le bundle JS unique juste avant le inline lucide.createIcons()
  html = html.replace(
    /<script>lucide\.createIcons\(\);<\/script>/,
    `<script src="dist/${jsFile}"></script>\n  <script>lucide.createIcons();</script>`
  );

  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf-8');
  console.log(`✓ HTML        ${fmtSize(html.length)}     dist/index.html`);

  // Copie manifest, icons, sw.js
  fs.copyFileSync(path.join(CLIENT, 'manifest.webmanifest'), path.join(DIST, 'manifest.webmanifest'));
  ensureDir(path.join(DIST, 'icons'));
  ['icon-192.svg', 'icon-512.svg', 'icon-maskable.svg'].forEach((n) => {
    fs.copyFileSync(path.join(CLIENT, 'icons', n), path.join(DIST, 'icons', n));
  });

  // Adapte sw.js pour pointer vers les bundles
  let sw = fs.readFileSync(path.join(CLIENT, 'sw.js'), 'utf-8');
  sw = sw.replace(
    /const SHELL_ASSETS = \[[\s\S]*?\];/,
    `const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/dist/${cssFile}',
  '/dist/${jsFile}',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
];`
  );
  fs.writeFileSync(path.join(DIST, 'sw.js'), sw, 'utf-8');

  // Manifeste de build
  fs.writeFileSync(path.join(DIST, 'build-manifest.json'), JSON.stringify({
    version: require(path.join(ROOT, 'package.json')).version,
    builtAt: new Date().toISOString(),
    files: { css: cssFile, js: jsFile },
    sizes: {
      cssRaw: cssRaw.length, cssMin: cssMin.length,
      jsRaw: jsRaw.length,   jsMin: jsMin.length,
    },
  }, null, 2));

  console.log('\n✅ Build terminé\n   → ' + path.relative(ROOT, DIST));
  const total = cssMin.length + jsMin.length + html.length;
  console.log(`   Total payload : ${fmtSize(total)}`);
}

build();
