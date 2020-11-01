import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');

import config from './config_constant';
export type MongooseType = typeof fakemongoose;

// TODO 页面开发时 热重载后 (页面刷新后) mongo的查询的时间会变的不确定 不是mongo server的问题 应该是mongoose的问题
// 本来以为是 没有正常断开连接 但是好像不是啊.... 
export function closeDB() {
  console.log('start close')
  mongoose.disconnect().then(()=>{
    console.log('db closed')
  })
}

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

