const puppeteer = require('puppeteer');

async function testFullDashboard() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  const email = 'o1oblivianfitness@gmail.com';
  await page.evaluateOnNewDocument((e) => {
    localStorage.setItem('o1fc_session_email', e);
    localStorage.setItem('lumina_users_accounts_meta', JSON.stringify({
      [e]: {
        email: e,
        name: 'O1 Athlete Pro',
        createdAt: new Date().toISOString()
      }
    }));
    localStorage.setItem(`o1fc_quicksetup_completed_${e}`, 'true');
    localStorage.setItem(`o1fc_onboarding_completed_${e}`, 'true');
    localStorage.setItem('o1fc_premium_showcase_shown', '1');
  }, email);

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((b, i) => ({
      index: i,
      id: b.id,
      text: b.innerText.trim().replace(/\n/g, ' '),
      ariaLabel: b.getAttribute('aria-label') || ''
    }));
  });

  console.log('Main Dashboard buttons count:', buttons.length);
  console.log('Sample buttons:', JSON.stringify(buttons.slice(0, 15), null, 2));

  await page.screenshot({ path: 'public/live_app_dashboard_main.png' });
  console.log('Saved to public/live_app_dashboard_main.png');

  await browser.close();
}

testFullDashboard().catch(console.error);
