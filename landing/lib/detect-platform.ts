/**
 * Platform & browser detection. Prefers the modern `userAgentData` API,
 * falls back to userAgent string parsing for older browsers.
 *
 * Returns a verdict against DeckPad's compatibility matrix:
 * - Server side: Windows 10/11 (64-bit)
 * - Client side: Android 9+ with a Chromium-based browser
 * - Visiting from Mac/iOS/Linux: still allowed (you can use the Android PWA
 *   if you have an Android tablet; the verdict simply notes "Side: client")
 */

export type Verdict = 'compatible' | 'partial' | 'incompatible' | 'unknown';

export type Platform = {
  os: 'windows' | 'android' | 'macos' | 'ios' | 'linux' | 'unknown';
  osLabel: string;
  /** Major version when known (e.g. 10 / 11 for Windows, 13 for Android). */
  version: number | null;
  /** Browser engine bucket. */
  browser: 'chromium' | 'safari' | 'firefox' | 'other';
  browserLabel: string;
  is64bit: boolean | null;
  verdict: Verdict;
  /** Short French note explaining the verdict. */
  message: string;
  /** Which DeckPad side fits best: server (Windows PC) or client (Android tablet). */
  side: 'server' | 'client' | 'both' | 'none';
};

type UADataBrand = { brand: string; version: string };
type NavigatorUAData = {
  brands?: UADataBrand[];
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    platformVersion?: string;
    architecture?: string;
    bitness?: string;
    model?: string;
  }>;
};

function parseFromUserAgent(ua: string): Pick<Platform, 'os' | 'version' | 'browser'> {
  const lower = ua.toLowerCase();
  let os: Platform['os'] = 'unknown';
  let version: number | null = null;
  let browser: Platform['browser'] = 'other';

  if (/windows nt/.test(lower)) {
    os = 'windows';
    const m = lower.match(/windows nt (\d+\.\d+)/);
    if (m) {
      // NT 10 = Windows 10 / 11 (UA doesn't differentiate). Default 10.
      version = Number(m[1].split('.')[0]) >= 10 ? 10 : 7;
    }
  } else if (/android/.test(lower)) {
    os = 'android';
    const m = lower.match(/android\s(\d+)/);
    if (m) version = Number(m[1]);
  } else if (/iphone|ipad|ipod/.test(lower)) {
    os = 'ios';
    const m = lower.match(/os\s(\d+)_/);
    if (m) version = Number(m[1]);
  } else if (/mac os x|macintosh/.test(lower)) {
    os = 'macos';
  } else if (/linux/.test(lower)) {
    os = 'linux';
  }

  if (/edg\//.test(lower)) browser = 'chromium';
  else if (/chrome\/|crios/.test(lower) && !/edg\//.test(lower)) browser = 'chromium';
  else if (/firefox\/|fxios/.test(lower)) browser = 'firefox';
  else if (/safari\//.test(lower) && !/chrome|crios|fxios|edg/.test(lower))
    browser = 'safari';

  return { os, version, browser };
}

function browserLabel(b: Platform['browser']): string {
  switch (b) {
    case 'chromium':
      return 'Chromium';
    case 'safari':
      return 'Safari';
    case 'firefox':
      return 'Firefox';
    default:
      return 'Navigateur';
  }
}

function osLabel(os: Platform['os'], v: number | null): string {
  switch (os) {
    case 'windows':
      return v ? `Windows ${v >= 10 ? '10/11' : v}` : 'Windows';
    case 'android':
      return v ? `Android ${v}` : 'Android';
    case 'ios':
      return v ? `iOS ${v}` : 'iOS';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'OS inconnu';
  }
}

export async function detectPlatform(): Promise<Platform> {
  if (typeof navigator === 'undefined') {
    return {
      os: 'unknown',
      osLabel: 'OS inconnu',
      version: null,
      browser: 'other',
      browserLabel: 'Navigateur',
      is64bit: null,
      verdict: 'unknown',
      message: 'Détection indisponible.',
      side: 'none',
    };
  }

  // Modern path: userAgentData
  const nav = navigator as Navigator & { userAgentData?: NavigatorUAData };
  const uaData = nav.userAgentData;

  let os: Platform['os'] = 'unknown';
  let version: number | null = null;
  let browser: Platform['browser'] = 'other';
  let is64bit: boolean | null = null;

  if (uaData?.platform) {
    const p = uaData.platform.toLowerCase();
    if (p.includes('windows')) os = 'windows';
    else if (p.includes('android')) os = 'android';
    else if (p.includes('mac')) os = 'macos';
    else if (p.includes('linux')) os = 'linux';
    else if (p.includes('ios')) os = 'ios';

    const brand = uaData.brands?.find((b) =>
      /chromium|google chrome|microsoft edge|opera/i.test(b.brand),
    );
    if (brand) browser = 'chromium';

    if (uaData.getHighEntropyValues) {
      try {
        const hv = await uaData.getHighEntropyValues([
          'platformVersion',
          'architecture',
          'bitness',
        ]);
        if (hv.platformVersion) {
          // For Windows: 13+ = Win 11, 1+..12 = Win 10
          if (os === 'windows') {
            const major = Number(hv.platformVersion.split('.')[0]);
            version = major >= 13 ? 11 : major >= 1 ? 10 : 7;
          } else {
            version = Number(hv.platformVersion.split('.')[0]) || null;
          }
        }
        if (hv.bitness === '64') is64bit = true;
        else if (hv.bitness === '32') is64bit = false;
      } catch {
        /* ignore */
      }
    }
  }

  // Fallback / completion via userAgent
  if (os === 'unknown' || version === null || browser === 'other') {
    const fromUA = parseFromUserAgent(navigator.userAgent);
    if (os === 'unknown') os = fromUA.os;
    if (version === null) version = fromUA.version;
    if (browser === 'other') browser = fromUA.browser;
  }

  /* ----- compatibility verdict ----- */
  let verdict: Verdict = 'unknown';
  let message = '';
  let side: Platform['side'] = 'none';

  if (os === 'windows') {
    if ((version ?? 0) >= 10) {
      verdict = 'compatible';
      side = 'server';
      message = 'Côté serveur compatible. Télécharge l’exécutable Windows.';
    } else {
      verdict = 'partial';
      side = 'server';
      message = 'Version Windows non testée. Windows 10 ou supérieur recommandé.';
    }
  } else if (os === 'android') {
    if ((version ?? 0) >= 9 && browser === 'chromium') {
      verdict = 'compatible';
      side = 'client';
      message = 'Côté client compatible. Installe la PWA depuis Chrome.';
    } else if ((version ?? 0) >= 9) {
      verdict = 'partial';
      side = 'client';
      message = 'Android compatible, mais utilise un navigateur Chromium (Chrome ou Edge).';
    } else {
      verdict = 'incompatible';
      side = 'none';
      message = 'Android 9 ou supérieur est requis pour DeckPad.';
    }
  } else if (os === 'ios') {
    verdict = 'incompatible';
    side = 'none';
    message = 'iOS n’est pas encore officiellement pris en charge.';
  } else if (os === 'macos' || os === 'linux') {
    verdict = 'partial';
    side = 'none';
    message =
      os === 'macos'
        ? 'Le serveur DeckPad ne tourne pas sur macOS. Utilise un PC Windows.'
        : 'Le serveur DeckPad ne tourne pas sur Linux. Utilise un PC Windows.';
  } else {
    verdict = 'unknown';
    message = 'Détection limitée. Vérifie la compatibilité manuellement.';
  }

  return {
    os,
    osLabel: osLabel(os, version),
    version,
    browser,
    browserLabel: browserLabel(browser),
    is64bit,
    verdict,
    message,
    side,
  };
}
