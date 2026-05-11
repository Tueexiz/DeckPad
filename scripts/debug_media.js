const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');
const monitor = new SMTCMonitor();

setTimeout(() => {
  const sessions = monitor.sessions;
  console.log("Total sessions found:", sessions.length);
  
  sessions.forEach((s, i) => {
    console.log(`\nSession ${i}:`);
    console.log(" - App ID:", s.sourceAppId);
    console.log(" - Title:", s.mediaProperties?.title);
    console.log(" - Artist:", s.mediaProperties?.artist);
    console.log(" - Status:", s.playbackInfo?.playbackStatus);
    console.log(" - Has Thumbnail:", !!s.mediaProperties?.thumbnail);
    if (s.mediaProperties?.thumbnail) {
        console.log(" - Thumbnail length:", s.mediaProperties.thumbnail.length);
    }
  });
  
  process.exit(0);
}, 2000);
