import jwt from 'koa-jwt';
import { auth } from 'config';
import mongo from '../../services/mongo';
import { appLogger } from '../../../server';

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

export function* renaterLogin() {
  const headers = this.request.header;
  const props   = {
    idp:          headers['shib-identity-provider'],
    uid:          headers.uid,
    name:         decode(headers.displayname || headers.cn || headers.givenname),
    mail:         decode(headers.mail),
    org:          decode(headers.o),
    unit:         decode(headers.ou),
    eppn:         headers.eppn,
    remoteUser:   headers.remote_user,
    persistentId: headers['persistent-id'] || headers['targeted-id'],
    affiliation:  headers.affiliation
  };

  if (!props.idp) {
    return this.throw('IDP not found in Shibboleth headers', 400);
  }

  let user = yield findUser(props);

  if (!user) {
    props.createdAt = props.updatedAt = new Date();

    try {
      yield mongo.db.collection('shibheaders').insert(headers);
    } catch (e) {
      appLogger.error('Failed at storing shibboleth headers', JSON.stringify(headers));
    }

    const result = yield mongo.db.collection('users').insert(props);

    user = result && result.ops && result.ops[0];

    if (!user) {
      return this.throw('Failed to save user data', 500);
    }
  }

  this.cookies.set('eztoken', generateToken(user), { httpOnly: true });
  this.redirect(decodeURIComponent(this.query.origin || '/'));
};

export function* getUser() {
  const user = yield findUser(this.state.user);

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

function findUser(props) {
  const { _id, mail, idp, eppn, persistentId, uid, remoteUser } = props;

  const query = { $or: [] };

  if (_id && mongo.ObjectID.isValid(_id)) {
    query.$or.push({ _id: mongo.ObjectID(_id) });
  }

  if (persistentId) {
    query.$or.push({ persistentId });
  }

  if (idp) {
    const ids = [];

    if (mail)       { ids.push({ mail }); }
    if (eppn)       { ids.push({ eppn }); }
    if (uid)        { ids.push({ uid }); }
    if (remoteUser) { ids.push({ remoteUser }); }

    if (ids.length > 0) {
      query.$or.push({ idp, $or: ids });
    }
  }

  return mongo.db.collection('users').findOne(query);
}

function generateToken(user) {
  if (!user) { return null; }

  const { _id, name, mail } = user;
  return jwt.sign({ _id, name, mail }, auth.secret);
}
