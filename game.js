(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const distanceEl = document.getElementById("distance");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const statusText = document.getElementById("statusText");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const jumpBtn = document.getElementById("jumpBtn");

  const STORAGE_KEY = "easygame.bestMeters";
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const base = { width: 960, height: 420 };
  const ground = () => height * 0.77;

  let width = base.width;
  let height = base.height;
  let lastTime = 0;
  let running = false;
  let gameOver = false;
  let distance = 0;
  let speed = 285;
  let nextObstacle = 0;
  let groundOffset = 0;
  let clouds = [];
  let obstacles = [];
  let sparks = [];
  let best = Number(localStorage.getItem(STORAGE_KEY) || 0);

  const player = {
    x: 132,
    y: ground() - 42,
    w: 34,
    h: 42,
    vy: 0,
    jumpLock: false,
    jumpsUsed: 0
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || base.width;
    height = rect.height || base.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function reset() {
    distance = 0;
    speed = 285;
    nextObstacle = 0.75;
    groundOffset = 0;
    obstacles = [];
    sparks = [];
    clouds = [
      { x: 80, y: 62, s: 1.1 },
      { x: 420, y: 44, s: 0.78 },
      { x: 760, y: 82, s: 0.95 }
    ];
    player.y = ground() - player.h;
    player.vy = 0;
    player.jumpLock = false;
    player.jumpsUsed = 0;
    gameOver = false;
    updateHud();
    hideOverlay();
  }

  function start() {
    reset();
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    gameOver = true;
    const meters = Math.floor(distance);
    if (meters > best) {
      best = meters;
      localStorage.setItem(STORAGE_KEY, String(best));
    }
    updateHud();
    statusText.textContent = `${meters} m`;
    startBtn.textContent = "再来";
    overlay.classList.remove("is-hidden");
  }

  function hideOverlay() {
    overlay.classList.add("is-hidden");
  }

  function jump() {
    if (!running) {
      start();
      return;
    }
    if (gameOver || player.jumpLock) return;
    const floor = ground() - player.h;
    if (player.y >= floor - 1) {
      player.vy = -650;
      player.jumpLock = true;
      player.jumpsUsed = 1;
      for (let i = 0; i < 8; i += 1) {
        sparks.push({
          x: player.x + 8,
          y: ground() - 8,
          vx: -80 - Math.random() * 120,
          vy: -20 - Math.random() * 70,
          life: 0.35 + Math.random() * 0.18
        });
      }
    } else if (player.jumpsUsed < 2) {
      player.vy = -760;
      player.jumpLock = true;
      player.jumpsUsed = 2;
      for (let i = 0; i < 11; i += 1) {
        sparks.push({
          x: player.x + player.w / 2,
          y: player.y + player.h,
          vx: -130 + Math.random() * 260,
          vy: 80 + Math.random() * 120,
          life: 0.28 + Math.random() * 0.16
        });
      }
    }
  }

  function spawnObstacle() {
    const tall = Math.random() > 0.58;
    const w = tall ? 30 + Math.random() * 15 : 42 + Math.random() * 20;
    const h = tall ? 66 + Math.random() * 28 : 34 + Math.random() * 18;
    obstacles.push({
      x: width + 28,
      y: ground() - h,
      w,
      h,
      hue: Math.random() > 0.5 ? "red" : "gold"
    });
  }

  function update(dt) {
    const gravity = 1800;
    const floor = ground() - player.h;

    distance += (speed * dt) / 18;
    speed += dt * 9;
    groundOffset = (groundOffset + speed * dt) % 54;
    nextObstacle -= dt;

    if (nextObstacle <= 0) {
      spawnObstacle();
      nextObstacle = Math.max(0.58, 1.22 - speed / 1200) + Math.random() * 0.66;
    }

    player.vy += gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= floor) {
      player.y = floor;
      player.vy = 0;
      player.jumpLock = false;
      player.jumpsUsed = 0;
    }

    for (const obstacle of obstacles) {
      obstacle.x -= speed * dt;
    }
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.w > -40);

    for (const cloud of clouds) {
      cloud.x -= speed * dt * 0.08 * cloud.s;
      if (cloud.x < -140) {
        cloud.x = width + 80 + Math.random() * 120;
        cloud.y = 36 + Math.random() * 70;
      }
    }

    for (const spark of sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 420 * dt;
      spark.life -= dt;
    }
    sparks = sparks.filter(spark => spark.life > 0);

    if (obstacles.some(hit)) {
      endGame();
    }
    updateHud();
  }

  function hit(obstacle) {
    const inset = 7;
    return (
      player.x + inset < obstacle.x + obstacle.w &&
      player.x + player.w - inset > obstacle.x &&
      player.y + inset < obstacle.y + obstacle.h &&
      player.y + player.h - 3 > obstacle.y
    );
  }

  function updateHud() {
    distanceEl.textContent = `${Math.floor(distance)} m`;
    bestEl.textContent = `${best} m`;
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#dfeeff");
    gradient.addColorStop(0.52, "#fff8ec");
    gradient.addColorStop(1, "#fffdf8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,.88)";
    for (const cloud of clouds) {
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, 36 * cloud.s, 15 * cloud.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x + 34 * cloud.s, cloud.y + 3 * cloud.s, 42 * cloud.s, 18 * cloud.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x - 32 * cloud.s, cloud.y + 7 * cloud.s, 28 * cloud.s, 12 * cloud.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround() {
    const groundY = ground();
    ctx.fillStyle = "#d7c8a7";
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = "#31443f";
    ctx.fillRect(0, groundY - 4, width, 6);

    for (let x = -groundOffset; x < width + 60; x += 54) {
      ctx.fillStyle = x % 108 === 0 ? "#bda979" : "#cdbb8b";
      ctx.fillRect(x, groundY + 22, 28, 5);
      ctx.fillRect(x + 20, groundY + 62, 40, 4);
    }
  }

  function drawPlayer() {
    ctx.save();
    const bob = player.vy === 0 ? Math.sin(distance / 12) * 2 : 0;
    ctx.translate(player.x, player.y + bob);
    ctx.fillStyle = "#2457c5";
    roundedRect(0, 0, player.w, player.h, 8);
    ctx.fill();
    ctx.fillStyle = "#dfeeff";
    roundedRect(7, 8, 20, 11, 4);
    ctx.fill();
    ctx.fillStyle = "#172026";
    ctx.fillRect(8, player.h - 3, 10, 3);
    ctx.fillRect(23, player.h - 3, 10, 3);
    ctx.restore();
  }

  function drawObstacles() {
    for (const obstacle of obstacles) {
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.fillStyle = obstacle.hue === "red" ? "#c7443e" : "#c28b2c";
      roundedRect(0, 0, obstacle.w, obstacle.h, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.32)";
      ctx.fillRect(7, 8, Math.max(8, obstacle.w - 14), 5);
      ctx.fillStyle = "rgba(23,32,38,.16)";
      ctx.fillRect(0, obstacle.h - 8, obstacle.w, 8);
      ctx.restore();
    }
  }

  function drawSparks() {
    ctx.fillStyle = "#2f8f6b";
    for (const spark of sparks) {
      ctx.globalAlpha = Math.max(0, spark.life * 2.4);
      ctx.fillRect(spark.x, spark.y, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  function roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }

  function draw() {
    drawSky();
    drawGround();
    drawSparks();
    drawObstacles();
    drawPlayer();
  }

  function loop(now) {
    if (!running) {
      draw();
      return;
    }
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    resize();
    draw();
  });

  window.addEventListener("keydown", event => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      jump();
    }
  });

  window.addEventListener("keyup", event => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      player.jumpLock = false;
    }
  });

  function pointerJump(event) {
    event.preventDefault();
    jump();
  }

  canvas.addEventListener("pointerdown", pointerJump);
  jumpBtn.addEventListener("pointerdown", pointerJump);
  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);

  resize();
  updateHud();
  draw();
})();
