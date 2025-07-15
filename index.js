const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./db');
const User = require('./models/UserModel');
const DeviceData = require('./models/DeviceDataModel');

const {
  getCommand, setCommand,
  getStatus, setStatus,
  getLevel, setLevel
} = require('./memoryStore');

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());

let supplyAvailable = true;

app.get('/', (req, res) => res.send('🚀 AquaSense Backend is Live'));

// ✅ Register route
app.post('/register', async (req, res) => {
  const { email, deviceId } = req.body;
  console.log("📝 Registering:", email, deviceId);

  if (!email || !deviceId)
    return res.status(400).json({ success: false, message: "Missing email or deviceId" });

  try {
    const existing = await User.findOne({ email, deviceId });
    if (existing) return res.status(200).json({ success: true, message: "Already registered" });

    const user = new User({ email, deviceId });
    await user.save();
    res.status(201).json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Login route
app.post('/login', async (req, res) => {
  const { email, deviceId } = req.body;
  console.log("🔐 Login attempt:", email, deviceId);

  if (!email || !deviceId)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const user = await User.findOne({ email, deviceId });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    res.status(200).json({ success: true, message: "Login successful", user: { email, deviceId } });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ App sends desired motor command
app.post('/command', (req, res) => {
  const { command } = req.body;
  console.log("💻 App sent command:", command);

  if (command === "ON" || command === "OFF") {
    setCommand(command);
    return res.json({ success: true, message: "Command set" });
  }

  res.status(400).json({ success: false, message: "Invalid command" });
});

// ✅ ESP fetches the command
app.get('/command', (req, res) => {
  const cmd = getCommand();
  console.log("📥 ESP fetched command:", cmd);
  res.json({ command: cmd });
});

// ✅ ESP sends ACTUAL motor status
app.post('/status', async (req, res) => {
  const { status, deviceId } = req.body;
  console.log("🔧 ESP reports status:", status);

  if (status === "ON" || status === "OFF") {
    setStatus(status); // Memory updated

    if (deviceId) await DeviceData.create({ deviceId, status });

    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid status" });
});

// ✅ Frontend or ESP fetches current motor status
app.get('/status', (req, res) => {
  const current = getStatus();
  res.json({ status: current });
});

// ✅ ESP sends water level
app.post('/level', async (req, res) => {
  const { level, deviceId } = req.body;
  console.log("📊 ESP posted level:", level);

  if (typeof level === 'number' && level >= 0 && level <= 100) {
    setLevel(level);
    if (deviceId) await DeviceData.create({ deviceId, level });
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid level" });
});

// ✅ Frontend fetches latest level
app.get('/level', (req, res) => {
  res.json({ level: getLevel() });
});

// ✅ ESP sends water supply status
app.post('/supply', async (req, res) => {
  const { available, deviceId } = req.body;
  console.log("🚰 ESP posted supply:", available);

  if (typeof available === 'boolean') {
    supplyAvailable = available;
    if (deviceId) await DeviceData.create({ deviceId, supply: available });
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid supply status" });
});

// ✅ Frontend fetches water supply status
app.get('/supply', (req, res) => {
  res.json({ available: supplyAvailable });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 AquaSense backend running at http://localhost:${PORT}`);
});
