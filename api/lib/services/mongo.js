const { MongoClient, ObjectID } = require('mongodb');

const mongo = { ObjectID };

mongo.connect = (url, callback) => {
  if (mongo.db) {
    callback(null, mongo.db);
    return;
  }

  MongoClient.connect(url, (err, database) => {
    if (err) {
      callback(err);
      return;
    }

    mongo.db = database;
    callback(err, database);
  });
};

mongo.disconnect = (callback) => {
  if (!mongo.db) {
    callback(null);
    return;
  }

  mongo.db.close((err) => {
    mongo.db = null;
    callback(err);
  });
};

mongo.get = (col) => (mongo.db ? mongo.db.collection(col) : null);

module.exports = mongo;
