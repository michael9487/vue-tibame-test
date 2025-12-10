<template>
  <div class="game-container">
    <div class="pool-area">
      
      <div ref="pivotRef" class="hook-pivot">
        
        <div ref="lineRef" class="fishing-line"></div>

        <div ref="arrowRef" class="arrow-indicator">⬇️</div>
        
      </div>

      <div ref="shrimpRef" class="shrimp">🍤</div>
    </div>

    <div class="controls">
      <button @click="shootHook" class="shoot-btn">發射釣竿 (SPACE)</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import gsap from "gsap";

const pivotRef = ref(null); // 新增：控制旋轉的容器
const arrowRef = ref(null);
const lineRef = ref(null);
const shrimpRef = ref(null);

let swingTween = null;
let dropTimeline = null;

onMounted(() => {
  // 注意：我們現在旋轉的是 pivotRef (容器)，而不是箭頭本身
  if (pivotRef.value) {
    // 初始角度
    gsap.set(pivotRef.value, { rotation: -45 }); // 稍微縮小角度範圍比較好玩

    // 啟動擺盪動畫 (對容器旋轉)
    swingTween = gsap.to(pivotRef.value, {
      rotation: 45,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }

  // 隨機放蝦子
  if (shrimpRef.value) {
    gsap.set(shrimpRef.value, { 
      x: Math.random() * 200 - 100, 
      y: Math.random() * 150 + 100 
    });
  }
});

function checkCollision() {
  if (!dropTimeline || !dropTimeline.isActive()) return;

  const hookRect = arrowRef.value.getBoundingClientRect();
  const shrimpRect = shrimpRef.value.getBoundingClientRect();

  // AABB 碰撞偵測 (即使旋轉，getBoundingClientRect 也會抓出那個瞬間的方框)
  if (
    hookRect.right > shrimpRect.left &&
    hookRect.left < shrimpRect.right &&
    hookRect.bottom > shrimpRect.top &&
    hookRect.top < shrimpRect.bottom
  ) {
    console.log("💥 抓到了！");
    dropTimeline.pause();
    returnHook(true);
  }

  // 觸底判斷 (這裡用 timeline 的進度或高度判斷皆可，這裡簡化用高度)
  // 因為繩子是在旋轉容器內變長，我們直接檢查繩子的高度屬性
  if (lineRef.value.clientHeight >= 580) { // 稍微扣一點避免穿幫
    dropTimeline.pause();
    returnHook(false);
  }
}

function returnHook(caught) {
  if (caught) {
    gsap.to(shrimpRef.value, { opacity: 0, duration: 0.2 });
  }

  // 返回動畫：縮回繩子、拉回鉤子
  gsap.timeline({
    onComplete: () => {
      // 恢復擺盪
      if (swingTween) swingTween.resume();
      
      // 重置蝦子
      if (caught) {
        gsap.set(shrimpRef.value, { opacity: 1 });
        gsap.to(shrimpRef.value, {
            x: Math.random() * 200 - 100, 
            y: Math.random() * 150 + 100,
            duration: 0 
        });
      }
    }
  })
  .to(arrowRef.value, { y: 0, duration: 0.5, ease: "power2.out" }, 0)
  .to(lineRef.value, { height: 0, duration: 0.5, ease: "power2.out" }, 0);
}

const shootHook = () => {
  if (!pivotRef.value) return;

  // 1. 暫停擺盪 (現在是暫停容器)
  if (swingTween) swingTween.pause();

  // 2. 確保狀態歸零
  gsap.set(lineRef.value, { height: 0 });
  gsap.set(arrowRef.value, { y: 0 });

  const MAX_LENGTH = 600; // 繩子最大長度

  dropTimeline = gsap.timeline({
    defaults: { duration: 2, ease: "linear" }, // 發射速度
    onUpdate: checkCollision,
    onComplete: () => returnHook(false)
  });

  // 3. 關鍵：因為 line 和 arrow 都在 pivot 裡面
  // 我們只要改變 Y 和 Height，它們就會沿著 pivot 目前的旋轉角度延伸出去！
  dropTimeline
    .to(arrowRef.value, { y: MAX_LENGTH }, 0)
    .to(lineRef.value, { height: MAX_LENGTH }, 0);
};
</script>

<style scoped>
.game-container {
  width: 100%;
  min-height: 100vh;
  background-color: #2c3e50;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50px;
  color: white;
}

.pool-area {
  position: relative;
  width: 300px;
  height: 400px;
  border: 4px solid #8e44ad;
  border-radius: 20px;
  background-color: #3498db;
  margin: 20px 0;
  overflow: hidden;
}

/* --- 1. 旋轉容器 (Pivot) --- */
.hook-pivot {
  position: absolute;
  top: 10px;        /* 固定在頂部 */
  left: 50%;        /* 水平居中 */
  width: 0;         /* 寬度設為 0，避免影響佈局 */
  height: 0;
  transform-origin: center top; /* 關鍵：以頂部中心為旋轉軸心 */
  z-index: 10;
}

/* --- 2. 繩子 --- */
.fishing-line {
  position: absolute;
  top: 0;           /* 從 pivot 的頂點開始 */
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 0;        /* 初始高度 0 */
  background-color: #333;
  z-index: 5;
}

/* --- 3. 箭頭/鉤子 --- */
.arrow-indicator {
  position: absolute;
  top: 0;           /* 初始位置在 pivot 頂點 */
  left: 50%;
  transform: translateX(-50%); /* 修正自身中心點 */
  font-size: 40px;
  line-height: 1;   /* 避免文字行高影響位置 */
  z-index: 10;
}

.shrimp {
  position: absolute;
  font-size: 30px;
  z-index: 4;
}

.shoot-btn {
  padding: 15px 30px;
  font-size: 20px;
  background-color: #f1c40f;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
}
</style>