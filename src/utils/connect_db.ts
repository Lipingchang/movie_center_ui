import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');
import config from './config_constant';
import fakepath from 'path';
import { ObjectID } from 'mongodb';
const path: typeof fakepath = window.require('path');

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

export type ScanResultType = {
  _id: ObjectID;
  timestamp: Date;
  rootPath: string;
  filePaths: Array<string>;
  fileCount: number;
  movieFilePaths: Array<string>; // 被识别为movie文件 的列表
  movieFileCount: number;
  collectionName: string; // 保存本次扫描所有文件详细信息的collection 那个collection的内部item是singlefileschema
};
// 各个扫描摘要
export const ScanResultSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now }, // 扫描日期
  rootPath: String, // 根目录
  filePaths: [String], // 所有文件 列表
  fileCount: Number,
  movieFilePaths: [String], // 被识别为movie文件 的列表
  movieFileCount: Number,
  collectionName: String, // 保存本次扫描所有文件详细信息的collection 那个collection的内部item是singlefileschema
});
const scanResultModel = mongoose.model('scanResult', ScanResultSchema, 'scanResults');

// 每个文件的信息
export const SingleFileSchema = new mongoose.Schema({
  filePath: String,
  fileName: String,
  fileSize: String,
  isMovieFile: Boolean, // 是否为movie文件
});

// 把查找出来的 普通文件 和 movie文件 合并后 保存到数据库中
export function saveSingleFilesToCollection(
  filePaths: Array<string>,
  movieFilePaths: Array<string>,
  collectionName: string,
) {
  const singleFileModel = mongoose.model('singlefile', SingleFileSchema, collectionName);
  filePaths.sort();
  movieFilePaths.sort();
  const paths = [];
  let i, j;
  for (i = 0, j = 0; i < filePaths.length; i++) {
    if (filePaths[i] != movieFilePaths[j]) {
      paths.push({
        filePath: filePaths[i],
        fileName: path.basename(filePaths[i]),
        fileSize: '0',
        isMovieFile: false,
      });
    } else {
      paths.push({
        filePath: filePaths[i],
        fileName: path.basename(filePaths[i]),
        fileSize: '0',
        isMovieFile: true,
      });
      j++;
    }
  }
  console.log(paths);

  return singleFileModel.insertMany(paths);
}

// 保存 扫描摘要 到扫描目录中
export function saveScanResult(
  timestamp: string,
  rootPath: string,
  filePaths: Array<string>,
  movieFilePaths: Array<string>,
  collectionName: string,
) {
  return scanResultModel.insertMany([
    {
      timestamp,
      rootPath,
      fileCount: filePaths.length,
      movieFileCount: movieFilePaths.length,
      filePaths,
      movieFilePaths,
      collectionName,
    },
  ]);
}

export function loadScanResult(): Promise<Array<ScanResultType>> {
  return new Promise((resolve, reject) => {
    scanResultModel
      .find({})
      .select('-filePaths -movieFilePaths')
      .then((docs) => {
        resolve(docs.map((doc) => doc._doc));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function removeScanResult(_id: ObjectID, collectionName: string) {
  const delone = scanResultModel.deleteOne({ _id: _id });
  mongoose.connection.dropCollection(collectionName)
  return delone;
}
