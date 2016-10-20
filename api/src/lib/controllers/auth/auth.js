import jwt from 'koa-jwt';
import { auth } from 'config';

export function* renaterLogin() {
  const headers = this.request.header;

  const user = {
    idp: headers['shib-identity-provider'],
    uid: headers.uid,
    username: headers.displayname,
    mail: headers.mail,
    org: headers.o,
    unit: headers.ou,
    eppn: headers.eppn,
    affiliation: headers.affiliation
  };

  this.cookies.set('eztoken', jwt.sign(user, auth.secret));
  this.redirect(decodeURIComponent(this.query.origin || '/'));
};

export function* getUser() {
  this.status = 200;
  this.body   = this.state.user;
};

export function* generateToken() {
  this.status = 200;
  this.body   = jwt.sign(this.state.user, auth.secret);
};
