import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './shared/router'

import '@/shared/styles/theme.css'
import '@/shared/styles/main.scss'
import '@/shared/styles/auth.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')