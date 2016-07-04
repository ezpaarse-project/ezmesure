import jwt from 'koa-jwt';
import { auth } from 'config';

export default function* renaterLogin() {
    const headers = this.request.header;

    const user = {
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
