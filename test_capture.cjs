const puppeteer = require('puppeteer');

async function testCapture() {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Puppeteer launched successfully:', await browser.version());
    const page = await browser.newPage();
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded! Title:', await page.title());
    await page.screenshot({ path: 'public/live_app_home_real.png' });
    console.log('Saved to public/live_app_home_real.png');
    await browser.close();
  } catch (err) {
    console.error('Capture error:', err);
  }
}

testCapture();
