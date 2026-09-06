const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const EMAIL = 'o1oblivianfitness@gmail.com';
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
const TMP_FRAMES_DIR = '/tmp/live_reels_flawless';

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(TMP_FRAMES_DIR)) fs.mkdirSync(TMP_FRAMES_DIR, { recursive: true });

async function createAthletePage(browser) {
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
  await new Promise(r => setTimeout(r, 1500));
  return page;
}

async function recordReel({ browser, reelName, titleText, subtitleText, scriptFn }) {
  const reelDir = path.join(TMP_FRAMES_DIR, reelName);
  if (fs.existsSync(reelDir)) fs.rmSync(reelDir, { recursive: true, force: true });
  fs.mkdirSync(reelDir, { recursive: true });

  const page = await createAthletePage(browser);
  const client = await page.target().createCDPSession();
  let frameIdx = 0;
  const frameHashes = [];

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    const buf = Buffer.from(data, 'base64');
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    frameHashes.push(hash);
    const fname = `frame_${String(frameIdx).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(reelDir, fname), buf);
    frameIdx++;
    try {
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {}
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1080,
    maxHeight: 1920,
    everyNthFrame: 1
  });

  console.log(`\n========================================`);
  console.log(`RECORDING: ${reelName}`);
  console.log(`========================================`);

  await scriptFn(page);

  try {
    await client.send('Page.stopScreencast');
  } catch (e) {}
  await new Promise(r => setTimeout(r, 600));
  await page.close();

  const uniqueCount = new Set(frameHashes).size;
  console.log(`Finished ${reelName}: ${frameIdx} total frames, ${uniqueCount} UNIQUE frames`);

  compileVideo({
    reelDir,
    frameCount: frameIdx,
    outputName: reelName,
    titleText,
    subtitleText
  });
}

function compileVideo({ reelDir, frameCount, outputName, titleText, subtitleText }) {
  const outPath = path.join(VIDEOS_DIR, `${outputName}.mp4`);
  if (frameCount < 15) {
    console.error(`ERROR: Insufficient frames (${frameCount}) for ${outputName}`);
    return;
  }

  // Exactly 8.0s duration
  const fps = Math.max(12, Math.min(30, frameCount / 8.0));
  console.log(`Compiling ${outputName}.mp4 with ${frameCount} frames at ${fps.toFixed(2)} fps...`);

  const ffmpegCmd = [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(reelDir, 'frame_%05d.jpg'),
    '-f', 'lavfi', '-i', 'sine=frequency=110:duration=8',
    '-filter_complex',
    '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,' +
    'drawbox=x=0:y=0:w=1080:h=150:color=black@0.75:t=fill,' +
    'drawbox=x=0:y=1770:w=1080:h=150:color=black@0.85:t=fill,' +
    'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text=\'O1FC OFFICIAL\':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=42,' +
    'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text=\'' + titleText.replace(/'/g, "") + '\':fontcolor=0xDC2626:fontsize=28:x=(w-text_w)/2:y=92,' +
    'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text=\'' + subtitleText.replace(/'/g, "") + '\':fontcolor=0xA1A1AA:fontsize=24:x=(w-text_w)/2:y=1825,' +
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
    console.log(`>>> SUCCESS: ${outputName}.mp4 (${sz} bytes, ${frameCount} frames)`);
  } else {
    console.error(`>>> FAILED to compile ${outputName}:`, res.stderr ? res.stderr.toString().slice(-400) : '');
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=393,852'
    ]
  });

  // ========================================================
  // REEL 1: HOME OS (Athletic Readiness & Living Vitals)
  // ========================================================
  await recordReel({
    browser,
    reelName: 'o1fc_live_reel_1_home_os',
    titleText: 'HOME OS • ATHLETIC READINESS',
    subtitleText: 'LIVING VITALS • BIO-SYNC • QUICK STRIKE',
    scriptFn: async (p) => {
      // Continuous smooth scroll down
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 45; i++) {
          m.scrollTop += 9;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 400));

      // Tap Bio-Sync or Activity
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const bio = btns.find(b => b.innerText.includes('BIO-SYNC') || b.innerText.includes('HYDRATION'));
        if (bio) bio.click();
      });
      await new Promise(r => setTimeout(r, 600));

      // Scroll through Elite Reels carousel
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 35; i++) {
          m.scrollTop += 10;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Smooth scroll back up to readiness rings
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 45; i++) {
          m.scrollTop -= 15;
          await new Promise(res => setTimeout(res, 35));
        }
        m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 500));
    }
  });

  // ========================================================
  // REEL 2: TRAINING OS PRO (Solo Workout, Rotary Dial, Set Logging)
  // ========================================================
  await recordReel({
    browser,
    reelName: 'o1fc_live_reel_2_training_dial',
    titleText: 'TRAINING OS PRO • ROTARY DIAL',
    subtitleText: 'PRECISION LOAD CALIBRATION • REST HUD',
    scriptFn: async (p) => {
      // Smoothly scroll directly into Solo Workout Section
      await p.evaluate(async () => {
        const sec = document.getElementById('solo-workout-section');
        const m = document.querySelector('main');
        if (sec && m) {
          const target = sec.offsetTop - 10;
          const step = (target - m.scrollTop) / 30;
          for (let i = 0; i < 30; i++) {
            m.scrollTop += step;
            await new Promise(res => setTimeout(res, 30));
          }
          m.scrollTop = target;
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Click on routine day or category tabs (e.g. "Lift", "Sports")
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#solo-workout-section button'));
        const liftBtn = btns.find(b => b.innerText.includes('Lift') || b.innerText.includes('Sports'));
        if (liftBtn) liftBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));

      // Scroll through the exercise list
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 40; i++) {
          m.scrollTop += 8;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Open Routine Swapper or Set Logger
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const swapper = btns.find(b => b.innerText.includes('Routine Swapper') || b.innerText.includes('Commit'));
        if (swapper) swapper.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Scroll inside modal or workout list
      await p.evaluate(async () => {
        const modal = document.querySelector('[role="dialog"]') || document.querySelector('.overflow-y-auto');
        if (modal) {
          for (let i = 0; i < 20; i++) {
            modal.scrollTop += 12;
            await new Promise(res => setTimeout(res, 35));
          }
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Scroll back up to show Solo Workout header
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 40; i++) {
          m.scrollTop -= 12;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 500));
    }
  });

  // ========================================================
  // REEL 3: FUEL OS (Metabolic Macro Engine & Hydration Tracker)
  // ========================================================
  await recordReel({
    browser,
    reelName: 'o1fc_live_reel_3_fuel_os',
    titleText: 'FUEL OS • METABOLIC MACRO ENGINE',
    subtitleText: 'PROTEIN TARGETING • WATER SYNC • MEAL LOGS',
    scriptFn: async (p) => {
      // Click Fuel tab in bottom navigation
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const fuelBtn = navBtns.find(b => b.innerText.toLowerCase().includes('fuel'));
        if (fuelBtn) fuelBtn.click();
        const m = document.querySelector('main');
        if (m) m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 700));

      // Smooth scroll down to water logger
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 30; i++) {
          m.scrollTop += 9;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 400));

      // Click +250ml water button 4 times with animated delays
      for (let w = 0; w < 4; w++) {
        await p.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const addWater = btns.find(b => b.innerText.includes('+250') || b.innerText.includes('250ml') || b.innerText.includes('+ 250'));
          if (addWater) addWater.click();
        });
        await new Promise(r => setTimeout(r, 350));
      }

      // Smooth continuous scroll down through meals breakdown
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 45; i++) {
          m.scrollTop += 12;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Smooth scroll back up to top macro rings
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 45; i++) {
          m.scrollTop -= 15;
          await new Promise(res => setTimeout(res, 35));
        }
        m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 500));
    }
  });

  // ========================================================
  // REEL 4: COACH HUB (Fitness Intelligence App & Client Roster)
  // ========================================================
  await recordReel({
    browser,
    reelName: 'o1fc_live_reel_4_coach_intelligence',
    titleText: 'COACH HUB • ATHLETE TELEMETRY',
    subtitleText: 'ROSTER OVERSIGHT • WORKOUT DISPATCH',
    scriptFn: async (p) => {
      // Click Coach tab in bottom navigation
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const coachBtn = navBtns.find(b => b.innerText.toLowerCase().includes('coach'));
        if (coachBtn) coachBtn.click();
        const m = document.querySelector('main');
        if (m) m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 700));

      // Smooth scroll down through athlete roster
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 40; i++) {
          m.scrollTop += 10;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Click on coach filter pills or tab buttons
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tab = btns.find(b => b.innerText.includes('Active') || b.innerText.includes('Dispatch') || b.innerText.includes('Telemetry') || b.innerText.includes('Roster'));
        if (tab) tab.click();
      });
      await new Promise(r => setTimeout(r, 600));

      // Smooth scroll down further through dispatch cards
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 35; i++) {
          m.scrollTop += 12;
          await new Promise(res => setTimeout(res, 35));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Smooth scroll back up to coach overview
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 45; i++) {
          m.scrollTop -= 14;
          await new Promise(res => setTimeout(res, 35));
        }
        m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 500));
    }
  });

  // ========================================================
  // REEL 5: ATHLETE VAULT & SESSION HISTORY
  // ========================================================
  await recordReel({
    browser,
    reelName: 'o1fc_live_reel_5_athlete_vault',
    titleText: 'ATHLETE VAULT • PERSONAL RECORDS',
    subtitleText: 'LIFETIME TONNAGE • WORKOUT LOGS',
    scriptFn: async (p) => {
      // 1. Click Log tab in bottom navigation to enter AthleteView
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const logBtn = navBtns.find(b => b.innerText.toLowerCase().includes('log'));
        if (logBtn) logBtn.click();
        const m = document.querySelector('main');
        if (m) m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 700));

      // 2. Click calendar date filters with visual updates
      for (const day of ['T 1', 'W 2', 'F 4', 'S 6']) {
        await p.evaluate((d) => {
          const btns = Array.from(document.querySelectorAll('button'));
          const b = btns.find(x => x.innerText.trim() === d);
          if (b) b.click();
        }, day);
        await new Promise(r => setTimeout(r, 450));
      }

      // 3. Click VAULT button to expand photo vault
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const vb = btns.find(b => b.innerText.trim() === 'VAULT');
        if (vb) vb.click();
      });
      await new Promise(r => setTimeout(r, 700));

      // 4. Smooth continuous scroll through 1RM telemetry and photo vault
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 40; i++) {
          m.scrollTop += 8;
          await new Promise(res => setTimeout(res, 30));
        }
        for (let i = 0; i < 40; i++) {
          m.scrollTop -= 8;
          await new Promise(res => setTimeout(res, 30));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // 5. Tap START ASSIGNED SESSION to launch live session workout
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const start = btns.find(b => b.innerText.includes('START ASSIGNED SESSION'));
        if (start) start.click();
      });
      await new Promise(r => setTimeout(r, 1200));
    }
  });

  await browser.close();
  console.log('\n======================================================');
  console.log('ALL 5 FLAWLESS LIVE REELS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

run().catch(console.error);
