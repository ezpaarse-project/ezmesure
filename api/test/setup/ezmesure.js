const axios = require('axios');

const ezmesure = axios.create({
  timeout: 3000,
  proxy: false,
  baseURL: 'http://localhost:3000/',
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  validateStatus: (status) => status < 500,
});

ezmesure.baseURL = 'http://localhost:3000/';

module.exports = ezmesure;
