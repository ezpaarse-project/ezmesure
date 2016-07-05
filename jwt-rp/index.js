"use strict";

const fs        = require('fs');
const path      = require('path');
const http      = require('http');
const httpProxy = require('http-proxy');
const jwt       = require('jsonwebtoken');
const Cookies   = require('cookies');

const redirectPage = fs.readFileSync(path.resolve(__dirname, 'redirect.html'));

const targetURL = process.env.TARGET_URL;
const secret    = process.env.JWT_SECRET;

if (!targetURL) { console.error('Missing TARGET_URL'); process.exit(1); }
if (!secret) { console.error('Missing JWT_SECRET'); process.exit(1); }

const proxy  = httpProxy.createProxyServer({});
const server = http.createServer((req, res) => {

  let token;

  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  } else {
    const cookies = new Cookies(req, res);
    token = cookies.get('eztoken');
  }

  if (!token) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/html');
    return res.end(redirectPage);
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      switch (err.name) {
      case 'TokenExpiredError':
      case 'JsonWebTokenError':
        res.statusCode = 401;
        res.setHeader('Content-Type', 'text/html');
        res.end(redirectPage);
      default:
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
      return;
    }

    proxy.web(req, res, { target: targetURL });
  });
});

console.log('listening on port 3030');
server.listen(3030);
