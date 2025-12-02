<template>
  <div class="app-wrapper">
    <aside class="sidebar">
      <div class="logo-area">
        <h2>後台管理系統</h2>
      </div>

      <nav class="nav-menu">
        <router-link to="/dashboard/member-management" class="nav-item">
          會員管理
        </router-link>

        <router-link to="/dashboard/product-management" class="nav-item">
          商品管理
        </router-link>

        <router-link to="/dashboard/order-management" class="nav-item">
          訂單管理
        </router-link>

        <router-link to="/dashboard/coupon" class="nav-item">
          折價券管理123
        </router-link>

        <router-link to="/dashboard/news" class="nav-item">
          消息管理
        </router-link>

        <router-link to="/dashboard/events" class="nav-item">
          年度盛事管理
        </router-link>
      </nav>

      <div class="logout-area">
        <button class="logout-btn" @click="handleLogout">登出</button>
      </div>
    </aside>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const handleLogout = () => {
  if (confirm("確定要登出嗎？")) {
    // 清除 token 等邏輯放這裡
    router.push("/");
  }
};
</script>

<style scoped lang="scss">
/* --- 全域佈局 --- */
.app-wrapper {
  display: flex; /* 左右排版 */
  width: 100vw;
  overflow: hidden;
  height: 100vh;
  background-color: #ffffff; /* 整體白底 */
  color: #333;
}

/* --- 左側 Sidebar 設定 --- */
.sidebar {
  width: 260px; /* 固定寬度 */
  display: flex;
  flex-direction: column; /* 上下排版 */
  padding: 40px 20px; /* 內距 */
  border-right: 1px solid #f0f0f0; /* 如果想要很淡的線可保留，不要就刪掉 */
  flex-shrink: 0; /* 防止被壓縮 */
}

/* Logo */
.logo-area {
  margin-bottom: 40px;
  text-align: center;

  h2 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #2c3e50;
  }
}

/* 選單區域 */
.nav-menu {
  flex: 1; /* 佔據中間所有空間 */
  display: flex;
  flex-direction: column;
  gap: 12px; /* 按鈕之間的間距 (Mockup 的重點！) */
}

/* 按鈕樣式 (Mockup 風格核心) */
.nav-item {
  display: block;
  text-align: center;
  padding: 12px 0;
  text-decoration: none;
  color: #606266;
  background-color: #f0f7ff; /* 預設淺灰底 */
  border-radius: 6px; /* 圓角 */
  font-size: 15px;
  transition: all 0.3s ease;

  /* 滑鼠移過去的效果 */
  &:hover {
    background-color: #e6effb;
    color: #333;
  }

  /* 被選中時的樣式 (Vue Router 自動加的 class) */
  &.router-link-active {
    background-color: #0a3d70; /* 深藍色背景 */
    color: #ffffff; /* 白色文字 */
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(16, 52, 106, 0.2); /* 加上一點陰影更有質感 */
  }
}

/* 底部登出區 */
.logout-area {
  margin-top: 20px;
}

.logout-btn {
  width: 100%;
  padding: 12px 0;
  border: none;
  background-color: #f0f7ff;
  color: #606266;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.3s;

  &:hover {
    background-color: #e6effb;
    color: #333;
  }
}

/* --- 右側內容區 --- */
.main-content {
  flex: 1; /* 自動填滿剩餘寬度 */
  overflow-y: auto; /* 內容過長時出現卷軸 */
  padding: 40px 60px; /* 這裡控制右邊內容留白的程度 */
  background-color: #ffffff; /* 右邊也是全白 */
}
</style>
