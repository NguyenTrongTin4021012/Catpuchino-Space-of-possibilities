//Global assets
//Variables for stars and rings
let starX;
let starY;
let ringAngle = 0; // declare an angle for the rings
let stars = []; // list for the stars
let ringArcs = []; // list for the ring's
let ringSpeed = 0.3; // base speed for rings
let ringCountMax = 0; // how many rings listOfRings() will spawn

// this is for a smoother transition between rings, call this variable as the Start and the Continue of the rings for timing and limiting the rings to spawn
let ringStart = 0; // frame to start a new frame
let ringContinue = 10; // spawn new ring at frame 10

//sound set ups
let planetAmbience;
let ringsAmbience;
let saturnSound = [];   // array of 3 atmosphere sounds
let currentSound = null; // null is an empty slot. 
let sfxRings = [];      // the list for sound effect for the rings fading effect

// Sound control state
const Sound = { started: false, muted: false };

//Nebula and starry background
// using loops of points to create different stars patterns background everytime being refreshed
function nebula(count) {
  stroke("white");
  strokeWeight(2);

  // draw the stars from the array
  for (let a = 0; a < stars.length; a++) {
    starX = stars[a].x;
    starY = stars[a].y;
    point(starX, starY);
  }
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

// ------------------------------------------------------------
// Sound control functions
// ------------------------------------------------------------
function updateSoundButton() {
  const btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = `Sound: ${Sound.started && !Sound.muted ? 'On' : 'Off'}`;
}

function startAllAmbience() {
  try {
    if (!planetAmbience || !ringsAmbience) return;
    if (!planetAmbience.isPlaying()) {
      planetAmbience.loop();
      ringsAmbience.loop();
      playRandomAtmosphere();
    }
  } catch (e) {
    console.warn('startAllAmbience failed:', e);
  }
}

function stopAllAmbience() {
  try {
    if (planetAmbience && planetAmbience.isPlaying()) planetAmbience.stop();
    if (ringsAmbience && ringsAmbience.isPlaying()) ringsAmbience.stop();
    if (currentSound && currentSound.isPlaying()) currentSound.stop();
    currentSound = null;
    saturnSound.forEach(s => { if (s.isPlaying()) s.stop(); });
    sfxRings.forEach(s => { if (s.isPlaying()) s.stop(); });
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

// a range of rings
function listOfRings() {
  //base information of the rings
  let ringX = width / 2;
  let ringY = height / 2;

  let ringW = 700;
  let ringH = 90;
  //steps of rings,
  let stepW = 50;
  let stepH = 10;

  //
  // let count = 3 + Math.floor(Math.random() * 20); // counting my random
  // let span = random(PI / 3); // random arc length using PI

  // use ringCountMax so we can randomize it via interaction
  let count = ringCountMax;
  if (count < 3) {
    count = 3;      // safety clamp
  } else if (count > 20) {
    count = 20;     // safety clamp
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
  planetAmbience = loadSound('ambience.mp3');
  ringsAmbience  = loadSound('rings.wav');
  
  saturnSound[0] = loadSound('saturn_atmosphere.wav');
  saturnSound[1] = loadSound('saturn_atmosphere-2.wav');
  saturnSound[2] = loadSound('saturn_atmosphere-3.wav');

  // ring sound for fading (rename these to your actual filenames)
  sfxRings[0] = loadSound('ring disappearing.wav');
  sfxRings[1] = loadSound('ring disappearing 2.wav');
  sfxRings[2] = loadSound('rings disappearing-3.wav');
}

//Set-ups
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30); // 30 framerate for smoother animation

  for (let i = 0; i < 2000; i++) {
    stars.push({
      x: random(width),
      y: random(height),
    });
  }

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

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Regenerate stars with new dimensions
  stars = [];
  for (let i = 0; i < 2000; i++) {
    stars.push({
      x: random(width),
      y: random(height),
    });
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

// Keyboard sound toggle: support both 'S' and 'M' keys
function keyPressed() {
  if (key === 's' || key === 'S' || key === 'm' || key === 'M') {
    if (typeof window.toggleSound === 'function') {
      window.toggleSound();
    }
    return false; // prevent default
  }
}

// mouse interaction is now only for the rings
function mousePressed() {
  // check if the click is roughly on the ring area around the planet
  let centerX = width / 2;
  let centerY = height / 2;
  let d = dist(mouseX, mouseY, centerX, centerY); // distance from planet center

  // ring "donut" area: not too close to center, not too far
  let innerRadius = 260; // slightly outside the planet radius (~250)
  let outerRadius = 450; // around where your arcs are

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
  nebula(0);
  
  let centerX = width / 2;
  let centerY = height / 2;
  
  //  the planet
  fill("black");
  ellipse(centerX, centerY, 500, 500);
  stroke(6);

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
  if (frameCount > 300) {        // after ~5 seconds at 60fps
    ringSpeed = 0.02;            // faster orbit
  } else {
    ringSpeed = 0.005;           // start slower
  }
  ringAngle += ringSpeed;

  fill("black");
  stroke("white"); // keep the white outline
  strokeWeight(2); // adjust if you want a thicker border
  arc(centerX, centerY, 500, 500, PI, TWO_PI);
}

// ------------------------------------------------------------
// Sound controls (bound from bach.html)
// ------------------------------------------------------------
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
  } catch (e) {
    console.warn('Sound toggle failed:', e);
  }
};

// Auto-start audio on the first gesture
['pointerdown', 'touchstart', 'keydown'].forEach((evt) => {
  window.addEventListener(evt, () => {
    if (!Sound.started) startAudio();
  }, { once: true });
});

// Initialize button label
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSoundButton, { once: true });
} else {
  updateSoundButton();
}
