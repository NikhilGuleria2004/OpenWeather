import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://openweatherappnikhil.vercel.app/';


function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [savedWeather, setSavedWeather] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchSavedWeathers();
    }
  }, [token]);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/weather/${city}`);
      setWeather(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch weather data');
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${API_BASE_URL}/register`, { username, password });
      setMessage('Registration successful. Please log in.');
      setError('');
    } catch (error) {
      setError('Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setError('');
    } catch (error) {
      setError('Login failed');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setSavedWeather([]);
  };

  const handleSaveWeather = async () => {
    try {
      await axios.post(`${API_BASE_URL}/save-weather`, 
        { city },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Weather saved successfully');
      setError('');
      fetchSavedWeathers();
    } catch (error) {
      setError('Failed to save weather');
    }
  };

  const fetchSavedWeathers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/saved-weather`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedWeather(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch saved weather');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  return (
    <div className="App">
      <h1>Weather App</h1>
      {!token ? (
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleRegister}>Register</button>
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <input
            type="text"
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={fetchWeather}>Get Weather</button>
          <button onClick={handleSaveWeather}>Save Weather</button>
          <button onClick={fetchSavedWeathers}>View Saved Weathers</button>
        </div>
      )}
      {weather && (
        <div>
          <h2>{weather.name}</h2>
          <p>Temperature: {weather.main.temp}°C</p>
          <p>Description: {weather.weather[0].description}</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}
      {savedWeather.length > 0 && (
        <div>
          <h2>Saved Weathers</h2>
          <ul>
            {savedWeather.map((weather, index) => (
              <li key={index}>
                <strong>{weather.city}</strong> - {new Date(weather.date).toLocaleDateString()}
                <p>Temperature: {weather.temperature}°C</p>
                <p>Description: {weather.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;