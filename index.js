const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./db');
const User = require('./models/UserModel'); // ✅ User model
const DeviceData = require('./models/DeviceDataModel'); // ✅ New


const {
  getCommand, setCommand,
  getStatus, setStatus,
  getLevel, setLevel
} = require('./memoryStore');

const app = express();
connectDB(); // ✅ Connect to MongoDB

app.use(cors());
app.use(bodyParser.json());

let supplyAvailable = true;

app.get('/', (req, res) => res.send('AquaSense Backend is live! 🚀'));

// ✅ Register route (save user info)
app.post('/register', async (req, res) => {
  const { email, deviceId } = req.body;
  console.log("📝 Registering user:", email, deviceId);

  if (!email || !deviceId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const existingUser = await User.findOne({ email, deviceId });
    if (existingUser) {
      return res.status(200).json({ success: true, message: "Already registered" });
    }

    const newUser = new User({ email, deviceId });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Login route (verify user)
app.post('/login', async (req, res) => {
  const { email, deviceId } = req.body;
  console.log("🔐 Login attempt:", email, deviceId);

  if (!email || !deviceId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const user = await User.findOne({ email, deviceId });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { email: user.email, deviceId: user.deviceId },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ✅ FRONTEND sends desired command
app.post('/command', (req, res) => {
  const { command } = req.body;
  console.log("💻 Frontend requested command:", command);

  if (command === "ON" || command === "OFF") {
    // Only store the request; DO NOT change motor state directly
    setCommand(command);
    return res.json({ success: true, message: "Command registered" });
  }

  res.status(400).json({ success: false, message: "Invalid command" });
});

// ✅ ESP fetches command when ready to act
app.get('/command', (req, res) => {
  const currentCommand = getCommand();
  console.log("📥 ESP fetched command:", currentCommand);
  res.json({ command: currentCommand });
});

// ✅ ESP reports *actual* motor status (manual or from command)
app.post('/status', async (req, res) => {
  const { status, deviceId } = req.body;
  console.log("🔧 ESP posted ACTUAL motor status:", status);

  if (status === "ON" || status === "OFF") {
    // This is the TRUTH, coming from the device itself
    setStatus(status);

    if (deviceId) {
      await DeviceData.create({ deviceId, status });
    }

    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid status" });
});

// ✅ Water level
app.post('/level', async (req, res) => {
  const { level, deviceId } = req.body;
  console.log("📊 ESP posted level:", level);

  if (typeof level === 'number' && level >= 0 && level <= 100) {
    setLevel(level);

    if (deviceId) {
      await DeviceData.create({ deviceId, level });
    }

    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Invalid level" });
  }
});


// ✅ Supply
app.post('/supply', async (req, res) => {
  const { available, deviceId } = req.body;
  console.log("🚰 ESP posted supply:", available);

  if (typeof available === 'boolean') {
    supplyAvailable = available;

    if (deviceId) {
      await DeviceData.create({ deviceId, supply: available });
    }

    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Invalid supply status" });
  }
});


// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 AquaSense backend running on http://localhost:${PORT}`);
});
