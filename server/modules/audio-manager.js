/**
 * DeckPad — Gestionnaire Audio
 * Volume Master/Mic via PowerShell + Core Audio API (zero dependency)
 * Détection nircmd optionnelle (fallback élégant si absent).
 * Profils audio : Gaming / Stream / Musique
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const log = require('./logger').create('AudioManager');

/* ─── Détection nircmd (best-effort) ─── */
function detectNircmd() {
  try {
    execSync('where nircmd', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch (_) {
    return false;
  }
}

const NIRCMD_AVAILABLE = detectNircmd();
log.info('Detection outillage', { nircmd: NIRCMD_AVAILABLE });

/* ─── PowerShell scripts ─── */
const PS_SET = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int f(); int g(); int h(); int i();
    int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
    int GetMasterVolumeLevelScalar(out float pfLevel);
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, Guid pguidEventContext);
    int GetMute(out bool pbMute);
}
[Guid("D6660639-8265-451A-9F0C-A13908ADB439"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref Guid id, int clsCtx, IntPtr pActivationParams, out IAudioEndpointVolume ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63C17C6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int f();
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class AudioControl {
    public static void SetVolume(float level, int dataFlow) {
        try {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(dataFlow, 1, out device);
            IAudioEndpointVolume volume;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            device.Activate(ref iid, 1, IntPtr.Zero, out volume);
            volume.SetMasterVolumeLevelScalar(level / 100.0f, Guid.Empty);
            if (level > 0) volume.SetMute(false, Guid.Empty);
        } catch {}
    }
    public static void SetMute(bool mute, int dataFlow) {
        try {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(dataFlow, 1, out device);
            IAudioEndpointVolume volume;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            device.Activate(ref iid, 1, IntPtr.Zero, out volume);
            volume.SetMute(mute, Guid.Empty);
        } catch {}
    }
}
'@
`;

const PS_GET = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int f(); int g(); int h(); int i();
    int k(); int l();
    int GetMasterVolumeLevelScalar(out float pfLevel);
    int n();
    int o();
    int GetMute(out bool pbMute);
}
[Guid("D6660639-8265-451A-9F0C-A13908ADB439"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref Guid id, int clsCtx, IntPtr pActivationParams, out IAudioEndpointVolume ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63C17C6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int f();
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class Audio {
    public static string GetState(int dataFlow) {
        try {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(dataFlow, 1, out device);
            IAudioEndpointVolume volume;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            device.Activate(ref iid, 1, IntPtr.Zero, out volume);
            float level; volume.GetMasterVolumeLevelScalar(out level);
            bool muted; volume.GetMute(out muted);
            return level.ToString("F4") + "|" + (muted ? "1" : "0");
        } catch { return "0.5|0"; }
    }
}
'@
`;

/* ─── Module ─── */
class AudioManager {
  constructor() {
    this.profiles = {
      gaming: { master: 80, mic: 70 },
      stream: { master: 50, mic: 90 },
      musique: { master: 70, mic: 0 },
    };
    this.profilesPath = path.join(__dirname, '..', '..', 'data', 'audio-profiles.json');
    this._loadProfiles();
  }

  _loadProfiles() {
    try {
      if (fs.existsSync(this.profilesPath)) {
        const data = JSON.parse(fs.readFileSync(this.profilesPath, 'utf-8'));
        Object.assign(this.profiles, data);
        log.info('Profils audio chargés', { count: Object.keys(this.profiles).length });
      }
    } catch (err) {
      log.warn('Erreur chargement profils', err);
    }
  }

  _saveProfiles() {
    try {
      const dir = path.dirname(this.profilesPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.profilesPath, JSON.stringify(this.profiles, null, 2));
      log.info('Profils audio sauvegardés');
    } catch (err) {
      log.warn('Erreur sauvegarde profils', err);
    }
  }

  getHealth() {
    return {
      nircmd: NIRCMD_AVAILABLE,
      profiles: Object.keys(this.profiles),
    };
  }

  setVolume(device, value) {
    const percent = Math.min(100, Math.max(0, parseFloat(value)));
    log.debug('Set volume', { device, percent });

    if (device !== 'master' && device !== 'mic') {
      log.warn('Device inconnu', { device });
      return;
    }

    const flow = device === 'master' ? 0 : 1; // 0=render 1=capture
    const psScript = `${PS_SET}\n[AudioControl]::SetVolume(${percent}, ${flow})`;
    exec(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, (err) => {
      if (err) log.error('Erreur SetVolume', { device, error: err.message });
    });
  }

  setMute(device, mute) {
    if (device !== 'master' && device !== 'mic') return;
    const flow = device === 'master' ? 0 : 1;
    const psScript = `${PS_SET}\n[AudioControl]::SetMute($${mute ? 'true' : 'false'}, ${flow})`;
    log.debug('Set mute', { device, mute });
    exec(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, (err) => {
      if (err) log.error('Erreur SetMute', { device, error: err.message });
    });
  }

  getMasterVolume() {
    return this._getState('master').then(s => s.volume);
  }

  /**
   * Etat complet { volume, muted } d'un device
   */
  _getState(device) {
    return new Promise((resolve) => {
      const flow = device === 'mic' ? 1 : 0;
      const psScript = `${PS_GET}\n[Audio]::GetState(${flow})`;
      exec(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, (err, stdout) => {
        if (err) {
          log.warn('GetState fallback', { device, error: err.message });
          return resolve({ volume: 50, muted: false });
        }
        const parts = (stdout || '').trim().split('|');
        const level = parseFloat(parts[0]);
        const muted = parts[1] === '1';
        const volume = isNaN(level) ? 50 : Math.round(level * 100);
        resolve({ volume, muted });
      });
    });
  }

  getState(device = 'master') {
    return this._getState(device);
  }

  /**
   * Profils audio
   */
  applyProfile(name) {
    const profile = this.profiles[name];
    if (!profile) {
      log.warn('Profil inconnu', { name });
      return false;
    }
    log.info('Application profil audio', { name, profile });
    if (typeof profile.master === 'number') this.setVolume('master', profile.master);
    if (typeof profile.mic === 'number')    this.setVolume('mic',    profile.mic);
    return true;
  }

  saveProfile(name, settings) {
    if (!name || typeof settings !== 'object') return false;
    this.profiles[name] = {
      master: typeof settings.master === 'number' ? settings.master : this.profiles[name]?.master ?? 50,
      mic:    typeof settings.mic    === 'number' ? settings.mic    : this.profiles[name]?.mic    ?? 50,
    };
    this._saveProfiles();
    return true;
  }

  listProfiles() {
    return Object.entries(this.profiles).map(([name, settings]) => ({ name, ...settings }));
  }
}

module.exports = new AudioManager();
