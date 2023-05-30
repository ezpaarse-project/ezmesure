const config = require('config');
const Axios = require('axios');

const {
  host,
  apiKey,
  port,
} = config.get('ezreeport');

const ezrAxios = Axios.create({
  baseURL: `http://${host}:${port}/v1`,
  headers: { 'X-Api-Key': apiKey },
});

module.exports = ezrAxios;
