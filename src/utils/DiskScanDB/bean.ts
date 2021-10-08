import { ObjectID } from 'mongodb';
import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');

/*************  各个扫描摘要 */
export type ScanResultType = {
  _id: ObjectID;
  timestamp: string; //Date;
  rootPath: string;
  filePaths: Array<string>;
  fileCount: number;
  movieFilePaths: Array<string>; // 被识别为movie文件 的列表
  movieFileCount: number;
  collectionName: string; // 保存本次扫描所有文件详细信息的collection 那个collection的内部item是singlefileschema
};
export const ScanResultSchema = new mongoose.Schema({
  timestamp: String, //{ type: Date, default: Date.now }, // 扫描日期
  rootPath: String, // 根目录
  filePaths: [String], // 所有文件 列表
  fileCount: Number,
  movieFilePaths: [String], // 被识别为movie文件 的列表
  movieFileCount: Number,
  collectionName: String, // 保存本次扫描所有文件详细信息的collection 那个collection的内部item是singlefileschema
});
export const scanResultModel = mongoose.model('scanResult', ScanResultSchema, 'scanResults');
/********************************************************************************************************************* */

/************************* 文件对象  记录每个文件的信息*/ 
export type SingleFileType = {
  _id: ObjectID;
  filePath: string;
  fileName: string;
  fileSize: String;
  isMovieFile: boolean;
  serialNo: MovieRecordSerialNoType; // 视频文件的番号，是电影文件的话内容就不为null
  isJav: boolean;     // 是不是jav
}
const MovieRecordSerialNoTypeSchema = {
  id: String, // 国产和欧美电影就只有id， 有番号的电影的id由serial和no组成
  serial: String,
  no: String,
  seqarator: String,
}
export const SingleFileSchema = new mongoose.Schema({
  filePath: String,
  fileName: String,
  fileSize: String,
  isMovieFile: Boolean, // 是否为movie文件
  serialNo: MovieRecordSerialNoTypeSchema,
  isJav: Boolean,
});
/********************************************************************************************************************* */

// 记录电影文件 ??? 应该是记录下同一个番号下有多少个文件
export type MovieRecordType = {
  _id?: ObjectID,
  key?: string,
  filename?: string,
  serialNo: MovieRecordSerialNoType,
  detail?: {
    cover: String,
    actor: Array<ObjectID>,
  },
  scanResult: Array<{
    collectionName: String,
    path: String,
    id: ObjectID, // 文件在collectionName中的_id号
  }>,
  
}

export type MovieRecordSerialNoType = {
  id: string,
  serial?: string,
  no?: string,
  seqarator?: string,
}

// python爬取的数据的格式:
/************************* 演员 */
export type JavbusIdolType = {
  _id: ObjectID,
  name: string,
  href: string,
  picPath: string,
}
export const JavbusIdolSchema = new mongoose.Schema({
  name: String,
  href: String,
  picPath: String,
})
/********************************************************************************************************************* */