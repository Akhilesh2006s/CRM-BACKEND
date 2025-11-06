const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/crm_system'

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    if (/whitelist|access|IP/i.test(error.message) || /atlas/i.test(mongoURI)) {
      console.error(
        'Tip: If using Atlas, add your current IP in Network Access and ensure the connection string includes user/pass. Example: mongodb+srv://USER:PASS@CLUSTER/db?retryWrites=true&w=majority'
      )
    }
    console.log('Falling back to in-memory mode for development (no DB persistence).')
  }
}

module.exports = connectDB

