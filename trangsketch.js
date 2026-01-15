// =====================================================
// Catpuchino Group Project - Planetary Soroban (p5.js)
// Author: Pham Ha Hoang Trang
//
// This file is part of Catpuchino Group Project - Planetary Soroban.
//
// Catpuchino Group Project - Planetary Soroban is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Catpuchino Group Project - Planetary Soroban is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Catpuchino Group Project - Turbulence.  If not, see <https://www.gnu.org/licenses/>.
// =====================================================
/**
 * Project: The Planet Soroban
 * Author: Pham Ha Hoang Trang
 * Description: A digital Soroban (Abacus) with planetary visuals. 
 * Features responsive scaling and high-fidelity UI rendering.
 */

// =====================================================
// 1. CONFIGURATION & CONSTANTS
// =====================================================
const NUM_STARS = 5000;
const ART_SCALE_BASE = 0.8;  // Percentage of screen space occupied by the abacus
const COLS = 5;              // Number of digits/columns
const BEAD_RADIUS = 60;      // Physical size of the "planets"
const COL_SPACE = 220;       // Horizontal distance between rods
const MOVE_LERP = 0.08;      // Animation smoothness (0.0 to 1.0)
const MOVE_THRESHOLD = 0.3;  // Snap-to-target threshold

// =====================================================
// 2. GLOBAL VARIABLES
// =====================================================
let stars = [];
let columns = [];
let monoFont;
let beadSound, resetSound;
let ambienceTracks = [];
let clickSFX = [];      
let bgClickSFX = [];    
let currentAmbience = null;
const Sound = { started: false, muted: false };

// =====================================================
// 3. LIFECYCLE FUNCTIONS
// =====================================================
function preload() {
  monoFont = loadFont("JetBrainsMono-Light.ttf");

  // Loading audio assets (all from root directory)
  ambienceTracks = [
    { name: "Ambience 1", sound: loadSound("Ambience.mp3"), volume: 0.5 },
    { name: "Ambience 2", sound: loadSound("Ambience2.mp3"), volume: 0.1 },
    { name: "Ambience 3", sound: loadSound("Ambience3.mp3"), volume: 0.08 },
  ];

  beadSound = loadSound("Bead.wav");
  resetSound = loadSound("Reset Button.wav");
  clickSFX = [loadSound("SFX1-Trang.wav"), loadSound("SFX2-Trang.wav")];
  bgClickSFX = [
    loadSound("Ambience_Click _1.wav"),
    loadSound("Ambience_Click_2.wav"),
    loadSound("Ambience_Click_3.wav"),
  ];
}

function setup() {
  /**
   * IMPORTANT: pixelDensity is set to displayDensity for sharp text
   * and high-fidelity rendering on Retina/4K displays.
   */
  pixelDensity(displayDensity()); 
  createCanvas(windowWidth, windowHeight);
  noFill();

  // Defer audio start until a user gesture due to browser policies
  updateSoundButton();
  ['pointerdown', 'touchstart', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (!Sound.started) startAudio();
    }, { once: true });
  });

  initStars();
  initSoroban();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  stars = []; // Regenerate stars to fill new screen dimensions
  initStars();
}

function draw() {
  background(0);
  drawStars();
  
  // Render the Abacus using responsive scaling
  drawSoroban();
  
  // Render UI/Text separately to ensure clarity (no scaling applied)
  drawSorobanValueHUD(); 
}

// =====================================================
// 3a. AUDIO CONTROL HELPERS
// =====================================================
function updateSoundButton() {
  const btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = `Sound: ${Sound.started && !Sound.muted ? 'On' : 'Off'}`;
}

function startAllAmbience() {
  try {
    if (Sound.muted) return;
    if (!currentAmbience) currentAmbience = random(ambienceTracks);
    if (!currentAmbience || !currentAmbience.sound) return;
    if (!currentAmbience.sound.isPlaying()) {
      currentAmbience.sound.setVolume(currentAmbience.volume);
      currentAmbience.sound.loop();
    }
  } catch (e) {
    console.warn('startAllAmbience failed:', e);
  }
}

function stopAllAmbience() {
  try {
    if (currentAmbience && currentAmbience.sound && currentAmbience.sound.isPlaying()) {
      currentAmbience.sound.stop();
    }
  } catch (e) {
    console.warn('stopAllAmbience failed:', e);
  }
}

function startAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') ctx.resume();
    Sound.started = true;
    Sound.muted = false;
    startAllAmbience();
    updateSoundButton();
  } catch (e) {
    console.warn('startAudio failed:', e);
  }
}

// =====================================================
// 4. STAR BACKGROUND SYSTEM
// =====================================================
function initStars() {
  let cx = width / 2;
  let cy = height / 2;
  let maxDist = dist(0, 0, cx, cy);
  
  for (let i = 0; i < NUM_STARS; i++) {
    let x = random(width);
    let y = random(height);
    let d = dist(x, y, cx, cy);
    
    // Create center-weighted brightness for a "nebula" effect
    let brightness = map(d, 0, maxDist, 255, 80);
    let size = map(d, 0, maxDist, 2.2, 0.5);
    
    stars.push({ 
      x, y, 
      b: brightness * random(0.6, 1.1), 
      s: size * random(0.6, 1.3) 
    });
  }
}

function drawStars() {
  stars.forEach((star) => {
    stroke(star.b);
    strokeWeight(star.s);
    point(star.x, star.y);
  });
}

// =====================================================
// 5. SOROBAN (ABACUS) SYSTEM
// =====================================================
function initSoroban() {
  const gap = BEAD_RADIUS * 2 + 15;
  const beamGap = gap * 0.5;
  let slots = [];
  let acc = 0;

  // Pre-calculate vertical Y-slots for beads
  for (let i = 0; i < 8; i++) {
    slots.push(acc);
    acc += i === 2 ? beamGap : gap;
  }

  columns = [];
  for (let c = 0; c < COLS; c++) {
    columns.push(new SorobanColumn(c * COL_SPACE + BEAD_RADIUS, slots, BEAD_RADIUS));
  }
}

function drawSoroban() {
  const gap = BEAD_RADIUS * 2 + 15;
  const beamGap = gap * 0.5;
  let totalH = (6 * gap) + beamGap; 
  let artW = COLS * COL_SPACE;

  /**
   * RESPONSIVE CALCULATION:
   * Determines scale based on the smaller window dimension to prevent cropping.
   */
  let responsiveScale = min(width / (artW + 100), height / (totalH + 200)) * ART_SCALE_BASE;

  push();
  translate(width / 2, height / 2); // Center the abacus
  scale(responsiveScale);
  translate(-artW / 2, -totalH / 2); // Offset by half dimensions

  for (let col of columns) {
    col.update();
    col.draw();
  }
  pop();
}

/**
 * SorobanColumn Class
 * Handles individual rod logic, bead movement chains, and collision checking.
 */
class SorobanColumn {
  constructor(x, slots, r) {
    this.x = x; 
    this.slots = slots; 
    this.r = r;
    this.heavenSlot = 0; // 0: Up, 1: Down (Value 5)
    this.heaven = new Planet(x, slots[0] + r, r);
    this.earthSlots = [4, 5, 6, 7]; // Earth beads (Value 1 each)
    this.earths = this.earthSlots.map((s) => new Planet(x, slots[s] + r, r));
  }

  update() {
    this.heaven.update();
    this.earths.forEach((e) => e.update());
  }

  draw() {
    this.heaven.draw();
    this.earths.forEach((e) => e.draw());
  }

  reset() {
    this.heavenSlot = 0;
    this.heaven.setTarget(this.slots[0] + this.r);
    this.earthSlots = [4, 5, 6, 7];
    for(let i = 0; i < 4; i++) {
      this.earths[i].setTarget(this.slots[this.earthSlots[i]] + this.r);
    }
  }

  /**
   * Chain Reaction Logic: Beads push each other when moving
   */
  tryMoveEarthUp(idx) {
    let targetSlot = this.earthSlots[idx] - 1;
    if (targetSlot < 3) return false;
    if (idx > 0 && this.earthSlots[idx - 1] === targetSlot) {
      if (!this.tryMoveEarthUp(idx - 1)) return false; 
    }
    this.earthSlots[idx] = targetSlot;
    return true;
  }

  tryMoveEarthDown(idx) {
    let targetSlot = this.earthSlots[idx] + 1;
    if (targetSlot > 7) return false;
    if (idx < 3 && this.earthSlots[idx + 1] === targetSlot) {
      if (!this.tryMoveEarthDown(idx + 1)) return false;
    }
    this.earthSlots[idx] = targetSlot;
    return true;
  }

  /**
   * Mouse Interaction: Converts screen coordinates back to 
   * the abacus's relative coordinate system.
   */
  checkInteraction(mx, my) {
    const gap = BEAD_RADIUS * 2 + 15;
    const beamGap = gap * 0.5;
    let totalH = (6 * gap) + beamGap;
    let artW = COLS * COL_SPACE;
    let rScale = min(width / (artW + 100), height / (totalH + 200)) * ART_SCALE_BASE;
    
    let originX = width / 2 - (artW * rScale) / 2;
    let originY = height / 2 - (totalH * rScale) / 2;
    let screenX = originX + (this.x * rScale);

    if (abs(mx - screenX) > (this.r * rScale * 1.5)) return false;

    let hit = false;
    let hScreenY = originY + (this.heaven.y * rScale);

    // Heaven Bead Detection
    if (dist(mx, my, screenX, hScreenY) < this.r * rScale * 1.5) {
      if (my > hScreenY && this.heavenSlot === 1) { this.heavenSlot = 0; hit = true; } 
      else if (my < hScreenY && this.heavenSlot === 0) { this.heavenSlot = 1; hit = true; }
      if (hit) this.heaven.setTarget(this.slots[this.heavenSlot] + this.r);
    }

    // Earth Bead Detection
    if (!hit) {
      for (let i = 0; i < 4; i++) {
        let eScreenY = originY + (this.earths[i].y * rScale);
        if (dist(mx, my, screenX, eScreenY) < this.r * rScale * 1.2) {
          if (my > eScreenY) { if (this.tryMoveEarthUp(i)) hit = true; } 
          else { if (this.tryMoveEarthDown(i)) hit = true; }
          if (hit) {
            for(let j = 0; j < 4; j++) {
              this.earths[j].setTarget(this.slots[this.earthSlots[j]] + this.r);
            }
            break; 
          }
        }
      }
    }

    if (hit) {
      playBeadSound();
      playRandomClickSFX();
      return true;
    }
    return false;
  }

  getValue() {
    let v = this.heavenSlot === 1 ? 5 : 0;
    for(let i = 0; i < 4; i++) {
      if (this.earthSlots[i] === 3 + i) v += 1;
      else break; 
    }
    return v;
  }
}

// =====================================================
// 6. PLANET VISUAL CLASS
// =====================================================
class Planet {
  constructor(x, y, r) {
    this.x = x; 
    this.y = y; 
    this.targetY = y; 
    this.r = r;
    this.ringCount = random() < 0.75 ? int(random(1, 6)) : int(random(8, 15));
  }
  
  setTarget(y) { this.targetY = y; }
  
  update() {
    this.y = lerp(this.y, this.targetY, MOVE_LERP);
    if (abs(this.y - this.targetY) < MOVE_THRESHOLD) this.y = this.targetY;
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    stroke(255);
    strokeWeight(2);
    fill(0);
    ellipse(0, 0, this.r * 2);

    strokeWeight(1);
    for (let i = 0; i < this.ringCount; i++) {
      let size = this.r * 2 - (i + 1) * (this.r * 0.15);
      let alpha = map(i, 0, this.ringCount - 1, 180, 40);
      if (size > 8) {
        stroke(255, alpha);
        ellipse(0, 0, size);
      }
    }
    pop();
  }
}

// =====================================================
// 7. UI & HUD (OPTIMIZED FOR CLARITY)
// ====================================================
function drawSorobanValueHUD() {
  let value = getSorobanValue();
  
  push();
  /**
   * resetMatrix() ensures the HUD is drawn in screen space,
   * bypassing the responsive scaling applied to the art. 
   * This prevents text from becoming blurry or distorted.
   */
  resetMatrix(); 
  textFont(monoFont);
  textSize(16);
  noStroke(); 

  // --- Right Display: Current Value ---
  textAlign(RIGHT, BOTTOM);
  fill(255, 240, 0);
  text(value, width - 20, height - 20);
  fill(255);
  let labelGap = width < 600 ? 60 : 70;
  text("Current value: ", width - labelGap, height - 20);

  // --- Left Display: Reset Button ---
  let btnW = 80;
  let btnH = 30;
  let btnX = 150; 
  let btnY = height - 20 - btnH;
  let isHover = mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH;

  fill(isHover ? color(255, 240, 0) : 255);
  textAlign(LEFT, BOTTOM);
  text("Reset", btnX, height - 20);
  pop();
}

function getSorobanValue() {
  let total = 0;
  for (let i = 0; i < columns.length; i++) {
    let digit = columns[columns.length - 1 - i].getValue();
    total += digit * pow(10, i);
  }
  return total;
}

// =====================================================
// 8. SOUND & INPUT HANDLING
// =====================================================
function playBeadSound() { 
  if (Sound.muted) return;
  if (beadSound.isLoaded()) { beadSound.setVolume(0.5); beadSound.play(); } 
}

function playRandomClickSFX() { 
  if (Sound.muted) return;
  let sfx = random(clickSFX); 
  if (sfx && sfx.isLoaded()) { sfx.setVolume(0.05); sfx.play(); } 
}

function playRandomBgClickSFX() { 
  if (Sound.muted) return;
  let sfx = random(bgClickSFX); 
  if (sfx && sfx.isLoaded()) { sfx.setVolume(0.01); sfx.play(); } 
}

function mousePressed() {
  // Check Reset Button Collision
  let btnW = 80;
  let btnX = 150; 
  let btnY = height - 50;
  
  if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < height) {
    for (let col of columns) col.reset();
    if (!Sound.muted && resetSound.isLoaded()) {
      resetSound.setVolume(0.1);
      resetSound.play();
    }
    return;
  }

  // Check Bead Interaction
  let hitAnyBead = false; 
  for (let col of columns) {
    if (col.checkInteraction(mouseX, mouseY)) {
      hitAnyBead = true;
      break;
    }
  }
  
  // Ambient click sound if nothing was hit
  if (!hitAnyBead) playRandomBgClickSFX();
}

// Mirror tinsketch.js: keyboard 'm' toggles sound using window.toggleSound
function keyPressed() {
  try { if (!Sound.started) startAudio(); } catch (e) {}
  if (key === 'm' || key === 'M') {
    if (typeof window.toggleSound === 'function') window.toggleSound();
  }
}

// Provide external toggle API and DOM label update
window.toggleSound = function toggleSound() {
  try {
    if (!Sound.started) {
      startAudio();
    } else {
      Sound.muted = !Sound.muted;
      if (Sound.muted) {
        stopAllAmbience();
      } else {
        startAllAmbience();
      }
      updateSoundButton();
    }
  } catch (e) { console.warn('Sound toggle failed:', e); }
};

// Initialize button label once DOM is ready (if present)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSoundButton, { once: true });
} else {
  updateSoundButton();
}