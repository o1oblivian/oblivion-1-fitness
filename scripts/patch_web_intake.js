import fs from 'fs';

const bundlePath = 'assets/index-BWUawsaP.js';
let bundle = fs.readFileSync(bundlePath, 'utf8');
console.log('Bundle loaded, length:', bundle.length);

// 1. In Tactical Command Dock, add "COPY ATHLETE LINK" with `${window.location.origin}/join/${coachId}`
// and inline preview button.
// Let's locate the Fast Builder button in Tactical Command Dock
const fastBuilderMarker = 'children:"Fast Builder"})]})]})]}),r.jsxs("div",{onClick:()=>z(!0)';
const fbIndex = bundle.indexOf(fastBuilderMarker);
if (fbIndex !== -1) {
  const athleteLinkDockReplacement = `children:"Fast Builder"})]})]})]}),r.jsxs("div",{className:"mt-2 pt-2 border-t border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2",children:[r.jsxs("button",{type:"button",onClick:()=>{const u=\`\${window.location.origin}/join/\${encodeURIComponent((typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||(n?(n.includes("@")?n.split("@")[0]:n):"default_coach"))}\`;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(u)}s("Coach athlete intake web link copied: "+u,"success")},className:"flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[10.5px] uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer",children:[r.jsx("span",{children:"COPY ATHLETE LINK"})]}),r.jsx("button",{type:"button",onClick:()=>{const u=\`\${window.location.origin}/join/\${encodeURIComponent((typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||(n?(n.includes("@")?n.split("@")[0]:n):"default_coach"))}\`;if(typeof window!=="undefined"){window.open(u,"_blank")||(window.location.href=u)}},title:"Preview what your athletes see on the external web intake page",className:"py-2 px-3 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-mono font-bold text-[10.5px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",children:[r.jsx("span",{children:"PREVIEW"})]})]}),r.jsxs("div",{onClick:()=>z(!0)`;

  bundle = bundle.replace(fastBuilderMarker, athleteLinkDockReplacement);
  console.log('1. Added COPY ATHLETE LINK and PREVIEW to Tactical Command Dock');
} else {
  console.log('Tactical Command Dock already has intake link or marker altered.');
}

// 2. In Coach Roster Empty State, update the "Copy Athlete Link" button to use window.location.origin/join/:coachId AND add preview button
const oldRosterCopyMarker = 'r.jsx("button",{onClick:()=>{var I,he;(he=(I=navigator.clipboard)==null?void 0:I.writeText)==null||he.call(I,`https://app.01fc.com/join?coach_id=';
const rIdx = bundle.indexOf(oldRosterCopyMarker);
if (rIdx !== -1) {
  const endBtnIdx = bundle.indexOf('children:"Copy Athlete Link"})', rIdx);
  if (endBtnIdx !== -1) {
    const fullOldSnippet = bundle.substring(rIdx, endBtnIdx + 'children:"Copy Athlete Link"})'.length);
    const newRosterCopyReplacement = `r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx("button",{onClick:()=>{const u=\`\${window.location.origin}/join/\${encodeURIComponent((typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||(n?(n.includes("@")?n.split("@")[0]:n):"default_coach"))}\`;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(u)}s("Coach athlete intake web link copied: "+u,"success")},className:"px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer",children:"COPY ATHLETE LINK"}),r.jsx("button",{onClick:()=>{const u=\`\${window.location.origin}/join/\${encodeURIComponent((typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||(n?(n.includes("@")?n.split("@")[0]:n):"default_coach"))}\`;if(typeof window!=="undefined"){window.open(u,"_blank")||(window.location.href=u)}},className:"px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer",children:"PREVIEW"})]})`;
    bundle = bundle.replace(fullOldSnippet, newRosterCopyReplacement);
    console.log('2. Updated Roster Empty State Copy & Preview Link');
  }
}

// 3. Define CoachIntakeView and AthleteWelcomeView components before function _Me()
const intakeComponentsCode = fs.readFileSync('scripts/intake_views.txt', 'utf8');

const meFunctionIdx = bundle.indexOf('function _Me(){var e;const t=yoe()');
if (meFunctionIdx !== -1) {
  bundle = bundle.slice(0, meFunctionIdx) + intakeComponentsCode + '\n' + bundle.slice(meFunctionIdx);
  console.log('3. Injected intake and welcome components before function _Me()');

  // Now patch function _Me() to inspect the route at startup
  const meTarget = 'function _Me(){var e;const t=yoe()';
  const meReplacement = `function _Me(){
  const [currentPath, setCurrentPath] = g.useState(() => typeof window !== "undefined" ? window.location.pathname : "/");
  const [currentSearch, setCurrentSearch] = g.useState(() => typeof window !== "undefined" ? window.location.search : "");

  // 1. Athlete Intake Route (/join/:coachId or /join?coach_id=...)
  if (currentPath.startsWith("/join/") || (currentPath === "/join" && currentSearch.includes("coach_id="))) {
    const extractedCoachId = currentPath.startsWith("/join/")
      ? decodeURIComponent(currentPath.slice(6).split("/")[0] || "default_coach")
      : (new URLSearchParams(currentSearch).get("coach_id") || "default_coach");
    return r.jsx(CoachIntakeView, { coachId: extractedCoachId, onNavigateHome: () => { window.location.href = "/"; } });
  }

  // 2. Athlete Welcome & Confirmation Route (/welcome?session_id=...)
  if (currentPath.startsWith("/welcome")) {
    return r.jsx(AthleteWelcomeView, { onNavigateHome: () => { window.location.href = "/"; } });
  }

  var e;const t=yoe()`;

  bundle = bundle.replace(meTarget, meReplacement);
  console.log('4. Injected intake and welcome routing into function _Me()');
} else {
  console.log('function _Me() already patched or signature altered.');
}

fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Saved patched bundle to:', bundlePath);

// Also update dist/assets/index-BWUawsaP.js if dist exists
const distBundlePath = 'dist/assets/index-BWUawsaP.js';
if (fs.existsSync('dist/assets')) {
  fs.writeFileSync(distBundlePath, bundle, 'utf8');
  console.log('Saved patched bundle to:', distBundlePath);
}
