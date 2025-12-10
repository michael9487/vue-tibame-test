<script setup>
import { onMounted, ref } from "vue";
import gsap from "gsap";

// --- 1. 圖片路徑 ---
import lanternImg from "@/assets/sur-lantern.png";
import nightImg from "@/assets/sur-night.png";
import storeImg from "@/assets/sur-convenience.png";
import taiwanImg from "@/assets/sur-taiwan.png";
// 這裡假設你有臭豆腐圖，沒有的話請換回 placeholder
const tofuPlaceholder = "https://placehold.co/150x150/e67e22/fff?text=Tofu";

const images = {
  lantern: lanternImg,
  nightMarket: nightImg,
  store: storeImg,
  taiwan: taiwanImg,
  tofu: tofuPlaceholder,
};

// --- 2. 狀態管理 ---
const activeScene = ref(null);

const onHover = (scene) => {
  activeScene.value = scene;
};

const onLeave = () => {
  activeScene.value = null;
};

const enterScene = (type) => {
  console.log("Enter scene:", type);
  // router.push(...)
};

onMounted(() => {
  // --- GSAP 漂浮動畫 (保持原本設定) ---
  gsap.to(".lantern-img", {
    y: 10,
    rotation: 5,
    duration: 3,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  gsap.to(".island-left-group .float-target", {
    y: -20,
    duration: 3.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  gsap.to(".island-right-group .float-target", {
    y: -25,
    duration: 4,
    delay: 0.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  gsap.to(".taiwan-map", {
    y: -15,
    x: 5,
    duration: 5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  gsap.to(".tofu-img", {
    y: -10,
    duration: 2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
});
</script>

<template>
  <div
    class="page-container"
    :class="{ 'mode-night-market': activeScene === 'night-market' }"
  >
    <header class="header-section">
      <div class="lantern-wrapper">
        <img :src="images.lantern" alt="Lantern" class="lantern-img" />
      </div>
      <div class="header-text">
        <h1 class="main-title">Welcome to survival guide !</h1>
        <p class="subtitle">
          Here, we'll introduce Taiwan's famous<br />
          night market culture and convenience<br />
          store culture.
        </p>
      </div>
    </header>

    <div class="nav-arrow-container" v-show="activeScene === 'night-market'">
      <span class="nav-label">Convenience<br />Store</span>
      <span class="nav-icon">&rarr;</span>
    </div>

    <main class="selection-container">
      <div
        class="island-group island-left-group"
        @mouseenter="onHover('night-market')"
        @mouseleave="onLeave"
      >
        <img :src="images.tofu" alt="Stinky Tofu" class="tofu-img" />

        <div class="float-target">
          <div class="island-img-wrapper">
            <img
              :src="images.nightMarket"
              alt="Night Market Island"
              class="island-img"
            />
          </div>

          <h2 class="island-title original-title">Night Market</h2>
        </div>

        <div class="details-panel">
          <h2 class="detail-title">Night Market</h2>

          <div class="info-card">
            <p class="info-text">
              Taiwan's night markets are known for food, games. Stinky tofu,
              braised pork rice, are must-tries, showing the heart of local
              Taiwanese culture.
            </p>
            <router-link :to="{ name: 'NightMarketMap' }">
              <button class="enter-btn">Enter</button>
            </router-link>
          </div>
        </div>
      </div>

      <div class="divider">
        <span class="arrow">&larr;</span>
        <span class="select-text">Select</span>
        <span class="arrow">&rarr;</span>
      </div>

      <div class="island-group island-right-group">
        <div class="float-target">
          <img :src="images.taiwan" alt="Taiwan Map" class="taiwan-map" />
          <div class="island-img-wrapper">
            <img
              :src="images.store"
              alt="Convenience Store Island"
              class="island-img"
            />
          </div>
          <h2 class="island-title">Convenience Store</h2>
        </div>
      </div>
    </main>
    <div class="bg-glow"></div>
    <router-view />
  </div>
</template>

<style scoped>
/* --- 基礎設定 --- */
.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #000000;
  background-image: radial-gradient(
    circle at 50% 50%,
    #1a1a1a 0%,
    #000000 100%
  );
  color: #ffffff;
  font-family: "Roboto", sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50px;
  overflow: hidden;
  position: relative;
  transition: all 0.5s ease;
}

/* --- 導航箭頭 --- */
.nav-arrow-container {
  position: absolute;
  top: 100px;
  right: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 50;
  animation: fadeInRight 0.5s forwards;
}
.nav-label {
  text-align: right;
  font-size: 1.2rem;
  font-weight: 500;
}
.nav-icon {
  font-size: 2.5rem;
  color: #ffffff;
  font-weight: bold;
}

/* --- Header --- */
.header-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
  z-index: 10;
  transition: opacity 0.3s;
}
.lantern-img {
  width: 80px;
  height: auto;
  filter: drop-shadow(0 0 15px rgba(255, 69, 0, 0.6));
}
.header-text {
  text-align: left;
}
.main-title {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 15px;
  letter-spacing: 1px;
}
.subtitle {
  font-size: 1rem;
  line-height: 1.8;
  color: #cccccc;
  font-weight: 300;
}

/* --- Selection Container --- */
.selection-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 100px;
  width: 100%;
  max-width: 1400px;
  z-index: 10;
  padding: 0 2%;
  /* 容器本身不動，我們動裡面的 group */
}

/* --- Divider --- */
.divider {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-size: 3.5rem;
  font-weight: 800;
  color: #ffffff;
  z-index: 50;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  width: 100%;
  transition: opacity 0.3s, transform 0.5s;
}
.arrow {
  font-size: 4rem;
  font-weight: 300;
}

/* --- Island Groups --- */
.island-group {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  /* 關鍵轉場設定：讓移動看起來像推擠 */
  transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s;
  z-index: 10;
}

.island-img-wrapper {
  width: 550px;
  height: auto;
  margin-bottom: 30px;
  transition: width 0.5s ease;
}
.island-img {
  width: 100%;
  display: block;
  filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6));
}

/* 底部標題 (原本的) */
.island-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 1px;
  transition: opacity 0.3s, transform 0.3s;
}

/* 台灣地圖 */
.taiwan-map {
  position: absolute;
  top: -50px;
  right: -20px;
  width: 100px;
  z-index: 20;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
}

/* --- 隱藏元素 (Hover 顯示) --- */

/* 1. 臭豆腐 */
.tofu-img {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  width: 150px;
  z-index: 30;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 2. 詳細資訊面板 (包含新標題 + 卡片) */
.details-panel {
  position: absolute;
  top: 50%;
  left: 90%; /* 位於圖片右側 */
  transform: translateY(-50%) translateX(30px); /* 初始位置稍微偏右 */
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 靠左對齊 */
  opacity: 0;
  pointer-events: none;
  z-index: 40;
  transition: all 0.5s ease 0.1s;
}

/* 2.1 新標題 */
.detail-title {
  font-size: 3rem; /* 大標題 */
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  white-space: nowrap; /* 不換行 */
}

/* 2.2 資訊卡 */
.info-card {
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 25px;
  color: #333;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  text-align: left;
}

.info-text {
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
  font-weight: 500;
}
.enter-btn {
  width: 100%;
  padding: 12px;
  background-color: #f1c40f;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}
.enter-btn:hover {
  background-color: #f39c12;
}

/* =========================================
   ★ 互動狀態 (Active States)
   ========================================= */

/* 當模式為 Night Market 時 */

/* 1. 中間 Select 隱藏 */
.mode-night-market .divider {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

/* 2. 右邊島嶼：被推開 (往右飛出) */
.mode-night-market .island-right-group {
  transform: translateX(100vw); /* 直接飛出螢幕 */
  opacity: 0;
  pointer-events: none;
}

/* 3. 左邊島嶼：往右移 (推擠效果) */
.mode-night-market .island-left-group {
  /* 往右移動 300px (或是 20vw)，營造擠開右邊的感覺 */
  transform: translateX(300px) scale(1.1);
}

/* 4. 隱藏原本下方的標題 */
.mode-night-market .island-left-group .original-title {
  opacity: 0;
  transform: translateY(20px);
}

/* 5. 顯示臭豆腐 */
.mode-night-market .tofu-img {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

/* 6. 顯示右側詳細面板 (新標題 + 卡片) */
.mode-night-market .details-panel {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
  pointer-events: auto;
}

/* --- 背景光暈 --- */
.bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80vw;
  height: 80vh;
  background: radial-gradient(
    circle,
    rgba(255, 160, 0, 0.05) 0%,
    rgba(0, 0, 0, 0) 70%
  );
  pointer-events: none;
  z-index: 1;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 1200px) {
  /* 平板時移動距離縮小 */
  .mode-night-market .island-left-group {
    transform: translateX(150px) scale(1.05);
  }
}
@media (max-width: 768px) {
  .selection-container {
    flex-direction: column;
  }
  .details-panel {
    position: relative;
    left: auto;
    top: auto;
    transform: none !important;
    margin-top: 20px;
  }
  .mode-night-market .island-left-group {
    transform: none;
  } /* 手機版取消位移 */
}
</style>
