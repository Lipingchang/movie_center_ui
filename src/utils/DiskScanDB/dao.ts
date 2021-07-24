import {
  SingleFileSchema,
  ScanResultSchema,
  scanResultModel,
  ScanResultType,
  SingleFileType,
  MovieRecordType,
} from './bean';
import {
  _SingleFileType
} from '../../pages/SerialNo/SerialNo'
import fakepath from 'path';
const path: typeof fakepath = window.require('path');
import fakemongoose, { Mongoose } from 'mongoose';
import { ObjectID } from 'bson';
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
  mongoose.connection.dropCollection(collectionName);
  return delone;
}

/**
 * 加载电影文件列表
 * @param collectionName collection名字
 * @returns 文件列表
 */
export function loadMovieFiles(collectionName: string): Promise<Array<SingleFileType>> {
  return new Promise((resolve, reject) => {
    const diskScanModel = mongoose.model('diskScan', SingleFileSchema, collectionName);
    diskScanModel
      .find({ isMovieFile: true })
      .then((docs) => {
        resolve(docs.map((doc) => doc._doc));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function updateOneMovie(movie: MovieRecordType) {
  return new Promise((resolve, reject) => {});
}

// 把movieList中每一项的serialNo对象和isJav属性同步入数据库，返回更新成功的个数
export function saveSerialNo(
  collectionName: string,
  movieList: Array<_SingleFileType>,
): Promise<number> {
  return new Promise((resolve, reject) => {
    (async () => {
      let okCount = 0;
      const diskScanModel = mongoose.model('diskScan', SingleFileSchema, collectionName);
      for (let i = 0; i < movieList.length; i++) {
        const id = movieList[i].key;
        let _ = await diskScanModel.updateMany(
          {
            _id: id,
          },
          {
            $set: {
              serialNo: movieList[i].serialNo,
              isJav: movieList[i].isJav,
            },
          },
        );
        if (_.ok===1) {
          okCount++;
        }
      }
      resolve(okCount);
    })();
  });
}
