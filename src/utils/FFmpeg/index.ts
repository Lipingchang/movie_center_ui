import fakePath from 'path';
// import fakeOs from 'os';
import fakeFs from 'fs';
import { exec as fakeExec } from 'child_process';
const exec: typeof fakeExec = window.require('child_process').exec;
const fs: typeof fakeFs = window.require('fs');
// const os: typeof fakeOs = window.require('os');
const path: typeof fakePath = window.require('path');

export function loadBase64ImageFiles(filePaths: Array<string>): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    const contents = [];
    try {
      for (let i = 0; i < filePaths.length; i++) {
        contents.push(fs.readFileSync(filePaths[i], { encoding: 'base64' }));
      }
    } catch (e) {
      reject(e);
    }
    resolve(contents);
  });
}

export function windowsFileName2cmdFormat(filePath: string) {
  return `"${filePath.replaceAll('"', '\\"')}"`;
}

/**
 *
 * @param filePath 要截缩略图的文件路径
 * @param ss 在第几秒截图
 * @param forceLoad 即使文件存在, 也要重新生成
 */
export function ScreenShot(filePath: string, ss: number, forceLoad = false): Promise<string> {
  const ImageDirName = 'Myscreenshot';
  return new Promise((resolve, reject) => {
    const hours = parseInt(ss / 3600) % 60;
    const minutes = parseInt(ss / 60) % 60;
    const seconds = ss % 60;
    const dirname = path.dirname(filePath);
    const imageDirPath = path.join(dirname, ImageDirName)
    const imagePath = path.join(
      imageDirPath,
      `${path.basename(filePath)}.jpg`,
    ); 

    // 创建 保存图片的文件夹
    if (!fs.existsSync(imageDirPath)) {
      fs.mkdirSync(imageDirPath)
    }

    // 有图片存在, 就不继续执行
    if (fs.existsSync(imagePath) && !forceLoad) {
      console.log('exist:',imagePath)
      resolve(imagePath);
      return;
    }

    // 截图命令 并缩放图像
    const cmd = `ffmpeg -hide_banner -loglevel error -ss ${hours}:${minutes}:${seconds} -i ${windowsFileName2cmdFormat(
      filePath,
    )} -vf scale=-1:100  -frames:v 1 -y ${windowsFileName2cmdFormat(imagePath)}`;
    console.log(cmd);
    exec(cmd, (err, stdout, stderr) => {
      // console.log('1',err, stdout, stderr);
      if (err) {
        reject(err);
      } else {
        resolve(imagePath);
      }
    });
  });
}

export function CutPrefix(filePath: string, ss: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const hours = parseInt(ss / 3600) % 60;
    const minutes = parseInt(ss / 60) % 60;
    const seconds = ss % 60;
    const fp = path.parse(filePath);
    fp.name = `${fp.name}-next`; //TODO 要确认没有重名的!
    const copyFilePath = path.join(fp.dir, fp.name + fp.ext);

    const cmd = `ffmpeg -hide_banner -loglevel error -ss ${hours}:${minutes}:${seconds} -i ${windowsFileName2cmdFormat(
      filePath,
    )} -c copy -avoid_negative_ts make_zero -n ${windowsFileName2cmdFormat(copyFilePath)}`;

    console.log(cmd);
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// function myExec() {
//   return new Promise((resolve, reject) => {
//     exec((err, stdout, stderr) => {
//       console.log(err, stdout, stderr);
//     });
//   });
// }
