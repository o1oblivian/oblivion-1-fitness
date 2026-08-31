let ctx: AudioContext | null = null;
let activeNodes: AudioNode[] = [];
let activeSourceNodes: (AudioBufferSourceNode | OscillatorNode)[] = [];
let currentSound: string | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function createNoise(audioCtx: AudioContext, seconds = 4): AudioBuffer {
  const sr = audioCtx.sampleRate;
  const len = sr * seconds;
  const buf = audioCtx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function loopNoise(audioCtx: AudioContext, buffer: AudioBuffer, gain: GainNode): AudioBufferSourceNode {
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(gain);
  src.start();
  return src;
}

function startRain(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);

  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 800;
  bp.Q.value = 0.4;

  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 300;

  const g = audioCtx.createGain();
  g.gain.value = 0.35;

  const src = loopNoise(audioCtx, noise, bp);
  bp.connect(hp);
  hp.connect(g);
  g.connect(master);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  lfoGain.connect(bp.frequency);
  lfo.start();

  activeSourceNodes.push(src, lfo);
  activeNodes.push(bp, hp, g, lfoGain);
}

function startOcean(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);

  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  lp.Q.value = 1;

  const g = audioCtx.createGain();
  g.gain.value = 0.4;

  const src = loopNoise(audioCtx, noise, lp);
  lp.connect(g);
  g.connect(master);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 400;
  lfo.connect(lfoGain);
  lfoGain.connect(lp.frequency);
  lfo.start();

  const volLfo = audioCtx.createOscillator();
  const volLfoGain = audioCtx.createGain();
  volLfo.frequency.value = 0.08;
  volLfoGain.gain.value = 0.15;
  volLfo.connect(volLfoGain);
  volLfoGain.connect(g.gain);
  volLfo.start();

  activeSourceNodes.push(src, lfo, volLfo);
  activeNodes.push(lp, g, lfoGain, volLfoGain);
}

function startForest(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);

  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200;
  bp.Q.value = 0.6;

  const g = audioCtx.createGain();
  g.gain.value = 0.12;

  const src = loopNoise(audioCtx, noise, bp);
  bp.connect(g);
  g.connect(master);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.25;
  lfoGain.gain.value = 600;
  lfo.connect(lfoGain);
  lfoGain.connect(bp.frequency);
  lfo.start();

  // low wind layer
  const windBp = audioCtx.createBiquadFilter();
  windBp.type = 'lowpass';
  windBp.frequency.value = 250;
  const windG = audioCtx.createGain();
  windG.gain.value = 0.18;
  const windSrc = loopNoise(audioCtx, noise, windBp);
  windBp.connect(windG);
  windG.connect(master);

  activeSourceNodes.push(src, lfo, windSrc);
  activeNodes.push(bp, g, lfoGain, windBp, windG);
}

function startBowls(audioCtx: AudioContext, master: GainNode) {
  const freqs = [261.6, 392, 523.25, 659.25];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const g = audioCtx.createGain();
    g.gain.value = 0.06;

    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.3 + i * 0.1;
    lfoG.gain.value = 0.04;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();

    const tremolo = audioCtx.createOscillator();
    const tremoloG = audioCtx.createGain();
    tremolo.frequency.value = 3 + i;
    tremoloG.gain.value = f * 0.003;
    tremolo.connect(tremoloG);
    tremoloG.connect(osc.frequency);
    tremolo.start();

    osc.connect(g);
    g.connect(master);
    osc.start();

    activeSourceNodes.push(osc, lfo, tremolo);
    activeNodes.push(g, lfoG, tremoloG);
  });
}

function startTheta(audioCtx: AudioContext, master: GainNode) {
  // Theta binaural: base 200Hz, beat ~6Hz
  const oscL = audioCtx.createOscillator();
  oscL.type = 'sine';
  oscL.frequency.value = 200;

  const oscR = audioCtx.createOscillator();
  oscR.type = 'sine';
  oscR.frequency.value = 206;

  const merger = audioCtx.createChannelMerger(2);
  const g = audioCtx.createGain();
  g.gain.value = 0.18;

  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(g);
  g.connect(master);

  oscL.start();
  oscR.start();

  // soft pad layer
  const pad = audioCtx.createOscillator();
  pad.type = 'sine';
  pad.frequency.value = 100;
  const padG = audioCtx.createGain();
  padG.gain.value = 0.06;
  pad.connect(padG);
  padG.connect(master);
  pad.start();

  activeSourceNodes.push(oscL, oscR, pad);
  activeNodes.push(merger, g, padG);
}

function startTibetanBowls(audioCtx: AudioContext, master: GainNode) {
  const freqs = [174, 261.6, 349.2, 523.25];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = audioCtx.createGain();
    g.gain.value = 0.05;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.15 + i * 0.05;
    lfoG.gain.value = 0.035;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, lfo);
    activeNodes.push(g, lfoG);
  });
}

function startSitar(audioCtx: AudioContext, master: GainNode) {
  const freqs = [130.81, 196, 261.6, 329.63];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2;
    bp.Q.value = 8;
    const g = audioCtx.createGain();
    g.gain.value = 0.025;
    const vib = audioCtx.createOscillator();
    const vibG = audioCtx.createGain();
    vib.frequency.value = 5 + i;
    vibG.gain.value = f * 0.008;
    vib.connect(vibG);
    vibG.connect(osc.frequency);
    vib.start();
    osc.connect(bp);
    bp.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, vib);
    activeNodes.push(bp, g, vibG);
  });
}

function startTanpura(audioCtx: AudioContext, master: GainNode) {
  const freqs = [130.81, 196, 261.6];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = f * 1.002;
    const g = audioCtx.createGain();
    g.gain.value = 0.04;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.1 + i * 0.03;
    lfoG.gain.value = 0.025;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(g);
    osc2.connect(g);
    g.connect(master);
    osc.start();
    osc2.start();
    activeSourceNodes.push(osc, osc2, lfo);
    activeNodes.push(g, lfoG);
  });
}

function startKoto(audioCtx: AudioContext, master: GainNode) {
  const freqs = [293.66, 329.63, 392, 440, 523.25];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 3;
    bp.Q.value = 5;
    const g = audioCtx.createGain();
    g.gain.value = 0.03;
    const trem = audioCtx.createOscillator();
    const tremG = audioCtx.createGain();
    trem.frequency.value = 0.2 + i * 0.08;
    tremG.gain.value = 0.02;
    trem.connect(tremG);
    tremG.connect(g.gain);
    trem.start();
    osc.connect(bp);
    bp.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, trem);
    activeNodes.push(bp, g, tremG);
  });
}

function startZenGarden(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3000;
  bp.Q.value = 1.5;
  const g = audioCtx.createGain();
  g.gain.value = 0.06;
  const src = loopNoise(audioCtx, noise, bp);
  bp.connect(g);
  g.connect(master);
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.12;
  lfoG.gain.value = 1500;
  lfo.connect(lfoG);
  lfoG.connect(bp.frequency);
  lfo.start();
  const bell = audioCtx.createOscillator();
  bell.type = 'sine';
  bell.frequency.value = 880;
  const bellG = audioCtx.createGain();
  bellG.gain.value = 0.02;
  const bellLfo = audioCtx.createOscillator();
  const bellLfoG = audioCtx.createGain();
  bellLfo.frequency.value = 0.08;
  bellLfoG.gain.value = 0.018;
  bellLfo.connect(bellLfoG);
  bellLfoG.connect(bellG.gain);
  bellLfo.start();
  bell.connect(bellG);
  bellG.connect(master);
  bell.start();
  activeSourceNodes.push(src, lfo, bell, bellLfo);
  activeNodes.push(bp, g, lfoG, bellG, bellLfoG);
}

function startOm(audioCtx: AudioContext, master: GainNode) {
  const base = 136.1;
  [1, 2, 3].forEach((h, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base * h;
    const g = audioCtx.createGain();
    g.gain.value = 0.07 / h;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.05 + i * 0.02;
    lfoG.gain.value = 0.03 / h;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, lfo);
    activeNodes.push(g, lfoG);
  });
}

function startCrickets(audioCtx: AudioContext, master: GainNode) {
  [4200, 5800, 6500].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = audioCtx.createGain();
    g.gain.value = 0;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 8 + i * 3;
    lfoG.gain.value = 0.04;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, lfo);
    activeNodes.push(g, lfoG);
  });
  const noise = createNoise(audioCtx, 4);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 200;
  const ng = audioCtx.createGain();
  ng.gain.value = 0.1;
  const nsrc = loopNoise(audioCtx, noise, lp);
  lp.connect(ng);
  ng.connect(master);
  activeSourceNodes.push(nsrc);
  activeNodes.push(lp, ng);
}

function startStream(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 600;
  const g = audioCtx.createGain();
  g.gain.value = 0.2;
  const src = loopNoise(audioCtx, noise, bp);
  bp.connect(hp);
  hp.connect(g);
  g.connect(master);
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.3;
  lfoG.gain.value = 500;
  lfo.connect(lfoG);
  lfoG.connect(bp.frequency);
  lfo.start();
  activeSourceNodes.push(src, lfo);
  activeNodes.push(bp, hp, g, lfoG);
}

function startWind(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 350;
  lp.Q.value = 0.5;
  const g = audioCtx.createGain();
  g.gain.value = 0.3;
  const src = loopNoise(audioCtx, noise, lp);
  lp.connect(g);
  g.connect(master);
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.06;
  lfoG.gain.value = 200;
  lfo.connect(lfoG);
  lfoG.connect(lp.frequency);
  lfo.start();
  activeSourceNodes.push(src, lfo);
  activeNodes.push(lp, g, lfoG);
}

function startFireplace(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600;
  bp.Q.value = 0.3;
  const g = audioCtx.createGain();
  g.gain.value = 0.25;
  const src = loopNoise(audioCtx, noise, bp);
  bp.connect(g);
  g.connect(master);
  const crackle = audioCtx.createBiquadFilter();
  crackle.type = 'highpass';
  crackle.frequency.value = 4000;
  const cg = audioCtx.createGain();
  cg.gain.value = 0.08;
  const csrc = loopNoise(audioCtx, noise, crackle);
  crackle.connect(cg);
  cg.connect(master);
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.4;
  lfoG.gain.value = 300;
  lfo.connect(lfoG);
  lfoG.connect(bp.frequency);
  lfo.start();
  activeSourceNodes.push(src, csrc, lfo);
  activeNodes.push(bp, g, crackle, cg, lfoG);
}

function startDelta(audioCtx: AudioContext, master: GainNode) {
  const oscL = audioCtx.createOscillator();
  oscL.type = 'sine';
  oscL.frequency.value = 150;
  const oscR = audioCtx.createOscillator();
  oscR.type = 'sine';
  oscR.frequency.value = 152;
  const merger = audioCtx.createChannelMerger(2);
  const g = audioCtx.createGain();
  g.gain.value = 0.16;
  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(g);
  g.connect(master);
  oscL.start();
  oscR.start();
  const pad = audioCtx.createOscillator();
  pad.type = 'sine';
  pad.frequency.value = 75;
  const padG = audioCtx.createGain();
  padG.gain.value = 0.05;
  pad.connect(padG);
  padG.connect(master);
  pad.start();
  activeSourceNodes.push(oscL, oscR, pad);
  activeNodes.push(merger, g, padG);
}

function startAlpha(audioCtx: AudioContext, master: GainNode) {
  const oscL = audioCtx.createOscillator();
  oscL.type = 'sine';
  oscL.frequency.value = 220;
  const oscR = audioCtx.createOscillator();
  oscR.type = 'sine';
  oscR.frequency.value = 230;
  const merger = audioCtx.createChannelMerger(2);
  const g = audioCtx.createGain();
  g.gain.value = 0.15;
  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(g);
  g.connect(master);
  oscL.start();
  oscR.start();
  activeSourceNodes.push(oscL, oscR);
  activeNodes.push(merger, g);
}

function startChakra(audioCtx: AudioContext, master: GainNode) {
  const freqs = [256, 288, 320, 341.3, 384, 426.7, 480];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = audioCtx.createGain();
    g.gain.value = 0;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.06 + i * 0.01;
    lfoG.gain.value = 0.03;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, lfo);
    activeNodes.push(g, lfoG);
  });
}

function startWhiteNoise(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const g = audioCtx.createGain();
  g.gain.value = 0.15;
  const src = loopNoise(audioCtx, noise, g);
  g.connect(master);
  activeSourceNodes.push(src);
  activeNodes.push(g);
}

function startPinkNoise(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1000;
  const g = audioCtx.createGain();
  g.gain.value = 0.22;
  const src = loopNoise(audioCtx, noise, lp);
  lp.connect(g);
  g.connect(master);
  activeSourceNodes.push(src);
  activeNodes.push(lp, g);
}

function startBrownNoise(audioCtx: AudioContext, master: GainNode) {
  const noise = createNoise(audioCtx, 4);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const g = audioCtx.createGain();
  g.gain.value = 0.35;
  const src = loopNoise(audioCtx, noise, lp);
  lp.connect(g);
  g.connect(master);
  activeSourceNodes.push(src);
  activeNodes.push(lp, g);
}

function startTempleBell(audioCtx: AudioContext, master: GainNode) {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = audioCtx.createGain();
    g.gain.value = 0.04;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.07 + i * 0.03;
    lfoG.gain.value = 0.03;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, lfo);
    activeNodes.push(g, lfoG);
  });
}

function startDrone(audioCtx: AudioContext, master: GainNode) {
  [65.41, 98.0, 130.81].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = f * 2;
    lp.Q.value = 2;
    const g = audioCtx.createGain();
    g.gain.value = 0.03;
    const lfo = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfo.frequency.value = 0.04 + i * 0.01;
    lfoG.gain.value = 0.015;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    osc.connect(lp);
    lp.connect(g);
    g.connect(master);
    osc.start();
    activeSourceNodes.push(osc, lfo);
    activeNodes.push(lp, g, lfoG);
  });
}

function startGamelan(audioCtx: AudioContext, master: GainNode) {
  const freqs = [277.18, 311.13, 369.99, 415.3, 493.88];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = f * 1.005;
    const g = audioCtx.createGain();
    g.gain.value = 0.03;
    const trem = audioCtx.createOscillator();
    const tremG = audioCtx.createGain();
    trem.frequency.value = 0.15 + i * 0.05;
    tremG.gain.value = 0.02;
    trem.connect(tremG);
    tremG.connect(g.gain);
    trem.start();
    osc.connect(g);
    osc2.connect(g);
    g.connect(master);
    osc.start();
    osc2.start();
    activeSourceNodes.push(osc, osc2, trem);
    activeNodes.push(g, tremG);
  });
}

function startThunderstorm(audioCtx: AudioContext, master: GainNode) {
  startRain(audioCtx, master);
  const noise = createNoise(audioCtx, 4);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 80;
  const g = audioCtx.createGain();
  g.gain.value = 0;
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.03;
  lfoG.gain.value = 0.25;
  lfo.connect(lfoG);
  lfoG.connect(g.gain);
  lfo.start();
  const src = loopNoise(audioCtx, noise, lp);
  lp.connect(g);
  g.connect(master);
  activeSourceNodes.push(src, lfo);
  activeNodes.push(lp, g, lfoG);
}

const soundMap: Record<string, (ctx: AudioContext, master: GainNode) => void> = {
  rain: startRain,
  ocean: startOcean,
  forest: startForest,
  bowls: startBowls,
  theta: startTheta,
  'tibetan-bowls': startTibetanBowls,
  sitar: startSitar,
  tanpura: startTanpura,
  koto: startKoto,
  'zen-garden': startZenGarden,
  om: startOm,
  crickets: startCrickets,
  stream: startStream,
  wind: startWind,
  fireplace: startFireplace,
  delta: startDelta,
  alpha: startAlpha,
  chakra: startChakra,
  'white-noise': startWhiteNoise,
  'pink-noise': startPinkNoise,
  'brown-noise': startBrownNoise,
  'temple-bell': startTempleBell,
  drone: startDrone,
  gamelan: startGamelan,
  thunderstorm: startThunderstorm,
};

export function startAmbientSound(soundId: string) {
  stopAmbientSound();
  if (soundId === 'silence') { currentSound = 'silence'; return; }

  try {
    const audioCtx = getCtx();
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0, audioCtx.currentTime);
    master.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 2);
    master.connect(audioCtx.destination);
    activeNodes.push(master);

    const starter = soundMap[soundId];
    if (starter) starter(audioCtx, master);
    else startRain(audioCtx, master);

    currentSound = soundId;
  } catch {
    // silent fallback
  }
}

export function stopAmbientSound() {
  const nodesToStop = activeSourceNodes;
  const nodesToDisconnect = activeNodes;
  activeSourceNodes = [];
  activeNodes = [];

  try {
    if (ctx) {
      const master = nodesToDisconnect.find(n => n instanceof GainNode) as GainNode | undefined;
      if (master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      }
    }
    setTimeout(() => {
      nodesToStop.forEach(n => { try { n.stop(); } catch {} try { n.disconnect(); } catch {} });
      nodesToDisconnect.forEach(n => { try { n.disconnect(); } catch {} });
    }, 600);
  } catch {
    nodesToStop.forEach(n => { try { n.stop(); } catch {} try { n.disconnect(); } catch {} });
    nodesToDisconnect.forEach(n => { try { n.disconnect(); } catch {} });
  }
  currentSound = null;
}

export function isPlaying(): boolean {
  return currentSound !== null;
}
