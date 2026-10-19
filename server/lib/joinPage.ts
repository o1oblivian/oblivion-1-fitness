/** Where the shared links (invite, coach, reel) land: a small page that sends people to the stores. */

const APP_SCHEME = 'com.o1fc.fitness';

export interface JoinPageOptions {
  /** Google Play listing, for example https://play.google.com/store/apps/details?id=com.o1fc.fitness */
  playUrl: string;
  /** App Store listing. Empty until the iOS app is live; the button is then hidden. */
  appleUrl: string;
}

function isHttpUrl(value: string): boolean {
  return /^https:\/\/[^\s"'<>]+$/i.test(value);
}

/** Safe to place inside a <script> block. */
function jsString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function resolveJoinOptions(env: NodeJS.ProcessEnv = process.env): JoinPageOptions {
  const play = String(env.GOOGLE_PLAY_URL || '').trim();
  const apple = String(env.APPLE_APP_STORE_URL || '').trim();
  return {
    playUrl: isHttpUrl(play) ? play : `https://play.google.com/store/apps/details?id=${APP_SCHEME}`,
    appleUrl: isHttpUrl(apple) ? apple : '',
  };
}

export function renderJoinPage(options: JoinPageOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#000000">
<meta property="og:title" content="O1FC - Oblivion 1 Fitness Club">
<meta property="og:description" content="Train, fuel and work with your coach. Get the app.">
<title>O1FC - Oblivion 1 Fitness Club</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;background:#000;color:#EAE8DF;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{min-height:100vh;display:flex;flex-direction:column;justify-content:center;max-width:420px;margin:0 auto;padding:32px 24px}
  .brand{font-size:44px;font-weight:800;letter-spacing:-0.02em;margin:0}
  .club{color:#8A887F;font-size:14px;margin:4px 0 28px}
  h1{font-size:22px;line-height:1.25;margin:0 0 8px;font-weight:700}
  p{color:#8A887F;font-size:15px;line-height:1.5;margin:0 0 20px}
  .code{display:none;align-items:center;justify-content:space-between;gap:12px;background:#111113;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:12px 14px;margin-bottom:20px}
  .code strong{font-size:17px;letter-spacing:.02em;word-break:break-all}
  .btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;font-size:16px;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,.07);background:#111113;color:#EAE8DF;margin-bottom:10px;cursor:pointer;font-family:inherit;width:100%}
  .btn.primary{background:#C4121A;border-color:#C4121A;color:#fff}
  .btn.small{min-height:36px;width:auto;padding:0 14px;font-size:14px;margin:0}
  .note{font-size:13px;margin-top:14px}
  [hidden]{display:none!important}
</style>
</head>
<body>
<main>
  <p class="brand" style="color:#EAE8DF;margin:0">O1FC</p>
  <p class="club">Oblivion 1 Fitness Club</p>
  <h1 id="title">Train, fuel and work with your coach.</h1>
  <p id="lead">Get the app to start. Your first 90 days include everything.</p>
  <div class="code" id="codeBox"><strong id="code"></strong><button class="btn small" id="copy" type="button">Copy</button></div>
  <a class="btn primary" id="open" href="#" hidden>Open in the app</a>
  <a class="btn" id="play" href="#">Get it on Google Play</a>
  <a class="btn" id="apple" href="#" hidden>Download on the App Store</a>
  <p class="note" id="note"></p>
</main>
<script>
(function () {
  var PLAY = ${jsString(options.playUrl)};
  var APPLE = ${jsString(options.appleUrl)};
  var SCHEME = ${jsString(APP_SCHEME)};
  var q = new URLSearchParams(location.search);
  function clean(v) { v = (v || '').trim(); return /^[A-Za-z0-9_.:-]{1,120}$/.test(v) ? v : ''; }
  var invite = clean(q.get('invite')), reel = clean(q.get('reel')), coach = clean(q.get('coach'));
  var p = new URLSearchParams();
  if (invite) p.set('invite', invite);
  if (reel) p.set('reel', reel);
  if (coach) p.set('coach', coach);
  var query = p.toString();
  var ua = navigator.userAgent || '';
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  var title = document.getElementById('title'), lead = document.getElementById('lead');
  if (invite) {
    title.textContent = 'You have been invited.';
    lead.textContent = 'Install the app, sign in, then open Log, Invite and enter this code. If the app is already installed, tap Open in the app.';
    document.getElementById('code').textContent = invite;
    document.getElementById('codeBox').style.display = 'flex';
  } else if (coach) {
    title.textContent = 'A coach shared their page.';
    lead.textContent = 'Open it in the app to see their programs and send a request.';
  } else if (reel) {
    title.textContent = 'Someone shared a reel with you.';
    lead.textContent = 'Open it in the app to watch.';
  }

  var play = document.getElementById('play'), apple = document.getElementById('apple'), open = document.getElementById('open');
  play.href = PLAY;
  if (APPLE) { apple.href = APPLE; apple.hidden = false; }
  if (android) { apple.hidden = true; }
  if (ios) { play.hidden = true; if (!APPLE) { document.getElementById('note').textContent = 'The iOS app is coming soon.'; } }

  if (android || ios) {
    open.hidden = false;
    open.href = android
      ? 'intent://auth/callback' + (query ? '?' + query : '') + '#Intent;scheme=' + SCHEME + ';package=' + SCHEME + ';S.browser_fallback_url=' + encodeURIComponent(PLAY) + ';end'
      : SCHEME + '://auth/callback' + (query ? '?' + query : '');
    var first = android ? open : (APPLE ? apple : open);
    if (first !== open) { open.classList.remove('primary'); first.classList.add('primary'); }
  } else {
    play.classList.add('primary');
  }

  document.getElementById('copy').addEventListener('click', function () {
    var btn = this;
    function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(invite).then(done, function () {}); }
  });
})();
</script>
</body>
</html>
`;
}
