<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import gsap from "gsap";

// --- ★ 修改點 1：定義 emit 事件，讓組件可以通知父層 ---
const emit = defineEmits(['close']);

const canvasContainer = ref(null);

// 用於儲存 Three.js 實例以便清理
let scene, camera, renderer, animationId;
let letterMesh, ashSystem;
let material, particleMat;
let resizeHandler, clickHandler, mouseMoveHandler;

onMounted(() => {
  // --- 1. 場景初始化 ---
  const width = window.innerWidth;
  const height = window.innerHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 4.8;

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  if (canvasContainer.value) {
    canvasContainer.value.appendChild(renderer.domElement);
  }

  // --- 按鈕區域座標儲存 (Raycaster 用) ---
  let buttonZones = {};

  // --- 2. 信紙貼圖生成 (Canvas Texture) ---
  function createPaperTexture() {
    const cvs = document.createElement("canvas");
    cvs.width = 1400;
    cvs.height = 1050;
    const ctx = cvs.getContext("2d");

    // 背景
    ctx.fillStyle = "#F4E4BC";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    const gradient = ctx.createRadialGradient(
      cvs.width / 2,
      cvs.height / 2,
      400,
      cvs.width / 2,
      cvs.height / 2,
      800
    );
    gradient.addColorStop(0, "rgba(139, 69, 19, 0)");
    gradient.addColorStop(1, "rgba(139, 69, 19, 0.1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // 雜訊
    for (let i = 0; i < 40000; i++) {
      ctx.fillStyle =
        Math.random() > 0.5
          ? "rgba(139, 69, 19, 0.05)"
          : "rgba(255,255,255,0.1)";
      ctx.fillRect(
        Math.random() * cvs.width,
        Math.random() * cvs.height,
        2,
        2
      );
    }

    // --- 排版 ---
    const paddingX = 80;
    const startX = paddingX;
    const contentWidth = cvs.width - paddingX * 2;
    let currentY = 100;

    function wrapText(context, text, x, y, maxWidth, lineHeight, marginBottom) {
      const words = text.split(" ");
      let line = "";
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          context.fillText(line, x, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, y);
      return y + lineHeight + marginBottom;
    }

    // [按鈕區塊 1] 右上角關閉 (X)
    buttonZones.close = {
      x: cvs.width - 80,
      y: 20,
      w: 60,
      h: 60,
    };

    ctx.textAlign = "right";
    ctx.font = "bold 50px Arial, sans-serif";
    ctx.fillStyle = "#5a3a22";
    ctx.globalAlpha = 0.6;
    ctx.fillText("×", cvs.width - 40, 70);
    ctx.globalAlpha = 1.0;

    // Header
    ctx.textAlign = "left";
    ctx.font = "bold 58px Georgia, serif";
    ctx.fillStyle = "#3e2723";
    ctx.fillText("Formosoul Institute of Magic", startX, currentY);
    currentY += 60;

    ctx.font = "normal 36px Georgia, serif";
    ctx.fillStyle = "#5d4037";
    ctx.fillText("Admission Notice", startX, currentY);
    currentY += 35;

    ctx.beginPath();
    ctx.moveTo(startX, currentY);
    ctx.lineTo(startX + contentWidth, currentY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(90, 58, 34, 0.3)";
    ctx.stroke();
    currentY += 50;

    // Body
    ctx.font = "24px Georgia, serif";
    ctx.fillStyle = "#3e2723";
    const lineHeight = 40;
    const paraMargin = 25;

    const paragraphs = [
      "Dear Prospective International Student,",
      'You are about to step into this magical academy, hidden within the alleys of Taiwan, as an "Auditing Student" or "International Student." From this moment on, you will explore the daily life and magical wonders of Taiwan from the perspective of a visiting student.',
      "The Academy has prepared six special courses and six interactive mini-games, guiding you to discover temples, night markets, local cuisine, and folk culture.",
      "These games are scattered throughout different corners of the campus, waiting for you to find them. Successfully complete all the interactive games to graduate and receive a discount coupon from the Taiwan Magical Marketplace.",
      "You may first explore the campus as an auditing student; after completing the games, if you wish to accumulate credits and save your progress, you can register at any time to receive your magical student ID.",
    ];

    paragraphs.forEach((text) => {
      currentY = wrapText(
        ctx,
        text,
        startX,
        currentY,
        contentWidth,
        lineHeight,
        paraMargin
      );
    });

    // Footer
    const footerY = currentY + 30;

    ctx.font = "italic 24px Georgia, serif";
    ctx.fillStyle = "#3e2723";
    ctx.textAlign = "left";

    let sigY = footerY;
    ctx.fillText("Sincerely,", startX, sigY);
    sigY += 35;
    ctx.fillText("Formosoul Institute of Magic", startX, sigY);
    sigY += 35;
    ctx.fillText("Office of Academic Affairs.", startX, sigY);

    // Buttons
    const btnHeight = 64;
    const btnWidthReg = 240;
    const btnWidthAudit = 280;
    const btnGap = 30;
    const btnY = footerY + 20;
    const rightEdge = cvs.width - paddingX;

    const regBtnX = rightEdge - btnWidthReg;
    const auditBtnX = regBtnX - btnGap - btnWidthAudit;

    // [按鈕區塊 2 & 3]
    buttonZones.audit = {
      x: auditBtnX,
      y: btnY,
      w: btnWidthAudit,
      h: btnHeight,
    };
    buttonZones.register = {
      x: regBtnX,
      y: btnY,
      w: btnWidthReg,
      h: btnHeight,
    };

    // 繪製 Audit Button
    ctx.strokeStyle = "#5a3a22";
    ctx.lineWidth = 3;
    ctx.strokeRect(auditBtnX, btnY, btnWidthAudit, btnHeight);
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillStyle = "#5a3a22";
    ctx.textAlign = "center";
    ctx.fillText(
      "Audit the Academy",
      auditBtnX + btnWidthAudit / 2,
      btnY + 40
    );

    // 繪製 Register Button
    ctx.fillStyle = "#FFCC46";
    ctx.fillRect(regBtnX, btnY, btnWidthReg, btnHeight);
    ctx.strokeStyle = "#b4941f";
    ctx.lineWidth = 3;
    ctx.strokeRect(regBtnX, btnY, btnWidthReg, btnHeight);
    ctx.fillStyle = "#2c1e14";
    ctx.fillText("Register Now", regBtnX + btnWidthReg / 2, btnY + 40);

    return new THREE.CanvasTexture(cvs);
  }

  const paperTex = createPaperTexture();

  // --- 3. Shader ---
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
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
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
        float fireNoise = fbm(uv * 6.0 + vec2(0.0, uTime * 1.2)); 
        float gradient = uv.y; 
        float threshold = (uProgress * 1.5) - 0.2;
        float burnVal = gradient + fireNoise * 0.3; 
        float diff = burnVal - threshold;

        if (diff < 0.0) {
            discard; 
        } else if (diff < 0.15) {
            float t = diff / 0.15;
            vec3 fireCol = mix(vec3(4.0, 2.0, 0.5), vec3(1.0, 0.4, 0.0), t);
            fireCol = mix(fireCol, vec3(0.2, 0.0, 0.0), smoothstep(0.4, 1.0, t));
            gl_FragColor = vec4(fireCol, 1.0);
        } else if (diff < 0.25) {
            float t = (diff - 0.15) / 0.1;
            vec3 charCol = mix(vec3(0.0), texColor.rgb, t);
            gl_FragColor = vec4(charCol, 1.0);
        } else {
            gl_FragColor = texColor;
        }
    }
  `;

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uTexture: { value: paperTex },
  };

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(4.2, 3.15, 60, 45);
  letterMesh = new THREE.Mesh(geometry, material);
  scene.add(letterMesh);

  // --- 4. 灰燼粒子系統 ---
  const particleCount = 2000;
  const posArray = new Float32Array(particleCount * 3);
  const randomArray = new Float32Array(particleCount);
  const sizeArray = new Float32Array(particleCount);
  const geoHalfHeight = 3.15 / 2;

  for (let i = 0; i < particleCount; i++) {
    posArray[i * 3] = (Math.random() - 0.5) * 4.2;
    posArray[i * 3 + 1] = -geoHalfHeight - 0.2 + Math.random() * 0.5;
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    randomArray[i] = Math.random();
    sizeArray[i] = Math.random();
  }

  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );
  particlesGeo.setAttribute(
    "aRandom",
    new THREE.BufferAttribute(randomArray, 1)
  );
  particlesGeo.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sizeArray, 1)
  );

  particleMat = new THREE.ShaderMaterial({
    vertexShader: `
        uniform float uTime;
        uniform float uBurnProgress; 
        attribute float aRandom;
        attribute float aSize;
        varying float vLife; 

        void main() {
            float originalY = position.y; 
            float burnHeight = (uBurnProgress * 3.15) - 1.575;
            vec3 pos = position;
            vLife = 0.0;
            if (burnHeight > originalY) {
                float flyTime = (burnHeight - originalY) * 2.0; 
                pos.y += flyTime * (0.5 + aRandom * 0.5); 
                pos.x += sin(flyTime * 2.0 + aRandom * 10.0) * 0.1;
                pos.z += cos(flyTime * 1.5 + aRandom) * 0.1;
                vLife = 1.0 - (flyTime * 0.4); 
            } else {
                vLife = 0.0; 
            }
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = (6.0 * aSize + 2.0) * vLife * (1.0 / -mvPosition.z);
        }
    `,
    fragmentShader: `
        varying float vLife;
        void main() {
            if (vLife <= 0.0) discard;
            vec2 uv = gl_PointCoord - 0.5;
            float dist = length(uv);
            if (dist > 0.5) discard;
            vec3 color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.8, 0.4), vLife);
            float alpha = smoothstep(0.5, 0.0, dist) * vLife;
            gl_FragColor = vec4(color, alpha);
        }
    `,
    uniforms: {
      uTime: { value: 0 },
      uBurnProgress: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  ashSystem = new THREE.Points(particlesGeo, particleMat);
  scene.add(ashSystem);

  // --- 5. 互動邏輯 (Raycaster) ---
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isBurned = false;

  function checkIntersection(clientX, clientY) {
    if (isBurned) return null;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(letterMesh);

    if (intersects.length > 0) {
      const uv = intersects[0].uv;
      const canvasX = uv.x * 1400;
      const canvasY = (1 - uv.y) * 1050;

      for (const [key, zone] of Object.entries(buttonZones)) {
        if (
          canvasX >= zone.x &&
          canvasX <= zone.x + zone.w &&
          canvasY >= zone.y &&
          canvasY <= zone.y + zone.h
        ) {
          return key;
        }
      }
    }
    return null;
  }

  function triggerBurn() {
    if (isBurned) return;
    isBurned = true;
    document.body.style.cursor = "default";

    uniforms.uProgress.value = 0;
    particleMat.uniforms.uBurnProgress.value = 0;

    // --- ★ 修改點 2：在 GSAP 中加入 onComplete 以觸發 emit ---
    const tl = gsap.timeline({
      onComplete: () => {
        // 動畫結束，通知父組件
        console.log('Burning complete, emitting close event');
        emit('close');
      }
    });

    tl.to(uniforms.uProgress, {
      value: 1.5,
      duration: 3,
      ease: "none",
      onUpdate: () => {
        particleMat.uniforms.uBurnProgress.value = uniforms.uProgress.value;
      },
    });
    tl.to(
      letterMesh.position,
      {
        y: 0.3,
        z: -0.5,
        duration: 3,
        ease: "power1.out",
      },
      "<"
    );
  }

  // --- Event Listeners ---
  clickHandler = (e) => {
    const hit = checkIntersection(e.clientX, e.clientY);
    if (hit) {
      console.log("Clicked:", hit);
      // 可以在這裡判斷 hit 是 'close', 'register' 還是 'audit' 來做路由跳轉
      triggerBurn();
    }
  };

  mouseMoveHandler = (e) => {
    if (isBurned) {
      document.body.style.cursor = "default";
      return;
    }
    const hit = checkIntersection(e.clientX, e.clientY);
    if (hit) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  };
  
  resizeHandler = () => {
      if(camera && renderer) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
  };

  window.addEventListener("click", clickHandler);
  window.addEventListener("mousemove", mouseMoveHandler);
  window.addEventListener("resize", resizeHandler);

  // --- 6. 動畫迴圈 ---
  const clock = new THREE.Clock();

  function animate() {
    animationId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    uniforms.uTime.value = t;
    particleMat.uniforms.uTime.value = t;

    if (uniforms.uProgress.value < 0.9) {
      letterMesh.rotation.z = Math.sin(t * 0.5) * 0.015;
      letterMesh.rotation.x = Math.sin(t * 0.3) * 0.015;
    }

    renderer.render(scene, camera);
  }
  animate();
});

onBeforeUnmount(() => {
  // 清除事件監聽
  window.removeEventListener("click", clickHandler);
  window.removeEventListener("mousemove", mouseMoveHandler);
  window.removeEventListener("resize", resizeHandler);

  // 停止動畫循環
  if (animationId) cancelAnimationFrame(animationId);

  // 釋放 Three.js 資源
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
  
  if (renderer) {
    renderer.dispose();
  }
});
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: block;
  overflow: hidden;
  background-color: #050505;
  margin: 0;
  padding: 0;
  z-index: 1000; 
  background-color: rgba(0, 0, 0, 0.85);
}
</style>