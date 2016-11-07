import { MongoClient, ObjectID } from 'mongodb';
import config from 'config';

const mongo = { ObjectID };

mongo.connect = function (url, callback) {
  if (mongo.db) { return callback(null, mongo.db); }

  MongoClient.connect(url, (err, database) => {
    if (err) { return callback(err); }

    mongo.db = database;
    callback(err, database);
  });
};

mongo.disconnect = function (callback) {
  if (!mongo.db) { return callback(null); }

  mongo.db.close(err => {
    mongo.db = null;
    callback(err);
  });
};

mongo.get = function (col) {
  return (mongo.db ? mongo.db.collection(col) : null);
};

export default mongo;