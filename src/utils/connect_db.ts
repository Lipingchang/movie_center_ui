import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');

import config from './config_constant';
export type MongooseType = typeof fakemongoose;

export function connectToDB(): Promise<any> {
  mongoose.connect(`mongodb://localhost:27017/${config.dbName}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose;
  const connection = mongoose.connection;
  return new Promise((resolve, reject) => {
    connection
      .on('error', (error) => {
        reject(error);
      })
      .once('open', function () {
        resolve();
      });
  });
}

