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

//Global assets
//Variables for stars and rings
const NUM_STARS = 1000;
let ringAngle = 0; // declare an angle for the rings
let stars = []; // list for the stars
let ringArcs = []; // list for the ring's
let ringSpeed = 0.3; // base speed for rings
let ringCountMax = 0; // how many rings listOfRings() will spawn

// NEW: planet size will scale with window
let planetRadius = 300; 

// this is for a smoother transition between rings, call this variable as the Start and the Continue of the rings for timing and limiting the rings to spawn
let ringStart = 10; // frame to start a new frame
let ringContinue = 10; // spawn new ring at frame 10


//sound set ups
let planetAmbience;
let ringsAmbience;
let saturnSound = [];   // array of 3 atmosphere sounds
let currentSound = null; // null is an empty slot. 
let sfxRings = [];      // the list for sound effect for the rings fading effect

//update layout based on current canvas size
function updateLayout() {
  // planet radius = 35% of the smaller side
  planetRadius = min(width, height) * 0.35;
}

//resize by trang
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // recompute layout
  updateLayout();

  // rebuild stars for new size
  stars = [];
  initStars();

  // OPTIONAL: recentre rings on new canvas
  ringArcs = [];
  listOfRings();
}

//Nebula and starry background by trang
// using loops of points to create different stars patterns background everytime being refreshed
function initStars() {
  let cx = width / 2;
  let cy = height / 2;
  let maxDist = dist(0, 0, cx, cy);
  for (let i = 0; i < NUM_STARS; i++) {
    let x = random(width);
    let y = random(height);
    let d = dist(x, y, cx, cy);
    let brightness = map(d, 0, maxDist, 255, 80);
    let size = map(d, 0, maxDist, 2.2, 0.5);
    stars.push({ x, y, b: brightness * random(0.6, 1.1), s: size * random(0.6, 1.3) });
  }
}

function drawStars() {
  stars.forEach((star) => {
    stroke(star.b);
    strokeWeight(star.s);
    point(star.x, star.y);
  });
}

// Class: Rings
class Rings {
  constructor(ringPosX, ringPosY, ringW, ringH, orbit) {
    this.cx = ringPosX; // xPosition of the rings
    this.cy = ringPosY; // yPosition of the rings
    this.w = ringW; // the width size of the rings
    this.h = ringH; // the height of the rings
    this.span = orbit; // the distance of the rings will spawn

    // other things
    this.offset = random(TWO_PI); // creating a phase, making the rings fade in and fade out when moving around the planet
    this.alpha = 255;
    this.fadeSpeed = 2; // transition speed
  }

  // update and isDead is Javascript function:
  // update = changing a value
  // isDead = checking the if the returns results should be remove
  update() {
    // speed up fade when the ring is nearly gone
    if (this.alpha > 80) {
      this.fadeSpeed = 2;   // still bright → fade slowly
    } else {
      this.fadeSpeed = 8;   // almost gone → fade much faster
    }

    this.alpha -= this.fadeSpeed; //compound: reduce the alpha by the speed of the animation every frame.
  }

  isDead() {
    return this.alpha <= 0; // this function is to check if the result of the alpha of the rings = 0.
  }
  // set up for the draw() to rendering the rings and arc. 
  draw() {
    if (this.alpha <= 0) return;

    // center angle of this arc (global rotation + personal offset)
    let angle = ringAngle + this.offset;
    let start = angle - this.span / 2;
    let end = angle + this.span / 2;

    noFill();
    stroke(255, this.alpha);
    strokeWeight(1);
    arc(this.cx, this.cy, this.w, this.h, start, end);
  }
}

// a range of rings
function listOfRings() {
  //base information of the rings
  let ringX = width / 2;   // 🔹 center X
  let ringY = height / 2;  // 🔹 center Y

  // 🔹 base sizes now depend on planetRadius
  let ringW = planetRadius * 2.0;      // ~same as planet diameter
  let ringH = planetRadius * 0.27;     // similar proportion as your 100 vs 375
  //steps of rings,
  let stepW = planetRadius * 0.13;     // similar to 50 vs 375
  let stepH = planetRadius * 0.027;    // similar to 10 vs 375

  // use ringCountMax so we can randomize it via interaction
  let count = ringCountMax;
  if (count < 3) {
    count = 3;      // safety clamp
  } else if (count > 70) {
    count = 70;     // safety clamp
  }

  let span = random(PI / 3); // random arc length using PI

  //loops to spawn the rings.
  for (let i = 0; i < count; i++) {
    let w = ringW + i * stepW; // the width and height of the rings that will spawn
    let h = ringH + i * stepH;
    ringArcs.push(new Rings(ringX, ringY, w, h, span)); //new rings will spawn from the array ringArcs using the base info
  }
}


// Sound setting up

function preload(){
  soundFormats('wav','mp3');
  planetAmbience = loadSound('ambience-edited.mp3');
  ringsAmbience  = loadSound('rings.wav');

  saturnSound[0] = loadSound('saturn_atmosphere.wav');
  saturnSound[1] = loadSound('saturn_atmosphere-2.wav');
  saturnSound[2] = loadSound('saturn_atmosphere-3.wav');

  // ring sound for fading (files in root directory)
  sfxRings[0] = loadSound('ring disappearing.wav');
  sfxRings[1] = loadSound('ring disappearing 2.wav');
  sfxRings[2] = loadSound('rings disappearing-3.wav');
}

//Set-ups
function setup() {
  // 🔹 use full window size so resize feels natural
  createCanvas(windowWidth, windowHeight);

  updateLayout();   // 🔹 compute planetRadius from current canvas
  initStars();      // 🔹 build stars with current width/height
  listOfRings();
  
  planetAmbience.setVolume(1);
  ringsAmbience.setVolume(1);
  
  // setting volume for the sound of Saturn  
  for (let i = 0; i < saturnSound.length; i++) {
    saturnSound[i].setVolume(1);
  }

  // setting volume for ring SFX
  for (let i = 0; i < sfxRings.length; i++) {
    sfxRings[i].setVolume(1);
  }
}

// adding thundering atmosphere sfx to the background using if statement with length
function playRandomAtmosphere() {
  // use the saturnSound array, not currentSound
  if (saturnSound.length === 0) return;

  let idx = int(random(saturnSound.length));
  let sfx = saturnSound[idx];

  currentSound = sfx;   // remember which one is playing
  sfx.setVolume(1);
  sfx.play();

  // when this one ends, start another random one if ambience is still running
  sfx.onended(() => {
    if (planetAmbience && planetAmbience.isPlaying()) {
      playRandomAtmosphere();
    } else {
      currentSound = null;
    }
  });
}

// sound toggle is separated: press S to start/stop audio
function keyPressed() {
  if (key === 's' || key === 'S') {
    if (window.toggleSound) window.toggleSound();
  }
}

// Shared sound toggle used by the page button
window.toggleSound = function() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'running') ctx.resume();
  } catch (e) {}

  const btn = document.getElementById('sound-toggle');
  const anyPlaying = (planetAmbience && planetAmbience.isPlaying()) || (ringsAmbience && ringsAmbience.isPlaying());

  if (!anyPlaying) {
    if (planetAmbience && planetAmbience.isLoaded()) {
      planetAmbience.setVolume(1);
      planetAmbience.loop();
    }
    if (ringsAmbience && ringsAmbience.isLoaded()) {
      ringsAmbience.setVolume(1);
      ringsAmbience.loop();
    }
    playRandomAtmosphere();
    if (btn) btn.textContent = 'Sound: On';
  } else {
    if (planetAmbience && planetAmbience.isPlaying()) planetAmbience.stop();
    if (ringsAmbience && ringsAmbience.isPlaying()) ringsAmbience.stop();

    if (currentSound && currentSound.isPlaying()) currentSound.stop();
    currentSound = null;

    if (Array.isArray(saturnSound)) {
      saturnSound.forEach(s => { if (s && s.isPlaying()) s.stop(); });
    }
    if (Array.isArray(sfxRings)) {
      sfxRings.forEach(s => { if (s && s.isPlaying()) s.stop(); });
    }

    if (btn) btn.textContent = 'Sound: Off';
  }
};

// mouse interaction is now only for the rings
function mousePressed() {
  // check if the click is roughly on the ring area around the planet
  let cx = width / 2;
  let cy = height / 2;
  let d = dist(mouseX, mouseY, cx, cy); // distance from planet center

  // ring "donut" area: not too close to center, not too far
  let innerRadius = planetRadius * 0.7;  // slightly outside the planet radius
  let outerRadius = planetRadius * 2.0;  // around where your arcs are

  if (d > innerRadius && d < outerRadius) {
    // clicked on the rings → randomize ring count between 3 and 20
    ringCountMax = int(random(3, 21));  // 3 ≤ value ≤ 20

    // if the mouse pressed, play one random SFX from sfxRings when rings react
    if (sfxRings.length > 0) {
      let idx = int(random(sfxRings.length));
      let fx = sfxRings[idx];

      // optional: stop it if already playing to avoid overlaps
      if (fx.isPlaying()) {
        fx.stop();
      }
      fx.play();
    }
  }
}


//Draw
function draw() {
  background(0);
 
  drawStars();
 
  let cx = width / 2;
  let cy = height / 2;

  //  the planet
  fill("black");
  ellipse(cx, cy, planetRadius * 2, planetRadius * 2);
  stroke(10);

  // spawn new rings every ringStart frames
  if (frameCount - ringContinue >= ringStart) { //this part controls the animation, how often does a new rings appears. This arguement tell us that how much frame should be past by to make a new ring appear. 
    listOfRings();
    ringContinue = frameCount;
  }

  //Every time the rings are drawn and animated, It will call the update function from class to update and draw a new batch again
  ringArcs.forEach((arcObj) => {
    arcObj.update();
    arcObj.draw();
  });

  ringArcs = ringArcs.filter((arcObj) => !arcObj.isDead());

  // speed up the orbit over time with if/else
  if (frameCount > 30) {        // after ~1s at 30fps
    ringSpeed = 0.02;           // faster orbit
  } else {
    ringSpeed = 0.005;          // start slower
  }
  ringAngle += ringSpeed;

  fill("black");
  stroke("white"); // keep the white outline
  strokeWeight(1); // adjust if you want a thicker border
  arc(cx, cy, planetRadius * 2, planetRadius * 2, PI, TWO_PI);
}
