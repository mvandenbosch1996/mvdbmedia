import puppeteer from "puppeteer";
import sharp from "sharp";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto("https://www.kampr.nl", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise(r => setTimeout(r, 2000));
const png = await page.screenshot({ type: "png" });
await browser.close();

await sharp(png).webp({ quality: 82 }).toFile("fotos/kampr-showcase.webp");
await sharp(png).resize(800).webp({ quality: 80 }).toFile("fotos/kampr-showcase-800.webp");
await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile("fotos/kampr-showcase.jpg");
console.log("done");
