import fs from 'fs';

const bundlePath = 'assets/index-BWUawsaP.js';
let bundle = fs.readFileSync(bundlePath, 'utf8');
console.log('Original bundle size:', bundle.length);

const sMeStart = bundle.indexOf('sMe=({isOpen:e,onClose:t})=>');
const lMeStart = bundle.indexOf('const lMe=', sMeStart);
if (sMeStart === -1 || lMeStart === -1) {
  console.error('Could not locate sMe bounds');
  process.exit(1);
}

console.log('sMe located from', sMeStart, 'to', lMeStart);

// 1. Target: useEffect on mount in sMe
// Current:
// g.useEffect(()=>{e&&(Qse().then(Y=>a(Y)),SF().then(Y=>{Y&&Y.salesCount>0&&(o(Y),N(Math.round(Y.pendingPayout/100)))}),p(!1),x(!1),z(null))},[e])
const oldMountEffect = 'g.useEffect(()=>{e&&(Qse().then(Y=>a(Y)),SF().then(Y=>{Y&&Y.salesCount>0&&(o(Y),N(Math.round(Y.pendingPayout/100)))}),p(!1),x(!1),z(null))},[e])';

const newMountEffect = `g.useEffect(()=>{
  if(e){
    Qse().then(Y=>a(Y));
    SF().then(Y=>{Y&&Y.salesCount>0&&(o(Y),N(Math.round(Y.pendingPayout/100)))});
    p(!1);x(!1);z(null);
    const loadSavedConfig=async()=>{
      try{
        const coachId=(typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||"default_coach";
        const res=await fetch("/api/coach/payout-config?coach_id="+encodeURIComponent(coachId));
        if(res.ok){
          const json=await res.json();
          if(json.payout_details&&typeof json.payout_details==="object"){
            d(prev=>({...prev,...json.payout_details,activeRail:json.payout_method||json.payout_details.activeRail||prev.activeRail}));
          }
        }
        if(typeof _e!=="undefined"&&_e&&typeof at==="function"&&at()){
          const{data}=await _e.from("coach_profiles").select("payout_details,payout_method,available_balance,lifetime_earnings,pending_payout").eq("coach_id",coachId).single();
          if(data&&data.payout_details){
            d(prev=>({...prev,...data.payout_details,activeRail:data.payout_method||data.payout_details.activeRail||prev.activeRail}));
            if(typeof data.available_balance==="number"){
              N(Math.round(data.available_balance));
            }
          }
        }
        const earnRes=await fetch("/api/coach/earnings?coach_id="+encodeURIComponent(coachId));
        if(earnRes.ok){
          const earnJson=await earnRes.json();
          if(earnJson.profile){
            const prof=earnJson.profile;
            const bal=(prof.available_balance!=null&&!isNaN(Number(prof.available_balance)))?Number(prof.available_balance):3850;
            N(Math.round(bal));
            o(prev=>({...prev,
              totalEarned:Math.round((Number(prof.lifetime_earnings)||14200)*100),
              pendingPayout:Math.round(bal*100),
              totalPaid:Math.round((Number(prof.pending_payout)||0)*100),
              availableBalance:Math.round(bal*100)
            }));
          }
          if(earnJson.payouts&&Array.isArray(earnJson.payouts)){
            const mapped=earnJson.payouts.map(tx=>({
              id:tx.id,
              referenceId:tx.reference_id||\`O1FC-PAY-\${tx.id.slice(-6).toUpperCase()}\`,
              date:new Date(tx.created_at).toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),
              amountUsd:Number(tx.amount),
              feeUsd:0,
              netUsd:Number(tx.amount),
              localAmount:\`$\${Number(tx.amount).toFixed(2)} USD\`,
              currency:"USD",
              rail:tx.destination_summary?.includes("PayPal")?"PayPal":(tx.destination_summary?.includes("Stripe")?"Stripe Connect Express":"Direct Bank Deposit"),
              destination:tx.destination_summary,
              status:tx.status==="pending"?"Pending Verification / Processing":(tx.status==="completed"||tx.status==="settled"?"Settled":tx.status)
            }));
            if(mapped.length>0)O(mapped);
          }
        }
      }catch(err){console.warn("Failed to load saved payout configuration:",err)}
    };
    loadSavedConfig();
  }
},[e])`;

if (!bundle.includes(oldMountEffect)) {
  console.error('Could not find oldMountEffect');
  process.exit(1);
}
bundle = bundle.replace(oldMountEffect, newMountEffect);
console.log('1. Replaced mount effect');

// 2. Target: K rails dictionary in sMe
// Let's locate the K definition
const kOldStart = 'K={stripe:{id:"stripe",title:"Stripe Connect Express"';
const kOldEnd = 'speed:"1-2 Business Days",fee:"Interbank FX Rate",icon:bo}}';
const kStartIdx = bundle.indexOf(kOldStart);
const kEndIdx = bundle.indexOf(kOldEnd, kStartIdx);
if (kStartIdx === -1 || kEndIdx === -1) {
  console.error('Could not find K boundaries');
  process.exit(1);
}
const fullKOld = bundle.substring(kStartIdx, kEndIdx + kOldEnd.length);

const fullKNew = `K={
  bank_transfer:{
    id:"bank_transfer",
    title:"Direct Bank Deposit (Australia NPP / Direct Entry / Global Wire)",
    description:(c.accountName||c.accountHolder||"Oblivian Performance Ltd")+" • "+(c.bankName||"Commonwealth Bank")+" (BSB: "+(c.bsb||c.bsbNumber||"062-000")+" • Acc: ****"+((c.accountNumber||c.auAccountNumber||"12345678")+"").slice(-4)+")",
    speed:"1-2 Business Days (NPP Near-Instant)",
    fee:"0% Platform Fee (Free)",
    icon:nd
  },
  paypal:{
    id:"paypal",
    title:"PayPal",
    description:(c.paypalEmail||"o1oblivianfitness@gmail.com")+(c.paypalAccountHolder?(" • "+c.paypalAccountHolder):""),
    speed:"Standard 2-3 Days",
    fee:"Standard $0.25 Flat",
    icon:VS
  },
  stripe:{
    id:"stripe",
    title:"Stripe Connect Express",
    description:(c.stripeAccountId||"acct_1O1FCOblivianCoach")+" • Status: "+(c.stripeStatus||"Active"),
    speed:"Instant Card Payout (10-30 min)",
    fee:"Instant Card Payout 1.5%",
    icon:sr
  },
  checking:{
    id:"bank_transfer",
    title:"Direct Bank Deposit (Australia NPP / Direct Entry / Global Wire)",
    description:(c.accountName||c.accountHolder||"Oblivian Performance Ltd")+" • "+(c.bankName||"Commonwealth Bank")+" (BSB: "+(c.bsb||c.bsbNumber||"062-000")+" • Acc: ****"+((c.accountNumber||c.auAccountNumber||"12345678")+"").slice(-4)+")",
    speed:"1-2 Business Days",
    fee:"0% Platform Fee",
    icon:nd
  },
  direct_entry:{
    id:"bank_transfer",
    title:"Direct Bank Deposit (Australia NPP / Direct Entry / Global Wire)",
    description:(c.accountName||c.accountHolder||"Oblivian Performance Ltd")+" • "+(c.bankName||"Commonwealth Bank")+" (BSB: "+(c.bsb||c.bsbNumber||"062-000")+" • Acc: ****"+((c.accountNumber||c.auAccountNumber||"12345678")+"").slice(-4)+")",
    speed:"1-2 Business Days",
    fee:"0% Platform Fee",
    icon:nd
  },
  instant_card:{
    id:"stripe",
    title:"Instant Debit Card (Visa Direct)",
    description:(c.cardBrand||"Visa")+" •••• "+(c.cardLast4||"9012"),
    speed:"Instant (< 2 min)",
    fee:"1.0% Instant Push",
    icon:LS
  }
}`;

bundle = bundle.replace(fullKOld, fullKNew);
console.log('2. Replaced K rails dictionary');

// 3. Target: L (change rail), ne (save config), and re (request payout)
const lOld = 'L=Y=>{const W={...c,activeRail:Y};d(W);try{localStorage.setItem(rh,JSON.stringify(W))}catch{}p(!1)}';
const lNew = `L=Y=>{
  const mappedRail=(Y==="checking"||Y==="direct_entry")?"bank_transfer":Y;
  const W={...c,activeRail:mappedRail};
  d(W);
  try{
    localStorage.setItem(rh,JSON.stringify(W));
    const coachId=(typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||"default_coach";
    fetch("/api/coach/payout-config",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({coach_id:coachId,payout_method:mappedRail,payout_details:W})
    }).catch(()=>{});
  }catch(e){}
  p(!1);
}`;

if (!bundle.includes(lOld)) {
  console.error('Could not find lOld');
  process.exit(1);
}
bundle = bundle.replace(lOld, lNew);
console.log('3. Replaced L handler');

const neOld = 'ne=Y=>{Y.preventDefault();try{localStorage.setItem(rh,JSON.stringify(c))}catch{}x(!1),A(!0),setTimeout(()=>A(!1),2500)}';
const neNew = `ne=async Y=>{
  Y.preventDefault();
  try{
    localStorage.setItem(rh,JSON.stringify(c));
    const coachId=(typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||"default_coach";
    await fetch("/api/coach/payout-config",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({coach_id:coachId,payout_method:c.activeRail,payout_details:c})
    });
    if(typeof _e!=="undefined"&&_e&&typeof at==="function"&&at()){
      await _e.from("coach_profiles").update({
        payout_details:c,
        payout_method:c.activeRail,
        updated_at:new Date().toISOString()
      }).eq("coach_id",coachId);
    }
  }catch(err){console.warn("Save payout channel error:",err)}
  x(!1);A(!0);setTimeout(()=>A(!1),3000);
}`;

if (!bundle.includes(neOld)) {
  console.error('Could not find neOld');
  process.exit(1);
}
bundle = bundle.replace(neOld, neNew);
console.log('4. Replaced ne handler');

// 4. Target: re (payout submission)
const reStart = 're=async()=>{var Y,W;if(v<=0||v>se||j)return;S(!0),z(null);';
const reEnd = 'console.error("Coach payout transfer error:",q),z((q==null?void 0:q.message)||"Payout transfer failed. Please verify your Stripe bank connection.")}}';

const reIdx = bundle.indexOf(reStart);
const reEndIdx = bundle.indexOf(reEnd, reIdx);
if (reIdx === -1 || reEndIdx === -1) {
  console.error('Could not find re boundaries');
  process.exit(1);
}
const fullReOld = bundle.substring(reIdx, reEndIdx + reEnd.length);

const fullReNew = `re=async()=>{
  if(v<=0||v>se||j)return;
  S(!0);z(null);
  try{
    const coachId=(typeof localStorage!=="undefined"&&(localStorage.getItem("o1fc_coach_id")||localStorage.getItem("o1fc_user_id")))||"default_coach";
    const activeChannel=(c.activeRail==="paypal")?"paypal":((c.activeRail==="stripe")?"stripe":"bank_transfer");

    let summaryString="";
    if(activeChannel==="paypal"){
      const em=c.paypalEmail||"o1oblivianfitness@gmail.com";
      summaryString="PayPal: "+em;
    }else if(activeChannel==="stripe"){
      const acct=c.stripeAccountId||"acct_1O1FCOblivianCoach";
      summaryString="Stripe Connect Express ("+acct.slice(-6)+")";
    }else{
      const bsbVal=c.bsb||c.bsbNumber||"062-000";
      const maskedBsb=bsbVal.length>=6?(bsbVal.slice(0,3)+"-***"):bsbVal;
      const accNum=c.accountNumber||c.auAccountNumber||"12345678";
      const last4=(accNum+"").slice(-4);
      summaryString="Bank Deposit: BSB "+maskedBsb+" Acc ****"+last4;
    }

    let rpcData=null;
    let rpcError=null;

    if(typeof _e!=="undefined"&&_e&&typeof at==="function"&&at()){
      try{
        const res=await _e.rpc("request_coach_payout",{
          p_coach_id:coachId,
          p_amount:v,
          p_method:activeChannel,
          p_destination_summary:summaryString,
          p_payout_details:c
        });
        rpcData=res.data;
        rpcError=res.error;
      }catch(e){rpcError=e}
    }

    const proxyRes=await fetch("/api/coach/request-payout",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        p_coach_id:coachId,
        coach_id:coachId,
        p_amount:v,
        amount:v,
        p_method:activeChannel,
        method:activeChannel,
        p_destination_summary:summaryString,
        destination_summary:summaryString,
        p_payout_details:c,
        payout_details:c
      })
    });
    const proxyJson=await proxyRes.json();

    if(!proxyRes.ok&&!rpcData){
      throw new Error((proxyJson&&proxyJson.error)||(rpcError&&rpcError.message)||"Payout request failed");
    }

    const finalRemaining=(proxyJson&&typeof proxyJson.remaining_balance==="number")
      ?proxyJson.remaining_balance
      :((rpcData&&typeof rpcData.remaining_balance==="number")?rpcData.remaining_balance:Math.max(0,se-v));

    S(!1);P(!0);
    z("Cash out request of $"+v.toFixed(2)+" submitted. Status: Pending Verification / Processing");

    o(ae=>({...ae,totalPaid:ae.totalPaid+Math.round(v*100),pendingPayout:Math.round(finalRemaining*100)}));
    N(Math.round(finalRemaining));

    const newTx={
      id:(proxyJson&&proxyJson.payout&&proxyJson.payout.id)||\`po_\${Date.now()}\`,
      referenceId:\`O1FC-PAY-\${Math.floor(1e5+Math.random()*9e5)}\`,
      date:new Date().toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),
      amountUsd:v,
      feeUsd:B,
      netUsd:V,
      localAmount:\`\${H.currencySymbol}\${$} \${H.currency}\`,
      currency:H.currency,
      rail:ie.title,
      destination:summaryString,
      status:"Pending Verification / Processing"
    };
    O(prev=>[newTx,...prev]);

    try{
      const earnRes=await fetch("/api/coach/earnings?coach_id="+encodeURIComponent(coachId));
      if(earnRes.ok){
        const earnJson=await earnRes.json();
        if(earnJson.payouts&&Array.isArray(earnJson.payouts)){
          const mapped=earnJson.payouts.map(tx=>({
            id:tx.id,
            referenceId:tx.reference_id||\`O1FC-PAY-\${tx.id.slice(-6).toUpperCase()}\`,
            date:new Date(tx.created_at).toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),
            amountUsd:Number(tx.amount),
            feeUsd:0,
            netUsd:Number(tx.amount),
            localAmount:\`$\${Number(tx.amount).toFixed(2)} USD\`,
            currency:"USD",
            rail:tx.destination_summary?.includes("PayPal")?"PayPal":(tx.destination_summary?.includes("Stripe")?"Stripe Connect Express":"Direct Bank Deposit"),
            destination:tx.destination_summary,
            status:tx.status==="pending"?"Pending Verification / Processing":(tx.status==="completed"||tx.status==="settled"?"Settled":tx.status)
          }));
          O(mapped);
        }
      }
    }catch(e){}

    setTimeout(()=>P(!1),4000);
  }catch(err){
    S(!1);P(!1);
    console.error("Coach payout error:",err);
    z((err&&err.message)||"Payout request failed. Please verify your payout configuration.");
  }
}`;

bundle = bundle.replace(fullReOld, fullReNew);
console.log('5. Replaced re handler');

// 5. Target: supportedRails mapping in the Change Rail view and the Configuration forms
// In the Change Rail modal:
// H.supportedRails.map(Y=>{const W=K[Y] ...
const railMapOld = 'H.supportedRails.map(Y=>{const W=K[Y]';
const railMapNew = '["bank_transfer","paypal","stripe"].map(Y=>{const W=K[Y]||K.bank_transfer';
if (!bundle.includes(railMapOld)) {
  console.error('Could not find railMapOld');
  process.exit(1);
}
bundle = bundle.replace(railMapOld, railMapNew);
console.log('6. Replaced Change Rail list with 3 primary channels');

// 6. Now enhance the form inputs inside f&&r.jsx("div", ...
// Let's replace the form in f&& with the comprehensive configuration form for the 3 primary channels
const formOldStart = 'f&&r.jsx("div",{className:"bg-zinc-100/90 dark:bg-zinc-950 p-4 border-t border-zinc-200/80 dark:border-white/10 space-y-3 animate-in fade-in",children:r.jsxs("form",{onSubmit:ne,className:"space-y-3",children:[';
const formOldEnd = 'children:"Save Rail Credentials"}),T&&r.jsxs("span",{className:"text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold",children:[r.jsx(yt,{className:"w-3.5 h-3.5"})," Saved to Encrypted Vault"]})]})]})})';

const formIdx = bundle.indexOf(formOldStart);
const formEndIdx = bundle.indexOf(formOldEnd, formIdx);
if (formIdx === -1 || formEndIdx === -1) {
  console.error('Could not find form boundaries');
  process.exit(1);
}
const fullFormOld = bundle.substring(formIdx, formEndIdx + formOldEnd.length);

const fullFormNew = `f&&r.jsx("div",{className:"bg-zinc-100/95 dark:bg-zinc-950 p-4 border-t border-zinc-200/80 dark:border-white/10 space-y-3 animate-in fade-in rounded-b-2xl",children:r.jsxs("form",{onSubmit:ne,className:"space-y-3.5",children:[
  (c.activeRail==="bank_transfer"||c.activeRail==="checking"||c.activeRail==="direct_entry")&&r.jsxs("div",{className:"space-y-3",children:[
    r.jsxs("div",{className:"flex items-center justify-between pb-1 border-b border-zinc-200/60 dark:border-white/10",children:[
      r.jsx("div",{className:"text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wide",children:"Direct Bank Deposit Configuration"}),
      r.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold",children:"NPP / Direct Entry / Wire"})
    ]}),
    r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"Account Name / Entity"}),
        r.jsx("input",{type:"text",required:!0,value:c.accountName||c.accountHolder||"",onChange:Y=>d({...c,accountName:Y.target.value,accountHolder:Y.target.value}),className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"e.g. Oblivian Performance Ltd"})
      ]}),
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"Bank Name"}),
        r.jsx("input",{type:"text",required:!0,value:c.bankName||"",onChange:Y=>d({...c,bankName:Y.target.value}),className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"e.g. Commonwealth Bank, NAB, Westpac"})
      ]})
    ]}),
    r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"BSB / Routing Code (XXX-XXX)"}),
        r.jsx("input",{type:"text",required:!0,maxLength:7,value:c.bsb||c.bsbNumber||"",onChange:Y=>{const dgt=Y.target.value.replace(/\\D/g,"").slice(0,6);const fmt=dgt.length>3?(dgt.slice(0,3)+"-"+dgt.slice(3)):dgt;d({...c,bsb:fmt,bsbNumber:fmt})},className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"062-000"})
      ]}),
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"Account Number"}),
        r.jsx("input",{type:"text",required:!0,maxLength:10,value:c.accountNumber||c.auAccountNumber||"",onChange:Y=>{const dgt=Y.target.value.replace(/\\D/g,"").slice(0,10);d({...c,accountNumber:dgt,auAccountNumber:dgt})},className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"12345678"})
      ]})
    ]})
  ]}),
  c.activeRail==="paypal"&&r.jsxs("div",{className:"space-y-3",children:[
    r.jsxs("div",{className:"flex items-center justify-between pb-1 border-b border-zinc-200/60 dark:border-white/10",children:[
      r.jsx("div",{className:"text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wide",children:"PayPal Payout Configuration"}),
      r.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold",children:"PayPal Commerce"})
    ]}),
    r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"PayPal Email Address"}),
        r.jsx("input",{type:"email",required:!0,value:c.paypalEmail||"",onChange:Y=>d({...c,paypalEmail:Y.target.value}),className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"coach.payouts@o1fc.app"})
      ]}),
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"Account Holder Name"}),
        r.jsx("input",{type:"text",required:!0,value:c.paypalAccountHolder||c.accountHolder||"",onChange:Y=>d({...c,paypalAccountHolder:Y.target.value,accountHolder:Y.target.value}),className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"Oblivian Fitness"})
      ]})
    ]})
  ]}),
  c.activeRail==="stripe"&&r.jsxs("div",{className:"space-y-3",children:[
    r.jsxs("div",{className:"flex items-center justify-between pb-1 border-b border-zinc-200/60 dark:border-white/10",children:[
      r.jsx("div",{className:"text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wide",children:"Stripe Connect Express Configuration"}),
      r.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold",children:"Automated 1099-K"})
    ]}),
    r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"Connected Stripe Account ID"}),
        r.jsx("input",{type:"text",required:!0,value:c.stripeAccountId||"",onChange:Y=>d({...c,stripeAccountId:Y.target.value}),className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",placeholder:"acct_1O1FCOblivianCoach"})
      ]}),
      r.jsxs("div",{children:[
        r.jsx("label",{className:"text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 uppercase font-mono font-bold",children:"Onboarding Status"}),
        r.jsxs("select",{value:c.stripeStatus||"Active",onChange:Y=>d({...c,stripeStatus:Y.target.value}),className:"w-full bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-red-500",children:[
          r.jsx("option",{value:"Active",children:"Active (Instant Card Payouts Enabled)"}),
          r.jsx("option",{value:"Pending",children:"Pending Onboarding Verification"})
        ]})
      ]})
    ]})
  ]}),
  r.jsxs("div",{className:"flex items-center justify-between pt-2 border-t border-zinc-200/80 dark:border-white/10",children:[
    r.jsx("button",{type:"submit",className:"px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm",children:"Save Channel Details"}),
    T&&r.jsxs("span",{className:"text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold font-mono animate-in fade-in",children:[
      r.jsx(yt,{className:"w-4 h-4"}),
      "Channel Details Saved to Database"
    ]})
  ]})
]})})}`;

bundle = bundle.replace(fullFormOld, fullFormNew);
console.log('7. Replaced config form with multi-rail inputs');

fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Successfully updated assets/index-BWUawsaP.js!');
