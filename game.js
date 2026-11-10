(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const coinsEl = document.getElementById("coins");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("overlay-title");
  const copyEl = document.getElementById("overlay-copy");
  const startBtn = document.getElementById("start");
  const W = canvas.width, H = canvas.height;
  const laneX = [W * .25, W * .5, W * .75];
  let running = false, last = 0, score = 0, coins = 0, speed = 300;
  let objects = [], spawnTimer = 0, roadOffset = 0, animation = 0;
  let best = Number(localStorage.getItem("railRushBest") || 0);
  const player = { lane: 1, x: laneX[1], y: H - 125, jump: 0, roll: 0, invuln: 0 };
  bestEl.textContent = best;

  function reset() {
    score = 0; coins = 0; speed = 300; objects = []; spawnTimer = .7;
    player.lane = 1; player.x = laneX[1]; player.jump = 0; player.roll = 0; player.invuln = 0;
    scoreEl.textContent = "0"; coinsEl.textContent = "0";
  }
  function start() { reset(); running = true; overlay.classList.add("hidden"); last = performance.now(); requestAnimationFrame(loop); }
  function end() {
    running = false;
    if (score > best) { best = score; localStorage.setItem("railRushBest", String(best)); bestEl.textContent = best; }
    titleEl.textContent = "Run over!";
    copyEl.textContent = "Score: " + score + " · Coins: " + coins + ". Ready for another run?";
    startBtn.textContent = "Run again";
    overlay.classList.remove("hidden");
  }
  function move(action) {
    if (!running) return;
    if (action === "left") player.lane = Math.max(0, player.lane - 1);
    if (action === "right") player.lane = Math.min(2, player.lane + 1);
    if (action === "jump" && player.jump <= 0 && player.roll <= 0) player.jump = .72;
    if (action === "roll" && player.roll <= 0 && player.jump <= 0) player.roll = .55;
  }
  function spawn() {
    const lane = Math.floor(Math.random() * 3);
    const r = Math.random();
    objects.push({ lane, y: -55, type: r < .22 ? "coin" : r < .53 ? "barrier" : r < .76 ? "train" : "sign", hit: false });
    if (Math.random() < .28) objects.push({ lane: (lane + 1 + Math.floor(Math.random() * 2)) % 3, y: -55, type: "coin", hit: false });
  }
  function rounded(x,y,w,h,r,color) { ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
  function drawRoad(dt) {
    ctx.fillStyle="#153c36"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#27394b"; ctx.beginPath(); ctx.moveTo(W*.12,0); ctx.lineTo(W*.88,0); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle="#a9b7c4"; ctx.lineWidth=5;
    for(let lane=0;lane<3;lane++){const x=laneX[lane];ctx.beginPath();ctx.moveTo(W*.5+(x-W*.5)*.18,0);ctx.lineTo(x,H);ctx.stroke();}
    roadOffset=(roadOffset+speed*dt)%80;
    ctx.strokeStyle="#e4c66b";ctx.lineWidth=3;
    for(let y=-80+roadOffset;y<H;y+=80){ctx.beginPath();ctx.moveTo(W*.5-5,y);ctx.lineTo(W*.5-5,y+34);ctx.stroke();ctx.beginPath();ctx.moveTo(W*.5+5,y);ctx.lineTo(W*.5+5,y+34);ctx.stroke();}
    ctx.fillStyle="#60788c";ctx.fillRect(0,0,12,H);ctx.fillRect(W-12,0,12,H);
  }
  function drawObject(o) {
    const x=laneX[o.lane], y=o.y, scale=.65+y/H*.5;
    if(o.type==="coin"){ctx.fillStyle="#ffd84c";ctx.beginPath();ctx.ellipse(x,y,12*scale,16*scale,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff2a6";ctx.lineWidth=3;ctx.stroke();return;}
    if(o.type==="barrier"){rounded(x-29*scale,y-18*scale,58*scale,38*scale,6,"#e45b45");ctx.fillStyle="#ffd9a0";ctx.fillRect(x-24*scale,y-5*scale,48*scale,7*scale);return;}
    if(o.type==="train"){rounded(x-43*scale,y-65*scale,86*scale,130*scale,10,"#c34b3e");rounded(x-31*scale,y-49*scale,62*scale,35*scale,5,"#9ed9e8");ctx.fillStyle="#f4c66a";ctx.fillRect(x-34*scale,y+42*scale,68*scale,8*scale);return;}
    rounded(x-32*scale,y-48*scale,64*scale,96*scale,8,"#e7b94f");rounded(x-23*scale,y-36*scale,46*scale,23*scale,4,"#38536a");
  }
  function drawPlayer() {
    const x=player.x, y=player.y-player.jump*125;
    if(player.roll>0){rounded(x-27,y-18,54,35,15,"#35c6b0");rounded(x-20,y-13,40,13,6,"#f6d7a5");return;}
    ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(x,y+29,25,8,0,0,Math.PI*2);ctx.fill();
    rounded(x-19,y-37,38,54,11,"#2dc2b0");rounded(x-16,y-59,32,27,10,"#f3c59b");rounded(x-18,y-65,36,13,7,"#26364c");
    ctx.strokeStyle="#f3c59b";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x-17,y-25);ctx.lineTo(x-27,y-5);ctx.moveTo(x+17,y-25);ctx.lineTo(x+27,y-5);ctx.stroke();
    ctx.strokeStyle="#26364c";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-9,y+12);ctx.lineTo(x-13,y+29);ctx.moveTo(x+9,y+12);ctx.lineTo(x+13,y+29);ctx.stroke();
  }
  function update(dt) {
    score += Math.floor(dt*speed*.08); speed = Math.min(650, speed+dt*5);
    player.x += (laneX[player.lane]-player.x)*Math.min(1,dt*14);
    player.jump=Math.max(0,player.jump-dt); player.roll=Math.max(0,player.roll-dt);
    spawnTimer-=dt; if(spawnTimer<=0){spawn();spawnTimer=Math.max(.48,1.05-(speed-300)/700)+Math.random()*.25;}
    for(const o of objects){o.y+=speed*dt;if(o.hit)continue;
      if(Math.abs(o.y-player.y)<43 && o.lane===player.lane){
        if(o.type==="coin"){o.hit=true;coins++;coinsEl.textContent=coins;}
        else if(o.type==="barrier" && player.jump>0){o.hit=true;}
        else if(o.type==="sign" && player.roll>0){o.hit=true;}
        else if(o.type!=="coin"){o.hit=true;end();return;}
      }
    }
    objects=objects.filter(o=>o.y<H+100);
    scoreEl.textContent=score;
  }
  function render(dt){drawRoad(dt);for(const o of objects)drawObject(o);drawPlayer();}
  function loop(now){if(!running)return;const dt=Math.min((now-last)/1000,.04);last=now;update(dt);render(dt);if(running)requestAnimationFrame(loop);}
  startBtn.addEventListener("click",start);
  document.querySelectorAll("[data-move]").forEach(b=>b.addEventListener("click",()=>move(b.dataset.move)));
  window.addEventListener("keydown",e=>{const map={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"jump",ArrowDown:"roll"," ":"start"};const a=map[e.key];if(a){e.preventDefault();if(a==="start"&&!running)start();else move(a);}});
  let touchX=0,touchY=0;
  canvas.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;},{passive:true});
  canvas.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;if(Math.abs(dx)>Math.abs(dy))move(dx<0?"left":"right");else move(dy<0?"jump":"roll");},{passive:true});
  drawRoad(0);drawPlayer();
})();