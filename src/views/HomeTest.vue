<template>
  <div id="container" ref="containerRef">
    <canvas id="canvas-back" ref="canvasBackRef"></canvas>
    
    <div id="logo-wrapper" ref="logoWrapperRef">
      <img id="logo-img" src="/home-logo.png" alt="Formosoul Logo" />
      <div id="socket-visual" ref="socketVisualRef"></div>
    </div>

    <canvas id="canvas-front" ref="canvasFrontRef"></canvas>

    <div id="letter-overlay" ref="letterOverlayRef">
      <div id="envelope-container" ref="envelopeContainerRef">
        <div class="envelope-body"></div>
        <div class="envelope-flap"></div>
        <div class="wax-seal"></div>
      </div>

      <div id="letter-content" ref="letterContentRef">
        <LetterContent @action="triggerBurnAction" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';
import LetterContent from '@/components/LetterContent.vue';

// --- Refs ---
const containerRef = ref(null);
const canvasBackRef = ref(null);
const canvasFrontRef = ref(null);
const logoWrapperRef = ref(null);
const socketVisualRef = ref(null);
const letterOverlayRef = ref(null);
const envelopeContainerRef = ref(null);
const letterContentRef = ref(null);

// --- Variables ---
let scene, camera, rendererBack, rendererFront;
let sceneLetter, cameraLetter;
let animationId;
let isBurning = false;
let isDragging = false;
let draggedSnitchIdx = -1;
let raycaster, mouse, dragPlane, dragOffset;
let burnUniforms, ashParticles, particleMaterial, letterMesh;
let clock;

const snitches = [];
const snitchCount = 10;

// --- Helper ---
const checkIsMobile = () => window.innerWidth < 768;

function getClientPos(event) {
  if (event.changedTouches && event.changedTouches.length > 0) {
    return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

// Logo 上洞口在螢幕的座標
function getHoleScreenPos() {
  if (!logoWrapperRef.value) return { x: 0, y: 0 };

  const logoWidth = logoWrapperRef.value.clientWidth;
  const logoHeight = logoWrapperRef.value.clientHeight;

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const offsetX = (0.733 - 0.5) * logoWidth;
  const offsetY = (0.72 - 0.5) * logoHeight;

  return {
    x: centerX + offsetX,
    y: centerY + offsetY,
  };
}

// 螢幕座標轉 3D 世界座標
function getHoleWorldPos() {
  const screenPos = getHoleScreenPos();

  const ndcX = (screenPos.x / window.innerWidth) * 2 - 1;
  const ndcY = -(screenPos.y / window.innerHeight) * 2 + 1;

  const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
  vec.unproject(camera);
  const dir = vec.sub(camera.position).normalize();
  const dist = -camera.position.z / dir.z;

  return camera.position.clone().add(dir.multiplyScalar(dist));
}

// snitch 世界座標到洞口的螢幕距離
function getScreenDistanceToHole(worldPos) {
  const vector = worldPos.clone().project(camera);
  const snitchX = ((vector.x + 1) / 2) * window.innerWidth;
  const snitchY = ((-vector.y + 1) / 2) * window.innerHeight;

  const holePos = getHoleScreenPos();

  return Math.sqrt(
    Math.pow(snitchX - holePos.x, 2) + Math.pow(snitchY - holePos.y, 2)
  );
}

// dock 後如果有改 camera / resize，可呼叫更新鎖點
function updateDockedSnitchLock() {
  const hero = snitches[0];
  if (!hero || !hero.isDocked) return;
  const newPos = getHoleWorldPos();
  hero.lockedPosition.copy(newPos);
  hero.group.position.copy(newPos);
}

// --- Interaction Logic ---
const triggerBurnAction = (action, url = null) => {
  if (isBurning) return;
  isBurning = true;

  const frontCanvas = canvasFrontRef.value;
  frontCanvas.classList.add('burn-mode');

  letterContentRef.value.classList.add('burning-active');
  letterMesh.visible = true;
  ashParticles.visible = true;

  letterMesh.position.set(0, 0, 0);
  letterMesh.rotation.set(0, 0, 0);
  burnUniforms.uProgress.value = 0;
  particleMaterial.uniforms.uBurnProgress.value = 0;

  const tl = gsap.timeline();

  tl.to(
    letterMesh.position,
    { y: 1.5, z: -4.0, duration: 2.5, ease: 'power1.in' },
    '<'
  );
  tl.to(
    letterMesh.rotation,
    { x: -0.5, z: 0.1, duration: 2.5, ease: 'power1.inOut' },
    '<'
  );
  tl.to(
    burnUniforms.uProgress,
    {
      value: 1.3,
      duration: 2.5,
      ease: 'linear',
      onUpdate: () => {
        particleMaterial.uniforms.uBurnProgress.value =
          burnUniforms.uProgress.value;
      },
    },
    '<'
  );

  tl.call(() => {
    if (action === 'redirect' && url) {
      window.location.href = url;
    } else {
      letterOverlayRef.value.classList.remove('show');
      letterOverlayRef.value.style.display = 'none';
      frontCanvas.classList.remove('burn-mode');

      setTimeout(() => {
        isBurning = false;
        letterMesh.visible = false;
        ashParticles.visible = false;
        letterContentRef.value.classList.remove('burning-active');

        // ★ 不再把 hero snitch 從 dock 狀態解掉
        // 如果你之後想讓它回到軌道再加邏輯

        envelopeContainerRef.value.style.opacity = '0';
        envelopeContainerRef.value.classList.remove('fade-out');
        envelopeContainerRef.value.classList.remove('open');
        letterContentRef.value.classList.remove('show');

        if (socketVisualRef.value)
          socketVisualRef.value.classList.remove('docked');
      }, 500);
    }
  });
};

function onDragStart(event) {
  if (isBurning) return;

  // ★ hero 已經卡進洞，就不要再拖它
  if (snitches[0] && snitches[0].isDocked) {
    return;
  }

  const pos = getClientPos(event);
  mouse.x = (pos.x / window.innerWidth) * 2 - 1;
  mouse.y = -(pos.y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const allGroups = snitches.map((s) => s.group);
  const intersects = raycaster.intersectObjects(allGroups, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !obj.userData.isLink && obj.parent) {
      obj = obj.parent;
    }
    if (obj && obj.userData.isLink) return;

    if (event.cancelable) event.preventDefault();
    let rootGroup = intersects[0].object;
    while (rootGroup.parent && rootGroup.parent.type !== 'Scene') {
      rootGroup = rootGroup.parent;
    }

    const idx = snitches.findIndex((s) => s.group === rootGroup);
    if (idx !== -1) {
      draggedSnitchIdx = idx;
      isDragging = true;
      containerRef.value.classList.add('dragging');
      if (idx === 0 && socketVisualRef.value)
        socketVisualRef.value.classList.add('active');

      const p = intersects[0].point;
      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()),
        p
      );
      dragOffset.copy(p).sub(snitches[idx].group.position);
    }
  }
}

function onDragMove(event) {
  if (!isDragging || draggedSnitchIdx === -1) return;
  if (event.cancelable) event.preventDefault();

  const pos = getClientPos(event);
  mouse.x = (pos.x / window.innerWidth) * 2 - 1;
  mouse.y = -(pos.y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, intersection);
  if (intersection)
    snitches[draggedSnitchIdx].group.position.copy(
      intersection.sub(dragOffset)
    );
}

function onDragEnd() {
  if (isDragging) {
    if (draggedSnitchIdx === 0) {
      const hero = snitches[0];

      const dist = getScreenDistanceToHole(hero.group.position);
      if (dist < 150) {
        const targetPos = getHoleWorldPos();

        hero.isDocked = true;
        hero.lockedPosition = targetPos.clone(); // ★ 鎖定世界座標
        hero.group.position.copy(targetPos);
        hero.group.position.z = targetPos.z; // 給穩定 z 值
        hero.group.lookAt(0, 0, 0);
        hero.isFront = true;

        if (hero.heroLight) hero.heroLight.intensity = 4.6;
        if (socketVisualRef.value)
          socketVisualRef.value.classList.add('docked');

        // 顯示信封 & 信紙
        letterOverlayRef.value.style.display = 'flex';
        // 觸發 reflow
        // eslint-disable-next-line no-unused-expressions
        letterOverlayRef.value.offsetHeight;
        letterOverlayRef.value.style.opacity = '1';

        const tl = gsap.timeline();
        gsap.set(envelopeContainerRef.value, {
          top: '-50%',
          left: '50%',
          xPercent: -50,
          yPercent: -50,
          scale: 0.2,
          rotationX: 0,
          rotation: 5,
          opacity: 1,
          zIndex: 10,
        });
        tl.to(envelopeContainerRef.value, {
          top: '60%',
          scale: 0.8,
          rotationX: 70,
          rotation: 0,
          duration: 2.5,
          ease: 'power2.out',
        });
        tl.add(() => {
          envelopeContainerRef.value.classList.add('open');
        }, '+=0.1');
        tl.add(() => {
          letterContentRef.value.classList.add('show');
          envelopeContainerRef.value.classList.add('fade-out');
        }, '+=0.5');
      }
      if (socketVisualRef.value)
        socketVisualRef.value.classList.remove('active');
    }

    isDragging = false;
    draggedSnitchIdx = -1;
    containerRef.value.classList.remove('dragging');
  }
}

function onDocumentClick(event) {
  if (isDragging || isBurning) return;
  const pos = getClientPos(event);
  mouse.x = (pos.x / window.innerWidth) * 2 - 1;
  mouse.y = -(pos.y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const targets = snitches.map((s) => s.group);
  const intersects = raycaster.intersectObjects(targets, true);
  for (let i = 0; i < intersects.length; i++) {
    let obj = intersects[i].object;
    while (obj && !obj.userData.isLink && obj.parent) {
      obj = obj.parent;
    }
    if (obj && obj.userData.isLink) {
      document.body.style.cursor = 'wait';
      setTimeout(() => {
        document.body.style.cursor = 'default';
        window.location.href = obj.userData.url;
      }, 100);
      return;
    }
  }
}

function onMouseMoveHover(event) {
  if (isDragging || isBurning) return;
  snitches.forEach((s) => {
    const lbl = s.group.getObjectByName('snitchLabel');
    if (lbl) lbl.visible = false;
  });
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const targets = snitches.map((s) => s.group);
  const intersects = raycaster.intersectObjects(targets, true);

  let hovering = false;
  if (intersects.length > 0) {
    let root = intersects[0].object;
    while (root.parent && root.parent.type !== 'Scene') {
      root = root.parent;
    }
    const lbl = root.getObjectByName('snitchLabel');
    if (lbl) lbl.visible = true;

    let obj = intersects[0].object;
    while (obj && !obj.userData.isLink && obj.parent) {
      obj = obj.parent;
    }
    if (obj && obj.userData.isLink) hovering = true;
  }

  if (hovering) document.body.classList.add('hover-link');
  else document.body.classList.remove('hover-link');
}

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  cameraLetter.aspect = w / h;
  cameraLetter.updateProjectionMatrix();
  rendererBack.setSize(w, h);
  rendererFront.setSize(w, h);

  const isMob = checkIsMobile();
  snitches.forEach((s) => {
    if (isMob && s.radiusBase !== 'large') {
      s.radius = s.isHero ? 6.8 : 4.5 + Math.random() * 5;
      s.radiusBase = 'large';
    } else if (!isMob && s.radiusBase !== 'small') {
      s.radius = s.isHero ? 3.5 : 2.5 + Math.random() * 3;
      s.radiusBase = 'small';
    }
  });

  // ★ 縮放後重算 dock 的 3D 鎖點
  updateDockedSnitchLock();
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const u = Math.min(1, t / 1.5);
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

  snitches.forEach((s, idx) => {
    // ★ hero dock 狀態：每幀強制鎖定位置與 front
    if (s.isHero && s.isDocked) {
      if (s.lockedPosition) {
        s.group.position.copy(s.lockedPosition);
      }
      s.group.lookAt(0, 0, 0);
      if (s.heroLight) s.heroLight.intensity = 4.7;
      s.isFront = true;
      return;
    }

    if (isDragging && draggedSnitchIdx === idx) {
      const dragFlap = Math.sin(t * 37 + s.phase) * 0.84;
      s.wings[0].rotation.z = -0.5 + dragFlap;
      s.wings[1].rotation.z = 0.5 - dragFlap;
      s.wings[0].rotation.x = Math.cos(t * 37) * 0.25;
      s.wings[1].rotation.x = Math.cos(t * 37) * 0.25;
      s.isFront = s.group.position.z > 0;
      return;
    }

    const extraAngle = u < 1 ? -2.3 * Math.PI * 2 * (1 - u) : 0;
    const baseAngle = t * s.speed + s.phase;
    const angle = baseAngle + extraAngle;
    const rNow =
      s.radius * easeOutCubic(u) + Math.sin(t * 0.3 + idx) * 0.2 * u;
    const x = rNow * Math.cos(angle) * Math.cos(s.inclination);
    const z = rNow * Math.sin(angle) * Math.cos(s.inclination);
    const y =
      Math.sin(angle * 1.2 + s.phase) * s.yAmp * u +
      Math.sin(t * 0.5 + idx) * 0.1 * u;
    s.group.position.set(x, y, z);
    s.group.lookAt(0, 0, 0);

    const flap = Math.sin(t * s.flapSpeed + s.phase) * 0.5;
    s.wings[0].rotation.z = -0.5 + flap * 0.6;
    s.wings[1].rotation.z = 0.5 - flap * 0.6;
    s.wings[0].rotation.x = Math.cos(t * s.flapSpeed) * 0.15;
    s.wings[1].rotation.x = Math.cos(t * s.flapSpeed) * 0.15;
    s.isFront = s.group.position.z > 0;
  });

  // Render Pipeline
  snitches.forEach((s) => {
    s.group.visible = !s.isFront;
  });
  rendererBack.render(scene, camera);

  rendererFront.clear();

  if (!isBurning) {
    snitches.forEach((s) => {
      s.group.visible = s.isFront;
    });
    rendererFront.render(scene, camera);
  }

  if (isBurning && burnUniforms) {
    burnUniforms.uTime.value = t;
    particleMaterial.uniforms.uTime.value = t;
    rendererFront.clearDepth();
    rendererFront.render(sceneLetter, cameraLetter);
  }
}

// --- Initialization ---
onMounted(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const textureLoader = new THREE.TextureLoader();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
  camera.position.set(0, 0.8, 7);
  camera.lookAt(0, 0, 0);

  rendererBack = new THREE.WebGLRenderer({
    canvas: canvasBackRef.value,
    antialias: true,
    alpha: true,
  });
  rendererBack.setPixelRatio(window.devicePixelRatio);
  rendererBack.setSize(width, height);
  rendererBack.setClearColor(0x000000, 0);

  rendererFront = new THREE.WebGLRenderer({
    canvas: canvasFrontRef.value,
    antialias: true,
    alpha: true,
  });
  rendererFront.setPixelRatio(window.devicePixelRatio);
  rendererFront.setSize(width, height);
  rendererFront.setClearColor(0x000000, 0);
  rendererFront.autoClear = false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 0.9));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(5, 8, 4);
  scene.add(dirLight);

  initBurnScene();
  initSnitches(textureLoader);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  dragPlane = new THREE.Plane();
  dragOffset = new THREE.Vector3();
  clock = new THREE.Clock();

  window.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('click', onDocumentClick);
  window.addEventListener('touchstart', onDragStart, { passive: false });
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('touchend', onDragEnd);
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMoveHover);

  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('mousedown', onDragStart);
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('click', onDocumentClick);
  window.removeEventListener('touchstart', onDragStart);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('touchend', onDragEnd);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', onMouseMoveHover);
});

// --- Setup Burn Scene ---
// --- Setup Burn Scene (Hand-coded to match Vue CSS 1:1) ---
function initBurnScene() {
  sceneLetter = new THREE.Scene();
  cameraLetter = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  cameraLetter.position.z = 3.5;

  const cvs = document.createElement('canvas');
  // 解析度設定 (維持高解析度)
  const cvsW = 1800;
  const cvsH = 1300;
  cvs.width = cvsW;
  cvs.height = cvsH;
  const ctx = cvs.getContext('2d');

  // --- 1. 背景設定 (對應 CSS .modal-overlay) ---
  ctx.clearRect(0, 0, cvsW, cvsH);
  
  // 羊皮紙色 + 0.95 透明度
  ctx.fillStyle = 'rgba(244, 228, 188, 0.95)'; 
  ctx.fillRect(0, 0, cvsW, cvsH);

  // --- 排版參數 (對應 CSS Padding) ---
  // CSS Padding: Top 54px, Side 20px
  // 換算到 1800 寬度 Canvas (約 2.5倍)
  const marginX = 50;   
  const marginY = 140;  
  const contentWidth = cvsW - (marginX * 2);
  let currentY = marginY;

  // 字體設定 (對應 CSS font-family: "Georgia")
  const fontBase = 'Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left'; 

  // --- 2. 標題繪製 (對應 .letter-header) ---
  
  // H1: Formosoul Institute of Magic
  // CSS: color: #3e2723, font-size: 2.5rem (~80px on canvas)
  ctx.fillStyle = '#3e2723'; 
  ctx.font = `bold 80px ${fontBase}`;
  ctx.fillText('Formosoul Institute of Magic', marginX, currentY + 60);
  currentY += 90; 

  // H2: Admission Notice
  // CSS: color: #5d4037, font-size: 1.5rem (~50px on canvas)
  ctx.fillStyle = '#5d4037';
  ctx.font = `normal 50px ${fontBase}`;
  ctx.fillText('Admission Notice', marginX, currentY + 40);
  
  currentY += 70; // H2 下方留一點空間給線條

  // ★★★ 重點：標題底線 (對應 border-bottom) ★★★
  // CSS: 2px solid rgba(90, 58, 34, 0.2)
  ctx.beginPath();
  ctx.moveTo(marginX, currentY); // 從左邊界開始
  ctx.lineTo(cvsW - marginX, currentY); // 畫到右邊界
  ctx.lineWidth = 5; // Canvas 解析度較高，線條要加粗一點才看得到
  ctx.strokeStyle = 'rgba(90, 58, 34, 0.2)'; // 顏色完全對應
  ctx.stroke();

  // header margin-bottom: 30px -> Canvas ~70px
  currentY += 70; 

  // --- 3. 內文繪製 (對應 .letter-body) ---
  // CSS: color: #3e2723, font-size: 1.1rem (~36px)
  // CSS: line-height: 1.8 (~65px)
  ctx.fillStyle = '#3e2723'; 
  ctx.font = `36px ${fontBase}`; 
  const lineHeight = 65; 
  const paragraphSpacing = 50; // CSS margin-bottom: 24px -> ~50px

  const rawText =
    'Dear Prospective International Student,\n\nYou are about to step into this magical academy, hidden within the alleys of Taiwan, as an "Auditing Student" or "International Student." From this moment on, you will explore the daily life and magical wonders of Taiwan from the perspective of a visiting student.\n\nThe Academy has prepared six special courses and six interactive mini-games, guiding you to discover temples, night markets, local cuisine, and folk culture.\n\nThese games are scattered throughout different corners of the campus, waiting for you to find them. Successfully complete all the interactive games to graduate and receive a discount coupon from the Taiwan Magical Marketplace.\n\nYou may first explore the campus as an auditing student; after completing the games, if you wish to accumulate credits and save your progress, you can register at any time to receive your magical student ID.';

  function wrapText(context, text, x, y, maxWidth, lh, paraSpace) {
    const paragraphs = text.split('\n');
    let cursorY = y;
    paragraphs.forEach((paragraph) => {
      if (paragraph === '') return;
      const words = paragraph.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          context.fillText(line, x, cursorY);
          line = words[n] + ' ';
          cursorY += lh;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, cursorY);
      cursorY += lh + paraSpace; 
    });
    return cursorY;
  }

  wrapText(ctx, rawText, marginX, currentY, contentWidth, lineHeight, paragraphSpacing);

  // --- 4. 底部區域 (Footer) ---
  const bottomBaseY = cvsH - marginY; // 底部留白

  // 4-1. 簽名 (左下)
  // CSS: color: #3e2723, italic
  ctx.fillStyle = '#3e2723';
  ctx.font = `italic 34px ${fontBase}`;
  const signLH = 50;
  let signY = bottomBaseY - (signLH * 2.5); 
  
  ctx.fillText('Sincerely,', marginX, signY);
  signY += signLH;
  ctx.font = `italic 34px ${fontBase}`; 
  ctx.fillText('Formosoul Institute of Magic', marginX, signY);
  signY += signLH;
  ctx.fillText('Office of Academic Affairs.', marginX, signY);

  // 4-2. 按鈕 (右下)
  const btnH = 85;        
  const btnW_Audit = 320; 
  const btnW_Reg = 280;   
  const btnGap = 30;      
  const btnRadius = 8;    
  
  const btnY = bottomBaseY - btnH;
  const btnRegX = cvsW - marginX - btnW_Reg;
  const btnAuditX = btnRegX - btnGap - btnW_Audit;

  // [Audit 按鈕] 
  // CSS: background: transparent, border: 2px solid #5a3a22, color: #5a3a22
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 4; // 邊框
  ctx.beginPath();
  ctx.roundRect(btnAuditX, btnY, btnW_Audit, btnH, btnRadius);
  ctx.stroke(); 
  
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a3a22'; 
  ctx.font = `bold 32px ${fontBase}`;
  ctx.fillText('Audit the Academy', btnAuditX + (btnW_Audit / 2), btnY + 55);

  // [Register 按鈕]
  // CSS: background: #FFCC46 (你的新顏色), border: 2px solid #b4941f
  ctx.fillStyle = '#FFCC46'; // 實心填充
  ctx.beginPath();
  ctx.roundRect(btnRegX, btnY, btnW_Reg, btnH, btnRadius);
  ctx.fill();

  // 邊框
  ctx.strokeStyle = '#b4941f';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // 文字 CSS: color: #2c1e14
  ctx.fillStyle = '#2c1e14'; 
  ctx.font = `bold 32px ${fontBase}`;
  ctx.fillText('Register Now', btnRegX + (btnW_Reg / 2), btnY + 55);

  // --- Texture & Shader ---
  const paperTex = new THREE.CanvasTexture(cvs);
  paperTex.colorSpace = THREE.SRGBColorSpace; 

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform float uTime;
    uniform float uProgress;
    uniform sampler2D uTexture;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.0 + 0.2;
        a *= 0.5;
      }
      return v;
    }
    void main() {
      vec2 uv = vUv;
      vec4 texColor = texture2D(uTexture, uv);
      float fireNoise = fbm(uv * 5.0 + vec2(0.0, uTime * 2.0));
      float gradient = uv.y;
      
      float threshold = uProgress * 1.5 - 0.2;
      float burnVal = gradient + fireNoise * 0.15;
      float diff = burnVal - threshold;

      if (diff < 0.0) {
        discard; 
      } else if (diff < 0.1) {
        float t = diff / 0.1;
        vec3 fireCol = mix(vec3(4.0, 2.0, 0.5), vec3(1.0, 0.4, 0.0), t);
        fireCol = mix(fireCol, vec3(0.2, 0.0, 0.0), smoothstep(0.4, 1.0, t));
        gl_FragColor = vec4(fireCol, 1.0);
      } else if (diff < 0.15) {
        float t = (diff - 0.1) / 0.05;
        vec3 charCol = mix(vec3(0.0), texColor.rgb, t);
        gl_FragColor = vec4(charCol, texColor.a);
      } else {
        gl_FragColor = texColor;
      }
    }
  `;

  burnUniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uTexture: { value: paperTex },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: burnUniforms,
    side: THREE.DoubleSide,
    transparent: true,     
    depthWrite: false,     // 確保不會擋住背後的金探子
  });

  const geometry = new THREE.PlaneGeometry(3.6, 2.6, 60, 60);
  letterMesh = new THREE.Mesh(geometry, material);
  letterMesh.visible = false;
  sceneLetter.add(letterMesh);

  // --- 粒子系統 (這部分不用動) ---
  const particleCount = 2000;
  const posArray = new Float32Array(particleCount * 3);
  const randomArray = new Float32Array(particleCount);
  const sizeArray = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    posArray[i * 3] = (Math.random() - 0.5) * 3.6;
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    randomArray[i] = Math.random();
    sizeArray[i] = Math.random();
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
  particlesGeo.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));

  particleMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float uTime;
      uniform float uBurnProgress;
      attribute float aRandom;
      attribute float aSize;
      varying float vLife;
      void main() {
        vec3 pos = position;
        float normalizedY = (pos.y + 1.3) / 2.6;
        float threshold = uBurnProgress * 1.5 - 0.2;
        vLife = 0.0;
        if (threshold > normalizedY) {
          float flyTime = (threshold - normalizedY) * 2.5;
          pos.y += flyTime * (2.0 + aRandom);
          pos.x += sin(flyTime * 5.0 + aRandom * 10.0) * 0.15;
          pos.z += cos(flyTime * 3.0) * 0.5;
          vLife = 1.0 - flyTime * 0.4;
        }
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (8.0 * aSize + 4.0) * vLife * (1.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying float vLife;
      void main() {
        if (vLife <= 0.0) discard;
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;
        vec3 color = mix(vec3(1.0, 0.5, 0.1), vec3(0.1, 0.1, 0.1), vLife);
        float alpha = smoothstep(0.5, 0.0, dist) * vLife;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    uniforms: { uTime: { value: 0 }, uBurnProgress: { value: 0 } },
    transparent: true,
    depthWrite: false, 
    blending: THREE.AdditiveBlending,
  });
  ashParticles = new THREE.Points(particlesGeo, particleMaterial);
  ashParticles.visible = false;
  sceneLetter.add(ashParticles);
}
// --- Setup Snitches ---
function initSnitches(loader) {
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd27f,
    metalness: 0.9,
    roughness: 0.3,
    emissive: 0x352100,
    emissiveIntensity: 0.22,
  });
  const heroBallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffec7e,
    metalness: 1,
    roughness: 0.07,
    emissive: 0xffe400,
    emissiveIntensity: 0.62,
  });
  const ballGeometry = new THREE.SphereGeometry(0.12, 32, 32);
  const featherMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e6dc,
    metalness: 0.4,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const featherGeometry = new THREE.BoxGeometry(0.03, 0.42, 0.005);

  const createWing = (side = 1) => {
    const wingGroup = new THREE.Group();
    const featherCount = 10;
    const spread = THREE.MathUtils.degToRad(35);
    for (let i = 0; i < featherCount; i++) {
      const feather = new THREE.Mesh(featherGeometry, featherMaterial);
      feather.castShadow = true;
      feather.receiveShadow = true;
      const t = i / (featherCount - 1);
      const angle = (t - 0.5) * spread;
      feather.scale.y = 0.6 + 0.4 * Math.sin(t * Math.PI);
      feather.position.y = (t - 0.4) * 0.35;
      feather.position.x = -(t * 0.1) * side;
      feather.rotation.z = angle * side * 1.2;
      feather.rotation.x = t * 0.2 * side;
      wingGroup.add(feather);
    }
    wingGroup.position.x = 0.05 * side;
    return wingGroup;
  };

  const createTextLabel = (text) => {
    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    cvs.width = 512;
    cvs.height = 128;
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 256, 64);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.strokeText(text, 256, 64);
    const tex = new THREE.CanvasTexture(cvs);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
  };

  const createSnitch = (isHero, linkData) => {
    const group = new THREE.Group();
    const ball = new THREE.Mesh(
      ballGeometry,
      isHero ? heroBallMaterial : ballMaterial
    );
    ball.castShadow = true;
    ball.receiveShadow = true;
    group.add(ball);

    const lWing = createWing(-1);
    const rWing = createWing(1);
    lWing.rotation.z = Math.PI / 2;
    rWing.rotation.z = -Math.PI / 2;
    const lAlign = new THREE.Group();
    lAlign.add(lWing);
    lAlign.rotation.x = Math.PI / 2;
    lAlign.position.x = -0.1;
    const rAlign = new THREE.Group();
    rAlign.add(rWing);
    rAlign.rotation.x = Math.PI / 2;
    rAlign.position.x = 0.1;
    const lPivot = new THREE.Group();
    lPivot.add(lAlign);
    const rPivot = new THREE.Group();
    rPivot.add(rAlign);
    group.add(lPivot);
    group.add(rPivot);

    if (linkData) {
      const tex = loader.load(linkData.img);
      tex.colorSpace = THREE.SRGBColorSpace;
      const rodMat = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b,
        roughness: 0.4,
        metalness: 0.6,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 1.0,
        roughness: 0.3,
      });
      const photoMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
      });
      const scrollGroup = new THREE.Group();
      scrollGroup.position.set(0, -1.8, 0);

      const canvasGeo = new THREE.PlaneGeometry(0.6, 0.9);
      const canvasMesh = new THREE.Mesh(canvasGeo, photoMat);
      scrollGroup.add(canvasMesh);

      const topRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.75, 16),
        rodMat
      );
      topRod.rotation.z = Math.PI / 2;
      topRod.position.y = 0.45;
      scrollGroup.add(topRod);

      const botRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.75, 16),
        rodMat
      );
      botRod.rotation.z = Math.PI / 2;
      botRod.position.y = -0.45;
      scrollGroup.add(botRod);

      const capGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
      [
        { y: 0.45, x: -0.375 },
        { y: 0.45, x: 0.375 },
        { y: -0.45, x: -0.375 },
        { y: -0.45, x: 0.375 },
      ].forEach((p) => {
        const c = new THREE.Mesh(capGeo, goldMat);
        c.rotation.z = Math.PI / 2;
        c.position.set(p.x, p.y, 0);
        scrollGroup.add(c);
      });

      if (linkData.name) {
        const lbl = createTextLabel(linkData.name);
        lbl.position.set(0, 0.85, 0);
        lbl.visible = false;
        lbl.name = 'snitchLabel';
        scrollGroup.add(lbl);
      }
      scrollGroup.userData = { url: linkData.url, isLink: true };

      const hitGeo = new THREE.BoxGeometry(0.5, 0.7, 0.2);
      const hitMesh = new THREE.Mesh(
        hitGeo,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.userData = { url: linkData.url, isLink: true };
      scrollGroup.add(hitMesh);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.25, -1.35, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.25, -1.35, 0),
      ]);
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.7,
        })
      );
      group.add(line);
      group.add(scrollGroup);
    }

    let heroLight = null;
    if (isHero) {
      heroLight = new THREE.PointLight(0xffe400, 2.8, 2.3);
      group.add(heroLight);
      group.scale.set(1.6, 1.6, 1.6);
    }
    return { group, wings: [lPivot, rPivot], heroLight };
  };

  const isMobile = checkIsMobile();
  let menuIdx = 0;
  const menuItemsData = [
    { name: 'Classes', img: '/home-class-book.png', url: '#schedule' },
    { name: 'Mentors', img: '/home-professor-people.png', url: '#professors' },
    { name: 'Daily Prophet', img: '/home-news-owl.png', url: '#map' },
    { name: 'Diagon Alley', img: '/home-shopping-money.png', url: '#alley' },
    { name: 'Annual Events', img: '/home-annual-lantern.png', url: '#events' },
    { name: 'History', img: '/home-about-badge.png', url: '#about' },
    {
      name: 'Survival Guide',
      img: '/home-survival-compass.png',
      url: '#survival',
    },
  ];

  for (let i = 0; i < snitchCount; i++) {
    const isHero = i === 0;
    let linkData = null;
    if (!isHero && menuIdx < menuItemsData.length) {
      linkData = menuItemsData[menuIdx];
      menuIdx++;
    }
    const snitch = createSnitch(isHero, linkData);

    let radius;
    if (isMobile) radius = isHero ? 6.8 : 4.5 + Math.random() * 5.0;
    else radius = isHero ? 3.5 : 2.5 + Math.random() * 3.0;

    snitches.push({
      group: snitch.group,
      wings: snitch.wings,
      heroLight: snitch.heroLight,
      radius,
      speed: isHero ? 0.3 : 0.2 + Math.random() * 0.25,
      flapSpeed: isHero ? 12 : 10 + Math.random() * 5,
      inclination: isHero
        ? 0.12
        : THREE.MathUtils.degToRad(-30 + Math.random() * 60),
      phase: isHero ? Math.PI * 1.2 : Math.random() * Math.PI * 2,
      yAmp: isHero ? 0.64 : 0.4 + Math.random() * 0.6,
      isFront: false,
      isDocked: false,
      lockedPosition: null,
      radiusBase: isMobile ? 'large' : 'small',
      isHero,
    });
    scene.add(snitch.group);
  }
}
</script>

<style scoped>
#container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  touch-action: none;
}
canvas {
  display: block;
  position: absolute;
  inset: 0;
  transition: z-index 0s;
}
#canvas-back {
  z-index: 0;
}
#canvas-front {
  z-index: 2;
  pointer-events: none;
}
#canvas-front.burn-mode {
  z-index: 101 !important;
}

/* Logo & Socket */
#logo-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  height: auto;
  z-index: 1;
  pointer-events: none;
  width: 811px;
  max-width: 45vw;
  animation: expandFromPoint 3s
    cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}
#logo-img {
  display: block;
  width: 100%;
  height: auto;
}
@keyframes expandFromPoint {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.05);
    filter: blur(10px) brightness(2);
  }
  40% {
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.05);
    filter: blur(0px) brightness(1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

#socket-visual {
  position: absolute;
  left: 73.3%;
  top: 72%;
  transform: translate(-50%, -50%);
  width: 6%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0) 70%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  transition: all 0.4s ease-out;
  z-index: 5;
  pointer-events: none;
}
@media (max-width: 768px) {
  #socket-visual {
    width: 12%;
  }
}
#socket-visual.active {
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 10%,
    rgba(255, 230, 100, 0.9) 30%,
    rgba(255, 200, 0, 0.4) 50%,
    rgba(255, 200, 0, 0) 70%
  );
  border-color: rgba(255, 255, 255, 0.9);
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.8),
    0 0 40px rgba(255, 215, 0, 0.6),
    0 0 80px rgba(255, 100, 0, 0.4),
    0 0 120px rgba(255, 255, 255, 0.2);
}
#socket-visual::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140%;
  height: 140%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 220, 100, 0.3),
    transparent 70%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: -1;
}
#socket-visual.active::after {
  opacity: 1;
  animation: glowBreathe 2s ease-in-out infinite alternate;
}
@keyframes glowBreathe {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.8;
  }
}
#socket-visual.docked {
  background: #fff;
  border-color: #fff;
  transform: translate(-50%, -50%) scale(0.8);
  box-shadow:
    0 0 60px rgba(255, 255, 255, 1),
    0 0 120px rgba(255, 215, 0, 0.8);
  transition:
    transform 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}
#socket-visual.docked::after {
  opacity: 0;
  transition: opacity 0.1s;
}

/* Letter Overlay */
#letter-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.5s ease-out;
  perspective: 1200px;
}
#letter-overlay.show {
  display: flex;
}

#envelope-container {
  position: absolute;
  width: 340px;
  height: 240px;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transform-style: preserve-3d;
}
.envelope-body {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: #d4b896;
  border-radius: 5px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  z-index: 10;
  overflow: hidden;
}
.envelope-body::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 120px 170px 0 170px;
  border-color:
    transparent #e0ccb3 #e0ccb3 transparent;
  z-index: 11;
  pointer-events: none;
}
.envelope-body::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 170px 130px 170px;
  border-color:
    transparent transparent #c9ad8a transparent;
  z-index: 12;
  pointer-events: none;
}
.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120px;
  background: #bf9e7a;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: top center;
  transition: transform 0.8s
    cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 15;
}
.wax-seal {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 55px;
  height: 55px;
  background: radial-gradient(
    circle,
    #8b0000 0%,
    #5c0000 100%
  );
  border-radius: 50%;
  border: 2px solid #6b0000;
  z-index: 16;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  transition:
    transform 0.4s,
    opacity 0.4s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd700;
  font-family: Georgia, serif;
  font-weight: bold;
  font-size: 26px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
}
.wax-seal::after {
  content: 'F';
}
#envelope-container.open .envelope-flap {
  transform: rotateX(180deg);
  z-index: 5;
}
#envelope-container.open .wax-seal {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
#envelope-container.fade-out {
  opacity: 0 !important;
  pointer-events: none;
  transition: opacity 0.5s ease-out;
}

/* Letter Content Wrapper */
#letter-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.1);
  width: 95%;
  max-width: 1200px;
  height: 90vh;
  max-height: none;
  background-color: #f3eada;
  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E"),
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0) 20%,
      rgba(139, 111, 71, 0.15) 100%
    );
  border: 1px solid #cda;
  border-radius: 4px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  opacity: 0;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 20;
  transition: all 0.8s
    cubic-bezier(0.34, 1.56, 0.64, 1);
}
#letter-content::-webkit-scrollbar {
  display: none;
}
#letter-content.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
#letter-content.burning-active {
  opacity: 0 !important;
  visibility: hidden !important;
  transition: none !important;
}
</style>
