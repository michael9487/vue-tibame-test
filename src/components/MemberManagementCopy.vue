<template>
  <div class="page-container">
    <el-card class="design-card" shadow="never">
      
      <div class="card-header">
        <h2 class="title">會員列表</h2>
        <p class="subtitle">檢視目前系統的所有會員資料。</p>
      </div>

      <div class="toolbar">
        <div class="search-area">
          <el-input
            v-model="searchKeyword"
            placeholder="搜尋會員..."
            class="rounded-input"
            size="default" 
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="action-area">
          <el-button class="custom-btn" round size="default">
            新增會員
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table 
          :data="tableData" 
          style="width: 100%; height: 100%;" 
          class="design-table"
          :header-cell-style="{ color: '#333', fontWeight: 'bold', backgroundColor: '#fff', padding: '8px 0' }"
          :cell-style="{ padding: '8px 0' }" 
        >
          <el-table-column prop="id" label="會員編號" width="130" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="email" label="Email" min-width="180" />
          <el-table-column prop="points" label="集點" width="80" />
          <el-table-column prop="regDate" label="註冊日期" width="120" />
          
          <el-table-column label="狀態" width="90">
            <template #default="scope">
              <span :class="scope.row.status === '啟用' ? 'status-active' : 'status-inactive'">
                {{ scope.row.status }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="" width="70" align="right">
            <template #default="scope">
              <el-button link type="primary" class="icon-btn" @click="handleEdit(scope.row)">
                <el-icon :size="16"><EditPen /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination 
          background 
          layout="prev, pager, next" 
          :total="100" 
          :page-size="10"
          class="custom-pagination"
          small
        />
      </div>

    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Search, EditPen } from '@element-plus/icons-vue';

const searchKeyword = ref('');

// 剛好 10 筆資料
const tableData = ref([
  { id: 'M2025110001', name: '王小明', email: 'user01@example.com', points: '4/6', regDate: '2025-01-10', status: '啟用' },
  { id: 'M2025110002', name: '陳淑芳', email: 'user02@example.com', points: '6/6', regDate: '2025-01-12', status: '啟用' },
  { id: 'M2025110003', name: '林小華', email: 'user03@example.com', points: '2/6', regDate: '2025-01-15', status: '停用' },
  { id: 'M2025110004', name: '張育翔', email: 'user04@example.com', points: '6/6', regDate: '2025-01-18', status: '啟用' },
  { id: 'M2025120005', name: '李大衛', email: 'david@example.com', points: '1/6', regDate: '2025-01-19', status: '啟用' },
  { id: 'M2025120006', name: '黃美玲', email: 'may@example.com', points: '5/6', regDate: '2025-01-20', status: '啟用' },
  { id: 'M2025120007', name: '吳宗憲', email: 'wu@example.com', points: '3/6', regDate: '2025-01-21', status: '停用' },
  { id: 'M2025120008', name: '蔡依林', email: 'jolin@example.com', points: '6/6', regDate: '2025-01-22', status: '啟用' },
  { id: 'M2025120009', name: '周杰倫', email: 'jay@example.com', points: '0/6', regDate: '2025-01-23', status: '啟用' },
  { id: 'M2025120010', name: '張惠妹', email: 'amei@example.com', points: '4/6', regDate: '2025-01-24', status: '啟用' },
]);

const handleEdit = (row) => {
  console.log('編輯', row);
};
</script>

<style scoped lang="scss">
/* 設定容器高度為 100% 並且使用 Flex column 佈局 */
.page-container {
  height: 100%; 
  padding: 20px 30px; /* 縮小外部間距 */
  box-sizing: border-box;
}

.design-card {
  border: none;
  height: 100%; /* 卡片佔滿 page-container */
  display: flex;
  flex-direction: column; /* 讓內部元素由上往下排 */
  
  /* 讓 el-card 的 body 也變成 flex 結構 */
  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 !important; /* 清除預設 padding，改由內部控制 */
  }
}

.card-header {
  margin-bottom: 15px; /* 縮小間距 */
  flex-shrink: 0; /* 防止被壓縮 */
  
  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 4px 0;
  }
  .subtitle {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px; /* 縮小間距 */
  flex-shrink: 0;
}

.search-area {
  width: 280px;
}

:deep(.rounded-input .el-input__wrapper) {
  border-radius: 50px;
  background-color: #f2f4f7;
  box-shadow: none !important;
  padding-left: 15px;
}

.custom-btn {
  background-color: #f2f4f7;
  color: #606266;
  border: 1px solid #dcdfe6;
  font-weight: 500;
  &:hover {
    background-color: #e6e8eb;
    color: #333;
  }
}

/* ★ 關鍵：表格區域自動填滿剩餘高度 */
.table-wrapper {
  flex: 1; /* 佔據所有剩餘空間 */
  overflow: hidden; /* 防止溢出 */
  min-height: 0; /* Flexbox 巢狀滾動的關鍵 */
}

.design-table {
  --el-table-border-color: transparent;
  
  :deep(th.el-table__cell) {
    border-bottom: 2px solid #f0f0f0;
  }
  
  :deep(td.el-table__cell) {
    border-bottom: 1px solid #f9f9f9;
    /* 高度已經在 template 的 :cell-style 設定為 8px */
  }
}

.status-active { color: #67c23a; font-weight: 500; }
.status-inactive { color: #ff9a42; font-weight: 500; }

.icon-btn {
  color: #409eff;
  :deep(.el-icon) {
    padding: 3px;
    border: 1px solid #409eff;
    border-radius: 4px;
  }
}

.pagination-container {
  margin-top: 15px; /* 縮小與表格的距離 */
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0; /* 防止被壓縮 */
}
</style>