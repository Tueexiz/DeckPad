/**
 * DeckPad - Media Monitor
 * Récupère les infos SMTC (Spotify, Apple Music, etc.)
 */

const { SMTCMonitor, PlaybackStatus } = require('@coooookies/windows-smtc-monitor');
const EventEmitter = require('events');

class MediaMonitor extends EventEmitter {
  constructor() {
    super();
    try {
      this.monitor = new SMTCMonitor();
      this._setupListeners();
      console.log('[MediaMonitor] Initialisé avec succès');
    } catch (err) {
      console.error('[MediaMonitor] Erreur initialisation:', err);
    }
  }

  _setupListeners() {
    this.monitor.on('media-properties-changed', (props) => {
      this._broadcastMediaUpdate();
    });

    this.monitor.on('playback-status-changed', (status) => {
      this._broadcastMediaUpdate();
    });

    this.monitor.on('current-session-changed', (session) => {
      this._broadcastMediaUpdate();
    });
  }

  getCurrentMedia() {
    if (!this.monitor) return null;
    
    const sessions = this.monitor.sessions;
    if (!sessions || sessions.length === 0) return null;

    // On prend la session active ou la première
    const session = sessions.find(s => s.playbackInfo && s.playbackInfo.playbackStatus === PlaybackStatus.PLAYING) || sessions[0];
    
    if (!session) return null;

    return {
      title: session.mediaProperties?.title || 'Inconnu',
      artist: session.mediaProperties?.artist || 'Artiste inconnu',
      album: session.mediaProperties?.albumTitle || '',
      status: session.playbackInfo?.playbackStatus === PlaybackStatus.PLAYING ? 'playing' : 'paused',
      appId: session.sourceAppId || '',
      thumbnail: session.mediaProperties?.thumbnail ? `data:image/jpeg;base64,${session.mediaProperties.thumbnail}` : null,
      appName: this._getAppName(session.sourceAppId)
    };
  }

  _getAppName(id) {
    if (!id) return 'Inconnu';
    const lowId = id.toLowerCase();
    if (lowId.includes('spotify')) return 'Spotify';
    if (lowId.includes('apple') || lowId.includes('music')) return 'Apple Music';
    if (lowId.includes('chrome')) return 'Chrome';
    if (lowId.includes('edge')) return 'Edge';
    if (lowId.includes('vlc')) return 'VLC';
    if (lowId.includes('discord')) return 'Discord';
    if (lowId.includes('steam')) return 'Steam';
    if (lowId.includes('rocketleague')) return 'Rocket League';
    if (lowId.includes('fortnite')) return 'Fortnite';
    return id.split('.').pop();
  }

  _broadcastMediaUpdate() {
    const data = this.getCurrentMedia();
    this.emit('media_update', data);
  }
}

module.exports = new MediaMonitor();
