import {
  SingleFileSchema,
  ScanResultSchema,
  scanResultModel,
  ScanResultType,
  SingleFileType,
  MovieRecordType,
  JavbusIdolType,
  JavbusIdolSchema,
  JavbusMovieSchema,
} from './bean';
import { _SingleFileType } from '../../pages/SerialNo/SerialNo';
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
/**
 * 模糊搜索电影文件
 * @returns 文件列表
 */
async function _searchMovieFiles(collectionName:string,target: string): Promise<Array<SingleFileType>> {
  return new Promise((resolve, reject) => {
    const diskScanModel = mongoose.model('diskScan', SingleFileSchema,collectionName);
    diskScanModel
      .find({ isMovieFile: true, filePath: new RegExp('.*' + target + '.*','i') }) // 忽略大小写
      .then((docs) => {
        resolve(docs.map((doc) => doc._doc));
      })
      .catch((error) => {
        reject(error);
      });
  });
}
export async function searchMovieFiles(target: string): Promise<Array<SingleFileType>> {
  const scanResult = await loadScanResult(); // 磁盘扫描结果列表
  let r: Array<SingleFileType> = []
  for(let i=0;i<scanResult.length;i++){
    let _ = await _searchMovieFiles(scanResult[i].collectionName,target)
    // console.log(scanResult[i].collectionName, _)
    r = r.concat(_)
  }
  return r;
}

/**
 * 加载Jav电影文件列表
 * @param collectionName collection名字
 * @returns 文件列表
 */
export function loadJavMovieFiles(collectionName: string): Promise<Array<SingleFileType>> {
  return new Promise((resolve, reject) => {
    const diskScanModel = mongoose.model('diskScan', SingleFileSchema, collectionName);
    diskScanModel
      .find({ isMovieFile: true, isJav: true })
      .then((docs) => {
        resolve(docs.map((doc) => doc._doc));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export type idolListType = {
  docs: Array<JavbusIdolType>;
  pageinfo: {
    pageSize: number;
    pageNum: number;
    total: number;
  };
};
/**
 *
 * @param pageNum 从1开始
 * @param pageSize 每页大小
 * @returns
 */
export function loadIdolListByPage(pageNum: number, pageSize: number): Promise<idolListType> {
  return new Promise((resolve, reject) => {
    const javbusIdolModel = mongoose.model('javbusIdol', JavbusIdolSchema, 'javbus_idol');
    javbusIdolModel
      .aggregate([
        {
          $facet: {
            docs: [{ $skip: (pageNum - 1) * pageSize }, { $limit: pageSize }],
            pageinfo: [{ $group: { _id: null, total: { $sum: 1 } } }],
          },
        },
      ])
      .then((docs) => {
        docs = docs.map((doc) => doc);
        let total = docs[0].pageinfo[0].total;
        docs[0].pageinfo = {
          pageSize,
          pageNum,
          total,
        };
        resolve(docs[0]);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
export function fuzzyQueryIdolName(fuzzyStr:string):Promise<Array<string>> {
  return new Promise((resolve,reject)=>{
    const javbusIdolModel = mongoose.model('javbusIdol', JavbusIdolSchema, 'javbus_idol');
    javbusIdolModel
      .find({'name': new RegExp(".*"+fuzzyStr+".*")})
      .then((docs) => {
        docs = docs.map((doc) => doc.name);
        resolve(docs);
      })
      .catch((error) => {
        reject(error);
      });
  })
}
/*
db.getCollection('javbus_movie')
.aggregate([
  {
      $match: {idol: {'$elemMatch': {name:'里美ゆりあ'}}}
  },
  {
      $lookup: {
          from: "diskscan-1627125782917",
          localField: "serial",
          foreignField: "serialNo.id",
          as: "newdoc",
      }
    
  },
  {
      $match: {"newdoc": {$ne:[]}}
  },
  {
      $project: {"newdoc":1}
  },
  {
      $unwind: "$newdoc"
  },
  {
      $project: {"newdoc.filePath":1,"newdoc.serialNo.id":1}
  },
])
*/

export type idolMovieType = {
  serial: string;
  cover: string;
  diskscan: {
    [key: string]: Array<SingleFileType>;
  };
  sample_pic: Array<{ name: string }>;
};
export async function loadIdolMovies(IdolName: string): Promise<Array<idolMovieType>> {
  const scanResult = await loadScanResult(); // 磁盘扫描结果列表
  // 把javbus的电影列表的番号 和 所有扫描结果左连接，连接结果储存到 diskscan 的对象中
  const lookupList = scanResult.map((c) => ({
    $lookup: {
      from: c.collectionName,
      localField: 'serial',
      foreignField: 'serialNo.id',
      as: 'diskscan.' + c.collectionName,
    },
  }));
  return new Promise((resolve, reject) => {
    const javbusMovieModel = mongoose.model('javbusmovie', JavbusMovieSchema, 'javbus_movie');
    javbusMovieModel
      .aggregate([
        {
          $match: { idol: { $elemMatch: { name: IdolName } } }, // 以idol的名字作为过滤条件
        },
        ...lookupList,
      ])
      .then((docs) => {
        docs = docs.map((doc) => doc);
        resolve(docs);
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
        if (_.ok === 1) {
          okCount++;
        }
      }
      resolve(okCount);
    })();
  });
}
