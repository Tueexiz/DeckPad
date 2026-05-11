/**
 * DeckPad - Module de monitoring système
 * Utilise systeminformation pour récupérer les stats du PC en temps réel
 */

const si = require('systeminformation');

class SystemMonitor {
  constructor() {
    this.interval = null;
    this.callback = null;
    this.cachedStaticInfo = null;
  }

  /**
   * Récupère les infos statiques du PC (une seule fois)
   */
  async getStaticInfo() {
    if (this.cachedStaticInfo) return this.cachedStaticInfo;

    try {
      const [cpu, osInfo, graphics, mem, diskLayout] = await Promise.all([
        si.cpu(),
        si.osInfo(),
        si.graphics(),
        si.mem(),
        si.diskLayout()
      ]);

      this.cachedStaticInfo = {
        pcName: osInfo.hostname,
        os: `${osInfo.distro} ${osInfo.release}`,
        cpu: `${cpu.manufacturer} ${cpu.brand}`,
        cpuCores: cpu.cores,
        cpuPhysicalCores: cpu.physicalCores,
        totalRam: mem.total,
        gpus: graphics.controllers.map(g => ({
          model: g.model,
          vram: g.vram
        })),
        disks: diskLayout.map(d => ({
          name: d.name,
          size: d.size,
          type: d.type
        }))
      };

      return this.cachedStaticInfo;
    } catch (err) {
      console.error('[SystemMonitor] Erreur infos statiques:', err.message);
      return null;
    }
  }

  /**
   * Récupère les stats dynamiques (CPU, RAM, GPU usage, etc.)
   */
  async getStats() {
    try {
      const [currentLoad, mem, graphics, fsSize, networkStats, battery, processes] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.graphics(),
        si.fsSize(),
        si.networkStats(),
        si.battery(),
        si.processes()
      ]);

      // Top 10 processus par utilisation CPU
      const topProcesses = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 10)
        .map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: Math.round(p.cpu * 10) / 10,
          mem: Math.round(p.mem * 10) / 10
        }));

      return {
        cpu: {
          usage: Math.round(currentLoad.currentLoad * 10) / 10,
          cores: currentLoad.cpus ? currentLoad.cpus.map(c => Math.round(c.load * 10) / 10) : []
        },
        ram: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          usagePercent: Math.round((mem.used / mem.total) * 1000) / 10
        },
        gpu: graphics.controllers.map(g => ({
          model: g.model,
          usage: g.utilizationGpu || 0,
          memUsed: g.memoryUsed || 0,
          memTotal: g.memoryTotal || 0,
          temp: g.temperatureGpu || null,
          fanSpeed: g.fanSpeed || null
        })),
        disks: fsSize.map(d => ({
          mount: d.mount,
          size: d.size,
          used: d.used,
          usagePercent: Math.round(d.use * 10) / 10
        })),
        network: {
          rxSec: networkStats[0] ? networkStats[0].rx_sec : 0,
          txSec: networkStats[0] ? networkStats[0].tx_sec : 0
        },
        battery: battery.hasBattery ? {
          percent: battery.percent,
          charging: battery.isCharging,
          timeRemaining: battery.timeRemaining
        } : null,
        processes: topProcesses,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error('[SystemMonitor] Erreur stats:', err.message);
      return null;
    }
  }

  /**
   * Démarre le monitoring périodique
   */
  startMonitoring(intervalMs = 2000, callback) {
    this.callback = callback;
    this.stopMonitoring();

    // Envoyer les stats immédiatement
    this.getStats().then(stats => {
      if (stats && this.callback) this.callback(stats);
    });

    this.interval = setInterval(async () => {
      const stats = await this.getStats();
      if (stats && this.callback) {
        this.callback(stats);
      }
    }, intervalMs);

    console.log(`[SystemMonitor] Monitoring démarré (intervalle: ${intervalMs}ms)`);
  }

  /**
   * Arrête le monitoring
   */
  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = SystemMonitor;
