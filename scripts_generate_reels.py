import os, subprocess, sys

os.makedirs('public/videos', exist_ok=True)
os.makedirs('/tmp/reel_txt', exist_ok=True)

reels = [
  {
    'name': 'o1fc_tutorial_reel_1_home_os.mp4',
    'src': 'public/screenshot_1_1284x2778.png',
    'freq': 110,
    'tag': 'O1FC ATHLETIC OS • TUTORIAL 01',
    'title': 'DAILY READINESS & TELEMETRY',
    'sub': 'Track recovery score, resting heart rate & streak',
    's1_badge': 'STEP 01 // CHECK ATHLETIC READINESS',
    's1_body': 'Monitor your 94% recovery score and resting heart rate',
    's1_sub': 'before initiating intense volume',
    's2_badge': 'STEP 02 // LAUNCH QUICK STRIKE',
    's2_body': 'One tap initiates your personalized training session',
    's2_sub': 'with auto-adjusted volume and rest targets',
    'cta': 'TESTFLIGHT BUILD 35 APPROVED • JOIN AT O1FC.APP',
    'crop_anim': '416*(t/8)'
  },
  {
    'name': 'o1fc_tutorial_reel_2_training_dial.mp4',
    'src': 'public/screenshot_2_1284x2778.png',
    'freq': 120,
    'tag': 'O1FC TRAINING PRO • TUTORIAL 02',
    'title': 'ROTARY DIAL & SET TRACKER',
    'sub': 'Precision haptic dial for instant set adjustments',
    's1_badge': 'STEP 01 // ROTATE FOR TARGET WEIGHT & REPS',
    's1_body': 'Spin the precision rotary dial to select weight and reps',
    's1_sub': 'engineered for rapid, zero-friction in-gym tracking',
    's2_badge': 'STEP 02 // AUTO REST TIMER & VOLUME LOGGING',
    's2_body': 'Logging sets triggers dynamic rest countdown HUD',
    's2_sub': 'calculating progressive overload and set volume live',
    'cta': 'TESTFLIGHT BUILD 35 APPROVED • JOIN AT O1FC.APP',
    'crop_anim': '416*(t/8)'
  },
  {
    'name': 'o1fc_tutorial_reel_3_fuel_os.mp4',
    'src': 'public/screenshot_3_1284x2778.png',
    'freq': 105,
    'tag': 'O1FC FUEL OS • TUTORIAL 03',
    'title': 'AI VISION MEAL SCANNER & MACROS',
    'sub': 'Instant USDA multimodal food nutrition breakdown',
    's1_badge': 'STEP 01 // SNAP MEAL WITH AI CAMERA',
    's1_body': 'Multimodal AI vision decomposes ingredients in 2 seconds',
    's1_sub': 'with 0% fake templates and real biochemical analysis',
    's2_badge': 'STEP 02 // TARGET PROTEIN, CARBS & CALORIES',
    's2_body': 'Live macro rings update automatically against daily goals',
    's2_sub': 'including hydration, supplements and metabolic load',
    'cta': 'TESTFLIGHT BUILD 35 APPROVED • JOIN AT O1FC.APP',
    'crop_anim': '416*(t/8)'
  },
  {
    'name': 'o1fc_tutorial_reel_4_workout_flow.mp4',
    'src': 'public/screenshot_2_1284x2778.png',
    'freq': 115,
    'tag': 'O1FC TRAINING PRO • TUTORIAL 04',
    'title': 'SPLIT SWAPPER & SET FLOW',
    'sub': 'Dynamic routine swapper, volume tonnage & sync',
    's1_badge': 'STEP 01 // CUSTOMIZE SPLITS ON THE FLY',
    's1_body': 'Swap exercises, substitute equipment, and adjust sets',
    's1_sub': 'tailored for peak strength and hypertrophy cycles',
    's2_badge': 'STEP 02 // REAL-TIME SYNC & ATHLETE VAULT',
    's2_body': 'All sets sync offline-first and persist to cloud storage',
    's2_sub': 'with zero data loss and automated PR detection',
    'cta': 'TESTFLIGHT BUILD 35 APPROVED • JOIN AT O1FC.APP',
    'crop_anim': '416*(1-t/8)'
  },
  {
    'name': 'o1fc_tutorial_reel_5_all_pages_masterclass.mp4',
    'src': 'public/screenshot_1_1284x2778.png',
    'freq': 95,
    'tag': 'O1FC OFFICIAL • TUTORIAL 05',
    'title': 'ALL-PAGES CLUB MASTERCLASS',
    'sub': 'Home OS, Training Pro, Fuel OS & Coach Hub',
    's1_badge': 'STEP 01 // UNIFIED ATHLETIC ECOSYSTEM',
    's1_body': 'Seamlessly glide between Training, Fuel, and Coach Hub',
    's1_sub': 'built with Apple-Grade precision and zero bloat',
    's2_badge': 'STEP 02 // PUBLIC TESTFLIGHT NOW LIVE',
    's2_body': 'Install Build 35 directly from Apple TestFlight today',
    's2_sub': 'and experience next-generation athletic intelligence',
    'cta': 'TESTFLIGHT BUILD 35 APPROVED • JOIN AT O1FC.APP',
    'crop_anim': '416*(t/8)'
  }
]

for idx, r in enumerate(reels):
    print(f'Starting Reel {idx+1}/{len(reels)}: {r["name"]}')
    prefix = f'/tmp/reel_txt/r{idx}'
    for field in ['tag', 'title', 'sub', 's1_badge', 's1_body', 's1_sub', 's2_badge', 's2_body', 's2_sub', 'cta']:
        with open(f'{prefix}_{field}.txt', 'w') as f:
            f.write(r[field])

    out_path = os.path.join('public/videos', r['name'])
    cmd = [
      'ffmpeg', '-y',
      '-loop', '1', '-r', '30', '-t', '8',
      '-i', r['src'],
      '-f', 'lavfi', '-i', f'sine=frequency={r["freq"]}:duration=8',
      '-filter_complex',
      f'[0:v]scale=1080:-1,crop=1080:1920:0:{r["crop_anim"]},'
      'drawbox=x=0:y=0:w=1080:h=260:color=black@0.80:t=fill,'
      'drawbox=x=0:y=1640:w=1080:h=280:color=black@0.85:t=fill,'
      'drawbox=x=0:y=0:w=1080*(t/8):h=6:color=0xDC2626@1:t=fill,'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_tag.txt:fontsize=26:fontcolor=0xEF4444:x=60:y=60,'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_title.txt:fontsize=44:fontcolor=white:x=60:y=105,'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_sub.txt:fontsize=24:fontcolor=0xA1A1AA:x=60:y=165,'
      'drawbox=x=60:y=1380:w=960:h=200:color=0x18181B@0.94:t=fill:enable=between(t\,0.3\,3.9),'
      'drawbox=x=60:y=1380:w=8:h=200:color=0xDC2626@1:t=fill:enable=between(t\,0.3\,3.9),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_s1_badge.txt:fontsize=24:fontcolor=0xEF4444:x=90:y=1415:enable=between(t\,0.3\,3.9),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_s1_body.txt:fontsize=28:fontcolor=white:x=90:y=1460:enable=between(t\,0.3\,3.9),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_s1_sub.txt:fontsize=22:fontcolor=0x71717A:x=90:y=1510:enable=between(t\,0.3\,3.9),'
      'drawbox=x=60:y=1380:w=960:h=200:color=0x18181B@0.94:t=fill:enable=between(t\,4.1\,7.8),'
      'drawbox=x=60:y=1380:w=8:h=200:color=0x22C55E@1:t=fill:enable=between(t\,4.1\,7.8),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_s2_badge.txt:fontsize=24:fontcolor=0x22C55E:x=90:y=1415:enable=between(t\,4.1\,7.8),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_s2_body.txt:fontsize=28:fontcolor=white:x=90:y=1460:enable=between(t\,4.1\,7.8),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_s2_sub.txt:fontsize=22:fontcolor=0x71717A:x=90:y=1510:enable=between(t\,4.1\,7.8),'
      f'drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:textfile={prefix}_cta.txt:fontsize=24:fontcolor=white:x=(1080-text_w)/2:y=1770,'
      'fade=t=in:st=0:d=0.4,fade=t=out:st=7.6:d=0.4[v];'
      '[1:a]afade=t=in:st=0:d=0.4,afade=t=out:st=7.6:d=0.4,volume=0.06[a]',
      '-map', '[v]', '-map', '[a]',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      out_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f'Done: {r["name"]} ({os.path.getsize(out_path)} bytes)')
    else:
        print(f'Error on {r["name"]}: {res.stderr[-300:]}')
        sys.exit(1)

print('All 5 reels generated successfully!')
