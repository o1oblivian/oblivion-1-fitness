const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const EMAIL = 'o1oblivianfitness@gmail.com';
const OUTPUT_PHOTOS_DIR = path.join(__dirname, 'public', 'live_photos');
const OUTPUT_VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
const FRAMES_BASE = '/tmp/live_frames';

if (!fs.existsSync(OUTPUT_PHOTOS_DIR)) fs.mkdirSync(OUTPUT_PHOTOS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_VIDEOS_DIR)) fs.mkdirSync(OUTPUT_VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(FRAMES_BASE)) fs.mkdirSync(FRAMES_BASE, { recursive: true });

async function setupPage(browser) {
  const page = await browser.newPage();
  // Standard high-res iPhone viewport (1080x1920 equivalent with deviceScaleFactor 2 or 3)
  // Let's use 393 x 852 with deviceScaleFactor: 2.75 -> 1080 x 2343 (perfect for 1080x1920 9:16 crop)
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2.75 });

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
    localStorage.setItem('o1fc_perm_camera', 'granted');
    localStorage.setItem('o1fc_perm_mic', 'granted');
  }, EMAIL);

  return page;
}

async function captureAllLivePhotos(page) {
  console.log('=== CAPTURING LIVE HIGH-RES PHOTOS ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Home OS Photo
  await page.screenshot({ path: path.join(OUTPUT_PHOTOS_DIR, '01_live_home_os.png'), fullPage: false });
  console.log('Saved 01_live_home_os.png');

  // 2. Training OS Pro Photo (Click "Workout")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.trim().toLowerCase() === 'workout');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_PHOTOS_DIR, '02_live_training_os_pro.png'), fullPage: false });
  console.log('Saved 02_live_training_os_pro.png');

  // 3. Fuel OS Photo (Click "Fuel")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.trim().toLowerCase() === 'fuel');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_PHOTOS_DIR, '03_live_fuel_os.png'), fullPage: false });
  console.log('Saved 03_live_fuel_os.png');

  // 4. Tandem / Buddy Radar Photo (Click "Buddy")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.trim().toLowerCase() === 'buddy');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_PHOTOS_DIR, '04_live_tandem_radar.png'), fullPage: false });
  console.log('Saved 04_live_tandem_radar.png');

  // 5. Coach Hub Photo (Click "Coach")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.trim().toLowerCase() === 'coach');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_PHOTOS_DIR, '05_live_coach_intelligence.png'), fullPage: false });
  console.log('Saved 05_live_coach_intelligence.png');

  // 6. Athlete Vault / History Log Photo (Click "Log")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.trim().toLowerCase() === 'log');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_PHOTOS_DIR, '06_live_athlete_history_vault.png'), fullPage: false });
  console.log('Saved 06_live_athlete_history_vault.png');
}

async function recordLiveClip({
  page,
  name,
  durationSec = 8,
  fps = 15,
  interactionFn
}) {
  const framesDir = path.join(FRAMES_BASE, name);
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  console.log(`\nRecording live clip: ${name} (${durationSec}s @ ${fps}fps)...`);
  const totalFrames = durationSec * fps;
  const frameIntervalMs = 1000 / fps;

  let frameIdx = 0;
  const startTime = Date.now();

  // Run interaction asynchronously or in steps
  const interactionPromise = interactionFn(page, durationSec);

  while (frameIdx < totalFrames) {
    const frameStart = Date.now();
    const framePath = path.join(framesDir, `frame_${String(frameIdx).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath, fullPage: false });
    frameIdx++;

    const elapsed = Date.now() - frameStart;
    const wait = Math.max(0, frameIntervalMs - elapsed);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
  }

  await interactionPromise;
  console.log(`Captured ${frameIdx} real live frames for ${name}`);

  // Encode frames to 1080x1920 MP4 using ffmpeg
  const outPath = path.join(OUTPUT_VIDEOS_DIR, `${name}.mp4`);
  console.log(`Encoding ${name}.mp4 with ffmpeg...`);

  const ffmpegCmd = [
    '-y',
    '-r', String(fps),
    '-i', path.join(framesDir, 'frame_%05d.png'),
    '-f', 'lavfi', '-i', 'sine=frequency=120:duration=' + durationSec,
    '-filter_complex',
    '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,' +
    'drawbox=x=0:y=0:w=1080:h=120:color=black@0.70:t=fill,' +
    'drawbox=x=0:y=1800:w=1080:h=120:color=black@0.80:t=fill,' +
    'drawbox=x=0:y=0:w=1080*(t/' + durationSec + '):h=6:color=0xDC2626@1:t=fill,' +
    'fade=t=in:st=0:d=0.3,fade=t=out:st=' + (durationSec - 0.4) + ':d=0.4[v];' +
    '[1:a]afade=t=in:st=0:d=0.3,afade=t=out:st=' + (durationSec - 0.4) + ':d=0.4,volume=0.04[a]',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outPath
  ];

  const res = spawnSync('ffmpeg', ffmpegCmd, { stdio: 'inherit' });
  if (res.status === 0 && fs.existsSync(outPath)) {
    console.log(`SUCCESS: Created ${outPath} (${fs.statSync(outPath).size} bytes)`);
  } else {
    console.error(`ERROR encoding ${name}.mp4`);
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await setupPage(browser);

  // First: Capture all static live photos
  await captureAllLivePhotos(page);

  // Video 1: Live Home OS & Telemetry Scrolling
  await recordLiveClip({
    page,
    name: 'o1fc_live_video_1_home_telemetry',
    durationSec: 8,
    fps: 12,
    interactionFn: async (p) => {
      // Go to Home
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const homeBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'home');
        if (homeBtn) homeBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      // Scroll smoothly down
      for (let i = 0; i < 6; i++) {
        await p.evaluate(() => window.scrollBy({ top: 120, behavior: 'smooth' }));
        await new Promise(r => setTimeout(r, 500));
      }
      // Click Action Rail / Bio-Sync
      await p.evaluate(() => {
        const bio = document.querySelector('button[aria-label="Flip to vitals"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BIO-SYNC'));
        if (bio) bio.click();
      });
      await new Promise(r => setTimeout(r, 1200));

      // Scroll back up
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await new Promise(r => setTimeout(r, 800));
    }
  });

  // Video 2: Live Training OS Pro & Rotary Dial Interaction
  await recordLiveClip({
    page,
    name: 'o1fc_live_video_2_training_dial',
    durationSec: 8,
    fps: 12,
    interactionFn: async (p) => {
      // Switch to Workout (SoloView)
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const wBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'workout');
        if (wBtn) wBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      // Scroll down to the rotary dial & exercise tracker
      await p.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
      await new Promise(r => setTimeout(r, 800));

      // Simulate dialing/dragging or clicking weight adjustments
      await p.evaluate(() => {
        const plusBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('+') || b.innerText.includes('LOG') || b.innerText.includes('Set'));
        if (plusBtns.length > 0) plusBtns[0].click();
      });
      await new Promise(r => setTimeout(r, 1200));

      // Click "Log Set" to trigger rest timer HUD
      await p.evaluate(() => {
        const logSetBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.toLowerCase().includes('log set') || 
          b.innerText.toLowerCase().includes('complete set') ||
          b.innerText.toLowerCase().includes('+ set')
        );
        if (logSetBtn) logSetBtn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
    }
  });

  // Video 3: Live Fuel OS & Macro Intake Breakdown
  await recordLiveClip({
    page,
    name: 'o1fc_live_video_3_fuel_os',
    durationSec: 8,
    fps: 12,
    interactionFn: async (p) => {
      // Switch to Fuel OS
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const fBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'fuel');
        if (fBtn) fBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      // Scroll smoothly down through macro rings
      for (let i = 0; i < 4; i++) {
        await p.evaluate(() => window.scrollBy({ top: 140, behavior: 'smooth' }));
        await new Promise(r => setTimeout(r, 600));
      }

      // Click quick add hydration (+250ml) or meal button
      await p.evaluate(() => {
        const addWater = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('+250') || b.innerText.toLowerCase().includes('water'));
        if (addWater) addWater.click();
      });
      await new Promise(r => setTimeout(r, 1500));
    }
  });

  // Video 4: Live Tandem Radar & Athlete History Vault
  await recordLiveClip({
    page,
    name: 'o1fc_live_video_4_tandem_history',
    durationSec: 8,
    fps: 12,
    interactionFn: async (p) => {
      // Switch to Buddy / Tandem
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const bBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'buddy');
        if (bBtn) bBtn.click();
      });
      await new Promise(r => setTimeout(r, 2000));

      // Switch to Log / History Vault
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const lBtn = btns.find(b => b.innerText.trim().toLowerCase() === 'log');
        if (lBtn) lBtn.click();
      });
      await new Promise(r => setTimeout(r, 1500));

      // Scroll through history logs
      for (let i = 0; i < 3; i++) {
        await p.evaluate(() => window.scrollBy({ top: 120, behavior: 'smooth' }));
        await new Promise(r => setTimeout(r, 700));
      }
    }
  });

  // Video 5: Live Masterclass All-Pages Seamless Tour
  await recordLiveClip({
    page,
    name: 'o1fc_live_video_5_masterclass_tour',
    durationSec: 8,
    fps: 12,
    interactionFn: async (p) => {
      const tabs = ['home', 'workout', 'fuel', 'buddy', 'coach', 'log'];
      for (const tab of tabs) {
        await p.evaluate((t) => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText.trim().toLowerCase() === t);
          if (btn) btn.click();
        }, tab);
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  });

  await browser.close();
  console.log('\n=== ALL REAL LIVE PHOTOS & VIDEOS CAPTURED AND ENCODED! ===');
}

main().catch(console.error);
