let command = "OFF";
let status = "unknown";
let statusSource = "unknown";
let level = 0;

module.exports = {
  // App Command (desired state)
  getCommand: () => command,
  setCommand: (c) => { command = c; },

  // Actual Motor Status (from ESP)
  getStatus: () => ({ status, source: statusSource }),
  setStatus: (s, source = "ESP") => {
    status = s;
    statusSource = source;
  },

  // Water Level
  getLevel: () => level,
  setLevel: (l) => { level = l; }
};
