import fs from 'fs';

const bundlePath = 'assets/index-BWUawsaP.js';
let bundle = fs.readFileSync(bundlePath, 'utf8');

const target = 'children:"Fast Builder"})]})]})';
const idx = bundle.indexOf(target);
if (idx === -1) {
  console.error('Could not find target Fast Builder in bundle');
  process.exit(1);
}

const replacement = `children:"Fast Builder"})]})]}),r.jsxs("div",{className:"col-span-2 pt-1 flex items-center gap-1.5",children:[r.jsxs("button",{type:"button",onClick:()=>{const u=\`\${window.location.origin}/join/\${encodeURIComponent((typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||(n?(n.includes("@")?n.split("@")[0]:n):"default_coach"))}\`;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(u)}s("Coach athlete intake web link copied: "+u,"success")},className:"flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer",children:[r.jsx("span",{children:"COPY ATHLETE LINK"})]}),r.jsx("button",{type:"button",onClick:()=>{const u=\`\${window.location.origin}/join/\${encodeURIComponent((typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||(n?(n.includes("@")?n.split("@")[0]:n):"default_coach"))}\`;if(typeof window!=="undefined"){window.open(u,"_blank")||(window.location.href=u)}},title:"Preview what your athletes see on the external web intake page",className:"py-2 px-2.5 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer",children:"PREVIEW"})]})`;

bundle = bundle.replace(target, replacement);

fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Successfully patched Tactical Command Dock in assets/index-BWUawsaP.js');

if (fs.existsSync('dist/assets/index-BWUawsaP.js')) {
  fs.writeFileSync('dist/assets/index-BWUawsaP.js', bundle, 'utf8');
  console.log('Successfully patched Tactical Command Dock in dist/assets/index-BWUawsaP.js');
}
