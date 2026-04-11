const getCtx = () => {
  if (!window._ac) window._ac = new (window.AudioContext || window.webkitAudioContext)();
  return window._ac;
};
function tone(freq, type, dur, vol = 0.25, delay = 0) {
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = ac.currentTime + delay;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur);
  } catch {}
}
export const sfx = {
  click:    () => tone(900,  "sine",    .05, .12),
  success:  () => { [523,659,784].forEach((f,i) => tone(f,"sine",.15,.2,i*.1)); },
  complete: () => { [523,659,784,1047].forEach((f,i) => tone(f,"sine",.2,.25,i*.1)); },
  error:    () => tone(220, "sawtooth", .25, .18),
  xp:       () => { tone(880,"sine",.1,.15); tone(1100,"sine",.15,.15,.09); },
  notify:   () => { tone(440,"sine",.12,.18); tone(550,"sine",.12,.18,.13); },
  levelUp:  () => [262,330,392,523,659,784,1047].forEach((f,i)=>tone(f,"sine",.2,.25,i*.08)),
  badge:    () => [523,784,1047].forEach((f,i)=>tone(f,"triangle",.2,.2,i*.12)),
  tick:     () => tone(1400,"square",.025,.07),
  pop:      () => tone(660,"sine",.08,.2),
};
export const useSfx = () => sfx;
