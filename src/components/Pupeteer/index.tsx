import React from 'react';
import {Button} from 'antd'
import fakeexec from 'child_process';
const exec: typeof fakeexec = window.require('child_process')

export default function () {
  function stdout(chunk: any){
    console.log(chunk.toString())
  }
  function stderr(chunk: any) {
    console.error(chunk.toString())
  }

  return (
    <div>
      <Button
        onClick={() => {
          // 只能在子进程退出后 才会触发data事件
          // data触发输出的内容进入缓存  缓存会溢出吗
          // const process = exec.spawn('node ./src/utils/scraper/javbus.js', {
          const process = exec.spawn('tsc ./src/utils/scraper/javbus.ts --esModuleInterop | node ./src/utils/scraper/javbus.js', {
          // const process = exec.spawn('ts-node ./src/utils/scraper/javbus', {
            shell: 'powershell.exe',
          });
          process.stdout?.on('data', stdout);
          process.stderr?.on('data', stderr);
          process.on('exit',(code)=>{
            console.log('pupetter exit code: ', code);
          })
        }}
      >
        Start a Pupeteer!
      </Button>
    </div>
  );
}