<template>
  <div class="modal-overlay">
    <div class="letter-container">
      <div class="close-btn" @click="$emit('action', 'stay')">×</div>
      
      <div class="letter-header">
        <h1>Formosoul Institute of Magic</h1>
        <h2>Admission Notice</h2>
      </div>
      
      <div class="letter-body">
        <p>Dear Prospective International Student,</p>
        
        <p>
          You are about to step into this magical academy, hidden within the alleys of Taiwan, as an "Auditing Student" or "International Student."
          From this moment on, you will explore the daily life and magical wonders of Taiwan from the perspective of a visiting student.
        </p>
        
        <p>
          The Academy has prepared six special courses and six interactive mini-games, guiding you to discover temples, night markets, local cuisine, and folk culture.
        </p>
        
        <p>
          These games are scattered throughout different corners of the campus, waiting for you to find them.
          Successfully complete all the interactive games to graduate and receive a discount coupon from the Taiwan Magical Marketplace.
        </p>
        
        <p>
          You may first explore the campus as an auditing student; after completing the games, if you wish to accumulate credits and save your progress, you can register at any time to receive your magical student ID.
        </p>
      </div>

      <div class="letter-footer-section">
        <div class="signature">
          <p>Sincerely,</p>
          <p>Formosoul Institute of Magic</p>
          <p>Office of Academic Affairs.</p>
        </div>

        <div class="action-area">
          <button class="btn btn-audit" @click="$emit('action', 'stay')">Audit the Academy</button>
          <button class="btn btn-register" @click="$emit('action', 'redirect', '/register')">Register Now</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['action']);
</script>

<style scoped>
/* 1. 外層容器設定 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 改為羊皮紙色 (米黃色)，帶一點點透明度讓它不像死板的色塊 */
  background-color: rgba(244, 228, 188, 0.95); 
  
  /* 如果想要一點紙張質感，可以加一點陰影 */
  box-shadow: inset 0 0 80px rgba(139, 69, 19, 0.1);

  /* 上下維持 54px */
  padding: 54px 20px;
   
  box-sizing: border-box;
  z-index: 1000;
}

/* 信件內容容器 */
.letter-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1100px;
  
  /* 文字改為深咖啡色，配合羊皮紙 */
  color: #2c1e14; 
  
  font-family: "Georgia", "Times New Roman", serif; /* 改回襯線字體會比較像信件，若堅持要無襯線可改回 sans-serif */
  text-align: left;
  display: flex;
  flex-direction: column;
}

/* 關閉按鈕 */
.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 2.2rem;
  font-weight: bold;
  color: #5a3a22; /* 深褐色 */
  cursor: pointer;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.close-btn:hover { opacity: 1; }

/* 標題區 */
.letter-header {
  margin-bottom: 30px; /* 拉大間距 */
  flex-shrink: 0;
  border-bottom: 2px solid rgba(90, 58, 34, 0.2); /* 加了一條淡淡的分隔線增加質感 */
  padding-bottom: 10px;
}

.letter-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 10px 0;
  letter-spacing: 0.5px;
  color: #3e2723;
}

.letter-header h2 {
  font-size: 1.5rem;
  font-weight: normal;
  margin: 0;
  color: #5d4037;
}

/* 內文區 */
.letter-body {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 10px; /* 捲軸空間 */
}

/* 針對羊皮紙風格的捲軸美化 (Webkit瀏覽器) */
.letter-body::-webkit-scrollbar { width: 6px; }
.letter-body::-webkit-scrollbar-thumb { background-color: rgba(90, 58, 34, 0.2); border-radius: 3px; }

.letter-body p {
  font-size: 1.1rem;
  line-height: 1.8; /* 行距加大 */
  margin-bottom: 24px; /* 段落間距加大 (原本12 -> 24) */
  color: #3e2723;
}

/* 底部區域 */
.letter-footer-section {
  margin-top: 30px; /* 拉大與內文的距離 */
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 20px;
}

.signature p {
  margin: 5px 0;
  font-size: 1rem;
  color: #3e2723;
  font-style: italic;
}

/* 按鈕區 */
.action-area {
  display: flex;
  gap: 15px;
}

/* 按鈕樣式 */
.btn {
  padding: 12px 28px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.btn:active { transform: scale(0.98); }

/* Audit 按鈕 - 深咖啡框線風格 */
.btn-audit {
  background-color: transparent;
  border: 2px solid #5a3a22;
  color: #5a3a22;
}
.btn-audit:hover {
  background-color: rgba(90, 58, 34, 0.1);
}

/* Register 按鈕 - 金色實心風格 */
.btn-register {
  background-color: #FFCC46; /* 復古金 */
  border: 2px solid #b4941f;
  color: #2c1e14;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.btn-register:hover {
  background-color: #eac14d;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* RWD */
@media (max-width: 768px) {
  .modal-overlay { padding: 54px 15px; } 
  .letter-header h1 { font-size: 1.8rem; }
  .letter-body p { font-size: 1rem; margin-bottom: 18px; }
  .letter-footer-section { flex-direction: column; align-items: flex-start; }
  .action-area { width: 100%; justify-content: flex-end; margin-top: 20px; }
}
</style>