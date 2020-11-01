import puppeteer from 'puppeteer'

export async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage()
  await page.goto('https://www.baidu.com')
  console.log('hello javbus')
}

await run()