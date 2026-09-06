const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const EMAIL = 'o1oblivianfitness@gmail.com';
const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');
const TMP_FRAMES_DIR = '/tmp/live_reels_cdp';

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(TMP_FRAMES_DIR)) fs.mkdirSync(TMP_FRAMES_DIR, { recursive: true });

async function createBrowserAndPage() {
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
  return { browser, page };
}

async function recordActionSequence({ page, actionFn, reelName, titleText, subtitleText }) {
  const reelDir = path.join(TMP_FRAMES_DIR, reelName);
  if (fs.existsSync(reelDir)) fs.rmSync(reelDir, { recursive: true, force: true });
  fs.mkdirSync(reelDir, { recursive: true });

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

  // Start screencast at full 1080x1920 mobile viewport
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1080,
    maxHeight: 1920,
    everyNthFrame: 1
  });

  console.log(`\n>>> START RECORDING: ${reelName}`);
  // Execute the dynamic scripted live user interactions
  await actionFn(page);

  // Stop screencast
  try {
    await client.send('Page.stopScreencast');
  } catch (e) {}
  await new Promise(r => setTimeout(r, 600));

  const uniqueHashes = new Set(frameHashes).size;
  console.log(`Captured ${frameIdx} frames (${uniqueHashes} unique) for ${reelName}`);

  // Compile video with ffmpeg
  compileVideoFromFrames({
    reelDir,
    frameCount: frameIdx,
    outputName: reelName,
    titleText,
    subtitleText
  });
}

function compileVideoFromFrames({ reelDir, frameCount, outputName, titleText, subtitleText }) {
  const outPath = path.join(VIDEOS_DIR, `${outputName}.mp4`);
  if (frameCount < 10) {
    console.error(`ERROR: Not enough frames (${frameCount}) for ${outputName}`);
    return;
  }

  // Calculate target framerate to make video exactly 8.0 seconds
  const targetDuration = 8.0;
  const fps = Math.max(12, Math.min(30, frameCount / targetDuration));

  console.log(`Compiling ${outputName}.mp4 at ${fps.toFixed(1)} fps...`);

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
    console.log(`SUCCESS: ${outputName}.mp4 created (${sz} bytes, ${frameCount} frames)`);
  } else {
    console.error(`FAILED to compile ${outputName}:`, res.stderr ? res.stderr.toString().slice(-400) : '');
  }
}

async function runAllReels() {
  console.log('=== STARTING HIGH-FIDELITY LIVE DYNAMIC REEL RECORDING ===');
  const { browser, page } = await createBrowserAndPage();

  // ==========================================
  // REEL 1: HOME OS (Athletic Readiness & Living Vitals)
  // ==========================================
  await recordActionSequence({
    page,
    reelName: 'o1fc_live_reel_1_home_os',
    titleText: 'HOME OS • ATHLETIC READINESS',
    subtitleText: 'LIVING VITALS • BIO-SYNC • QUICK STRIKE',
    actionFn: async (p) => {
      // Ensure top of main
      await p.evaluate(() => {
        const m = document.querySelector('main');
        if (m) m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 600));

      // Smoothly scroll main down through living vitals
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 35; i++) {
          m.scrollTop += 12;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Tap Bio-Sync or Activity widget
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const bio = btns.find(b => b.innerText.includes('BIO-SYNC') || b.innerText.includes('HYDRATION'));
        if (bio) bio.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Scroll further down to Elite Reels
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 30; i++) {
          m.scrollTop += 14;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Smooth scroll back up to readiness rings
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 40; i++) {
          m.scrollTop -= 18;
          await new Promise(r => setTimeout(r, 40));
        }
        m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 600));
    }
  });

  // ==========================================
  // REEL 2: TRAINING OS PRO (Solo Workout, Rotary Dial, Set Logging)
  // ==========================================
  await recordActionSequence({
    page,
    reelName: 'o1fc_live_reel_2_training_dial',
    titleText: 'TRAINING OS PRO • ROTARY DIAL',
    subtitleText: 'PRECISION LOAD CALIBRATION • REST HUD',
    actionFn: async (p) => {
      // Scroll main to solo workout section
      await p.evaluate(() => {
        const sec = document.getElementById('solo-workout-section');
        const m = document.querySelector('main');
        if (sec && m) {
          m.scrollTop = sec.offsetTop - 20;
        }
      });
      await new Promise(r => setTimeout(r, 700));

      // Smooth scroll through routine choices and exercises
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 25; i++) {
          m.scrollTop += 10;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Click on exercise dial or routine swapper
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#solo-workout-section button'));
        // Find Routine Swapper or Open Dial or Lift
        const target = btns.find(b => b.innerText.includes('Routine') || b.innerText.includes('Lift') || b.innerText.includes('Set') || b.innerText.includes('kg'));
        if (target) target.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      // Click dial adjustment buttons if modal open
      await p.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll('button'));
        const plusBtn = allBtns.find(b => b.innerText.trim() === '+5' || b.innerText.trim() === '+2.5' || b.innerText.trim() === '+' || b.innerText.includes('Log Set'));
        if (plusBtn) plusBtn.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Smooth scroll in workout section
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 25; i++) {
          m.scrollTop += 12;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Scroll back up to workout header
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 25; i++) {
          m.scrollTop -= 12;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 500));
    }
  });

  // ==========================================
  // REEL 3: FUEL OS (Metabolic Macro Engine & Hydration Tracker)
  // ==========================================
  await recordActionSequence({
    page,
    reelName: 'o1fc_live_reel_3_fuel_os',
    titleText: 'FUEL OS • METABOLIC MACRO ENGINE',
    subtitleText: 'PROTEIN TARGETING • WATER SYNC • MEAL LOGS',
    actionFn: async (p) => {
      // Click Fuel tab in bottom navigation
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const fuelBtn = navBtns.find(b => b.innerText.toLowerCase().includes('fuel'));
        if (fuelBtn) fuelBtn.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Reset main scroll to top
      await p.evaluate(() => {
        const m = document.querySelector('main');
        if (m) m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 500));

      // Smooth scroll down past macro rings to hydration
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 20; i++) {
          m.scrollTop += 12;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Click +250ml water button multiple times with delays to animate water ring
      for (let w = 0; w < 3; w++) {
        await p.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const addWater = btns.find(b => b.innerText.includes('+250') || b.innerText.includes('+250ml') || b.innerText.includes('+ 250'));
          if (addWater) addWater.click();
        });
        await new Promise(r => setTimeout(r, 400));
      }
      await new Promise(r => setTimeout(r, 600));

      // Smooth scroll down to meals list
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 30; i++) {
          m.scrollTop += 14;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 700));

      // Smooth scroll back up to macro summary
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 35; i++) {
          m.scrollTop -= 15;
          await new Promise(r => setTimeout(r, 40));
        }
        m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 600));
    }
  });

  // ==========================================
  // REEL 4: COACH HUB (Fitness Intelligence App & Client Roster)
  // ==========================================
  await recordActionSequence({
    page,
    reelName: 'o1fc_live_reel_4_coach_intelligence',
    titleText: 'COACH HUB • ATHLETE TELEMETRY',
    subtitleText: 'ROSTER OVERSIGHT • WORKOUT DISPATCH',
    actionFn: async (p) => {
      // Click Coach tab in bottom navigation
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const coachBtn = navBtns.find(b => b.innerText.toLowerCase().includes('coach'));
        if (coachBtn) coachBtn.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Reset main scroll to top
      await p.evaluate(() => {
        const m = document.querySelector('main');
        if (m) m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 500));

      // Smooth scroll down through athlete roster
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 30; i++) {
          m.scrollTop += 12;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Click an athlete filter or dispatch tab button
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tab = btns.find(b => b.innerText.includes('Active') || b.innerText.includes('Dispatch') || b.innerText.includes('Telemetry') || b.innerText.includes('Filter'));
        if (tab) tab.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Smooth scroll down to details
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 25; i++) {
          m.scrollTop += 14;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Smooth scroll back to top of Coach Hub
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 35; i++) {
          m.scrollTop -= 16;
          await new Promise(r => setTimeout(r, 40));
        }
        m.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 600));
    }
  });

  // ==========================================
  // REEL 5: ATHLETE VAULT & BUDDY RADAR
  // ==========================================
  await recordActionSequence({
    page,
    reelName: 'o1fc_live_reel_5_athlete_vault',
    titleText: 'ATHLETE VAULT • BUDDY RADAR',
    subtitleText: 'LIFETIME RECORDS • PARTNER RADAR SYNC',
    actionFn: async (p) => {
      // Click Log tab in bottom navigation
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const logBtn = navBtns.find(b => b.innerText.toLowerCase().includes('log'));
        if (logBtn) logBtn.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Smooth scroll down past volume tonnage charts
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 25; i++) {
          m.scrollTop += 12;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Smooth scroll to workout history sessions
      await p.evaluate(async () => {
        const m = document.querySelector('main');
        if (!m) return;
        for (let i = 0; i < 25; i++) {
          m.scrollTop += 14;
          await new Promise(r => setTimeout(r, 45));
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Click Buddy button in bottom navigation to trigger the live Buddy Radar sweep modal
      await p.evaluate(() => {
        const navBtns = Array.from(document.querySelectorAll('nav button'));
        const buddyBtn = navBtns.find(b => b.innerText.toLowerCase().includes('buddy'));
        if (buddyBtn) buddyBtn.click();
      });
      // Allow live radar blip animation to sweep on screen
      await new Promise(r => setTimeout(r, 2200));

      // Dismiss or interact in radar
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const closeOrSync = btns.find(b => b.innerText.includes('Close') || b.innerText.includes('Sync') || b.innerText.includes('Connect'));
        if (closeOrSync) closeOrSync.click();
      });
      await new Promise(r => setTimeout(r, 800));
    }
  });

  await browser.close();
  console.log('\n=== ALL 5 HIGH-FIDELITY LIVE REELS COMPLETED SUCCESSFULLY ===');
}

runAllReels().catch(console.error);
