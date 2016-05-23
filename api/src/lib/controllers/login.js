import jwt from 'koa-jwt';
import { auth } from 'config';

export default function* renaterLogin() {
    const headers = this.request.header;

    const user = {
      username: headers.remote_user
    };

    if (!user) { return this.status = 401; }

    const cookie = headers.cookie && headers.cookie.split(';').filter(value => value.startsWith('_shibsession_'))[0];

    const token = jwt.sign({
      username: headers.remote_user
    }, auth.secret);

    this.body = { token, user };
    // this.redirect(`${decodeURIComponent(this.query.origin)}?shib=${encodeURIComponent(cookie)}&token=${token}&username=${encodeURIComponent(headers.remote_user)}`);
};
