'use strict';

import koa from 'koa';
import jwt from 'koa-jwt';
import route from 'koa-route';
import mount from 'koa-mount';
import { auth } from 'config';

import { renaterLogin } from './auth/auth';
import logs from './logs';
import authorize from './auth';
import providers from './providers';

const app = koa();

app.use(route.get('/login', renaterLogin));

app.use(route.get('/', function* main() {
  this.status = 200;
  this.body   = 'OK';
}));

app.use(mount('/auth', authorize));
app.use(mount('/logs', logs));
app.use(mount('/providers', providers));

export default app;
