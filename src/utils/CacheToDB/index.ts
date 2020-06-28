import { ObjectID } from 'mongodb';
import fakepath from 'path';
const path: typeof fakepath = window.require('path');
import fakemongoose, { Mongoose } from 'mongoose';
const mongoose: typeof fakemongoose = window.require('mongoose');


export const collectionName = 'cache'
// 保存一个对象到数据库中
export function saveObjectToCacheCollection(
  collectionName: string,
) {
}