<template>
  <el-card class="box-card">
    <div class="table-header">
      <el-input
        v-model="searchKeyword"
        placeholder="搜尋會員名稱..."
        style="width: 200px; margin-right: 10px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary">
        <el-icon style="margin-right: 5px"><Plus /></el-icon>新增會員
      </el-button>
    </div>

    <el-table
      :data="tableData"
      style="width: 100%; margin-top: 20px"
      border
      stripe
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="會員名稱" width="120" />
      <el-table-column prop="email" label="電子信箱" min-width="200" />
      <el-table-column prop="status" label="狀態" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '啟用' ? 'success' : 'danger'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="註冊日期" width="150" />

      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default>
          <el-button link type="primary" size="small">編輯</el-button>
          <el-button link type="danger" size="small">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-block">
      <el-pagination background layout="prev, pager, next" :total="100" />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from "vue";
// 如果沒裝自動引入，記得 import：Search, Plus from '@element-plus/icons-vue'

const searchKeyword = ref("");

// 假資料 (先讓畫面有東西，之後再接 API)
const tableData = ref([
  {
    id: 1,
    name: "王小明",
    email: "ming@example.com",
    status: "啟用",
    date: "2023-11-01",
  },
  {
    id: 2,
    name: "李大美",
    email: "may@example.com",
    status: "停用",
    date: "2023-11-02",
  },
  {
    id: 3,
    name: "陳小華",
    email: "hua@example.com",
    status: "啟用",
    date: "2023-11-05",
  },
  {
    id: 4,
    name: "王小明",
    email: "ming@example.com",
    status: "啟用",
    date: "2023-11-01",
  },
  {
    id: 5,
    name: "李大美",
    email: "may@example.com",
    status: "停用",
    date: "2023-11-02",
  },
  {
    id: 6,
    name: "陳小華",
    email: "hua@example.com",
    status: "啟用",
    date: "2023-11-05",
  },
  {
    id: 7,
    name: "王小明",
    email: "ming@example.com",
    status: "啟用",
    date: "2023-11-01",
  },
  {
    id: 8,
    name: "李大美",
    email: "may@example.com",
    status: "停用",
    date: "2023-11-02",
  },
  {
    id: 9,
    name: "陳小華",
    email: "hua@example.com",
    status: "啟用",
    date: "2023-11-05",
  },
  {
    id: 10,
    name: "陳小華",
    email: "hua@example.com",
    status: "啟用",
    date: "2023-11-05",
  },
]);
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
}
.pagination-block {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
