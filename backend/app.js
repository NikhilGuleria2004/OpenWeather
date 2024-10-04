const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// User model
const User = mongoose.model('User', {
  username: String,
  password: String,
  savedWeather: [{
    city: String,
    temperature: Number,
    description: String,
    date: Date
  }]
});

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`);
    res.json(response.data);
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.post('/api/save-weather', authenticateToken, async (req, res) => {
  try {
    const { city } = req.body;
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`);
    const weatherData = {
      city: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      date: new Date()
    };

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.savedWeather.push(weatherData);
    await user.save();
    res.json({ message: 'Weather saved successfully' });
  } catch (error) {
    console.error('Save weather error:', error);
    res.status(500).json({ error: 'Failed to save weather' });
  }
});

app.get('/api/saved-weather', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('savedWeather');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.savedWeather);
  } catch (error) {
    console.error('Fetch saved weather error:', error);
    res.status(500).json({ error: 'Failed to fetch saved weather data' });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.userId = user.userId;
    console.log('Authenticated user ID:', req.userId);  // Log user ID for debugging
    next();
  });
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Unexpected route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
