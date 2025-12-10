<template>
  <Teleport to="body">
    
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click="closeModal">
        
        <div class="modal-container" @click.stop>
          
          <button class="close-btn" @click="closeModal">×</button>

          <div class="modal-body">
            <slot></slot>
          </div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// 接收父層傳來的開關狀態
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

// 關閉函式：發送事件通知父層把 modelValue 改為 false
const closeModal = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
/* --- 1. 遮罩層樣式 --- */
.modal-overlay {
  position: fixed; /* 固定在視窗 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* 半透明黑底 */
  z-index: 9999; /* 確保在最上層 */
  
  /* Flexbox 讓內容垂直水平置中 */
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px); /* (選用) 背景模糊效果 */
}

/* --- 2. 彈窗本體樣式 --- */
.modal-container {
  background: white;
  width: 90%;       /* 寬度 90% */
  height: 80vh;     /* 高度 80% */
  border-radius: 12px;
  position: relative; /* 為了定位關閉按鈕 */
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止內容溢出圓角 */
}

.modal-body {
  flex: 1; /* 佔滿剩餘空間 */
  overflow: auto; /* 內容太多時可以卷 */
  height: 100%;
}

/* --- 3. 關閉按鈕 --- */
.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 36px;
  color: #333;
  cursor: pointer;
  z-index: 10;
  line-height: 1;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
    color: red;
  }
}

/* --- 4. Vue Transition 動畫 (Fade + Scale) --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  
  /* 讓內部的 modal-container 也有動畫 */
  .modal-container {
    transition: transform 0.3s ease;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  
  /* 進場前/離場後稍微縮小，製造彈出感 */
  .modal-container {
    transform: scale(0.95); 
  }
}
</style>