let command = "OFF";
let status = "unknown";
let level = 0;

module.exports = {
  getCommand: () => command,
  setCommand: (c) => { command = c; },

  getStatus: () => status,
  setStatus: (s) => { status = s; },

  getLevel: () => level,
  setLevel: (l) => { level = l; }
};
