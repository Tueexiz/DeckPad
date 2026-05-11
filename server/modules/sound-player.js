/**
 * DeckPad - Lecteur Audio
 * Utilise PowerShell pour jouer des sons sur Windows
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class SoundPlayer {
  constructor() {
    // Liste des sons système Windows garantis de fonctionner
    this.soundMap = {
      'airhorn': 'Hand', 
      'meme': 'Exclamation',
      'clap': 'Asterisk',
      'fail': 'Question',
      'drum': 'Beep',
      'victory': 'Exclamation'
    };
    
    this.soundsDir = path.join(__dirname, '..', '..', 'assets', 'sounds');
    if (!fs.existsSync(this.soundsDir)) {
      fs.mkdirSync(this.soundsDir, { recursive: true });
    }
  }

  play(soundId) {
    console.log(`[SoundPlayer] Lecture demandée: ${soundId}`);
    
    const customPath = path.join(this.soundsDir, `${soundId}.wav`);
    
    if (fs.existsSync(customPath)) {
      // Jouer un fichier WAV personnalisé
      const psCommand = `(New-Object Media.SoundPlayer "${customPath}").Play()`;
      exec(`powershell -NoProfile -Command "${psCommand}"`, (err) => {
        if (err) console.error('[SoundPlayer] Erreur WAV:', err.message);
      });
    } else {
      // Utiliser les sons système (on tente plusieurs méthodes pour assurer le coup)
      const systemSound = this.soundMap[soundId] || 'Beep';
      
      // Méthode 1: SystemSounds
      const psCommand = `[System.Media.SystemSounds]::${systemSound}.Play()`;
      
      exec(`powershell -NoProfile -Command "${psCommand}"`, (err) => {
        if (err) {
          console.error('[SoundPlayer] Erreur son système, tentative fallback Beep:', err.message);
          // Méthode 2: Beep simple
          exec(`powershell -NoProfile -Command "[System.Console]::Beep(440, 200)"`);
        }
      });
    }
  }
}

module.exports = new SoundPlayer();
