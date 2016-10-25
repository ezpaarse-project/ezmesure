import jwt from 'koa-jwt';
import { auth } from 'config';
import mongo from '../../services/mongo';

export function* renaterLogin() {
  const headers = this.request.header;
  const idp     = headers['shib-identity-provider'];

  if (!idp) {
    return this.throw('IDP not found in Shibboleth headers', 400);
  }

  let user = yield mongo.db.collection('users').findOne({ idp });

  if (!user) {
    yield mongo.db.collection('users').insert({
      idp,
      uid:            headers.uid,
      name:           headers.displayname,
      mail:           headers.mail,
      org:            headers.o,
      unit:           headers.ou,
      eppn:           headers.eppn,
      affiliation:    headers.affiliation
    });

    user = yield mongo.db.collection('users').findOne({ idp });
  }

  this.cookies.set('eztoken', jwt.sign(user, auth.secret), { httpOnly: true });
  this.redirect(decodeURIComponent(this.query.origin || '/'));
};

export function* getUser() {

  const user = yield mongo.db.collection('users').findOne({ idp: this.state.user.idp });

  if (!user) {
    return this.throw('IDP unregistered, please log in again', 401);
  }

  this.status = 200;
  this.body   = user;
};

export function* generateToken() {
  this.status = 200;
  this.body   = jwt.sign(this.state.user, auth.secret);
};
