// 原本想 用node的交互式模式来执行 爬虫的语句
// 用 node  在更目录 执行本文件中的内容 
let page1;

import('./src/utils/scraper/javbus.js').then(async function (m) {
  page1 = await m.run();
});
