const { Client } = require('@elastic/elasticsearch');
const { elasticsearch } = require('config');
const { URL } = require('url');

const {
  username,
  password,
  host,
  port,
  scheme,
} = elasticsearch;

const client = new Client({
  node: {
    url: new URL(`${scheme}://${host}:${port}`),
    auth: {
      username,
      password,
    },
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = client;
