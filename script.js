// =====================================================
// Catpuchino Group Project - Turbulence (p5.js)
// Author: Nguyen Trong Tin
//
// This file is part of Catpuchino Group Project - Turbulence.
//
// Catpuchino Group Project - Turbulence is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Catpuchino Group Project - Turbulence is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Catpuchino Group Project - Turbulence.  If not, see <https://www.gnu.org/licenses/>.
// =====================================================

// =====================================================
// CONFIGURATION & CONSTANTS
// =====================================================
const NUM_STARS = 2000;
const BG = '#000';
const TEXT_COLOR = '#fff';
const ACCENT_COLOR = '#fff';
const FADE_SPEED = 0.03;
const LINE_ANIMATION_SPEED = 0.025;

const PAGE_MAP = {
  0: 'trang.html',
  1: 'bach.html',
  2: 'khoa.html',
  3: 'tin.html'
};

const CONNECTIONS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6]];

// =====================================================
// GLOBAL VARIABLES
// =====================================================
// Canvas and visual state
let dots = [];
let stars = [];
let fadeOut = 0;
let isTransitioning = false;
let selectedDotIndex = -1;

// Line animation
let lineProgress = 0;
let lineAnimationDone = false;

// Audio
let clickSound;
let slideSound;
let ambienceSound;
let ambienceStarted = false;

// =====================================================
// DOT CLASS
// =====================================================
class Dot {
  constructor(x, y, label, radius = 5, showBorder = true) {
    this.x = x;
    this.y = y;
    this.label = label;
    // Increase base size by 30%
    this.radius = radius * 1.3;
    this.isHovered = false;
    this.borderSize = this.radius * 3;
    this.currentSize = this.borderSize;
    this.showBorder = showBorder;
  }

  display() {
    let targetSize = this.isHovered ? this.borderSize * 4 : this.borderSize;
    this.currentSize = lerp(this.currentSize, targetSize, 0.1);
    
    // Draw square border
    if (this.showBorder) {
      stroke(ACCENT_COLOR);
      strokeWeight(2);
      noFill();
      // Use a circular border instead of a square
      circle(this.x, this.y, this.currentSize);
    }
    
    // Draw dot
    noStroke();
    fill(TEXT_COLOR);
    circle(this.x, this.y, this.radius);
    
    // Draw label
    fill(ACCENT_COLOR);
    textFont('JetBrains Mono', 300);
    textAlign(LEFT, CENTER);
    textSize(24);
    text(this.label, this.x + this.currentSize * 0.7, this.y - this.currentSize / 2 - 10);
  }

  updateHover(mx, my) {
    let d = dist(mx, my, this.x, this.y);
    // Hover when pointer is near the circular border (use currentSize for scale)
    this.isHovered = d < (this.currentSize / 2 + 10);
  }

  isClicked(mx, my) {
    // Circular hit-test: inside the current circular border
    return dist(mx, my, this.x, this.y) <= this.currentSize / 2;
  }
}

// =====================================================
// STAR BACKGROUND
// =====================================================
function initStars() {
  stars = [];
  let centerX = width / 2;
  let centerY = height / 2;
  let maxDistance = dist(0, 0, centerX, centerY);

  for (let i = 0; i < NUM_STARS; i++) {
    let x = random(width);
    let y = random(height);

    let distanceToCenter = dist(x, y, centerX, centerY);
    let brightness = map(distanceToCenter, 0, maxDistance, 255, 80);
    let size = map(distanceToCenter, 0, maxDistance, 2.2, 0.5);

    stars.push({
      x: x,
      y: y,
      b: brightness * random(0.6, 1.1),
      s: size * random(0.6, 1.3)
    });
  }
}

function drawStars() {
  stars.forEach(function(star) {
    stroke(star.b);
    strokeWeight(star.s);
    point(star.x, star.y);
  });
}

// =====================================================
// CONNECTING LINES ANIMATION
// =====================================================
function drawConnectingLines() {
  stroke(TEXT_COLOR);
  strokeWeight(2);
  
  if (!lineAnimationDone) {
    lineProgress += LINE_ANIMATION_SPEED;
    if (lineProgress > 1) {
      lineProgress = 1;
      lineAnimationDone = true;
    }
  }
  
  for (let i = 0; i < CONNECTIONS.length; i++) {
    const [from, to] = CONNECTIONS[i];
    const segmentProgress = lineAnimationDone ? 1 : lineProgress * CONNECTIONS.length - i;
    
    if (segmentProgress > 0 && segmentProgress < 1) {
      const x2 = lerp(dots[from].x, dots[to].x, segmentProgress);
      const y2 = lerp(dots[from].y, dots[to].y, segmentProgress);
      line(dots[from].x, dots[from].y, x2, y2);
    } else if (segmentProgress >= 1) {
      line(dots[from].x, dots[from].y, dots[to].x, dots[to].y);
    }
  }
}

// =====================================================
// HELPER RENDERING FUNCTIONS
// =====================================================
function drawCursorCoordinates() {
  const x = Math.round(mouseX);
  const y = Math.round(mouseY);
  const label = `x: ${x}  y: ${y}`;
  noStroke();
  fill(ACCENT_COLOR);
  textFont('JetBrains Mono', 300);
  textSize(16);
  textAlign(LEFT, CENTER);
  text(label, mouseX + 12, mouseY);
}

// =====================================================
// P5.JS LIFECYCLE
// =====================================================
function preload() {
  soundFormats('mp3', 'wav');
  clickSound = loadSound('blipSelect2.wav');
  slideSound = loadSound('slide.wav');
  ambienceSound = loadSound('Ambience.mp3');
}

function setup() {
  let w = windowWidth, h = windowHeight;
  let canvas = createCanvas(w, h);
  canvas.parent('p5-container');
  background(BG);
  stroke(TEXT_COLOR);
  strokeWeight(2);
  textFont('JetBrains Mono', 300);
  initStars();

  dots = [
    new Dot(w * 0.1, h * 0.2),
    new Dot(w * 0.2, h * 0.4, 'Planetary Soroban'),
    new Dot(w * 0.4, h * 0.6, 'Disrupted Saturn'),
    new Dot(w * 0.6, h * 0.7, 'The Sun'),
    new Dot(w * 0.75, h * 0.4, 'Turbulence'),
    new Dot(w * 0.9, h * 0.5, '', 0, false),
    new Dot(w * 0.85, h * 0.2)
  ];
}

function draw() {
  background(BG);
  stroke(TEXT_COLOR);
  strokeWeight(2);
  
  drawStars();
  drawConnectingLines();

  for (let i = 0; i < dots.length; i++) {
    if (i === 0 || i === dots.length - 1) continue;
    dots[i].updateHover(mouseX, mouseY);
    dots[i].display();
  }

  drawCursorCoordinates();

  // Handle fade-out transition
  if (isTransitioning) {
    fadeOut += FADE_SPEED;
    fill(BG);
    stroke(BG);
    strokeWeight(0);
    rect(0, 0, windowWidth, windowHeight);
    fill(0, 0, 0, fadeOut * 255);
    rect(0, 0, windowWidth, windowHeight);
    
    if (fadeOut >= 1) {
      window.location.href = PAGE_MAP[selectedDotIndex];
    }
  }
}

function windowResized() {
  let w = windowWidth, h = windowHeight;
  resizeCanvas(w, h);
  
  if (dots.length >= 6) {
    dots[0].x = w * 0.1; dots[0].y = h * 0.2;
    dots[1].x = w * 0.2; dots[1].y = h * 0.4;
    dots[2].x = w * 0.4; dots[2].y = h * 0.6;
    dots[3].x = w * 0.6; dots[3].y = h * 0.7;
    dots[4].x = w * 0.75; dots[4].y = h * 0.4;
    dots[5].x = w * 0.9; dots[5].y = h * 0.5;
    dots[6].x = w * 0.85; dots[6].y = h * 0.2;
  }
}

// =====================================================
// INTERACTION & INPUT HANDLERS
// =====================================================
function mousePressed() {
  if (isTransitioning) return;

  // Play click sound
  if (clickSound && clickSound.isLoaded()) {
    try {
      if (clickSound.isPlaying()) clickSound.stop();
      clickSound.setVolume(0.8);
      clickSound.play();
    } catch (e) {
      console.warn('Click sound play failed:', e);
    }
  }
  
  for (let i = 0; i < dots.length; i++) {
    if (i === 0 || i === dots.length - 1) continue;

    if (dots[i].isClicked(mouseX, mouseY)) {
      console.log(`Clicked: ${dots[i].label}`);
      
      // Play slide sound
      if (slideSound && slideSound.isLoaded()) {
        try {
          if (slideSound.isPlaying()) slideSound.stop();
          slideSound.setVolume(0.8);
          slideSound.play();
        } catch (e) {
          console.warn('Slide sound play failed:', e);
        }
      }
      
      isTransitioning = true;
      selectedDotIndex = i - 1;
      break;
    }
  }
}

// =====================================================
// POPUP FUNCTIONS
// =====================================================
function openInfoPopup(event) {
  event.preventDefault();
  const popup = document.getElementById('info-popup');
  const overlay = document.getElementById('popup-overlay');
  popup.classList.add('show');
  overlay.classList.add('show');
}

function closeInfoPopup() {
  const popup = document.getElementById('info-popup');
  const overlay = document.getElementById('popup-overlay');
  popup.classList.remove('show');
  overlay.classList.remove('show');
}

// =====================================================
// AUDIO INITIALIZATION
// =====================================================
document.addEventListener('mouseenter', function() {
  if (!ambienceStarted && ambienceSound && ambienceSound.isLoaded()) {
    try {
      const ctx = getAudioContext();
      if (ctx.state !== 'running') ctx.resume();
      
      ambienceSound.setVolume(0.4);
      ambienceSound.loop();
      ambienceStarted = true;
    } catch (e) {
      console.warn('Failed to start ambience:', e);
    }
  }
}, { once: true });
