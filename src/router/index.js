import { createRouter, createWebHistory } from "vue-router";
//
// 引入剛建立的頁面
import AdminDashboard from "../views/AdminDashboard.vue";
import MemberManagement from "../views/MemberManagement.vue";
import ProductManagement from "../views/ProductManagement.vue";
import OrderManagement from "../views/OrderManagement.vue";
import ParallaxTest from "../views/ParallaxText.vue";
import HomeTest from "../views/HomeTest.vue";
import ClassesTest from "../views/classesTest.vue";
import SurvivalRules from "@/views/SurvivalRules.vue";
import SurvivalTest from "../components/survival/SurvivalTest.vue";
import NightMarketMap from "../components/survival/NightMarketMap.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "HomeTest",
      component: HomeTest,
    },
    {
      path: "/parallax-test",
      name: "ParallaxTest",
      component: ParallaxTest,
    },
    {
      path: "/survival-rules",
      name: "SurvivalRules",
      component: SurvivalRules,
      children: [
        {
          // 空路徑代表預設顯示 (雙島選擇畫面)
          path: "",
          name: "SurvivalTest",
          component: SurvivalTest,
        },
        {
          path: "nightmarket-map",
          name: "NightMarketMap",
          component: NightMarketMap,
        },
      ],
    },
    {
      path: "/classes-test",
      name: "ClassesTest",
      component: ClassesTest,
    },
    {
      path: "/dashboard",
      component: AdminDashboard,
      children: [
        {
          path: '', 
          redirect: { name: 'MemberManagement' } 
        },
        {
          path: "/member-management",
          name: "MemberManagement",
          component: MemberManagement,
        },
        {
          path: "product-management",
          name: "ProductManagement",
          component: ProductManagement,
        },
        {
          path: "order-management",
          name: "OrderManagement",
          component: OrderManagement,
        },
      ],
    },
  ],
});

export default router;
