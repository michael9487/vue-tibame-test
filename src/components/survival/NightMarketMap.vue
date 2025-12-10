<template>
  <div class="game-container">
    <div class="pool-area">
      <div ref="arrowRef" class="arrow-indicator">⬇️</div>
    </div>

    <div class="controls">
      <button @click="shootHook" class="shoot-btn">發射釣竿 (SPACE)</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import gsap from "gsap";

const arrowRef = ref(null);

onMounted(() => {
  console.log("釣蝦頁面掛載完成，檢查箭頭:", arrowRef.value);

  // 加上判斷，確保元素存在才執行動畫
  if (arrowRef.value) {
    // 設定初始狀態
    gsap.set(arrowRef.value, { rotation: -90 });

    // 開始左右擺盪動畫
    gsap.to(arrowRef.value, {
      rotation: 90, // 轉到 45 度
      duration: 1, // 速度
      repeat: -1, // 無限重複
      yoyo: true, // 來回擺盪
      ease: "power1.inOut", // 擺盪的物理感 (兩端慢中間快)
    });
  }
});

const shootHook = () => {
  // 之後我們要寫這裡：取得目前 arrowRef 的角度，然後發射
  if (arrowRef.value) {
    // gsap.getProperty 可以抓出目前動畫跑到幾度了
    const currentAngle = gsap.getProperty(arrowRef.value, "rotation");
    console.log(`發射！角度是: ${currentAngle}`);
    alert(`發射角度：${Math.round(currentAngle)} 度`);
  }
};
</script>

<style scoped>
/* 讓整個頁面有高度跟背景，避免白畫面 */
.game-container {
  width: 100%;
  min-height: 100vh;
  background: center center no-repeat url(/public/shrimp-fishing.png);
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
  background-color: #3498db; /* 水的顏色 */
  margin: 20px 0;
  overflow: hidden; /* 讓跑出去的東西被切掉 */
}

/* 箭頭樣式 */
.arrow-indicator {
  font-size: 40px;
  position: absolute;
  top: 10px;
  left: 50%;
  /* 這裡很重要：設定旋轉的支點在「上方中間」，不要設在正中心 */
  /* x: -50% 是為了讓它水平置中，transform-origin 設為 center top */
  transform-origin: center top;
  margin-left: -20px; /* 因為寬度約 40px，往左回推一半確保置中 */
  z-index: 10;
}

.hook {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 30px;
}
.water {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 80%;
  opacity: 0.8;
}
.fish,
.trash {
  position: absolute;
  font-size: 30px;
  top: 50%;
  left: 20%;
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
.shoot-btn:hover {
  background-color: #f39c12;
}
</style>
