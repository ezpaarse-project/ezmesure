const { Client } = require('@elastic/elasticsearch');
const { elasticsearch } = require('config');
const { URL } = require('url');

const {
  username,
  password,
  host,
  port,
} = elasticsearch;

const client = new Client({
  node: {
    url: new URL(`http://${host}:${port}`),
    auth: {
      username,
      password,
    },
  },
});

module.exports = client;
