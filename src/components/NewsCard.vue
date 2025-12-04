<script setup>
// 定義接收的資料 props
defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="news-card">
    <img :src="data.image" class="news-bg" alt="News Image" />

    <div class="news-content">
      <div class="news-title">{{ data.title }}</div>
      <div class="news-date">{{ data.date }}</div>
    </div>

    <div class="corner-triangle"></div>
  </div>
</template>

<style scoped>
/* 這裡是從原本頁面拆出來的 CSS 
  只保留跟「卡片長相」有關的樣式 
*/

.news-card {
  position: relative;
  aspect-ratio: 1 / 1; /* 保持正方形 */
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.news-card:hover {
  transform: translateY(-5px);
}

.news-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.news-card:hover .news-bg {
  opacity: 1;
}

.news-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 標題在頂，日期在底 */
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.6)
  );
}

.news-title {
  font-family: "Roboto", sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.news-date {
  font-family: "Roboto", sans-serif;
  font-size: 0.9rem;
  color: #e0e0e0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 右下角的白色三角 */
.corner-triangle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  /* 使用漸層切出三角形：左上透明，右下白色 */
  background: linear-gradient(to top left, transparent 50%, #ffffff 50%);
  pointer-events: none; /* 讓滑鼠點擊穿透 */
}
</style>
