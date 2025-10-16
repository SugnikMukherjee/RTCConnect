// Environment Configuration
require('dotenv').config();

module.exports = {
  development: {
    port: 3001,
    clientUrl: 'http://localhost:3000',
    logLevel: 'debug'
  },
  
  production: {
    port: process.env.PORT || 3001,
    clientUrl: process.env.CLIENT_URL,
    logLevel: 'info'
  },
  
  test: {
    port: 3002,
    clientUrl: 'http://localhost:3001',
    logLevel: 'error'
  }
};