const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: '{{projectName}} API',
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to {{projectName}} API',
    version: '1.0.0'
  });
});

// TODO: Add your routes here
// app.use('/api/users', require('./routes/users'));
// app.use('/api/auth', require('./routes/auth'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

module.exports = app;