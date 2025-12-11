<!-- 螺旋式展開 -->
<template>
  <div id="home-container" ref="containerRef">
    <canvas id="home-canvas-back" ref="canvasBackRef"></canvas>
    
    <div id="home-logo-wrapper" ref="logoWrapperRef">
      <img id="home-logo-img" src="/Home/home-logo.png" alt="Formosoul Logo" />
      <div id="home-socket-visual" ref="socketVisualRef"></div>
    </div>

    <canvas id="home-canvas-front" ref="canvasFrontRef"></canvas>

    <div id="home-letter-overlay" ref="letterOverlayRef">
      <div id="home-envelope-container" ref="envelopeContainerRef">
        <div class="home-envelope-body"></div>
        <div class="home-envelope-flap"></div>
        <div class="home-wax-seal"></div>
      </div>
    </div>

    <Transition name="home-fade">
      <AdmissionLetter 
        v-if="showLetter" 
        @close="onLetterClose" 
      />
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';
// 確保路徑正確
import AdmissionLetter from '@/components/Home/AdmissionLetter.vue';

// --- Refs ---
const containerRef = ref(null);
const canvasBackRef = ref(null);
const canvasFrontRef = ref(null);
const logoWrapperRef = ref(null);
const socketVisualRef = ref(null);
const letterOverlayRef = ref(null);
const envelopeContainerRef = ref(null);

// --- State ---
const showLetter = ref(false); // 控制 AdmissionLetter 組件顯示

// --- Variables ---
let scene, camera, rendererBack, rendererFront;
let animationId;
let isDragging = false;
let draggedSnitchIdx = -1;
let raycaster, mouse, dragPlane, dragOffset;
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

  const offsetX = (0.715 - 0.5) * logoWidth;
  const offsetY = (0.71 - 0.5) * logoHeight;

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

// 處理 AdmissionLetter 發出的 close 事件
const onLetterClose = () => {
  // 1. 關閉 Vue 信紙組件
  showLetter.value = false;
  
  // 2. 隱藏 HTML 遮罩層 (那個黑底)
  if (letterOverlayRef.value) {
    letterOverlayRef.value.style.display = 'none';
  }
  
  // 3. 重置 HTML 信封的 CSS 狀態 (為了避免殘留樣式)
  if (envelopeContainerRef.value) {
    envelopeContainerRef.value.style.opacity = '0';
    // Class 操作已更名: home-fade-out, home-open
    envelopeContainerRef.value.classList.remove('home-fade-out');
    envelopeContainerRef.value.classList.remove('home-open');
  }

  const hero = snitches[0];
  if (hero) {
    // 確保它維持在鎖定狀態
    hero.isDocked = true; 
    
    // 確保它維持在前景 (因為背景層會被 Logo 遮住)
    hero.isFront = true; 
    
    // 維持較亮的亮度 (模擬卡在能量槽的發光感)
    if (hero.heroLight) hero.heroLight.intensity = 4.6; 
  }

  // 確保插槽視覺保持 "docked" (亮起) 狀態
  // 不要移除 'home-docked' class
  if (socketVisualRef.value) {
    // Class 操作已更名: home-docked
    socketVisualRef.value.classList.add('home-docked');
  }
};

function onDragStart(event) {
  // ★ 新增：如果點擊的目標不在 home-container 內 (例如點到 Modal 或 Header)，則不處理
  if (!containerRef.value || !containerRef.value.contains(event.target)) return;

  // 如果信件開著，禁止拖曳
  if (showLetter.value) return;

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
      // Class 操作已更名: home-dragging
      containerRef.value.classList.add('home-dragging');
      if (idx === 0 && socketVisualRef.value)
        // Class 操作已更名: home-active
        socketVisualRef.value.classList.add('home-active');

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
          // Class 操作已更名: home-docked
          socketVisualRef.value.classList.add('home-docked');

        // 1. 顯示 HTML 信封覆蓋層
        letterOverlayRef.value.style.display = 'flex';
        // 觸發 reflow
        // eslint-disable-next-line no-unused-expressions
        letterOverlayRef.value.offsetHeight;
        letterOverlayRef.value.style.opacity = '1';

        // 2. 執行信封飛入與打開動畫
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
          duration: 1.5,
          ease: 'power2.out',
        });
        // 打開信封蓋
        tl.add(() => {
          // Class 操作已更名: home-open
          envelopeContainerRef.value.classList.add('home-open');
        }, '+=0.1');
        
        // 3. 信封打開後，隱藏 HTML 信封，顯示 Vue AdmissionLetter 組件
        tl.add(() => {
          // 讓 HTML 信封淡出
          // Class 操作已更名: home-fade-out
          envelopeContainerRef.value.classList.add('home-fade-out');
        }, '+=0.5');
        
        tl.add(() => {
           // 啟用全螢幕信紙組件
           showLetter.value = true;
           // 隱藏 HTML overlay 避免干擾點擊
           letterOverlayRef.value.style.display = 'none';
        }, '+=0.5'); // 等待淡出差不多後切換
      }
      
      if (socketVisualRef.value)
        // Class 操作已更名: home-active
        socketVisualRef.value.classList.remove('home-active');
    }

    isDragging = false;
    draggedSnitchIdx = -1;
    // Class 操作已更名: home-dragging
    containerRef.value.classList.remove('home-dragging');
  }
}

function onDocumentClick(event) {
  // ★ 新增：如果點擊的目標不在 home-container 內，則不處理
  if (!containerRef.value || !containerRef.value.contains(event.target)) return;

  if (isDragging || showLetter.value) return;
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
  // ★ 新增：如果滑鼠不在 home-container 內 (例如懸停在 Modal 上)，則不處理
  if (!containerRef.value || !containerRef.value.contains(event.target)) {
     // 離開容器範圍時，確保移除 hover class
     document.body.classList.remove('home-hover-link');
     return;
  }

  if (isDragging || showLetter.value) return;
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

  // Class 操作已更名: home-hover-link
  if (hovering) document.body.classList.add('home-hover-link');
  else document.body.classList.remove('home-hover-link');
}

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  rendererBack.setSize(w, h);
  rendererFront.setSize(w, h);

  const isMob = checkIsMobile();
  snitches.forEach((s, i) => {
    if (isMob) {
      s.radius = s.isHero ? 3.0 : 2.8 + (i % 2) * 0.4;
      s.radiusBase = 'large';
    } else {
      // ▼▼▼ 電腦版縮放後距離 (建議跟下面的設定保持一致) ▼▼▼
      s.radius = s.isHero ? 1.8 : 1.6 + (i % 2) * 0.4;
      s.radiusBase = 'small';
    }
  });

  // ★ 縮放後重算 dock 的 3D 鎖點
  updateDockedSnitchLock();
}

// ★★★ 新增：控制軌道傾斜程度的常數 ★★★
// 數字越大，傾斜越明顯（後方越高，前方越低）。試試看 0.3 到 0.6 之間的值。
const ORBIT_TILT = 0.3; 

function animate() {
  animationId = requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // 1. 修改動畫時間：從 1 秒改成 3 秒 (t / 3)，這樣才看得清楚螺旋過程
  const duration = 3.0; 
  const u = Math.min(1, t / duration);

  // Easing 函數：控制擴散的加速度
  // easeOutCubic 會讓它一開始衝很快，後面慢下來。
  // 如果想要螺旋更均勻，可以改用 easeOutQuad 或甚至 linear ( x => x )
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

    // 拖曳邏輯
    if (isDragging && draggedSnitchIdx === idx) {
      const dragFlap = Math.sin(t * 37 + s.phase) * 0.84;
      s.wings[0].rotation.z = -0.5 + dragFlap;
      s.wings[1].rotation.z = 0.5 - dragFlap;
      s.wings[0].rotation.x = Math.cos(t * 37) * 0.25;
      s.wings[1].rotation.x = Math.cos(t * 37) * 0.25;
      s.isFront = s.group.position.z > 0;
      return;
    }

    // ★★★ 修改重點 1：螺旋角度計算 ★★★
    // 原始代碼是 -2.3 * ...，我們改成 -6.0 (代表多轉 6 圈)
    // 數字越大，螺旋越密；數字越小，越像直接炸開
    const spiralRotations = 6.0; 
    const extraAngle = u < 1 ? -spiralRotations * Math.PI * 2 * (1 - easeOutCubic(u)) : 0;
    
    const baseAngle = t * s.speed + s.phase;
    
    // 將螺旋角度疊加到基礎角度上
    const angle = baseAngle + extraAngle;
    
    // 計算當前半徑 (從 0 到 最終半徑)
    const rNow = s.radius * easeOutCubic(u);
    
    // 1. 計算基礎水平面 (XZ平面) 上的圓周運動座標
    const xBase = rNow * Math.cos(angle);
    const zBase = rNow * Math.sin(angle);

    // 2. 根據深度 (Z) 來計算傾斜高度 (Y)
    // 這是上一版加的傾斜邏輯，螺旋時也會生效，會變成「傾斜的螺旋」
    const tiltY = -zBase * ORBIT_TILT;

    // 3. 自然波動
    const naturalWaveY = Math.sin(angle * 1.2 + s.phase) * (s.yAmp * 0.3) * u;
    const randomFloatY = Math.sin(t * 0.5 + idx) * 0.1 * u;

    // 4. 組合最終座標
    const x = xBase;
    const z = zBase;
    const y = tiltY + naturalWaveY + randomFloatY;

    s.group.position.set(x, y, z);
    s.group.lookAt(0, 0, 0);

    // 翅膀拍動動畫
    const flap = Math.sin(t * s.flapSpeed + s.phase) * 0.5;
    s.wings[0].rotation.z = -0.5 + flap * 0.6;
    s.wings[1].rotation.z = 0.5 - flap * 0.6;
    s.wings[0].rotation.x = Math.cos(t * s.flapSpeed) * 0.15;
    s.wings[1].rotation.x = Math.cos(t * s.flapSpeed) * 0.15;
    
    // 判斷是否在前景 (Z > 0)
    s.isFront = s.group.position.z > 0;
  });

  // Render Pipeline
  snitches.forEach((s) => {
    s.group.visible = !s.isFront;
  });
  rendererBack.render(scene, camera);

  rendererFront.clear();

  snitches.forEach((s) => {
    s.group.visible = s.isFront;
  });
  rendererFront.render(scene, camera);
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

  // 初始化金探子 (移除了 initBurnScene)
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

// --- Setup Snitches (已修改邏輯) ---
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
    { name: 'Classes', img: '/Home/home-class-book.png', url: '/classes' },
    { name: 'Professors', img: '/Home/home-professor-people.png', url: '/professorsintroduction' },
    { name: 'News', img: '/Home/home-news-owl.png', url: '/news' },
    { name: 'Shop', img: '/Home/home-shopping-money.png', url: '/shop' },
    { name: 'Annual Event', img: '/Home/home-annual-lantern.png', url: '/annualevent' },
    { name: 'About', img: '/Home/home-about-badge.png', url: '/about' },
    {
      name: 'Survival Guide',
      img: '/Home/home-survival-compass.png',
      url: '/survivalguide',
    },
  ];

  // 計算每個金探子之間的間隔角度 (360度 / 數量)
  const angleStep = (Math.PI * 2) / snitchCount;

  for (let i = 0; i < snitchCount; i++) {
    const isHero = i === 0;
    let linkData = null;
    if (!isHero && menuIdx < menuItemsData.length) {
      linkData = menuItemsData[menuIdx];
      menuIdx++;
    }
    const snitch = createSnitch(isHero, linkData);

    let radius;
    if (isMobile) {
      // 手機版：半徑縮小
      radius = isHero ? 3.0 : 2.8 + (i % 2) * 0.4;
    } else {
      // ▼▼▼ 電腦版：半徑縮小，靠近 Logo (這裡設定初始值) ▼▼▼
      radius = isHero ? 4 : 3.8 + (i % 2) * 0.4;
    }

    // 計算均分角度，確保完全分開不重疊
    const fixedPhase = i * angleStep;

    snitches.push({
      group: snitch.group,
      wings: snitch.wings,
      heroLight: snitch.heroLight,
      radius,
      // ▼▼▼ 統一速度，避免追撞 (可調整) ▼▼▼
      speed: 0.3,
      flapSpeed: isHero ? 12 : 10 + Math.random() * 5,
      // 軌道平緩，形成圓環狀
      inclination: 0.1 + (i % 2) * 0.05,
      // 使用均分角度
      phase: fixedPhase,
      yAmp: 0.2,
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

<style lang="scss" scoped>
/* ID 已更名 */
#home-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  touch-action: none;
  background: radial-gradient(circle at center, #1b2940 0%, #050810 100%);
}
canvas {
  display: block;
  position: absolute;
  inset: 0;
  transition: z-index 0s;
}
/* ID 已更名 */
#home-canvas-back {
  z-index: 0;
}
/* ID 已更名 */
#home-canvas-front {
  z-index: 2;
  pointer-events: none;
}


/* Logo & Socket */
/* ID 已更名 */
#home-logo-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  height: auto;
  z-index: 1;
  pointer-events: none;
  width: 811px;
  max-width: 45vw;
  /* 動畫名稱已更名 */
  animation: home-expandFromPoint 3s
    cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}
/* ID 已更名 */
#home-logo-img {
  display: block;
  width: 100%;
  height: auto;
}
/* Keyframes 名稱已更名 */
@keyframes home-expandFromPoint {
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

/* ID 已更名 */
#home-socket-visual {
  position: absolute;
  left: 72.5%;
  top: 71%;
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
  /* ID 已更名 */
  #home-socket-visual {
    width: 12%;
  }
}
/* ID 和 Class 已更名: .home-active */
#home-socket-visual.home-active {
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
/* ID 已更名 */
#home-socket-visual::after {
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
/* ID 和 Class 已更名: .home-active */
#home-socket-visual.home-active::after {
  opacity: 1;
  /* 動畫名稱已更名 */
  animation: home-glowBreathe 2s ease-in-out infinite alternate;
}
/* Keyframes 名稱已更名 */
@keyframes home-glowBreathe {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.8;
  }
}
/* ID 和 Class 已更名: .home-docked */
#home-socket-visual.home-docked {
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
/* ID 和 Class 已更名: .home-docked */
#home-socket-visual.home-docked::after {
  opacity: 0;
  transition: opacity 0.1s;
}

/* Letter Overlay (只保留 HTML 信封動畫部分) */
/* ID 已更名 */
#home-letter-overlay {
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
/* ID 和 Class 已更名 (假設 JS 會加 show class，雖然原代碼沒看到 show 的切換邏輯，但為了安全一併改名) */
#home-letter-overlay.home-show {
  display: flex;
}

/* ID 已更名 */
#home-envelope-container {
  position: absolute;
  width: 340px;
  height: 240px;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transform-style: preserve-3d;
}
/* Class 已更名 */
.home-envelope-body {
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
/* Class 已更名 */
.home-envelope-body::after {
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
/* Class 已更名 */
.home-envelope-body::before {
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
/* Class 已更名 */
.home-envelope-flap {
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
/* Class 已更名 */
.home-wax-seal {
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
/* Class 已更名 */
.home-wax-seal::after {
  content: 'F';
}
/* ID 和 Class 已更名: .home-open, .home-envelope-flap */
#home-envelope-container.home-open .home-envelope-flap {
  transform: rotateX(180deg);
  z-index: 5;
}
/* ID 和 Class 已更名: .home-open, .home-wax-seal */
#home-envelope-container.home-open .home-wax-seal {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
/* ID 和 Class 已更名: .home-fade-out */
#home-envelope-container.home-fade-out {
  opacity: 0 !important;
  pointer-events: none;
  transition: opacity 0.5s ease-out;
}

/* Transition Animation for AdmissionLetter Component (已更名為 home-fade) */
.home-fade-enter-active,
.home-fade-leave-active {
  transition: opacity 0.5s ease;
}
.home-fade-enter-from,
.home-fade-leave-to {
  opacity: 0;
}
</style>