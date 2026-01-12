// Code by Nguyen Trong Tin for Catpuchino group project
// p5.js sketch: Turbulence

// =====================================================
// Configuration
// =====================================================
const CONFIG = {
  canvas: {
    bg: 'black',
    cl: 'white',
    sw: 2,
    cr: 650 // boundary circle diameter
  },
  stars: {
    count: 2000,
    noiseStep: 0.02
  },
  audio: {
    volumes: {
      ambient: 0.4,
      tone: 0.8,
      slide: 1.0,
      blip: 0.6,
      breathe: 0.1,
      jumpscare: 0.7,
      resize: 0.1,
      space2: 0.5
    },
    intervals: {
      breathe: { min: 5000, max: 10000 },
      jumpscare: { min: 120000, max: 180000 },
      space2: 120000
    },
    paths: {
      ambient: 'storm.wav',
      tone: 'track4_tone12.wav',
      slide: 'slide.wav',
      blipSelect2tin: 'blipSelect2tin.wav',
      breathe: 'breathe.wav',
      jumpscare: 'jumpscare.wav',
      increase: 'increase.wav',
      decrease: 'decrease.wav',
      space2: 'space2.wav'
    }
  }
};

// Legacy ASSETS object (mapped from CONFIG for compatibility)
const ASSETS = {
  ambient: CONFIG.audio.paths.ambient,
  tone: CONFIG.audio.paths.tone,
  slide: CONFIG.audio.paths.slide,
  blipSelect2tin: CONFIG.audio.paths.blipSelect2tin,
  breathe: CONFIG.audio.paths.breathe,
  jumpscare: CONFIG.audio.paths.jumpscare,
  increase: CONFIG.audio.paths.increase,
  decrease: CONFIG.audio.paths.decrease,
  space2: CONFIG.audio.paths.space2,
};

// Constants mapped from CONFIG for backward compatibility
const NUM_STARS = CONFIG.stars.count;
const NOISE_STEP = CONFIG.stars.noiseStep;
const VOLUME_AMBIENT = CONFIG.audio.volumes.ambient;
const VOLUME_TONE = CONFIG.audio.volumes.tone;
const VOLUME_SLIDE = CONFIG.audio.volumes.slide;
const VOLUME_BLIP = CONFIG.audio.volumes.blip;
const VOLUME_BREATHE = CONFIG.audio.volumes.breathe;
const VOLUME_JUMPSCARE = CONFIG.audio.volumes.jumpscare;
const VOLUME_RESIZE = CONFIG.audio.volumes.resize;
const VOLUME_SPACE2 = CONFIG.audio.volumes.space2;

let bg = CONFIG.canvas.bg;
let cl = CONFIG.canvas.cl;
let sw = CONFIG.canvas.sw;
let cr = CONFIG.canvas.cr; // boundary circle diameter
let stars = [];

let dancers = []; // orbiting circles
let center = { x: 0, y: 0, vx: 0, vy: 0 }; // moving orbit center
let noiseX = 0, noiseY = 0; // Perlin noise seeds
let starBuffer; // off-screen graphics buffer for stars (render once)

let canvasRadiusX = 0, canvasRadiusY = 0; // cached canvas center
let maxBoundaryDist = 0; // inner boundary radius minus margin
let circleRadius = 0; // cached circle radius (cr / 2)

// ------------------------------------------------------------
// Simple sound handling
// ------------------------------------------------------------
const S = {}; // p5.SoundFile instances loaded in preload()
const Sound = { started: false, muted: false };

function updateSoundButton() { //aided by Copilot
  const btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = `Sound: ${!Sound.muted ? 'On' : 'Off'}`;
}

function playSound(name, volume = 1, loop = false) {
  const snd = S[name];
  if (!snd || !Sound.started || Sound.muted) return;
  try {
    if (loop) {
      if (!snd.isPlaying()) {
        snd.setLoop(true);
        snd.setVolume(volume);
        snd.play();
      }
    } else {
      if (snd.isPlaying()) snd.stop();
      snd.setLoop(false);
      snd.setVolume(volume);
      snd.play();
    }
  } catch (e) {
    console.warn('Sound play failed:', name, e);
  }
}

function stopSound(name) {
  const snd = S[name];
  try { if (snd && snd.isPlaying()) snd.stop(); } catch (e) {}
}

function stopAllSounds() {
  Object.keys(S).forEach(k => stopSound(k));
}

function startAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') ctx.resume();
    Sound.started = true;
    Sound.muted = false;
    playSound('ambient', VOLUME_AMBIENT, true);
    updateSoundButton();
  } catch (e) {
    console.warn('startAudio failed:', e);
  }
}

// ------------------------------------------------------------
// Orbiter class
// ------------------------------------------------------------
class Orbiter { //partialy aided by Copilot
  constructor(orbitRadius, speed, startAngle) {
    this.orbitRadius = orbitRadius;
    this.speed = speed; // radians per frame
    this.angle = startAngle; // current angle position
    this.maxTrail = floor(random(7, 12)); // trail length
    this.trail = new Array(this.maxTrail); // pre-allocate array
    this.trailIndex = 0; // circular buffer index
    this.trailCount = 0; // track how many points added
  }

  draw(cx, cy) {
    const x = cx + cos(this.angle) * this.orbitRadius;
    const y = cy + sin(this.angle) * this.orbitRadius;
    
    // Add to circular buffer
    this.trail[this.trailIndex] = {x, y};
    this.trailIndex = (this.trailIndex + 1) % this.maxTrail;
    if (this.trailCount < this.maxTrail) this.trailCount++;

    stroke(cl);
    strokeWeight(sw);
    noFill();
    beginShape();
    
    // Draw from oldest to newest
    const startIdx = this.trailCount < this.maxTrail ? 0 : this.trailIndex;
    for (let i = 0; i < this.trailCount; i++) {
      const idx = (startIdx + i) % this.maxTrail;
      const p = this.trail[idx];
      vertex(p.x, p.y);
    }
    
    endShape();

    this.angle += this.speed;
  }
}

// ------------------------------------------------------------
// p5 lifecycle
// ------------------------------------------------------------

function preload() {
  try {
    soundFormats('mp3', 'wav');
    const P = CONFIG.audio.paths;
    S.ambient = loadSound(P.ambient);
    S.tone = loadSound(P.tone);
    S.slide = loadSound(P.slide);
    S.blip = loadSound(P.blipSelect2tin);
    S.breathe = loadSound(P.breathe);
    S.jumpscare = loadSound(P.jumpscare);
    S.increase = loadSound(P.increase);
    S.decrease = loadSound(P.decrease);
    S.space2 = loadSound(P.space2);
  } catch (e) {
    console.warn('Preload sound error:', e);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(bg);
  initStars();

  canvasRadiusX = width / 2;
  canvasRadiusY = height / 2;
  circleRadius = cr / 2; // cache circle radius calculation
  maxBoundaryDist = cr / 2 - 200; // inner radius for center movement

  // Init center + noise seeds
  center.x = canvasRadiusX;
  center.y = canvasRadiusY;
  noiseX = random(1000);
  noiseY = random(1000);

  // Spawn orbiters
  const count = floor(random(17, 20));
  for (let i = 0; i < count; i++) {
    dancers.push(new Orbiter(
      random(40, 200),
      random(0.1, 0.3),
      random(TWO_PI)
    ));
  }

  // Pre-render starfield to off-screen buffer (performance optimization)
  refreshStarBuffer();
  
  // NOTE: Circle is drawn in draw() loop to respond to cr changes

  // Start random breathe sound schedule
  scheduleBreatheSounds();
  // Start random jumpscare schedule (roughly every 2–3 minutes)
  scheduleJumpscareSound();
  // Start space2 background schedule (every 30 seconds)
  scheduleSpace2Sound();
}

// Handle window resizing - update canvas and recalculate circle position
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Update cached canvas center
  canvasRadiusX = width / 2;
  canvasRadiusY = height / 2;
  
  // Recalculate boundary constraints
  maxBoundaryDist = cr / 2 - 200;
  
  // Center the orbit center to new canvas center
  center.x = canvasRadiusX;
  center.y = canvasRadiusY;
  
  // Regenerate stars for new canvas size
  initStars();
  refreshStarBuffer();
  
  // NOTE: Circle is drawn in draw() loop to respond to cr changes
}

// Schedule breathe.wav at random intervals (5–10 seconds)
function scheduleBreatheSounds() {
  function tick() {
    if (Sound.started && !Sound.muted && S.breathe) {
      try {
        if (S.breathe.isPlaying()) S.breathe.stop();
        S.breathe.setVolume(VOLUME_BREATHE);
        S.breathe.play();
      } catch (e) { console.warn('Failed to play breathe:', e); }
    }
    const next = random(CONFIG.audio.intervals.breathe.min, CONFIG.audio.intervals.breathe.max);
    setTimeout(tick, next);
  }
  const first = random(CONFIG.audio.intervals.breathe.min, CONFIG.audio.intervals.breathe.max);
  setTimeout(tick, first);
}

// Schedule jumpscare.wav at random intervals (~2–3 minutes)
function scheduleJumpscareSound() {
  function tick() {
    if (Sound.started && !Sound.muted && S.jumpscare) {
      try {
        if (S.jumpscare.isPlaying()) S.jumpscare.stop();
        S.jumpscare.setVolume(VOLUME_JUMPSCARE);
        S.jumpscare.play();
      } catch (e) { console.warn('Failed to play jumpscare:', e); }
    }
    const next = floor(random(CONFIG.audio.intervals.jumpscare.min, CONFIG.audio.intervals.jumpscare.max));
    setTimeout(tick, next);
  }
  const first = floor(random(CONFIG.audio.intervals.jumpscare.min, CONFIG.audio.intervals.jumpscare.max));
  setTimeout(tick, first);
}

// Schedule space2.wav every 120 seconds unless tone or jumpscare is playing
function scheduleSpace2Sound() {
  setInterval(() => {
    const tonePlaying = S.tone && S.tone.isPlaying();
    const jumpPlaying = S.jumpscare && S.jumpscare.isPlaying();
    if (Sound.started && !Sound.muted && S.space2 && !tonePlaying && !jumpPlaying) {
      try {
        if (S.space2.isPlaying()) S.space2.stop();
        S.space2.setVolume(VOLUME_SPACE2);
        S.space2.play();
      } catch (e) { console.warn('Failed to play space2:', e); }
    }
  }, CONFIG.audio.intervals.space2);
}
// ======================
// STARS
// ======================
function initStars() { //Shared by Trang
  const centerX = width / 2;
  const centerY = height / 2;
  // Calculate max distance from center to any corner of canvas
  const maxDistance = dist(centerX, centerY, 0, 0);
  const circleRadiusSq = (cr / 2) * (cr / 2); // Pre-calculate circle radius squared

  stars = []; // Reset array
  let starCount = 0;

  // Generate stars until we have NUM_STARS outside the circle
  while (starCount < NUM_STARS) {
    const x = random(width);
    const y = random(height);

    // Skip if star is inside the circle
    const dx = x - centerX;
    const dy = y - centerY;
    if (dx * dx + dy * dy <= circleRadiusSq) {
      continue; // Skip this star and generate another
    }

    // Brighter and bigger when near the center
    const distanceToCenter = dist(x, y, centerX, centerY);
    const brightness = map(distanceToCenter, 0, maxDistance, 255, 80);
    const size = map(distanceToCenter, 0, maxDistance, 2.2, 0.5);

    stars.push({
      x: x,
      y: y,
      b: brightness * random(0.6, 1.1),
      s: size * random(0.6, 1.3)
    });
    starCount++;
  }
}

// =====================================================
// Helper Utilities
// =====================================================
// Refresh the star buffer (called after resize or circle size change)
function refreshStarBuffer() {
  starBuffer = createGraphics(width, height);
  starBuffer.background(CONFIG.canvas.bg);
  starBuffer.noFill();
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    starBuffer.stroke(star.b);
    starBuffer.strokeWeight(star.s);
    starBuffer.point(star.x, star.y);
  }
}

// Helper: check if point is inside the boundary circle
function isInsideCircle(x, y) {
  const dx = x - canvasRadiusX;
  const dy = y - canvasRadiusY;
  return sqrt(dx * dx + dy * dy) <= circleRadius;
}

function draw() {
  // Apply fade effect to create trails (semi-transparent black overlay)
  fill(0, 0, 0, 40);
  noStroke();
  rect(0, 0, width, height);
  frameRate(30);
  
  // Draw pre-rendered starfield buffer on top to keep stars visible
  blendMode(ADD);
  image(starBuffer, 0, 0);
  blendMode(BLEND);
  
  stroke(cl);
  strokeWeight(sw);
  fill(0,0,0,10);
  circle(canvasRadiusX, canvasRadiusY, cr);


  // Chaotic center motion via Perlin noise
  center.vx = (noise(noiseX) - 0.5) * 30;
  center.vy = (noise(noiseY) - 0.5) * 30;
  noiseX += NOISE_STEP;
  noiseY += NOISE_STEP;
  
  // Mouse attraction when inside circle
  if (mouseX >= 0 && mouseY >= 0 && mouseX <= width && mouseY <= height) {
    if (isInsideCircle(mouseX, mouseY)) {
      // Calculate direction from center to mouse
      const toMouseX = mouseX - center.x;
      const toMouseY = mouseY - center.y;
      const distToMouse = sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
      
      if (distToMouse > 0.1) { // Avoid division by near-zero
        // Apply attraction force (normalized direction * strength)
        const attractionStrength = 0.5; // Adjust for more/less attraction
        center.vx += (toMouseX / distToMouse) * attractionStrength * 15;
        center.vy += (toMouseY / distToMouse) * attractionStrength * 15;
      }
    }
  }
  
  center.x += center.vx;
  center.y += center.vy;

  // Keep center inside inner boundary (bounce on hit)
  //Aided partially by Copilot
  const dx = center.x - canvasRadiusX;
  const dy = center.y - canvasRadiusY;
  const distance = sqrt(dx * dx + dy * dy);
  if (distance > maxBoundaryDist) {
    const angle = atan2(dy, dx);
    center.x = canvasRadiusX + cos(angle) * maxBoundaryDist;
    center.y = canvasRadiusY + sin(angle) * maxBoundaryDist;
    center.vx *= -1;
    center.vy *= -1;
  }

  // Draw orbiting circles
  stroke(cl);
  strokeWeight(sw);
  fill(bg);
  for (const d of dancers) d.draw(center.x, center.y);

  // Cursor-based slide trigger: play on enter and exit
  const mx = mouseX, my = mouseY;
  if (mx >= 0 && my >= 0 && mx <= width && my <= height) {
    const inside = isInsideCircle(mx, my);

    // Play slide when entering or exiting the circle
    if ((inside && !prevInside) || (!inside && prevInside)) {
      playSound('slide', VOLUME_SLIDE);
    }

    prevInside = inside;
  }
}

// ------------------------------------------------------------
// Input handlers
// ---------------------------------------Trang----------------
function updateCircleSize(delta) {
  const before = cr;
  const minSize = min(width*0.1, height*0.1);
  const maxSize = min(width*0.95, height*0.95);
  cr = constrain(cr + delta, minSize, maxSize);
  circleRadius = cr / 2;
  maxBoundaryDist = cr / 2 - 200;
  initStars();
  refreshStarBuffer();

  // Play resize feedback when size actually changes
  if (cr !== before && Sound.started && !Sound.muted) {
    if (cr > before) playSound('increase', VOLUME_RESIZE);
    if (cr < before) playSound('decrease', VOLUME_RESIZE);
  }
}

function mousePressed() {
  if (!Sound.started || Sound.muted) return;
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Check if click is inside the circle boundary
    const inside = isInsideCircle(mouseX, mouseY);

    if (inside) {
      // Click inside circle: play tone
      playSound('tone', VOLUME_TONE);
    } else if (!inside) {
      // Click outside circle (non-interactable): play blipSelect2tin
      playSound('blip', VOLUME_BLIP);
    }
  }
}
function keyPressed() {
  // Play a short blip on any keypress (user gesture) when audio is available.
  try { if (!Sound.started) startAudio(); if (!Sound.muted) playSound('blip', VOLUME_BLIP); } catch (e) {}
  if (key === 'm' || key === 'M') {
    window.toggleSound();
  }
  if (key === '+' || key === '=') {
    updateCircleSize(50);
  }
  if (key === '-' || key === '_') {
    updateCircleSize(-50);
  }
}

// Scroll wheel also adjusts circle size (up to grow, down to shrink)
function mouseWheel(event) {
  updateCircleSize(-event.delta * 0.15);
  return false; // prevent page scroll while interacting
}

// ------------------------------------------------------------
// Sound controls (bound from tin.html)
// ------------------------------------------------------------
window.toggleSound = function toggleSound() {
  try {
    if (!Sound.started) {
      startAudio();
    } else {
      Sound.muted = !Sound.muted;
      if (Sound.muted) {
        stopAllSounds();
      } else {
        playSound('ambient', VOLUME_AMBIENT, true);
      }
      updateSoundButton();
    }
  } catch (e) { console.warn('Sound toggle failed:', e); }
};

// Auto-start audio on the first gesture so sound is effectively on by default
['pointerdown', 'touchstart', 'keydown'].forEach((evt) => {
  window.addEventListener(evt, () => { if (!Sound.started) startAudio(); }, { once: true });
});

// Ensure the button shows the default-on state once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSoundButton, { once: true });
} else {
  updateSoundButton();
}

// Track cursor inside/outside state for slide trigger
let prevInside = false;