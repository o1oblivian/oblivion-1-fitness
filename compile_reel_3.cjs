const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const EMAIL = 'o1oblivianfitness@gmail.com';
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
const TMP_DIR = '/tmp/live_reels_flawless/o1fc_live_reel_3_fuel_os';

if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2.75 });
  await page.evaluateOnNewDocument((e) => {
    localStorage.setItem('o1fc_session_email', e);
    localStorage.setItem('lumina_users_accounts_meta', JSON.stringify({ [e]: { email: e, name: 'O1 Athlete Pro' } }));
    localStorage.setItem('o1fc_quicksetup_completed_' + e, 'true');
    localStorage.setItem('o1fc_onboarding_completed_' + e, 'true');
    localStorage.setItem('o1fc_premium_showcase_shown', '1');
  }, EMAIL);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const client = await page.target().createCDPSession();
  let frameIdx = 0;
  const hashes = [];
  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    const buf = Buffer.from(data, 'base64');
    hashes.push(crypto.createHash('md5').update(buf).digest('hex'));
    const fname = `frame_${String(frameIdx).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(TMP_DIR, fname), buf);
    frameIdx++;
    try { await client.send('Page.screencastFrameAck', { sessionId }); } catch (e) {}
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1080,
    maxHeight: 1920,
    everyNthFrame: 1
  });

  console.log('Recording Fuel OS Reel 3...');
  // Click Fuel tab
  await page.evaluate(() => {
    const navBtns = Array.from(document.querySelectorAll('nav button'));
    const fuelBtn = navBtns.find(b => b.innerText.toLowerCase().includes('fuel'));
    if (fuelBtn) fuelBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Smooth scroll down to water logger
  await page.evaluate(async () => {
    const m = document.querySelector('main');
    if (!m) return;
    for (let i = 0; i < 30; i++) {
      m.scrollTop += 9;
      await new Promise(res => setTimeout(res, 35));
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // Click +250ml
  for (let w = 0; w < 4; w++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addWater = btns.find(b => b.innerText.includes('+250') || b.innerText.includes('250ml') || b.innerText.includes('+ 250'));
      if (addWater) addWater.click();
    });
    await new Promise(r => setTimeout(r, 350));
  }

  // Smooth scroll down
  await page.evaluate(async () => {
    const m = document.querySelector('main');
    if (!m) return;
    for (let i = 0; i < 45; i++) {
      m.scrollTop += 12;
      await new Promise(res => setTimeout(res, 35));
    }
  });
  await new Promise(r => setTimeout(r, 600));

  // Smooth scroll up
  await page.evaluate(async () => {
    const m = document.querySelector('main');
    if (!m) return;
    for (let i = 0; i < 45; i++) {
      m.scrollTop -= 15;
      await new Promise(res => setTimeout(res, 35));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  await client.send('Page.stopScreencast');
  await browser.close();

  const fps = Math.max(12, Math.min(30, frameIdx / 8.0));
  const outPath = path.join(VIDEOS_DIR, 'o1fc_live_reel_3_fuel_os.mp4');
  console.log(`Compiling Reel 3 with ${frameIdx} frames at ${fps.toFixed(2)} fps...`);

  const ffmpegCmd = [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(TMP_DIR, 'frame_%05d.jpg'),
    '-f', 'lavfi', '-i', 'sine=frequency=110:duration=8',
    '-filter_complex',
    '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,' +
    'drawbox=x=0:y=0:w=1080:h=150:color=black@0.75:t=fill,' +
    'drawbox=x=0:y=1770:w=1080:h=150:color=black@0.85:t=fill,' +
    'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text=\'O1FC OFFICIAL\':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=42,' +
    'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text=\'FUEL OS • METABOLIC MACRO ENGINE\':fontcolor=0xDC2626:fontsize=28:x=(w-text_w)/2:y=92,' +
    'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text=\'PROTEIN TARGETING • WATER SYNC • MEAL LOGS\':fontcolor=0xA1A1AA:fontsize=24:x=(w-text_w)/2:y=1825,' +
    'drawbox=x=0:y=0:w=1080*(t/8):h=6:color=0xDC2626@1:t=fill,' +
    'fade=t=in:st=0:d=0.3,fade=t=out:st=7.6:d=0.4[v];' +
    '[1:a]afade=t=in:st=0:d=0.3,afade=t=out:st=7.6:d=0.4,volume=0.03[a]',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-t', '8',
    '-movflags', '+faststart',
    outPath
  ];

  const res = spawnSync('ffmpeg', ffmpegCmd, { stdio: 'pipe' });
  if (res.status === 0 && fs.existsSync(outPath)) {
    const sz = fs.statSync(outPath).size;
    console.log(`>>> SUCCESS: o1fc_live_reel_3_fuel_os.mp4 (${sz} bytes, ${frameIdx} frames, ${new Set(hashes).size} UNIQUE)`);
  } else {
    console.error('FAILED to compile:', res.stderr ? res.stderr.toString().slice(-300) : '');
  }
})();
