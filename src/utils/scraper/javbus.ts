// import  puppeteer from 'puppeteer'
const puppeteer = require('puppeteer')
const path = require('path')
// import path from 'path'
// const connectToDB = require('../connect_db')
// import {connectToDB} from '../connect_db'
// import fs from 'fs'
// const __dirname = path.resolve()

async function run() {
  // init browser
  console.log(puppeteer, __dirname)
  const browser = await puppeteer.launch({
    args: [
      '--proxy-server=http://localhost:1080',
      '--window-size=1000,1000',
      `--disk-cache-dir=${path.join(__dirname,"/cache/chromium_cache/disk-cache/")}`,
      `--user-data-dir=${path.join(__dirname,"/cache/chromium_cache/user-data/")}`,
  ], // https://peter.sh/experiments/chromium-command-line-switches/
    devtools: true, // relate to headless mode 
    defaultViewport: {
      width: 1000,
      height: 1000,
      isLandscape: true
    }
  });

  // go to main page
  const pages = await browser.pages();
  await pages[0].goto('https://www.javbus.com')
  // await pages[0].goto('https://www.google.com')

  // start scrape
  const mainPage = pages[0];
  const items = await mainPage.$x('/html/body/div[4]/div/div[3]/div/*')
  for( let item in items ) {
    const date = await items[item].$x('./a/div[2]/span/date[2]')
    console.log( await (await date[0].getProperty('textContext')).jsonValue())
  }

  // connectToDB()


  return mainPage;

}


console.log('runing!,\n')
// run()

// 调试
// a = require("./src/utils/scraper/javbus.js")
exports.run = run;