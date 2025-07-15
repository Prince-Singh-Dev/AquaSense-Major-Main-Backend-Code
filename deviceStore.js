// deviceStore.js
let devices = {};

module.exports = {
  registerDevice: (deviceID, owner) => {
    devices[deviceID] = { owner };
  },
  getDevicesByOwner: (owner) => {
    return Object.entries(devices)
      .filter(([_, v]) => v.owner === owner)
      .map(([k, v]) => ({ deviceID: k, ...v }));
  },
  isDeviceOwnedBy: (deviceID, owner) => {
    return devices[deviceID]?.owner === owner;
  },
  getAllDevices: () => devices
};
