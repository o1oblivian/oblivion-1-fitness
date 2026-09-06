const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const EMAIL = 'o1oblivianfitness@gmail.com';
const PHOTOS_DIR = path.join(__dirname, 'public', 'live_photos');
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

async function captureAllViewsClean() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2.75 });

  await page.evaluateOnNewDocument((e) => {
    localStorage.setItem('o1fc_session_email', e);
    localStorage.setItem('lumina_users_accounts_meta', JSON.stringify({
      [e]: { email: e, name: 'O1 Athlete Pro', createdAt: new Date().toISOString() }
    }));
    localStorage.setItem(`o1fc_quicksetup_completed_${e}`, 'true');
    localStorage.setItem(`o1fc_onboarding_completed_${e}`, 'true');
    localStorage.setItem('o1fc_premium_showcase_shown', '1');
    localStorage.setItem('o1fc_perm_camera', 'granted');
    localStorage.setItem('o1fc_perm_mic', 'granted');
  }, EMAIL);

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Home View Photo
  console.log('Capturing Home...');
  await page.screenshot({ path: path.join(PHOTOS_DIR, '01_live_home_os.png') });

  // 2. Training OS Pro (Scroll down to SoloView)
  console.log('Capturing Training OS Pro (SoloView)...');
  await page.evaluate(() => {
    const el = document.getElementById('solo-workout-section');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(PHOTOS_DIR, '02_live_training_os_pro.png') });

  // 3. Fuel OS
  console.log('Capturing Fuel OS...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const fBtn = btns.find(b => b.innerText.toLowerCase().includes('fuel'));
    if (fBtn) fBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(PHOTOS_DIR, '03_live_fuel_os.png') });

  // 4. Coach Hub
  console.log('Capturing Coach Hub...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const cBtn = btns.find(b => b.innerText.toLowerCase().includes('coach'));
    if (cBtn) cBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(PHOTOS_DIR, '04_live_coach_intelligence.png') });

  // 5. Athlete Log / Vault
  console.log('Capturing Athlete History Log Vault...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const lBtn = btns.find(b => b.innerText.toLowerCase().includes('log'));
    if (lBtn) lBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(PHOTOS_DIR, '05_live_athlete_history_vault.png') });

  // 6. Buddy Radar Modal
  console.log('Capturing Buddy Radar Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const bBtn = btns.find(b => b.innerText.toLowerCase().includes('buddy'));
    if (bBtn) bBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(PHOTOS_DIR, '06_live_buddy_radar.png') });

  await browser.close();
  console.log('All 6 clean live views captured!');
}

captureAllViewsClean().catch(console.error);
