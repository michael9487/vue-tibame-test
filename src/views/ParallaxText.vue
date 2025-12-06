<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
// 引入你剛剛建立的卡片元件 (請確認路徑是否正確)
import NewsCard from "@/components/NewsCard.vue";

// 註冊 GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const mainSection = ref(null);
const ctx = ref(null); // 用來清理 GSAP 動畫
const lenis = ref(null); // Lenis 實例

// 1. 視差漂浮卡片資料 (Parallax Items)
const cards = ref([
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600",
    style: { top: "25%", left: "5%" },
    speed: -100,
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=600",
    style: { top: "32%", right: "8%" },
    speed: 50,
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1601314167099-232775b3d6fd?w=600",
    style: { top: "42%", left: "15%" },
    speed: -50,
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1633478062482-790e3b5dd810?w=600",
    style: { top: "48%", right: "25%" },
    speed: 120,
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600",
    style: { top: "55%", left: "8%" },
    speed: -80,
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600",
    style: { top: "62%", right: "5%" },
    speed: 80,
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600",
    style: { top: "68%", left: "35%" },
    speed: -150,
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600",
    style: { top: "75%", right: "15%" },
    speed: 40,
  },
  {
    id: 9,
    src: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600",
    style: { top: "82%", left: "10%" },
    speed: 150,
  },
  {
    id: 10,
    src: "https://images.unsplash.com/photo-1633478062482-790e3b5dd810?w=600",
    style: { top: "85%", right: "30%" },
    speed: -60,
  },
]);

// 2. 最新消息資料 (Updates)
const updates = ref([
  {
    id: 1,
    title: "Taiwan's Ancient Temples",
    date: "2025.11.20",
    image: "https://images.unsplash.com/photo-1583656968798-84242d544060?w=600",
  },
  {
    id: 2,
    title: "Festival of Lights",
    date: "2025.11.22",
    image: "https://images.unsplash.com/photo-1533552069279-d17fb692257d?w=600",
  },
  {
    id: 3,
    title: "Mazu Pilgrimage",
    date: "2025.11.25",
    image: "https://images.unsplash.com/photo-1590499690680-2cb4b0593466?w=600",
  },
  {
    id: 4,
    title: "Golden Fireworks",
    date: "2025.11.28",
    image: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=600",
  },
  {
    id: 5,
    title: "Dragon Boat Race",
    date: "2025.12.01",
    image: "https://images.unsplash.com/photo-1598935898635-43896df56507?w=600",
  },
  {
    id: 6,
    title: "Burning Boat Ritual",
    date: "2025.12.05",
    image: "https://images.unsplash.com/photo-1542176465-985e94b15091?w=600",
  },
]);

onMounted(() => {
  lenis.value = new Lenis({
    duration: 1.5,
    smooth: true,
  });

  function raf(time) {
    lenis.value.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  ctx.value = gsap.context(() => {
    ScrollTrigger.create({
      trigger: mainSection.value,
      start: "top top",
      end: "bottom bottom",
      pin: ".news-pin-target",
      pinSpacing: false,
    });

    const parallaxCards = document.querySelectorAll(".news-parallax-card");
    parallaxCards.forEach((el) => {
      const speed = el.getAttribute("data-speed");
      gsap.to(el, {
        y: speed,
        ease: "none",
        scrollTrigger: {
          trigger: mainSection.value,
          start: "top top",
          end: "bottom bottom",
          scrub: 0,
        },
      });
    });
  }, mainSection.value);
});

onUnmounted(() => {
  if (ctx.value) ctx.value.revert();
  if (lenis.value) lenis.value.destroy();
});
</script>

<template>
  <div class="news-page-container">
    <section ref="mainSection" class="news-parallax-section">
      <div class="news-sticky-title-wrapper news-pin-target">
        <h2 class="news-main-text">I solemnly swear that I am up to no good.</h2>
      </div>

      <div class="news-cards-container">
        <div
          v-for="card in cards"
          :key="card.id"
          class="news-parallax-card"
          :style="card.style"
          :data-speed="card.speed"
        >
          <div class="news-card-inner">
            <img :src="card.src" alt="Magic Item" />
          </div>
        </div>
      </div>
    </section>

    <section class="news-quote-section">
      <div class="news-quote-content">
        <p>Curiosity, friction, iteration:</p>
        <p>The machinery of my design</p>
      </div>
    </section>

    <section class="news-updates-section">
      <div class="news-updates-header">
        <h3 class="news-updates-title">UPDATES</h3>
      </div>

      <div class="news-updates-grid">
        <NewsCard v-for="item in updates" :key="item.id" :data="item" />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 注意：Global 的設定 (body, *) 應該移到 App.vue 或 main.css 
   這裡只保留該頁面特定的樣式 
*/

.news-page-container {
  width: 100%;
  position: relative;
  background-color: #0a0a0a;
  color: #ffffff;
  font-family: "Cinzel", serif;
  overflow-x: hidden;
}

/* --- 視差區塊樣式 --- */
.news-parallax-section {
  position: relative;
  width: 100%;
  height: 550vh;
  overflow: hidden;
  background-color: #0a0a0a;
}

.news-sticky-title-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}

.news-main-text {
  font-size: 2.8rem;
  line-height: 1.1;
  text-align: center;
  color: #fff;
  mix-blend-mode: exclusion;
}

/* 卡片容器 */
.news-cards-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.news-parallax-card {
  position: absolute;
  width: 270px;
  height: 290px;
  will-change: transform;
  /* 若你希望連「點擊」都不要被這些卡片擋住（變成純裝飾背景），
     可以把 auto 改成 none。
     目前保留 auto 讓你以後想加點擊功能時可以直接用。
  */
  pointer-events: auto !important;
}

.news-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
}

.news-card-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 移除了 transition 和 filter，讓它保持原樣 */
  filter: sepia(20%) contrast(110%);
}

/* ★ 已移除 hover 效果的 CSS */

/* --- 引言區塊 --- */
.news-quote-section {
  width: 100%;
  height: 100vh;
  background-color: #0a0a0a;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 30;
}

.news-quote-content {
  text-align: center;
  color: #e0e0e0;
  font-size: 2.8rem;
  line-height: 2;
  letter-spacing: 1px;
  opacity: 0.9;
}

/* --- Updates 區塊 (排版層) --- */
.news-updates-section {
  width: 100%;
  background-color: #0a0a0a;
  padding: 100px 5%;
  position: relative;
  z-index: 30;
}

.news-updates-header {
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 15px;
}

.news-updates-title {
  font-family: "Roboto", sans-serif;
  font-size: 5.2rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
}

/* 網格系統 */
.news-updates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 響應式 */
@media (max-width: 768px) {
  .news-updates-grid {
    grid-template-columns: 1fr;
  }
  .news-main-text {
    font-size: 15vw;
  }
  .news-parallax-section {
    height: 450vh;
  }
  .news-parallax-card {
    width: 160px;
    height: 180px;
  }
}
</style>