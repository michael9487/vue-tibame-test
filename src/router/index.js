import { createRouter, createWebHistory } from "vue-router";
//
// 引入剛建立的頁面
import AdminDashboard from "../views/AdminDashboard.vue";
import MemberManagement from "../views/MemberManagement.vue";
import ProductManagement from "../views/ProductManagement.vue";
import OrderManagement from "../views/OrderManagement.vue";
import ParallaxTest from "../views/ParallaxText.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/dashboard", // 進入首頁自動導向後台
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
    {
      path: "/parallax-test",
      name: "ParallaxTest",
      component: ParallaxTest,
    },
  ],
});

export default router;
