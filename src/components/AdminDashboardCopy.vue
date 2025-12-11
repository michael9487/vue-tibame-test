<template>
  <div class="layout-container">
    <div class="app-wrapper">
      
      <aside class="sidebar">
        <div class="logo-area">
          <h2>後台管理系統</h2>
        </div>

        <nav class="nav-menu">
          <router-link :to="{name : 'MemberManagement' }" class="nav-item">
            會員管理
          </router-link>
          <router-link to="/dashboard/product-management" class="nav-item">
            商品管理
          </router-link>
          <router-link to="/dashboard/order-management" class="nav-item">
            訂單管理
          </router-link>
          <router-link to="/dashboard/coupon" class="nav-item">
            折價券管理
          </router-link>
          <router-link to="/dashboard/news" class="nav-item">
            消息管理
          </router-link>
          <router-link to="/dashboard/events" class="nav-item">
            年度盛事管理
          </router-link>
          <router-link to="/" class="nav-item">
            回前台
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
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const handleLogout = () => {
  if (confirm("確定要登出嗎？")) {
    router.push("/");
  }
};
</script>

<style scoped lang="scss">
/* --- 全螢幕背景與置中 --- */
.layout-container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f7fa; /* 淺灰背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* ★ 鎖死全域捲軸 */
}

/* --- App 主視窗 (1200px) --- */
.app-wrapper {
  display: flex;
  width: 100%;
  max-width: 1200px;
  height: 100vh; /* ★ 強制高度佔滿 */
  background-color: #ffffff;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.08);
  overflow: hidden; /* ★ 鎖死內部捲軸 */
}

/* --- 左側 Sidebar --- */
.sidebar {
  width: 220px;
  display: flex;
  flex-direction: column;
  padding: 100px 16px 16px 16px;
  border-right: 1px solid #f0f0f0;
  flex-shrink: 0;
  background-color: #fff;
  z-index: 10;
}

.logo-area {
  margin-bottom: 25px;
  text-align: center;
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px; /* 間距縮小 */
  overflow-y: auto; /* 只有選單可以卷 */
}

.nav-item {
  display: block;
  text-align: center;
  padding: 10px 0;
  text-decoration: none;
  color: #606266;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f0f7ff;
    color: #333;
  }

  &.router-link-active {
    background-color: #0a3d70;
    color: #ffffff;
    font-weight: 500;
  }
}

.logout-area {
  margin-top: 20px;
}

.logout-btn {
  width: 100%;
  padding: 10px 0;
  border: none;
  background-color: #f5f7fa;
  color: #606266;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
  &:hover {
    background-color: #e6e8eb;
    color: #333;
  }
}

/* --- 右側內容區 --- */
.main-content {
  flex: 1;
  background-color: #ffffff;
  padding: 0; 
  overflow: hidden; /* ★ 這裡設為 hidden，內容若超過會直接切掉 (要靠內層縮小來適應) */
  height: 100%;
}
</style>