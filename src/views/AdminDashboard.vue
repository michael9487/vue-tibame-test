<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <el-container class="layout-container">
    <el-header>Header</el-header>

    <el-container>
      <el-aside width="200px" class="aside-container">
        <div><h6>後台管理系統</h6></div>
        <el-menu router>
          <el-menu-item index="/admin/member-management">會員管理</el-menu-item>
          <el-menu-item index="/admin/product-management">商品管理</el-menu-item>
          <el-menu-item index="/admin/order-management">訂單管理</el-menu-item>
          <el-menu-item index="/admin/coupon-management">折價券管理</el-menu-item>
          <el-menu-item index="/admin/news-management">消息管理</el-menu-item>
          <el-menu-item index="/admin/annual-event-management">年度盛事管理</el-menu-item>
        </el-menu>
        <router-link to="/" class="el-menu-item logout-btn">
          登出
        </router-link>
      </el-aside>
      <el-main>       
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
.el-header, .el-footer {
  background-color: #b3c0d1;
  color: #333;
  text-align: center;
  line-height: 60px;
}
.el-aside {
  background-color: #FFF;
  text-align: center;
}
.aside-container{
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: 0 10px;
}
.el-menu{
  padding: 10px;
  border-right: none;
}
/* 一般狀態的按鈕 */
.el-menu-item {
  margin: 10px 0;
  border-radius: 10px;
  background-color: #F0F7FF;
  justify-content: center;/* 文字置中 */
  color: #333; 
  box-sizing: border-box;
  width: 180px;
  height: 48px;
}
.el-menu-item:hover{
  background-color: #0A3D70;
  color: #fff;
}

/* 被選中時的狀態 */
.el-menu-item.is-active {
  background-color: #0A3D70;
  color: #fff; 
}
.aside-container h6{
  font-size: 2rem;
  line-height: 160%;
  margin-top: 50px;
  margin-bottom: 10px;
}
.logout-btn {
  /* 推到最下面 */
  margin: auto 10px 20px 10px;
  border-radius: 10px;
  background-color: #F0F7FF;
  text-align: center;
  width: 180px;
  height: 48px;
  display: flex;
  justify-content: center; 
  align-items: center;     
  cursor: pointer;
  color: #333;
}

.logout-btn:hover {
  background-color: #0A3D70;
  color: #fff;
}
</style>