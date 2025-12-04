<template>
  <div class="inventory-content">
    <h3>冒險者背包</h3>
    
    <div class="inventory-grid">
      <div class="item-slot" title="新手劍" draggable="true" 
           @dragstart="startDrag($event, '🗡️')" 
           @mousedown.stop @touchstart.stop>
        🗡️
      </div>

      <div class="item-slot" title="回復藥水" draggable="true" 
           @dragstart="startDrag($event, '🍷')" 
           @mousedown.stop @touchstart.stop>
        🍷
      </div>

      <div class="item-slot" title="魔法卷軸" draggable="true" 
           @dragstart="startDrag($event, '📜')" 
           @mousedown.stop @touchstart.stop>
        📜
      </div>

      <div class="item-slot" title="世界地圖" draggable="true" 
           @dragstart="startDrag($event, '🗺️')" 
           @mousedown.stop @touchstart.stop>
        🗺️
      </div>

      <div class="item-slot empty"></div>
      <div class="item-slot empty"></div>
    </div>
    
    <div class="inventory-info">
       <p>金幣: 💰 1,250 G</p>
       <p>負重: ⚖️ 4/20</p>
    </div>
  </div>
</template>

<script setup>
// 把 startDrag 函式搬進來，讓這個組件自己處理拖曳起點
const startDrag = (event, itemIcon) => {
  // 設定拖曳資料
  event.dataTransfer.dropEffect = 'copy';
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('item', itemIcon);
};
</script>

<style scoped>
/* 只搬運跟背包有關的樣式，不會影響到外面 */
h3 {
  font-family: "Times New Roman", serif;
  margin-bottom: 10px;
  color: #4a3b2a;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 20px 0;
}

.item-slot {
  width: 60px;
  height: 60px;
  background: rgba(0,0,0,0.05);
  border: 2px inset #c2b5a3;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  border-radius: 5px;
  cursor: grab; /* 強制顯示手掌 */
}

/* 抓取時的樣式 */
.item-slot:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.item-slot:hover {
  background: rgba(139, 69, 19, 0.1);
  transform: scale(1.05);
}

.item-slot.empty {
  opacity: 0.3;
}

.inventory-info {
  width: 100%;
  display: flex;
  justify-content: space-around;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #555;
  border-top: 1px dashed #aaa;
  padding-top: 10px;
}
</style>