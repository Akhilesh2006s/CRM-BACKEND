const mongoose = require('mongoose');

/**
 * Middleware to check MongoDB connection health
 * Returns 503 if database is not connected
 */
const checkDbHealth = (req, res, next) => {
  const connectionState = mongoose.connection.readyState;
  
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (connectionState !== 1) {
    return res.status(503).json({
      message: 'Database connection is not available. Please check your MongoDB connection.',
      error: 'DATABASE_CONNECTION_ERROR',
      connectionState: connectionState,
      states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }
    });
  }
  
  next();
};

module.exports = { checkDbHealth };



