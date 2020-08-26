import { Subscription, Reducer, Effect } from 'umi';
import fakefs, { Dirent } from 'fs';
import util from 'util';
import fakepath from 'path';
const fs: typeof fakefs = window.require('fs');
const path: typeof fakepath = window.require('path');

export interface DiskScanModelState {
  collapsed: boolean;
}

export interface DiskScanModelType {
  namespace: 'diskscan';
  state: DiskScanModelState;
  effects: { [key in string]: Effect };
  reducers: { [key in string]: Reducer };
  // subscriptions: { setup: Subscription };
}

const DiskScanModel: DiskScanModelType = {
  namespace: 'diskscan',

  state: {
    collapsed: false,
  },

  effects: {
    *getFolderTree({ payload: {rootPath, suffixList} }, { call, put }) {
      const filePaths = pickOutFiles(rootPath);
      return {movieFilePaths: pickOutMoives(filePaths, suffixList),filePaths}
    },
  },

  reducers: {
    changeLayoutCollapsed(state = { collapsed: true }, { payload }): DiskScanModelState {
      return {
        ...state,
        collapsed: payload,
      };
    },
  },
};

// 拿出文件夹下所有的文件
function pickOutFiles(rootPath: string): Array<string> {
  let dirents;
  try {
    dirents = fs.readdirSync(rootPath, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  let nextFolders = []; // 下一级文件夹
  let files = []; // 本级中的文件
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      nextFolders.push(dirent);
    } else if (dirent.isFile()) {
      files.push(path.join(rootPath, dirent.name));
    }
  }
  for (let folder of nextFolders) {
    files = files.concat(pickOutFiles(path.join(rootPath, folder.name)));
  }
  return files;
}

// 拿出本级文件夹下所有的文件
export function pickOutFilesOneLevel(rootPath: string): Array<string> {
  let dirents;
  try {
    dirents = fs.readdirSync(rootPath, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  // let nextFolders = []; // 下一级文件夹
  let files = []; // 本级中的文件
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      // nextFolders.push(dirent);
    } else if (dirent.isFile()) {
      files.push(path.join(rootPath, dirent.name));
    }
  }
  // for (let folder of nextFolders) {
  //   files = files.concat(pickOutFiles(path.join(rootPath, folder.name)));
  // }
  return files;
}

// 拿出后缀在后缀列表中的文件
export function pickOutMoives(filePaths: Array<string>, suffixes: Array<string>):Array<string> {
  return filePaths.filter((value)=>{
    const basename = path.basename(value);
    if(basename.startsWith('.')) return false;
    const suffix = value.split('.').pop();
    if (suffix===undefined) return false;
    return suffixes.map(suffix=>suffix.toUpperCase()).includes(suffix.toUpperCase());
  })
}
export default DiskScanModel;
