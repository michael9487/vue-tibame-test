<script setup>
  import { ref } from 'vue'
  const memberSearch = ref('')
  const memberData = ref([
      {
        id: 'M2025110001',
        name: 'Wang Xiaoming',
        email: 'user123@gmail.com',
        pointsCard: '2/7',
        registerDate: '2025-01-10',
        isAdmin: 1,
        memberStatus: 1,
      },
            {
        id: 'M2025110002',
        name: 'Chen Yijun',
        email: 'user11155@gmail.com',
        pointsCard: '5/7',
        registerDate: '2025-02-22',
        isAdmin: 0,
        memberStatus: 0,
      },
            {
        id: 'M2025110003',
        name: 'Lin Zhihao',
        email: 'user222222@gmail.com',
        pointsCard: '4/7',
        registerDate: '2025-03-02',
        isAdmin: 0,
        memberStatus: 1,
      },
            {
        id: 'M2025110004',
        name: 'Wu Peiling',
        email: 'user3332334@gmail.com',
        pointsCard: '6/7',
        registerDate: '2025-04-10',
        isAdmin: 0,
        memberStatus: 1,
      },
            {
        id: 'M2025110005',
        name: 'Huang Jianwei',
        email: 'user444@gmail.com',
        pointsCard: '5/7',
        registerDate: '2025-05-12',
        isAdmin: 0,
        memberStatus: 1,
      },
            {
        id: 'M2025110006',
        name: 'Liu Xiuying',
        email: 'user555@gmail.com',
        pointsCard: '3/7',
        registerDate: '2025-06-15',
        isAdmin: 0,
        memberStatus: 1,
      },
            {
        id: 'M2025110007',
        name: 'Zheng Minghui',
        email: 'user666@gmail.com',
        pointsCard: '5/7',
        registerDate: '2025-03-01',
        isAdmin: 0,
        memberStatus: 1,
      },
            {
        id: 'M2025110008',
        name: 'Xu Zihao',
        email: 'user777@gmail.com',
        pointsCard: '5/7',
        registerDate: '2025-03-19',
        isAdmin: 0,
        memberStatus: 0,
      },
            {
        id: 'M2025110009',
        name: 'Cai Yuting',
        email: 'user8842328@gmail.com',
        pointsCard: '2/7',
        registerDate: '2025-11-22',
        isAdmin: 0,
        memberStatus: 1,
      },
            {
        id: 'M2025110010',
        name: 'Zhang Jiaying',
        email: 'user93232394449@gmail.com',
        pointsCard: '5/7',
        registerDate: '2025-10-20',
        isAdmin: 0,
        memberStatus: 1,
      },
  ])

</script>
<template>
  <div>
    <h6>會員列表</h6>
    <p>檢視目前系統的所有會員資料。</p>
    <div class="search-add-container">
      <el-input class="custom-search-input" type="text" v-model="memberSearch" placeholder="搜尋會員姓名/Email" style="width: 400px;"></el-input>
      <el-button class="add-btn" round>新增會員</el-button>
    </div>
    <el-table :data="memberData" stripe>
      <el-table-column label="會員編號" prop="id"  width="120px"></el-table-column>
      <el-table-column label="姓名" prop="name" width="160px"></el-table-column>
      <el-table-column label="Email" prop="email"></el-table-column>
      <el-table-column label="集點卡" prop="pointsCard" width="70px"></el-table-column>
      <el-table-column label="註冊日期" prop="registerDate" width="110px"></el-table-column>
      <el-table-column label="權限" width="90px">
        <template #default="scope">
          <span v-if="scope.row.isAdmin === 1">
            管理者
          </span>
          <span v-else>
            一般會員
          </span>
        </template>
      </el-table-column>
      <el-table-column label="會員狀態" width="90px">
        <template #default="scope">
          <span v-if="scope.row.memberStatus === 1">
            啟用
          </span>
          <span v-else style="color:red;">
            停用
          </span>
        </template>
      </el-table-column>
      <el-table-column width="50px">
        <font-awesome-icon :icon="['fas', 'pen-to-square']" class="edit-icon" />
      </el-table-column>
    </el-table>
  </div>
</template>
<style lang="scss" scoped>
.el-main p{
  color: #B0B0B0;
  margin-bottom: 8px;
}
.search-add-container{
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
:deep(.custom-search-input .el-input__wrapper){
  border-radius:50px;
  background-color: #F0F7FF;
}
.add-btn{
  background-color: #F0F7FF;
  width: 140px;
}
.edit-icon{
  font-size: 20px;
  color: #0A3D70;
}
/* 覆蓋element-plus的背景色 */
:deep(.el-table__row--striped td.el-table__cell) {
  background-color: #F0F7FF !important; /* 換成淺藍色 */
}
/* 修改內建行高 */
:deep(.el-table .el-table__cell) {
  padding: 4px 0;
}
</style>
