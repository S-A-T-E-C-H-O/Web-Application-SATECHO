import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './shared/router'
import i18n from './shared/i18n'
import { setOnUnauthorized } from '@/shared/infrastructure/http/api-client'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

import '@/shared/styles/theme.css'
import '@/shared/styles/main.scss'
import '@/shared/styles/auth.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Expired/revoked token → clear the local session and land on /login.
// Registered here (after Pinia is installed) to avoid a circular import
// between the api client and the auth store.
setOnUnauthorized(() => {
  const authStore = useAuthStore()
  authStore.logout()
  if (router.currentRoute.value.name !== 'login') {
    router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
})

app.mount('#app')