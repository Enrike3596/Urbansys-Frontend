import './assets/base.css'
import './assets/app-theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import { initApiService } from './services/api'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Inicializar servicio de API con router para manejo de errores
initApiService(router)

// COMENTARIO: Se añade la verificación de sesión aquí.
// Esto asegura que si el usuario recarga la página, su estado de login persiste.
const authStore = useAuthStore()
authStore.checkAuth().then(() => {
  // Montar la aplicación solo después de verificar la autenticación.
  app.mount('#app')
})