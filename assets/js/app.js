/* ===== DOM ===== */
var video, canvas, ctx, statusEl, fpsEl;
var pfill, ppct, ptxt, pstep, progressWrap, retryBtn;

/* ===== 状态 ===== */
var W, H;
var isRunning = false;
var now = 0;

/* ===== 玫瑰参数（带平滑插值） ===== */
var targetScale = 1.0,
  currentScale = 1.0;
var targetRotation = 0,
  currentRotation = 0;
var baseRoseSize = 0; // 根据屏幕计算

/* ===== 手势数据 ===== */
var landmarks = [];
var lmLen = 0;
var handsObj = null;

/* ===== 粒子 ===== */
var particles = [];
var MAX_PARTICLES = 60;

/* ===== 星空缓存 ===== */
var starCanvas;

/* ===== FPS ===== */
var lastFpsTime = 0,
  fpsCount = 0,
  fps = 0;

/* ===== 触摸控制 ===== */
var touchActive = false;
var touchStartX = 0,
  touchStartY = 0;
var touchStartDist = 0;
var touchScale = 1.0;
var touchRotation = 0;

/* ===== 初始化 ===== */
window.onload = function () {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d', { alpha: false });
  statusEl = document.getElementById('status');
  fpsEl = document.getElementById('fps');
  pfill = document.getElementById('pfill');
  ppct = document.getElementById('pct');
  ptxt = document.getElementById('ptxt');
  pstep = document.getElementById('pstep');
  progressWrap = document.getElementById('progressWrap');
  retryBtn = document.getElementById('retryBtn');

  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  baseRoseSize = Math.min(W, H) * 0.35;
  buildStars();

  // 触摸事件
  canvas.style.pointerEvents = 'auto';
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);

  requestAnimationFrame(animate);
};

window.onresize = function () {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  baseRoseSize = Math.min(W, H) * 0.35;
  buildStars();
};

/* ===== 触摸控制 ===== */
function onTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    touchActive = true;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchRotation = currentRotation;
  } else if (e.touches.length === 2) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    touchStartDist = Math.sqrt(dx * dx + dy * dy);
    touchScale = currentScale;
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1 && touchActive) {
    var dx = e.touches[0].clientX - touchStartX;
    targetRotation = touchRotation + dx * 0.01;
  } else if (e.touches.length === 2) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    targetScale = Math.max(
      0.2,
      Math.min(2.5, touchScale * (dist / touchStartDist)),
    );
  }
}

function onTouchEnd(e) {
  if (e.touches.length === 0) touchActive = false;
}

/* ===== 星空 ===== */
function buildStars() {
  starCanvas = document.createElement('canvas');
  starCanvas.width = W;
  starCanvas.height = H;
  var sc = starCanvas.getContext('2d');
  for (var i = 0; i < 100; i++) {
    sc.beginPath();
    sc.arc(
      Math.random() * W,
      Math.random() * H,
      Math.random() * 0.8 + 0.2,
      0,
      6.28,
    );
    sc.fillStyle = 'rgba(200,210,255,' + (Math.random() * 0.3 + 0.08) + ')';
    sc.fill();
  }
}

/* ===== 粒子 ===== */
function spawnParticle(x, y, hue) {
  if (particles.length >= MAX_PARTICLES) return;
  particles.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5 - 0.5,
    life: 1,
    decay: Math.random() * 0.015 + 0.008,
    size: Math.random() * 2 + 0.5,
    hue: hue || 220 + Math.random() * 60,
  });
}

function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.01;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  ctx.globalCompositeOperation = 'lighter';
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    ctx.globalAlpha = p.life * 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 6.28);
    ctx.fillStyle = 'hsla(' + p.hue + ',80%,70%,1)';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* ===== 玫瑰绘制 ===== */
function drawPetal(angle, length, width, curl, color1, color2) {
  ctx.save();
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);

  var w = width * (0.8 + curl * 0.4);
  var h = length;
  var tipOffset = curl * length * 0.15;

  // 右侧曲线
  ctx.bezierCurveTo(w * 0.7, -h * 0.25, w * 0.9, -h * 0.65, tipOffset, -h);
  // 顶端圆弧
  ctx.quadraticCurveTo(0, -h * 1.08, -tipOffset, -h);
  // 左侧曲线
  ctx.bezierCurveTo(-w * 0.9, -h * 0.65, -w * 0.7, -h * 0.25, 0, 0);

  // 渐变填充
  var grad = ctx.createLinearGradient(0, 0, 0, -h);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.6, color2);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fill();

  // 边缘高光
  ctx.strokeStyle = 'rgba(180,200,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

function drawRose(cx, cy, scale, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);

  var s = baseRoseSize;

  // 发光效果
  var glow = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 1.2);
  glow.addColorStop(0, 'rgba(59,130,246,0.15)');
  glow.addColorStop(0.5, 'rgba(99,102,241,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-s * 1.5, -s * 1.5, s * 3, s * 3);

  // 花瓣层定义: [数量, 长度比例, 宽度比例, 卷曲度, 起始角度偏移, 颜色1, 颜色2]
  var layers = [
    [8, 1.0, 0.55, 0.3, 0, '#0c1a4a', '#1e3a8a'],
    [7, 0.82, 0.5, 0.5, 0.25, '#1e3a8a', '#2563eb'],
    [6, 0.65, 0.45, 0.7, 0.5, '#2563eb', '#3b82f6'],
    [5, 0.48, 0.4, 0.9, 0.7, '#3b82f6', '#60a5fa'],
    [5, 0.32, 0.35, 1.1, 0.9, '#60a5fa', '#93c5fd'],
    [4, 0.2, 0.3, 1.3, 1.2, '#93c5fd', '#bfdbfe'],
  ];

  for (var l = 0; l < layers.length; l++) {
    var layer = layers[l];
    var count = layer[0];
    var len = s * layer[1];
    var wid = s * layer[2];
    var curl = layer[3];
    var offset = layer[4];

    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + offset;
      drawPetal(angle, len, wid, curl, layer[5], layer[6]);
    }
  }

  // 中心螺旋
  ctx.beginPath();
  for (var t = 0; t < Math.PI * 5; t += 0.15) {
    var r = t * s * 0.012;
    var x = Math.cos(t) * r;
    var y = Math.sin(t) * r;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(191,219,254,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 中心光点
  var cg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.06);
  cg.addColorStop(0, 'rgba(200,220,255,0.9)');
  cg.addColorStop(1, 'rgba(100,150,255,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.06, 0, 6.28);
  ctx.fill();

  ctx.restore();
}

/* ===== 手势检测 ===== */
function getHandOpenness(lm) {
  var wrist = lm[0];
  var tips = [lm[4], lm[8], lm[12], lm[16], lm[20]];
  var mcps = [lm[2], lm[5], lm[9], lm[13], lm[17]];
  var total = 0;
  for (var i = 0; i < 5; i++) {
    var td = Math.sqrt(
      (tips[i].x - wrist.x) * (tips[i].x - wrist.x) +
        (tips[i].y - wrist.y) * (tips[i].y - wrist.y),
    );
    var md = Math.sqrt(
      (mcps[i].x - wrist.x) * (mcps[i].x - wrist.x) +
        (mcps[i].y - wrist.y) * (mcps[i].y - wrist.y),
    );
    total += md > 0.001 ? td / md : 0;
  }
  var avg = total / 5;
  // avg: ~1.0 = closed fist, ~2.0 = open hand
  return Math.max(0, Math.min(1, (avg - 1.0) / 1.0));
}

function onResults(results) {
  landmarks = results.multiHandLandmarks || [];
  lmLen = landmarks.length;
}

/* ===== 动画循环 ===== */
function animate(ts) {
  now = ts || 0;

  // FPS
  fpsCount++;
  if (ts - lastFpsTime >= 1000) {
    fps = fpsCount;
    fpsCount = 0;
    lastFpsTime = ts;
    fpsEl.textContent = fps + 'fps';
  }

  ctx.clearRect(0, 0, W, H);
  if (starCanvas) ctx.drawImage(starCanvas, 0, 0);

  // 手势控制
  if (lmLen > 0) {
    var lm = landmarks[0];
    var openness = getHandOpenness(lm);
    // 张开 = 大, 握拳 = 小
    targetScale = 0.3 + openness * 1.8;
    // 左右位置控制旋转
    var handX = 1 - lm[9].x; // 镜像
    targetRotation += (handX * 4 - targetRotation) * 0.05;

    statusEl.textContent =
      openness > 0.6 ? '🌸 张开' : openness < 0.3 ? '✊ 握拳' : '✋ 半开';
  }

  // 平滑插值
  currentScale += (targetScale - currentScale) * 0.08;
  currentRotation += (targetRotation - currentRotation) * 0.06;

  // 生成粒子（围绕玫瑰）
  if (Math.random() < 0.3) {
    var angle = Math.random() * 6.28;
    var dist = baseRoseSize * currentScale * (0.8 + Math.random() * 0.5);
    spawnParticle(
      W / 2 + Math.cos(angle) * dist,
      H / 2 + Math.sin(angle) * dist,
      220 + Math.random() * 60,
    );
  }

  updateParticles();

  // 绘制粒子（在玫瑰后面）
  drawParticles();

  // 绘制玫瑰
  drawRose(W / 2, H / 2, currentScale, currentRotation);

  requestAnimationFrame(animate);
}

/* ===== 进度管理 ===== */
function showProgress() {
  document.getElementById('startBtn').classList.add('hidden');
  progressWrap.style.display = 'block';
}

function setProgress(pct, text, step) {
  pfill.style.width = pct + '%';
  ppct.textContent = Math.round(pct) + '%';
  ptxt.textContent = text;
  pstep.textContent = step || '';
}

function failProgress(msg) {
  ptxt.textContent = '❌ ' + msg;
  pstep.textContent = '';
  pfill.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
  setTimeout(function () {
    progressWrap.style.display = 'none';
    document.getElementById('startBtn').classList.remove('hidden');
  }, 2000);
}

/* ===== 启动流程 ===== */
function handleStart() {
  if (isRunning) return;
  showProgress();
  setProgress(5, '加载 AI 库...', '步骤 1/3');

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
  script.crossOrigin = 'anonymous';
  script.onload = function () {
    setProgress(30, 'AI 库已加载', '步骤 1/3');
    setTimeout(initHands, 200);
  };
  script.onerror = function () {
    // 备用源
    setProgress(15, '切换备用源...', '步骤 1/3');
    var s2 = document.createElement('script');
    s2.src = 'https://unpkg.com/@mediapipe/hands/hands.js';
    s2.crossOrigin = 'anonymous';
    s2.onload = function () {
      setProgress(30, 'AI 库已加载', '步骤 1/3');
      setTimeout(initHands, 200);
    };
    s2.onerror = function () {
      // 直接进入触摸模式
      setProgress(100, '✓ 触摸模式就绪', '');
      setTimeout(function () {
        progressWrap.style.display = 'none';
        statusEl.textContent = '触摸模式 · 拖拽旋转 · 双指缩放';
      }, 500);
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(script);
}

function initHands() {
  setProgress(40, '初始化模型...', '步骤 2/3');

  if (typeof Hands === 'undefined') {
    setProgress(100, '✓ 触摸模式就绪', '');
    setTimeout(function () {
      progressWrap.style.display = 'none';
      statusEl.textContent = '触摸模式 · 拖拽旋转 · 双指缩放';
    }, 500);
    return;
  }

  try {
    handsObj = new Hands({
      locateFile: function (f) {
        if (f.includes('.wasm')) setProgress(55, '加载核心引擎...', '步骤 2/3');
        else if (f.includes('landmark'))
          setProgress(70, '加载识别模型...', '步骤 2/3');
        return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + f;
      },
    });

    handsObj.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });

    var modelReady = false;
    handsObj.onResults(function (r) {
      if (!modelReady) {
        modelReady = true;
        setProgress(90, '模型就绪', '步骤 2/3');
        setTimeout(startCamera, 200);
      }
      onResults(r);
    });

    setProgress(50, '加载模型文件...', '步骤 2/3');

    // 发送测试帧触发加载
    var tc = document.createElement('canvas');
    tc.width = 240;
    tc.height = 180;
    var tctx = tc.getContext('2d');
    tctx.fillStyle = '#000';
    tctx.fillRect(0, 0, 240, 180);
    setTimeout(function () {
      handsObj.send({ image: tc });
    }, 100);
  } catch (e) {
    setProgress(100, '✓ 触摸模式就绪', '');
    setTimeout(function () {
      progressWrap.style.display = 'none';
      statusEl.textContent = '触摸模式 · 拖拽旋转 · 双指缩放';
    }, 500);
  }
}

async function startCamera() {
  setProgress(92, '请求摄像头权限...', '步骤 3/3');

  // 显示手动触发按钮（让用户可以主动点击）
  document.getElementById('forceCamBtn').style.display = 'inline-block';
  pstep.textContent = '请点击下方绿色按钮允许摄像头';

  try {
    if (!navigator.mediaDevices) throw new Error('NO_CAMERA');

    var stream = await Promise.race([
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 240 },
          height: { ideal: 180 },
        },
        audio: false,
      }),
      new Promise(function (_, rej) {
        setTimeout(function () {
          rej(new Error('TIMEOUT'));
        }, 20000); // 延长到20秒
      }),
    ]);

    // 成功获取摄像头
    document.getElementById('forceCamBtn').style.display = 'none';
    document.getElementById('retryBtn').style.display = 'none';

    video.srcObject = stream;

    await Promise.race([
      new Promise(function (res) {
        video.onloadedmetadata = function () {
          video.play();
          res();
        };
      }),
      new Promise(function (_, rej) {
        setTimeout(function () {
          if (video.readyState === 0) rej(new Error('TIMEOUT'));
        }, 6000);
      }),
    ]);

    isRunning = true;
    setProgress(100, '✅ 启动完成！', '');
    setTimeout(function () {
      progressWrap.style.display = 'none';
      statusEl.textContent = '手势模式 · 张合缩放 · 左右旋转';
    }, 600);

    setInterval(function () {
      if (handsObj && video.readyState >= 2) handsObj.send({ image: video });
    }, 1000 / 8);
  } catch (e) {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(function (t) {
        t.stop();
      });
      video.srcObject = null;
    }
    if (e.message === 'TIMEOUT') {
      ptxt.textContent = '⚠️ 摄像头权限未响应';
      pstep.textContent = '请点击下方绿色按钮，或检查浏览器设置';
      document.getElementById('forceCamBtn').style.display = 'inline-block';
      document.getElementById('retryBtn').style.display = 'inline-block';
    } else {
      ptxt.textContent = '⚠️ ' + (e.message || '摄像头启动失败');
      pstep.textContent = '请点击下方按钮重试';
      document.getElementById('forceCamBtn').style.display = 'inline-block';
      document.getElementById('retryBtn').style.display = 'inline-block';
    }
  }
}

function retryCamera() {
  document.getElementById('retryBtn').style.display = 'none';
  document.getElementById('forceCamBtn').style.display = 'none';
  startCamera();
}

// 强制请求摄像头（用户主动点击）
function forceRequestCamera() {
  document.getElementById('forceCamBtn').style.display = 'none';
  ptxt.textContent = '正在请求摄像头...';
  pstep.textContent = '如果弹出权限窗口，请点击"允许"';

  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 240 },
        height: { ideal: 180 },
      },
      audio: false,
    })
    .then(function (stream) {
      video.srcObject = stream;
      video.onloadedmetadata = function () {
        video.play();
        isRunning = true;
        document.getElementById('retryBtn').style.display = 'none';
        setProgress(100, '✅ 摄像头已启用！', '');
        setTimeout(function () {
          progressWrap.style.display = 'none';
          statusEl.textContent = '手势模式 · 张合缩放 · 左右旋转';
        }, 600);

        setInterval(function () {
          if (handsObj && video.readyState >= 2)
            handsObj.send({ image: video });
        }, 1000 / 8);
      };
    })
    .catch(function (e) {
      ptxt.textContent = '❌ 摄像头被拒绝或不可用';
      pstep.textContent = '请在浏览器设置中允许摄像头权限，或使用触摸模式';
      document.getElementById('forceCamBtn').style.display = 'inline-block';
      document.getElementById('retryBtn').style.display = 'inline-block';
    });
}
