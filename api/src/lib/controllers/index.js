'use strict';

import koa from 'koa';
import jwt from 'koa-jwt';
import route from 'koa-route';
import mount from 'koa-mount';
import { auth } from 'config';

import login from './login';
import logs from './logs';

const app = koa();

app.use(route.get('/login', login));

app.use(route.get('/', function* main() {
  this.status = 200;
  this.body = 'OK';
}));

app.use(jwt({ secret: auth.secret }));

app.use(mount('/logs', logs));

export default app;
