let rot = 0;  // rotation angle
let numQuads; // how much light rays

// Audio variables
let sfx4;
let sfx5;
let sfx6;
let space1;
let space2;
let space3;

// audio stuff
let sfxList = [];
let sfxIndex = 0;
let isPlaying = false;

// expanding circles on click
let pulseCircles = [];

// auto circles
let autoPulseCircles = []; // auto expanding circles
let nextAutoPulseTime = 0; // timer for circle

// star bg
const NUM_STARS = 5000; // number of stars
let stars = [];

// expanding click circle
class PulseCircle {
  constructor(alpha = 255) { 
    this.r = 0;
    this.speed = random(10, 80); // RANDOM SPEED for circle
    this.active = true;  // keep this true
    this.alpha = alpha;  // opacity
  }

  update() {
    if (!this.active) return;

    this.r += this.speed;

    // stop once it's fully off screen
    if (this.r > max(width, height) * 1.5) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;

    push();
    noFill();
    stroke(255, this.alpha); 
    strokeWeight(2);
    ellipse(width / 2, height / 2, this.r * 2);
    pop();
  }
}

function preload() {
  soundFormats('wav', 'mp3');
  sfx4 = loadSound('sfx4.wav');
  sfx5 = loadSound('sfx5.wav');
  sfx6 = loadSound('sfx6.wav');
  space1 = loadSound('space1.wav');
  space2 = loadSound('space2.wav');
  space3 = loadSound('space3.wav');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  initStars();

  numQuads = int(random(80, 150)); // how much light rays

  // sound list that loop
  sfxList = [sfx4, sfx6, space1, space2, space3];

  nextAutoPulseTime = millis() + random(2000, 5000); // auto pulse timing
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Reinitialize stars with new dimensions
  stars = [];
  initStars();
}

function draw() {
  background(0);

  // star bg stuff
  drawStars();

  translate(width / 2, height / 2);

  rotate(rot);
  rot += random(-0.0001, -0.0005); // rotation speed, negative number for counter clockwise

  let radius = 0;

  let triHeight = 750; // ray length
  let circleRadius = 250;
  let innerR = circleRadius + 10;
  let outerR = innerR + triHeight; // more ray stuff innerR start outerR ends

  let step = TWO_PI / numQuads; // angular gap between rays

  for (let i = 0; i < numQuads; i++) {
    push(); // push n pop make the stuff happen inside it like inside it, keep the quad stuff here

    let angle = map(i, 0, numQuads, 0, TWO_PI); // these one to make it like neat in a circle n all that
    let offsetX = cos(angle) * radius;
    let offsetY = sin(angle) * radius;

    translate(offsetX, offsetY);
    noFill();
    strokeWeight(1); // line thickness

    let mid = angle + step / 2;

    let segments = 40; // higher number = smoother fade
    for (let s = 0; s < segments; s++) {
      let t1 = s / segments;
      let t2 = (s + 1) / segments;

      let r1 = lerp(innerR, outerR, t1);
      let r2 = lerp(innerR, outerR, t2);

      // alpha fades outward
      let alpha = lerp(200, 30, t1); // first number is alpha of inside, second is alpha of outside

      stroke(255, alpha);

      let x1 = r1 * cos(mid);
      let y1 = r1 * sin(mid);
      let x2 = r2 * cos(mid);
      let y2 = r2 * sin(mid);

      line(x1, y1, x2, y2); // line stuff
    }

    pop();
  }

  resetMatrix();

  // transparent circle that appear every 2-5 seconds
  if (millis() > nextAutoPulseTime) {
    let count = int(random(1, 6)); 
    for (let i = 0; i < count; i++) {
      autoPulseCircles.push(new PulseCircle(128)); 
    }
    nextAutoPulseTime = millis() + random(2000, 5000); 
  }

  // draw automatic expanding circles
  for (let p of autoPulseCircles) {
    p.update();
    p.draw();
  }

  // draw expanding click circles behind sun ellipse)
  for (let p of pulseCircles) {
    p.update();
    p.draw();
  }

  push();
  stroke(255);
  strokeWeight(2); // line thickness
  fill(0);
  ellipse(width / 2, height / 2, 500, 500); // size of the middle circle, might need change as needed
  pop();
}

// star bg stuff
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

    stars.push({
      x,
      y,
      b: brightness * random(0.6, 1.1),
      s: size * random(0.6, 1.3),
    });
  }
}

// star bg
function drawStars() {
  for (let star of stars) {
    stroke(star.b);
    strokeWeight(star.s);
    point(star.x, star.y);
  }
}

// sound stuff
function playNextSound() {
  if (!isPlaying) return;

  let current = sfxList[sfxIndex];
  current.play();

  current.onended(() => {
    if (!isPlaying) return;

    sfxIndex++;
    if (sfxIndex >= sfxList.length) {
      sfxIndex = 0;
    }

    playNextSound();
  });
}

function mousePressed() {
  // 1–5 circles per click
  let count = int(random(1, 6));
  for (let i = 0; i < count; i++) {
    pulseCircles.push(new PulseCircle());
  }

  // left click to play sound, its gonna loop
  if (!isPlaying) {
    isPlaying = true;
    sfxIndex = 0;
    playNextSound();
  } else {
    // play sfx5 once on click
    if (sfx5.isPlaying()) {
      sfx5.stop(); // restart clean if spam-clicked
    }
    sfx5.play();
  }
}
