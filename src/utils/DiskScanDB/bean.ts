import { ObjectID } from 'mongodb';
import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');

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
// 各个扫描摘要
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

export type SingleFileType = {
  _id: ObjectID;
  filePath: string;
  fileName: string;
  fileSize: String;
  isMovieFile: boolean;
}
// 每个文件的信息
export const SingleFileSchema = new mongoose.Schema({
  filePath: String,
  fileName: String,
  fileSize: String,
  isMovieFile: Boolean, // 是否为movie文件
});

// 记录电影文件
export type MovieRecordType = {
  _id?: ObjectID,
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
  id: String,
  serial?: String,
  no?: String,
  seqarator?: String,
}