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
          <el-menu-item index="/">會員管理</el-menu-item>
          <el-menu-item index="/">商品管理</el-menu-item>
          <el-menu-item index="/">訂單管理</el-menu-item>
          <el-menu-item index="/">折價券管理</el-menu-item>
          <el-menu-item index="/">消息管理</el-menu-item>
          <el-menu-item index="/">年度盛事管理</el-menu-item>
                <div class="el-menu-item logout-btn">登出</div>
        </el-menu>
      </el-aside>
      <el-main>       
        <router-view></router-view>
      </el-main>
    </el-container>

    <el-footer>Footer</el-footer>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}
.el-header, .el-footer {
  background-color: #b3c0d1;
  color: #333;
  text-align: center;
  line-height: 60px;
}
.el-aside {
  background-color: #FFF;
  color: #333;
  text-align: center;
}
.el-main {
  background-color: #e9eef3;
  color: #333;
  text-align: center;
  line-height: 160px;
}
.aside-container{
  height: 100%;
  display: flex;
  flex-direction: column;
}
.el-menu{
  padding: 10px;
}
/* 一般狀態的按鈕 */
.el-menu-item {
  margin: 10px 0;          /* 上下製造空隙 */
  border-radius: 10px;     /* 圓角 */
  background-color: #F0F7FF; /* 淺藍底色 */
  justify-content: center;      /* 文字置中 */
  color: #333;             /* 一般文字顏色 (視情況調整) */
}

/* 被選中時的狀態 */
.el-menu-item.is-active {
  background-color: #0A3D70; /* 深藍底色 */
  color: #fff;             /* 白色文字 */
}
.aside-container h6{
  font-size: 20px;
}
.logout-btn {
  /* 推到最下面 */
  margin-top: auto; 
  /* 2. 讓它長得跟選單一樣 */
  margin-bottom: 20px;
  border-radius: 10px;
  background-color: #F0F7FF;
  text-align: center;
  height: 56px; 
  display: flex;
  justify-content: center; 
  align-items: center;     
  cursor: pointer;
  
  /* 6. 文字顏色 */
  color: #333;
}

/* 為了讓體驗更好，也可以加上滑鼠移過去變色的效果 */
.logout-btn:hover {
  background-color: #ecf5ff; /* 稍微深一點的藍 */
}
</style>