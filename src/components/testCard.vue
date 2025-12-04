<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from 'lenis' // 記得引入

gsap.registerPlugin(ScrollTrigger)

const mainSection = ref(null)
const ctx = ref(null)
let lenis = null

const cards = [
  // --- 第一區段 ---
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
    style: { top: '5%', left: '10%' },
    speed: -100,
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&q=80&w=600',
    style: { top: '12%', right: '15%' },
    speed: 50,
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1515549832467-8783363e19b6?auto=format&fit=crop&q=80&w=600',
    style: { top: '22%', left: '25%' },
    speed: -50,
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1633478062482-790e3b5dd810?auto=format&fit=crop&q=80&w=600',
    style: { top: '28%', right: '10%' },
    speed: 120,
  },

  // --- 第二區段 ---
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cad?auto=format&fit=crop&q=80&w=600',
    style: { top: '35%', left: '8%' },
    speed: -80,
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?auto=format&fit=crop&q=80&w=600',
    style: { top: '42%', right: '25%' },
    speed: 80,
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=600',
    style: { top: '48%', left: '40%' },
    speed: -150,
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600',
    style: { top: '55%', right: '15%' },
    speed: 40,
  },
  {
    id: 9,
    src: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=600',
    style: { top: '62%', left: '15%' },
    speed: 150,
  },

  // --- 第三區段 ---
  {
    id: 10,
    src: 'https://images.unsplash.com/photo-1514539079130-25950c84965d?auto=format&fit=crop&q=80&w=600',
    style: { top: '70%', right: '35%' },
    speed: -60,
  },
  {
    id: 11,
    src: 'https://images.unsplash.com/photo-1601314167099-232775b3d6fd?auto=format&fit=crop&q=80&w=600',
    style: { top: '75%', left: '20%' },
    speed: 90,
  },
  {
    id: 12,
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=600',
    style: { top: '82%', right: '10%' },
    speed: -120,
  },
  {
    id: 13,
    src: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?auto=format&fit=crop&q=80&w=600',
    style: { top: '88%', left: '5%' },
    speed: 60,
  },
  {
    id: 14,
    src: 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&q=80&w=600',
    style: { top: '92%', right: '25%' },
    speed: 200,
  },
]

onMounted(() => {
  // 1. 啟動 Lenis (絲滑慣性滾動的核心)
  lenis = new Lenis({
    // 這裡調整數值來改變「滑溜」的程度
    duration: 1.5, // 數值越大越滑，建議 1.5 ~ 2.0
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  })

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  // 2. GSAP 動畫設定
  ctx.value = gsap.context(() => {
    // 標題動畫
    gsap.to('.sticky-title-wrapper', {
      y: 100,
      ease: 'none',
      scrollTrigger: {
        trigger: mainSection.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true, // 標題保持同步
      },
    })

    // 卡片動畫
    const cardElements = document.querySelectorAll('.parallax-card')
    cardElements.forEach((el) => {
      const speed = el.getAttribute('data-speed')

      gsap.to(el, {
        y: speed,
        ease: 'none',
        scrollTrigger: {
          trigger: mainSection.value,
          start: 'top top',
          end: 'bottom bottom',

          // ★★★ 重點：有 Lenis 時，這裡設 0 最自然 ★★★
          // 如果設成 1，會變成「延遲的延遲」，導致卡片跟不上背景
          scrub: 0,
        },
      })
    })
  }, mainSection.value)
})

onUnmounted(() => {
  ctx.value && ctx.value.revert()
  if (lenis) lenis.destroy()
})
</script>

<template>
  <div class="page-container">
    <section ref="mainSection" class="parallax-section">
      <div class="sticky-title-wrapper">
        <h1 class="main-text">
          TAIWAN<br />
          MAGIC<br />
          ACADEMY
        </h1>
        <p class="sub-text">Scroll to explore the memories</p>
      </div>

      <div class="cards-container">
        <div
          v-for="card in cards"
          :key="card.id"
          class="parallax-card"
          :style="card.style"
          :data-speed="card.speed"
        >
          <div class="card-inner">
            <img :src="card.src" alt="Magic Item" />
          </div>
        </div>
      </div>
    </section>

    <section class="footer">
      <h2>Enrolling Now 2025</h2>
    </section>
  </div>
</template>

<style scoped>
/* 關鍵：這裡不能用 overflow: hidden 鎖住高度
   如果圖片跑出去出現橫向卷軸，請用下面的方式解
*/
.page-container {
  width: 100%;
  background-color: #0a0a0a;
  overflow-x: hidden; /* 只鎖 X 軸，Y 軸要留給 Lenis 滾動 */
}

.parallax-section {
  position: relative;
  width: 100%;
  height: 450vh;
  background-color: #0a0a0a;
}

.sticky-title-wrapper {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}

.main-text {
  font-family: 'Cinzel', serif;
  font-size: 8vw;
  line-height: 1.1;
  color: #fff;
  text-align: center;
  text-transform: uppercase;
  mix-blend-mode: exclusion;
}

.sub-text {
  font-family: 'Cinzel', serif;
  color: #d4af37;
  margin-top: 20px;
  font-size: 1.2rem;
  letter-spacing: 2px;
  opacity: 0.8;
  mix-blend-mode: exclusion;
}

.cards-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.parallax-card {
  position: absolute;
  will-change: transform;
  width: 270px;
  height: 290px;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
}

.card-inner img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  filter: sepia(20%) contrast(110%);
}

.parallax-card:hover {
  z-index: 20;
}

.parallax-card:hover .card-inner img {
  transform: scale(1.1);
}

.footer {
  height: 50vh;
  background: #111;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  position: relative;
  z-index: 20;
}

@media (max-width: 768px) {
  .main-text {
    font-size: 15vw;
  }
  .parallax-section {
    height: 350vh;
  }
  .parallax-card {
    width: 200px;
    height: 215px;
  }
}
</style>
