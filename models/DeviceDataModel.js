const mongoose = require('mongoose');

const DeviceDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  level: Number,
  status: String,
  supply: Boolean,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeviceData', DeviceDataSchema);
