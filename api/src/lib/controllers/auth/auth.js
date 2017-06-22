import crypto from 'crypto';
import jwt from 'koa-jwt';
import { auth } from 'config';
import elastic from '../../services/elastic';
import { appLogger } from '../../../server';

export function* renaterLogin() {
  const query   = this.request.query;
  const headers = this.request.header;
  const props   = {
    full_name: decode(headers.displayname || headers.cn || headers.givenname),
    email:     decode(headers.mail),
    roles: [],
    metadata: {
      idp:          headers['shib-identity-provider'],
      uid:          headers.uid,
      org:          decode(headers.o),
      unit:         decode(headers.ou),
      eppn:         headers.eppn,
      remoteUser:   headers.remote_user,
      persistentId: headers['persistent-id'] || headers['targeted-id'],
      affiliation:  headers.affiliation
    }
  };

  if (!props.metadata.idp) {
    return this.throw('IDP not found in Shibboleth headers', 400);
  }

  if (!props.email) {
    return this.throw('email not found in Shibboleth headers', 400);
  }

  const username = props.email.split('@')[0];
  let user = yield elastic.findUser(username);

  if (!user) {
    props.metadata.createdAt = props.metadata.updatedAt = new Date();
    props.password = yield randomString();

    user = yield elastic.updateUser(username, props);

    if (!user) {
      return this.throw('Failed to save user data', 500);
    }
  } else if (query.refresh) {
    props.metadata.updatedAt = new Date();
    props.metadata.createdAt = user.metadata.createdAt;

    user = yield elastic.updateUser(username, props);

    if (!user) {
      return this.throw('Failed to update user data', 500);
    }
  }

  this.cookies.set('eztoken', generateToken(user), { httpOnly: true });
  this.redirect(decodeURIComponent(this.query.origin || '/'));
};

export function* getUser() {
  const user = yield elastic.findUser(this.state.user.username);

  if (!user) {
    return this.throw('Unable to fetch user data, please log in again', 401);
  }

  this.status = 200;
  this.body   = user;
};

export function* getToken() {
  this.status = 200;
  this.body   = generateToken(this.state.user);
};

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, auth.secret);
}

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

function randomString () {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(25, (err, buffer) => {
      if (err) { return reject(err); }
      resolve(buffer.toString('hex'));
    });
  });
}
