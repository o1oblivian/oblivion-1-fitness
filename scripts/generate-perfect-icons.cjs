const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function generate() {
  console.log("Launching headless browser for high-precision asset rendering...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  const svgContent = fs.readFileSync(path.join(__dirname, "../public/o1_logo.svg"), "utf8");

  // Helper to render HTML to a PNG buffer
  async function renderToBuffer(width, height, isTransparent, emblemHeightRatio = 0.42) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const bg = isTransparent ? "transparent" : "#000000";
    
    // In o1_logo.svg, viewBox is 0 0 500 500, emblem height is ~377 and width is ~310.
    // We scale the SVG so that the emblem height equals height * emblemHeightRatio.
    // SVG height = (height * emblemHeightRatio) / (377 / 500) = (height * emblemHeightRatio) * (500 / 377)
    const svgPixelHeight = Math.round((height * emblemHeightRatio) * (500 / 377));
    const svgPixelWidth = svgPixelHeight; // 1:1 aspect ratio

    const html = `<!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${width}px;
            height: ${height}px;
            background: ${bg};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          svg {
            width: ${svgPixelWidth}px;
            height: ${svgPixelHeight}px;
            color: #FFFFFF;
            display: block;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>`;

    await page.setContent(html);
    return await page.screenshot({ type: "png", omitBackground: isTransparent });
  }

  // 1. Generate Web Master Icons
  console.log("Generating Web Icons...");
  const icon1024 = await renderToBuffer(1024, 1024, false, 0.42);
  fs.writeFileSync("public/icon-1024.png", icon1024);

  const icon512 = await renderToBuffer(512, 512, false, 0.42);
  fs.writeFileSync("public/icon-512.png", icon512);

  const icon192 = await renderToBuffer(192, 192, false, 0.42);
  fs.writeFileSync("public/icon-192.png", icon192);

  const icon180 = await renderToBuffer(180, 180, false, 0.42);
  fs.writeFileSync("public/apple-touch-icon.png", icon180);

  // Favicon 48x48
  const fav48 = await renderToBuffer(48, 48, false, 0.44);
  fs.writeFileSync("public/favicon.ico", fav48);
  fs.writeFileSync("app-favicon.ico", fav48);

  // 2. iOS AppIcon
  console.log("Generating iOS AppIcon...");
  const iosAppIconPath = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
  if (fs.existsSync(path.dirname(iosAppIconPath))) {
    fs.writeFileSync(iosAppIconPath, icon1024);
  }

  // 3. Android Mipmaps
  console.log("Generating Android Mipmaps (Adaptive Foreground + Legacy)...");
  const densities = [
    { name: "mdpi", legacySize: 48, fgSize: 108 },
    { name: "hdpi", legacySize: 72, fgSize: 162 },
    { name: "xhdpi", legacySize: 96, fgSize: 216 },
    { name: "xxhdpi", legacySize: 144, fgSize: 324 },
    { name: "xxxhdpi", legacySize: 192, fgSize: 432 },
  ];

  for (const d of densities) {
    const dir = `android/app/src/main/res/mipmap-${d.name}`;
    fs.mkdirSync(dir, { recursive: true });

    // Adaptive Foreground (transparent bg, centered emblem occupying ~42% height - safe zone)
    const fgBuf = await renderToBuffer(d.fgSize, d.fgSize, true, 0.42);
    fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), fgBuf);

    // Legacy square icon (black bg, centered emblem occupying ~52% height)
    const legBuf = await renderToBuffer(d.legacySize, d.legacySize, false, 0.52);
    fs.writeFileSync(path.join(dir, "ic_launcher.png"), legBuf);

    // Legacy round icon (circular mask)
    // Render round icon via canvas in puppeteer
    await page.setViewport({ width: d.legacySize, height: d.legacySize });
    const roundHtml = `<!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${d.legacySize}px;
            height: ${d.legacySize}px;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .circle {
            width: ${d.legacySize}px;
            height: ${d.legacySize}px;
            border-radius: 50%;
            background: #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          svg {
            width: ${Math.round((d.legacySize * 0.52) * (500 / 377))}px;
            height: ${Math.round((d.legacySize * 0.52) * (500 / 377))}px;
            color: #FFFFFF;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="circle">
          ${svgContent}
        </div>
      </body>
    </html>`;
    await page.setContent(roundHtml);
    const roundBuf = await page.screenshot({ type: "png", omitBackground: true });
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), roundBuf);

    console.log(`Saved mipmap-${d.name}: fg (${d.fgSize}x${d.fgSize}), legacy & round (${d.legacySize}x${d.legacySize})`);
  }

  // 4. Android & iOS Splash Screens
  console.log("Generating Splash Screens...");
  const splashes = [
    { p: "android/app/src/main/res/drawable/splash.png", w: 480, h: 320 },
    { p: "android/app/src/main/res/drawable-land-mdpi/splash.png", w: 480, h: 320 },
    { p: "android/app/src/main/res/drawable-land-hdpi/splash.png", w: 800, h: 480 },
    { p: "android/app/src/main/res/drawable-land-xhdpi/splash.png", w: 1280, h: 720 },
    { p: "android/app/src/main/res/drawable-land-xxhdpi/splash.png", w: 1600, h: 960 },
    { p: "android/app/src/main/res/drawable-land-xxxhdpi/splash.png", w: 1920, h: 1280 },
    { p: "android/app/src/main/res/drawable-port-mdpi/splash.png", w: 320, h: 480 },
    { p: "android/app/src/main/res/drawable-port-hdpi/splash.png", w: 480, h: 800 },
    { p: "android/app/src/main/res/drawable-port-xhdpi/splash.png", w: 720, h: 1280 },
    { p: "android/app/src/main/res/drawable-port-xxhdpi/splash.png", w: 960, h: 1600 },
    { p: "android/app/src/main/res/drawable-port-xxxhdpi/splash.png", w: 1280, h: 1920 },
    { p: "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png", w: 2732, h: 2732 },
    { p: "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png", w: 2732, h: 2732 },
    { p: "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png", w: 2732, h: 2732 },
  ];

  for (const s of splashes) {
    fs.mkdirSync(path.dirname(s.p), { recursive: true });
    const ratio = Math.min(s.w, s.h) < 600 ? 0.28 : 0.24;
    const buf = await renderToBuffer(s.w, s.h, false, ratio);
    fs.writeFileSync(s.p, buf);
  }

  await browser.close();
  console.log("All icons and splash assets rendered with pixel perfection!");
}

generate().catch(err => {
  console.error("Error generating assets:", err);
  process.exit(1);
});
