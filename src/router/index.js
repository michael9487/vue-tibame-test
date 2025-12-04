import { createRouter, createWebHistory } from "vue-router";
//
// 引入剛建立的頁面
import AdminDashboard from "../views/AdminDashboard.vue";
import MemberManagement from "../views/MemberManagement.vue";
import ProductManagement from "../views/ProductManagement.vue";
import OrderManagement from "../views/OrderManagement.vue";
import ParallaxTest from "../views/ParallaxText.vue";
import HomeTest from "../views/HomeTest.vue";
import SurvivalTest from "../views/SurvivalTest.vue";
import ClassesTest from '../views/classesTest.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomeTest',
      component: HomeTest,
    },
        {
      path: "/parallax-test",
      name: "ParallaxTest",
      component: ParallaxTest,
    },
    {
      path: "/survival-test",
      name: "SurvivalTest",
      component: SurvivalTest,
    },
     {
      path: "/classes-test",
      name: "ClassesTest",
      component: ClassesTest,
    },
    {
      path: "/dashboard",
      component: AdminDashboard,
      redirect: "/dashboard/member-management", // 預設顯示會員頁
      children: [
        {
          path: "member-management",
          name: "member-management",
          component: MemberManagement,
        },
        {
          path: "product-management",
          name: "product-management",
          component: ProductManagement,
        },
        {
          path: "order-management",
          name: "order-management",
          component: OrderManagement,
        },
      ],
    },

  ],
});

export default router;
