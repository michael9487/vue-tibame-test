import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

/* 1. 引入 FontAwesome 核心 */
import { library } from '@fortawesome/fontawesome-svg-core'

/* 2. 引入 Vue 組件 */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* 3. 引入你需要的特定圖標 (這裡是筆：pen-to-square) */
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

/* 4. 將圖標加入圖書館 */
library.add(faPenToSquare)

const app = createApp(App)

app.use(createPinia())
app.use(router)

/* 5. 註冊全域組件，以後用 <font-awesome-icon> 即可 */
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
