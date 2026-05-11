const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');
const monitor = new SMTCMonitor();

console.log("Listening for SMTC events for 10 seconds...");

monitor.on('media-properties-changed', (props) => {
  console.log("EVENT: media-properties-changed", props);
});

monitor.on('playback-status-changed', (status) => {
  console.log("EVENT: playback-status-changed", status);
});

monitor.on('session-changed', (session) => {
  console.log("EVENT: session-changed", session);
});

setInterval(() => {
  const sessions = monitor.sessions;
  console.log("\nCurrent sessions:", sessions.length);
  sessions.forEach(s => {
    console.log(` - ${s.sourceAppId}: ${s.mediaProperties?.title || 'N/A'} by ${s.mediaProperties?.artist || 'N/A'} [${s.playbackInfo?.playbackStatus || 'N/A'}]`);
  });
}, 2000);

setTimeout(() => {
  console.log("Debug finished.");
  process.exit(0);
}, 10000);
