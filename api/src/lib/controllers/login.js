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

    if (!user) { return this.status = 401; }

    const cookie = headers.cookie && headers.cookie.split(';').filter(value => value.startsWith('_shibsession_'))[0];
    const token  = jwt.sign(user, auth.secret);

    this.body = { token, user };
    // this.redirect(`${decodeURIComponent(this.query.origin)}?shib=${encodeURIComponent(cookie)}&token=${token}&username=${encodeURIComponent(headers.remote_user)}`);
};
