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
  JavbusMovieType,
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
    let targets = target.split(" ")// 去掉空格
    targets = targets.filter(i => i&&i.trim())
    let target_reg = targets.join(".*")
    diskScanModel
      .find({ isMovieFile: true, filePath: new RegExp('.*' + target_reg + '.*','i') }) // 忽略大小写
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

export type idolListEleType = {m_count:number; name:string; detail: JavbusIdolType}
export type idolListType = {
  docs: Array<idolListEleType>;
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

export function loadIdolListByMovieCount(pageNum: number, pageSize: number): Promise<idolListType>{
  return new Promise((resolve, reject) => {
    const javbusMovieModel = mongoose.model('javbusMovie', JavbusIdolSchema, 'javbus_movie');
    javbusMovieModel.aggregate([{
        $facet: {
          docs:[
            {"$unwind":"$idol"},    // 把idol字段拍平
            {
              "$group":
                {"_id":"$idol.id","m_count":{$sum:1},'name':{$first: "$idol.name"}} // 按照idol.id字段分组后 计算出场次数
            },
            {"$sort": {"m_count":-1}},  // 按照出场次数排序
            {"$skip": (pageNum - 1) * pageSize},  // 分页
            {"$limit": pageSize},
            {"$lookup":{                              
              let: {"userObjId":{$toObjectId: "$_id"}},   // 在group时新加入的_id字段转换成obj 并命名为userObjId
              pipeline: [{"$match":{$expr:{$eq:["$_id", "$$userObjId"]}}}], //在idol表中 查找_id和userObjId相同的
              from: "javbus_idol", 
              as: 'detail'
            }}	
          ],
          pageinfo: [{ $group: { _id: null, total: { $sum: 1 } } }]
        }
      }])
      .then((docs) => {
        // console.log(docs)
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

export function fuzzyQueryIdolName(fuzzyStr:string):Promise<Array<{value:string, detail:JavbusIdolType}>> {
  return new Promise((resolve,reject)=>{
    const javbusIdolModel = mongoose.model('javbusIdol', JavbusIdolSchema, 'javbus_idol');
    javbusIdolModel
      .find({'name': new RegExp(".*"+fuzzyStr+".*")})
      .then((docs) => {
        docs = docs.map((doc) => {return {value:doc.name, detail:doc}});
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
type MagnetType = {
  magnet_link: string;
  size: string;
  date:string;
}
export type idolMovieType = {
  serial: string;
  cover: string;
  // diskscan: {
  //   [key: string]: Array<SingleFileType>;
  // };
  idol: Array<JavbusIdolType>;
  idol_count: number;
  release_date: string;
  disk_records: Array<SingleFileType>;
  record_c: number;
  sample_pic: Array<{ name: string }>;
  magnet: Array<MagnetType>;
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

type idolMovieListType = {
  docs: Array<idolMovieType>;
  pageinfo: {
    total: number;
  }
}
export async function loadIdolMoviesByPage(IdolName: string, pageSize: number, pageNum: number): Promise<idolMovieListType> {
  const scanResult = await loadScanResult(); // 磁盘扫描结果列表

  // 把javbus的电影列表的番号 和 所有扫描结果左连接，连接结果储存到 diskscan 的对象中
  const lookupList = scanResult.map((c) => ({
    $lookup: {
      from: c.collectionName,
      localField: 'serial',
      foreignField: 'serialNo.id',
      as: 'diskscan.' + c.collectionName, // 都在 diskscan 属性下
    },
  }));

  // 把 diskscan 对象里面的每个 scanResult 中包含的电影 都拼接到同一个数组中
  const unionScanResult = {
    $setUnion: scanResult.map((c)=> '$diskscan.' + c.collectionName)
  }

  return new Promise((resolve, reject) => {
    const javbusMovieModel = mongoose.model('javbusmovie', JavbusMovieSchema, 'javbus_movie');
    javbusMovieModel
      .aggregate([{
        $facet: {
          docs:[
            {"$project":{"serial":1,  "idol_count": {"$size": "$idol"}, "idol":1, "cover": 1, "sample_pic":1, "release_date": 1, "magnet": 1}},
            {"$match": { "idol": { "$elemMatch": { "name": IdolName } } }},
            ...lookupList,
            {"$project": {"serial":1,  "idol_count": 1, "idol":1, "cover": 1, "sample_pic":1, "release_date": 1, "disk_records": unionScanResult, "magnet": 1 }},
            {"$project": {"serial":1,  "idol_count": 1, "idol":1, "cover": 1, "sample_pic":1, "release_date": 1, "disk_records":1, "record_c":{"$size":"$disk_records"}, "magnet": 1}},
            {"$sort": {"idol_count": 1, "record_c":-1, "release_date": -1,}},  // 如果要按照在 磁盘上存储的文件数 排序 要滞后release_data 
            {"$skip": (pageNum - 1) * pageSize},
            {"$limit": pageSize}
          ],
          pageinfo: [
            {"$match": { "idol": { "$elemMatch": { "name": IdolName } } }},
            { $group: { _id: null, total: { $sum: 1 } } }
          ]
        }
      }])
      .then((docs) => {
        // console.log(docs)
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

export async function findSameFilename(filename: string) {
  const scanResult = await loadScanResult(); // 磁盘扫描结果列表
  const collectionNames = scanResult.map(r => r.collectionName)
  let ret: any[] = []
  for( let c = 0;c<collectionNames.length; c++) {
    const collectionName = collectionNames[c]
    const diskScanModel = mongoose.model('diskScan', SingleFileSchema, collectionName);
    const res = await diskScanModel.find({
      'fileName': filename
    })
    res = res.map(_=>_._doc)
    ret = ret.concat(res)
  }
  return ret;
}