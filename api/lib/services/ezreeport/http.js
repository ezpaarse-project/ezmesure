const config = require('config');
const { ofetch } = require('ofetch');

const {
  host,
  apiKey,
  port,
} = config.get('ezreeport');

const $fetch = ofetch.create({
  baseURL: `http://${host}:${port}/v2`,
  headers: { 'X-Api-Key': apiKey },
});

module.exports = $fetch;
