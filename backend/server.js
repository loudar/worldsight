const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connected:', res.rows[0].now);
  }
});

// API Routes

// Get climate data
app.get('/api/climate-data', async (req, res) => {
  try {
    // Query to get climate data from the database
    const result = await pool.query(`
      SELECT 
        id, 
        location_name, 
        ST_AsGeoJSON(location)::json as geometry, 
        temperature, 
        precipitation, 
        climate_type
      FROM climate_data
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching climate data:', error);
    res.status(500).json({ error: 'Failed to fetch climate data' });
  }
});

// Get location details
app.get('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Query to get location details
    const result = await pool.query(`
      SELECT 
        id, 
        location_name, 
        ST_AsGeoJSON(location)::json as geometry, 
        temperature, 
        precipitation, 
        climate_type,
        additional_data
      FROM climate_data
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching location details:', error);
    res.status(500).json({ error: 'Failed to fetch location details' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;