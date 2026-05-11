/**
 * DeckPad — Audio Meter (Windows Core Audio peak meter)
 *
 * Lit IAudioMeterInformation::GetPeakValue() du device de sortie par défaut
 * via un script PowerShell persistant.
 *
 * Avantages :
 *  • Aucune capture audio (pas de bande passante, pas de droits micro)
 *  • Aucune dépendance externe
 *  • Reflète exactement ce qui sort des haut-parleurs (master)
 *  • Latence < 30ms
 *
 * Émet : 'level' { peak: 0..1, channels: [0..1] }
 *        toutes les ~50ms quand actif
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const log = require('./logger').create('AudioMeter');

const PS_SCRIPT = String.raw`
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioMeterInformation {
    int GetPeakValue(out float pfPeak);
    int GetMeteringChannelCount(out uint pnChannelCount);
    int GetChannelsPeakValues(uint u32ChannelCount, [Out] float[] afPeakValues);
    int QueryHardwareSupport(out uint pdwHardwareSupportMask);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref Guid id, int clsCtx, IntPtr pActivationParams,
                 [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63C17C6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int f();
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class Meter {
    static IAudioMeterInformation meter;
    static uint channels;
    public static void Init() {
        try {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(0, 1, out device);
            Guid iid = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");
            object o; device.Activate(ref iid, 1, IntPtr.Zero, out o);
            meter = (IAudioMeterInformation)o;
            meter.GetMeteringChannelCount(out channels);
        } catch { meter = null; }
    }
    public static string Sample() {
        if (meter == null) Init();
        if (meter == null) return "0";
        try {
            float peak; meter.GetPeakValue(out peak);
            float[] vals = new float[channels];
            meter.GetChannelsPeakValues(channels, vals);
            string s = peak.ToString("F4", System.Globalization.CultureInfo.InvariantCulture);
            for (int i = 0; i < channels; i++) {
                s += "|" + vals[i].ToString("F4", System.Globalization.CultureInfo.InvariantCulture);
            }
            return s;
        } catch { return "0"; }
    }
}
'@

[Meter]::Init()
while ($true) {
    [Console]::Out.WriteLine([Meter]::Sample())
    [Console]::Out.Flush()
    Start-Sleep -Milliseconds 50
}
`;

class AudioMeter extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.running = false;
    this.lastSampleAt = 0;
    this.peak = 0;
    this.channels = [];
    this.subscribers = 0;
  }

  /**
   * Démarre la capture du peak meter
   * Appelle subscribe()/unsubscribe() pour activer/désactiver à la demande.
   */
  subscribe() {
    this.subscribers++;
    if (this.subscribers === 1) this._start();
  }

  unsubscribe() {
    this.subscribers = Math.max(0, this.subscribers - 1);
    if (this.subscribers === 0) this._stop();
  }

  _start() {
    if (this.running) return;
    log.info('Démarrage peak meter');

    try {
      this.process = spawn('powershell', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command', PS_SCRIPT,
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      log.error('Spawn PowerShell échec', err);
      this.process = null;
      return;
    }

    this.running = true;
    let buf = '';

    this.process.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        this._parseLine(line);
      }
    });

    this.process.stderr.on('data', (chunk) => {
      const msg = chunk.toString().trim();
      if (msg) log.warn('PS stderr', { msg: msg.slice(0, 200) });
    });

    this.process.on('close', (code) => {
      log.info('Peak meter terminé', { code });
      this.running = false;
      this.process = null;
      // Auto-restart si toujours des subscribers
      if (this.subscribers > 0) {
        setTimeout(() => this._start(), 1000);
      }
    });

    this.process.on('error', (err) => {
      log.error('Peak meter error', err);
      this.running = false;
    });
  }

  _stop() {
    if (this.process) {
      try { this.process.kill(); } catch (_) {}
      this.process = null;
    }
    this.running = false;
    log.info('Peak meter arrêté');
  }

  _parseLine(line) {
    const parts = line.split('|');
    const peak = parseFloat(parts[0]);
    if (isNaN(peak)) return;
    const channels = parts.slice(1).map(parseFloat).filter(v => !isNaN(v));
    this.peak = peak;
    this.channels = channels;
    this.lastSampleAt = Date.now();
    this.emit('level', { peak, channels, t: this.lastSampleAt });
  }

  getHealth() {
    return {
      running: this.running,
      subscribers: this.subscribers,
      peak: this.peak,
      channels: this.channels.length,
      lastSampleMsAgo: this.lastSampleAt ? Date.now() - this.lastSampleAt : null,
    };
  }
}

module.exports = new AudioMeter();
