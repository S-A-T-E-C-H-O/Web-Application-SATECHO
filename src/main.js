import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './shared/router'
import i18n from './shared/i18n'

import '@/shared/styles/theme.css'
import '@/shared/styles/main.scss'
import '@/shared/styles/auth.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')