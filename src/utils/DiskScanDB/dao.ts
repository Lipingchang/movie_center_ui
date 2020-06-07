import {SingleFileSchema, ScanResultSchema, scanResultModel, ScanResultType} from './bean';
import { ObjectID } from 'mongodb';
import fakepath from 'path';
const path: typeof fakepath = window.require('path');
import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');

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
