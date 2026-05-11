/**
 * DeckPad - Gestionnaire Audio
 * Contrôle le volume master et micro via PowerShell (Core Audio API)
 */

const { exec } = require('child_process');

class AudioManager {
  setVolume(device, value) {
    const percent = Math.min(100, Math.max(0, value));
    console.log(`[AudioManager] Set ${device} to ${percent}%`);

    if (device === 'master' || device === 'mic') {
      const psScript = `
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
}
'@
[AudioControl]::SetVolume(${percent}, ${device === 'master' ? 0 : 1})
`;
      exec(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`);
    }
  }

  getMasterVolume() {
    return new Promise((resolve) => {
      const psScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int f(); int g(); int h(); int i();
    int k(); int l();
    int GetMasterVolumeLevelScalar(out float pfLevel);
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
    public static float GetVolume() {
        try {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(0, 1, out device);
            IAudioEndpointVolume volume;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            device.Activate(ref iid, 1, IntPtr.Zero, out volume);
            float level;
            volume.GetMasterVolumeLevelScalar(out level);
            return level * 100;
        } catch { return 50; }
    }
}
'@
[Audio]::GetVolume()
`;
      exec(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, (err, stdout) => {
        if (err) resolve(50);
        else resolve(Math.round(parseFloat(stdout.trim())) || 50);
      });
    });
  }
}

module.exports = new AudioManager();
