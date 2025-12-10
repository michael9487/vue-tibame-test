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
    </div>

    <Transition name="fade">
      <AdmissionLetter v-if="showLetter" @close="onLetterClose" />
    </Transition>

    <router-link class="linktosurvival" :to="{ name: 'SurvivalTest' }">
      <button>前往生存頁面</button>
    </router-link>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";
import gsap from "gsap";
// 確保路徑正確
import AdmissionLetter from "@/components/AdmissionLetter.vue";

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
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
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

// 處理 AdmissionLetter 發出的 close 事件
const onLetterClose = () => {
  // 1. 關閉 Vue 信紙組件
  showLetter.value = false;

  // 2. 隱藏 HTML 遮罩層 (那個黑底)
  if (letterOverlayRef.value) {
    letterOverlayRef.value.style.display = "none";
  }

  // 3. 重置 HTML 信封的 CSS 狀態 (為了避免殘留樣式)
  if (envelopeContainerRef.value) {
    envelopeContainerRef.value.style.opacity = "0";
    envelopeContainerRef.value.classList.remove("fade-out");
    envelopeContainerRef.value.classList.remove("open");
  }

  const hero = snitches[0];
  if (hero) {
    // 確保它維持在鎖定狀態
    hero.isDocked = true;
    // 確保它維持在前景
    hero.isFront = true;
    // 維持較亮的亮度
    if (hero.heroLight) hero.heroLight.intensity = 4.6;
  }

  // 確保插槽視覺保持 "docked" (亮起) 狀態
  if (socketVisualRef.value) {
    socketVisualRef.value.classList.add("docked");
  }
};

function onDragStart(event) {
  if (showLetter.value) return;

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
    while (rootGroup.parent && rootGroup.parent.type !== "Scene") {
      rootGroup = rootGroup.parent;
    }

    const idx = snitches.findIndex((s) => s.group === rootGroup);
    if (idx !== -1) {
      draggedSnitchIdx = idx;
      isDragging = true;
      containerRef.value.classList.add("dragging");
      if (idx === 0 && socketVisualRef.value)
        socketVisualRef.value.classList.add("active");

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
        hero.lockedPosition = targetPos.clone();
        hero.group.position.copy(targetPos);
        hero.group.position.z = targetPos.z;
        hero.group.lookAt(0, 0, 0);
        hero.isFront = true;

        if (hero.heroLight) hero.heroLight.intensity = 4.6;
        if (socketVisualRef.value)
          socketVisualRef.value.classList.add("docked");

        // 1. 顯示 HTML 信封覆蓋層
        letterOverlayRef.value.style.display = "flex";
        // eslint-disable-next-line no-unused-expressions
        letterOverlayRef.value.offsetHeight; // reflow
        letterOverlayRef.value.style.opacity = "1";

        // 2. 執行信封飛入與打開動畫
        const tl = gsap.timeline();
        gsap.set(envelopeContainerRef.value, {
          top: "-50%",
          left: "50%",
          xPercent: -50,
          yPercent: -50,
          scale: 0.2,
          rotationX: 0,
          rotation: 5,
          opacity: 1,
          zIndex: 10,
        });
        tl.to(envelopeContainerRef.value, {
          top: "60%",
          scale: 0.8,
          rotationX: 70,
          rotation: 0,
          duration: 1.5,
          ease: "power2.out",
        });
        // 打開信封蓋
        tl.add(() => {
          envelopeContainerRef.value.classList.add("open");
        }, "+=0.1");

        // 3. 信封打開後，隱藏 HTML 信封，顯示 Vue AdmissionLetter 組件
        tl.add(() => {
          envelopeContainerRef.value.classList.add("fade-out");
        }, "+=0.5");

        tl.add(() => {
          showLetter.value = true;
          letterOverlayRef.value.style.display = "none";
        }, "+=0.5");
      }

      if (socketVisualRef.value)
        socketVisualRef.value.classList.remove("active");
    }

    isDragging = false;
    draggedSnitchIdx = -1;
    containerRef.value.classList.remove("dragging");
  }
}

function onDocumentClick(event) {
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
      document.body.style.cursor = "wait";
      setTimeout(() => {
        document.body.style.cursor = "default";
        window.location.href = obj.userData.url;
      }, 100);
      return;
    }
  }
}

function onMouseMoveHover(event) {
  if (isDragging || showLetter.value) return;
  snitches.forEach((s) => {
    const lbl = s.group.getObjectByName("snitchLabel");
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
    while (root.parent && root.parent.type !== "Scene") {
      root = root.parent;
    }
    const lbl = root.getObjectByName("snitchLabel");
    if (lbl) lbl.visible = true;

    let obj = intersects[0].object;
    while (obj && !obj.userData.isLink && obj.parent) {
      obj = obj.parent;
    }
    if (obj && obj.userData.isLink) hovering = true;
  }

  if (hovering) document.body.classList.add("hover-link");
  else document.body.classList.remove("hover-link");
}

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  rendererBack.setSize(w, h);
  rendererFront.setSize(w, h);

  const isMob = checkIsMobile();
  snitches.forEach((s) => {
    if (isMob && s.radiusBase !== "large") {
      s.radius = s.isHero ? 6.8 : 4.5 + Math.random() * 5;
      s.radiusBase = "large";
    } else if (!isMob && s.radiusBase !== "small") {
      s.radius = s.isHero ? 3.5 : 2.5 + Math.random() * 3;
      s.radiusBase = "small";
    }
  });

  updateDockedSnitchLock();
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const u = Math.min(1, t / 1.5);
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

  snitches.forEach((s, idx) => {
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
    const rNow = s.radius * easeOutCubic(u) + Math.sin(t * 0.3 + idx) * 0.2 * u;
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

  initSnitches(textureLoader);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  dragPlane = new THREE.Plane();
  dragOffset = new THREE.Vector3();
  clock = new THREE.Clock();

  window.addEventListener("mousedown", onDragStart);
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd);
  window.addEventListener("click", onDocumentClick);
  window.addEventListener("touchstart", onDragStart, { passive: false });
  window.addEventListener("touchmove", onDragMove, { passive: false });
  window.addEventListener("touchend", onDragEnd);
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMoveHover);

  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("mousedown", onDragStart);
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);
  window.removeEventListener("click", onDocumentClick);
  window.removeEventListener("touchstart", onDragStart);
  window.removeEventListener("touchmove", onDragMove);
  window.removeEventListener("touchend", onDragEnd);
  window.removeEventListener("resize", onWindowResize);
  window.removeEventListener("mousemove", onMouseMoveHover);

  // ★ 1. 停止 requestAnimationFrame (最重要!)
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null; // 確保清空
  }
  // ★ 2. 停止所有 GSAP 動畫
  gsap.killTweensOf("*"); // 殺掉所有正在執行的 tween
});

// --- Setup Snitches (保持不變) ---
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
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    cvs.width = 512;
    cvs.height = 128;
    ctx.font = "bold 48px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 256, 64);
    ctx.strokeStyle = "#ffd700";
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
        lbl.name = "snitchLabel";
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
    { name: "Classes", img: "/home-class-book.png", url: "#schedule" },
    { name: "Mentors", img: "/home-professor-people.png", url: "#professors" },
    { name: "Daily Prophet", img: "/home-news-owl.png", url: "#map" },
    { name: "Diagon Alley", img: "/home-shopping-money.png", url: "#alley" },
    { name: "Annual Events", img: "/home-annual-lantern.png", url: "#events" },
    { name: "History", img: "/home-about-badge.png", url: "#about" },
    {
      name: "Survival Guide",
      img: "/home-survival-compass.png",
      url: "#survival",
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
      radiusBase: isMobile ? "large" : "small",
      isHero,
    });
    scene.add(snitch.group);
  }
}
</script>

<style scoped>
#container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  touch-action: none;
  background: radial-gradient(circle at 50% 30%, #f4efe4, #d3d7e8, #7a8aa5);
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
/* 移除 .burn-mode 相關樣式，因為現在由 AdmissionLetter 組件處理 */

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
  animation: expandFromPoint 3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 215, 0, 0.6),
    0 0 80px rgba(255, 100, 0, 0.4), 0 0 120px rgba(255, 255, 255, 0.2);
}
#socket-visual::after {
  content: "";
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
  box-shadow: 0 0 60px rgba(255, 255, 255, 1), 0 0 120px rgba(255, 215, 0, 0.8);
  transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
}
#socket-visual.docked::after {
  opacity: 0;
  transition: opacity 0.1s;
}

/* Letter Overlay (只保留 HTML 信封動畫部分) */
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
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 120px 170px 0 170px;
  border-color: transparent #e0ccb3 #e0ccb3 transparent;
  z-index: 11;
  pointer-events: none;
}
.envelope-body::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 170px 130px 170px;
  border-color: transparent transparent #c9ad8a transparent;
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
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 15;
}
.wax-seal {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 55px;
  height: 55px;
  background: radial-gradient(circle, #8b0000 0%, #5c0000 100%);
  border-radius: 50%;
  border: 2px solid #6b0000;
  z-index: 16;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  transition: transform 0.4s, opacity 0.4s;
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
  content: "F";
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

/* Transition Animation for AdmissionLetter Component */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* ★ 修改了這裡 ★ */
.linktosurvival {
  position: absolute; /* 絕對定位 */
  top: 20px; /* 距離頂部 20px */
  left: 20px; /* 距離左側 20px */
  z-index: 1000; /* 確保在最上層 */
  cursor: pointer;
}
.linktosurvival button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffd700;
  border: 1px solid #ffd700;
  border-radius: 5px;
}
</style>
