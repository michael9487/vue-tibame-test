<template>
  <div class="book-section">
    <div v-if="isAnimating" class="blocking-overlay"></div>

    <div 
      class="book" 
      ref="bookRef"
      :class="{ 'intro-center-pos': isIntroPosition }"
    >
      
      <div class="page cover">
        <div class="page-content">
          <h1>台灣魔法學院</h1>
          <p>Taiwan Magic Academy</p>
          <div class="decoration">✨</div>
          <p class="hint">
            <span v-if="isAnimating">正在施法中...</span>
            <span v-else>請拖曳書角或雙擊翻頁</span>
          </p>
        </div>
      </div>

      <div class="page">
        <div class="page-content text-page">
          <h3>院長致詞</h3>
          <p>歡迎來到這片充滿奇蹟的土地。在這裡，程式碼是咒語，瀏覽器是我們的魔杖。</p>
          <p>請小心翻閱，知識是有重量的。</p>
          
          <button class="nav-btn" @click.stop="goToPage(10)">
            🚀 傳送至裝備區
          </button>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>魔藥學：Vue Composition</h3>
          <p>將 `ref` 與 `reactive` 混合攪拌，並加入一點 `computed` 的精華。</p>
          <div class="potion-image-box">🧪</div>
          <p class="caption">基礎配方：Setup Sugar</p>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>學院地圖</h3>
          <ul class="magic-list">
            <li>🏰 <strong>前端堡壘</strong> (Main Hall)</li>
            <li>🌲 <strong>後端黑森林</strong> (Backend API)</li>
            <li>📚 <strong>資料庫圖書館</strong> (MySQL)</li>
            <li>⚔️ <strong>Git 競技場</strong> (Version Control)</li>
          </ul>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>咒語學：API 召喚術</h3>
          <div class="code-block">
            <span class="keyword">await</span> axios.<span class="func">get</span>(<span class="str">'/magic'</span>);
          </div>
          <p>揮動你的 Axios 魔杖，從遙遠的伺服器召喚數據精靈。</p>
          <hr class="divider">
          <p class="small-text">⚠️ 警告：若魔力不足 (404)，精靈將拒絕回應。</p>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>奇獸飼育學</h3>
          <div class="creature-card">
            <div class="creature-icon">🕷️</div>
            <h4>名稱：千年 Bug</h4>
            <p><strong>習性：</strong>總是在 Demo 前一刻出現，喜歡躲在非同步函式中。</p>
            <p><strong>剋星：</strong>Chrome DevTools 與 console.log 法陣。</p>
          </div>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>占卜學：未來之路</h3>
          <p>透過水晶球窺探畢業後的命運...</p>
          <ul class="prophecy-list">
            <li>🔮 <strong>全端大法師</strong> (Full Stack)</li>
            <li>🎨 <strong>UI 幻術師</strong> (Designer)</li>
            <li>🛡️ <strong>資安守護者</strong> (Security)</li>
          </ul>
          <p>命運掌握在你的 Commit 紀錄中。</p>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>禁忌森林入口</h3>
          <p>前方偵測到強大的魔力波動...</p>
          <div class="game-portal-icon">🌀</div>
          <router-link to="/parallax-test" class="magic-btn">
            進入遊戲測試
          </router-link>
          <p class="small-text">點擊按鈕進行空間跳躍</p>
        </div>
      </div>

      <div class="page">
        <div class="page-content image-page">
           <img src="https://picsum.photos/300/400?grayscale" alt="Old Library" />
        </div>
      </div>

      <div class="page">
          <div class="page-content">
              <h3>魔法筆記</h3>
              <p>這裡記錄著未知的符文...</p>
          </div>
      </div>

      <div class="page">
        <div class="page-content equipment-page">
           <h3>冒險者裝備欄</h3>
           <button class="nav-btn back-btn" @click.stop="goToPage(3)">
             ⬅️ 回到學院地圖
           </button>
           <p>請從右側背包拖曳裝備至此</p>
           
           <div 
             class="equipment-slot" 
             :class="{ 'has-item': equippedItem }"
             @dragover.prevent 
             @drop="onDrop"
           >
              <div v-if="equippedItem" class="equipped-icon">{{ equippedItem }}</div>
              <div v-else class="placeholder-text">
                <span style="font-size: 2rem; opacity: 0.3;">🛡️</span>
                <p>拖曳至此裝備</p>
              </div>
           </div>

           <p class="equip-status" v-if="equippedItem">
             已裝備: <strong>{{ getEquipName(equippedItem) }}</strong>
           </p>

           <img src="https://picsum.photos/300/200?grayscale&blur=2" class="bg-img" />
        </div>
      </div>

      <div class="page">
          <div class="page-content">
              <h3>背包</h3>
              <DragDrop /> 
              <div class="inventory-grid" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:20px;">
                  <div class="item" draggable="true" @dragstart="startDrag($event, '🗡️')" style="font-size:3rem; cursor:grab;">🗡️</div>
                  <div class="item" draggable="true" @dragstart="startDrag($event, '🍷')" style="font-size:3rem; cursor:grab;">🍷</div>
                  <div class="item" draggable="true" @dragstart="startDrag($event, '📜')" style="font-size:3rem; cursor:grab;">📜</div>
                  <div class="item" draggable="true" @dragstart="startDrag($event, '🗺️')" style="font-size:3rem; cursor:grab;">🗺️</div>
              </div>
          </div>
      </div>

      <div class="page">
        <div class="page-content">
          <h3>角色狀態</h3>
          <div class="profile-box">
              <div class="avatar">🧙‍♂️</div>
              <h4>Level 5 見習巫師</h4>
          </div>
          
          <div class="stat-bars">
            <div class="stat-row">
              <span>HP</span>
              <div class="bar-container"><div class="bar red" style="width: 80%"></div></div>
            </div>
            <div class="stat-row">
              <span>MP</span>
              <div class="bar-container"><div class="bar blue" style="width: 45%"></div></div>
            </div>
            <div class="stat-row">
              <span>EXP</span>
              <div class="bar-container"><div class="bar green" style="width: 30%"></div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <ProductCard />
        </div>
      </div>

      <div class="page">
        <div class="page-content">
          <HelloWorld />
        </div>
      </div>

      <div class="page cover">
        <div class="page-content">
          <h3>The End</h3>
          <p>© 2025 Class Project</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { PageFlip } from 'page-flip';
// 請確認這些元件的路徑是否正確
import ProductCard from '@/components/ProductCard.vue';
import HelloWorld from '@/components/HelloWorld.vue';
import DragDrop from '@/components/drag-drop.vue';

const bookRef = ref(null);
const isAnimating = ref(true); // 鎖定互動
// 🔥 新增：控制書本起始位置 (true = 在中間, false = 回到正常位置)
const isIntroPosition = ref(true); 

let pageFlip = null;

// --- 輔助函式：等待 (毫秒) ---
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// --- 🔥 核心：開場動畫邏輯 ---
const playIntroAnimation = async () => {
  if (!pageFlip) return;

  // 1. 初始狀態：書本因為 CSS class (.intro-center-pos) 被強制在中間
  // 等待一下讓使用者看到書在中間
  await wait(800);

  // 2. 🔥 開始移動：移除 class，書本會滑到它原本的位置 (右邊/正常位置)
  isIntroPosition.value = false;

  // 3. 等待滑動動畫結束 (配合 CSS 的 1.5s，這裡抓 1600ms)
  await wait(1600);

  // --- 以下是原本的翻頁動畫 ---
  
  // 4. 快速翻閱 (嘩啦嘩啦效果)
  for (let i = 0; i < 8; i++) {
    pageFlip.flipNext();
    await wait(300); // 稍微加速翻頁
  }

  // 5. 停在中間讓觀眾看一下
  await wait(600);

  // 6. 蓋上書本 (回到 index 0)
  pageFlip.flip(0);

  // 7. 等待蓋書動畫完成 (稍微久一點，增加重量感)
  await wait(1200);

  // 8. 正式打開第一頁
  pageFlip.flip(1);
  
  // 9. 解鎖互動，動畫結束
  await wait(600); 
  isAnimating.value = false;
};

// --- 跳頁函式 ---
const goToPage = (pageNum) => {
  if (pageFlip && !isAnimating.value) { 
    pageFlip.flip(pageNum);
  }
};

// --- 🎒 拖曳功能邏輯 ---
const equippedItem = ref(null);

const startDrag = (event, itemIcon) => {
  event.dataTransfer.dropEffect = 'copy';
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('item', itemIcon);
};

const onDrop = (event) => {
  const item = event.dataTransfer.getData('item');
  if (item) {
    equippedItem.value = item;
  }
};

const getEquipName = (icon) => {
  const map = { '🗡️': 'Excalibur', '🍷': '阿嬤的藥水', '📜': 'Vue 文件', '🗺️': '藏寶圖' };
  return map[icon] || '未知物品';
};

onMounted(() => {
  // --- 🔥 修改點 2: 設定 size 為 'fixed' ---
  pageFlip = new PageFlip(bookRef.value, {
    width: 400,    // 單頁寬度
    height: 600,   // 書本高度
    
    // 這裡改成 fixed，書本就不會被全螢幕拉伸，會維持 800x600 (雙頁)
    size: 'fixed',  
    
    showCover: true,
    maxShadowOpacity: 0.2,
    flippingTime: 400, 
  });

  pageFlip.loadFromHTML(bookRef.value.querySelectorAll('.page'));

  // 啟動開場動畫
  playIntroAnimation();
});

onUnmounted(() => {
  if (pageFlip) pageFlip.destroy();
});
</script>

<style scoped>
/* --- 🔥 修改點 3: 容器全螢幕 --- */
.book-section {
  width: 100vw;   /* 佔滿寬度 */
  height: 100vh;  /* 佔滿高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2c3e50;
  overflow: hidden; 
  user-select: none; 
  position: relative;
  box-sizing: border-box; /* 避免 padding 撐大 */
  padding: 0;
  margin: 0;
}

/* 互動阻擋遮罩 */
.blocking-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  cursor: wait; 
  background: rgba(0,0,0,0);
}

.book {
  
  filter: drop-shadow(0 20px 20px rgba(0, 0, 0, 0.5));
  /* 🔥 修改點 4: 增加滑動的轉場效果 */
  transition: transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 🔥 修改點 5: 起始位置設定
  這個 class 存在時，書本會被位移。
  translateX 的數值 (-25%) 是為了把原本偏右的書拉回中間。
  你可以試著調整這個 % 數，直到它看起來完全在正中央。
*/
.intro-center-pos {
  transform: translateX(-25%) scale(0.9); 
}

/* --- 頁面樣式 (保持不變) --- */
.page {
  padding: 20px;
  background-color: #ccc;
  border: 1px solid #c2b5a3;
  overflow: hidden;
  transition: none !important; 
}

/* 讓背景有點紙質感 */
.page::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: url('https://www.transparenttextures.com/patterns/paper.png');
  opacity: 0.4;
  pointer-events: none;
}

.cover {
  background-color: #8b4513; 
  color: #e0d5c1;
  border: 2px solid #5e2f0d;
}

.page-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

h1, h3, h4 {
  font-family: "Times New Roman", serif;
  margin-bottom: 10px;
  color: #4a3b2a;
}
.cover h1, .cover h3 { color: #e0d5c1; }

.decoration { font-size: 2rem; margin: 10px 0; }
.hint { font-size: 0.8rem; opacity: 0.8; }
.magic-list { text-align: left; list-style: none; padding: 0; margin-top: 20px; font-family: 'Courier New', Courier, monospace; }
.magic-list li { margin-bottom: 15px; font-size: 1.1rem; border-bottom: 1px dashed #c2b5a3; padding-bottom: 5px; }
.potion-image-box { font-size: 4rem; margin: 20px 0; filter: drop-shadow(0 0 10px rgba(100, 200, 100, 0.5)); }
img { max-width: 100%; border-radius: 4px; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); }
.code-block { background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; margin: 20px 0; box-shadow: inset 0 0 10px #000; text-align: left; width: 90%; }
.keyword { color: #c678dd; } .func { color: #61afef; } .str { color: #98c379; }
.divider { width: 50%; border-top: 1px solid #c2b5a3; margin: 20px 0; }
.small-text { font-size: 0.8rem; color: #888; }
.creature-card { border: 2px dashed #8b4513; padding: 15px; border-radius: 10px; background: rgba(139, 69, 19, 0.05); }
.creature-icon { font-size: 3rem; margin-bottom: 10px; }
.prophecy-list { list-style: none; padding: 0; margin: 20px 0; text-align: left; }
.prophecy-list li { font-size: 1.2rem; margin-bottom: 10px; padding: 5px; border-bottom: 1px solid rgba(0,0,0,0.1); }
.magic-btn { display: inline-block; margin-top: 15px; padding: 12px 24px; background: #8b4513; color: #fff; text-decoration: none; border-radius: 30px; border: 2px solid #e0d5c1; font-family: "Times New Roman", serif; font-weight: bold; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: all 0.3s ease; cursor: pointer; position: relative; z-index: 10; }
.magic-btn:hover { background: #a0522d; transform: scale(1.1) translateY(-2px); box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); }
.magic-btn:active { transform: scale(0.95); }
.game-portal-icon { font-size: 4rem; margin: 15px 0; animation: spinPortal 3s linear infinite; }
@keyframes spinPortal { 0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); } 50% { transform: rotate(180deg) scale(1.1); filter: hue-rotate(90deg); } 100% { transform: rotate(360deg) scale(1); filter: hue-rotate(0deg); } }

.profile-box { margin-bottom: 20px; }
.avatar { font-size: 4rem; background: #eee; width: 100px; height: 100px; line-height: 100px; border-radius: 50%; margin: 0 auto 10px; border: 4px double #8b4513; }
.stat-bars { width: 100%; padding: 0 10px; }
.stat-row { display: flex; align-items: center; margin-bottom: 10px; gap: 10px; }
.stat-row span { width: 40px; font-weight: bold; font-family: monospace; }
.bar-container { flex-grow: 1; height: 15px; background: #ddd; border-radius: 10px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); }
.bar { height: 100%; border-radius: 10px; }
.bar.red { background: linear-gradient(90deg, #ff6b6b, #e74c3c); }
.bar.blue { background: linear-gradient(90deg, #4facfe, #00f2fe); }
.bar.green { background: linear-gradient(90deg, #4cd964, #2ecc71); }

.equipment-page { position: relative; z-index: 1; }
.equipment-slot { width: 120px; height: 120px; margin: 20px auto; border: 3px dashed #8b4513; background: rgba(255, 255, 255, 0.8); border-radius: 10px; display: flex; justify-content: center; align-items: center; transition: all 0.3s; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
.equipment-slot:hover { border-color: #d35400; background: rgba(255, 255, 255, 0.95); transform: scale(1.05); }
.has-item { border-style: solid; border-color: #27ae60; background: #fff; }
.equipped-icon { font-size: 4rem; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.placeholder-text { color: #aaa; font-size: 0.8rem; display: flex; flex-direction: column; align-items: center; }
.equip-status { background: rgba(0,0,0,0.7); color: #fff; padding: 5px 15px; border-radius: 20px; margin-top: 10px; }
.bg-img { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 80%; opacity: 0.3; z-index: -1; pointer-events: none; }
@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }

.nav-btn { margin-top: 20px; padding: 8px 16px; border: 2px solid #8b4513; background-color: #fff; color: #8b4513; font-family: "Times New Roman", serif; font-weight: bold; border-radius: 5px; cursor: pointer; transition: all 0.3s; z-index: 10; position: relative; }
.nav-btn:hover { background-color: #8b4513; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
.back-btn { margin-top: 10px; background-color: rgba(255, 255, 255, 0.9); border-color: #2c3e50; color: #2c3e50; }
.back-btn:hover { background-color: #2c3e50; color: white; }
</style>