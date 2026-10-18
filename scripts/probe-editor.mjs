import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:3333';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 1000 });
await page.goto(BASE + '/tools/format/json-editor', { waitUntil: 'networkidle0' });

const input = await page.$('input[type=file]');
await input.uploadFile('scripts/samples/sample.json');
await new Promise((r) => setTimeout(r, 2500));

const info = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
    .map((b) => b.textContent.trim())
    .filter(Boolean);
  const inputs = [...document.querySelectorAll('input')].map((i) => ({
    type: i.type,
    ph: i.placeholder,
  }));
  const treeEls = [...document.querySelectorAll('[class*="tree" i]')].map((e) => e.className);
  const hasTree = treeEls.length > 0;
  const searchInput = [...document.querySelectorAll('input')].find((i) =>
    /search|filter|find/i.test(i.placeholder || '')
  );
  const panels = [...document.querySelectorAll('[class*="panel" i]')].map((p) => p.className).slice(0, 8);
  return {
    buttons,
    inputs,
    hasTree,
    treeEls: treeEls.slice(0, 5),
    searchPlaceholder: searchInput ? searchInput.placeholder : null,
    panels,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
