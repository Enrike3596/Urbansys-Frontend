import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable para verificar autenticación después de que Vue está completamente montado
 * Esto asegura que si la sesión expira pero el usuario recarga, se detecte correctamente
 */
export function useAuthCheck() {
  const router = useRouter()
  const authStore = useAuthStore()

  onMounted(async () => {
    // Verificar si la sesión aún es válida
    const isValid = await authStore.checkAuth()

    // Si no está autenticado y está en una ruta protegida, redirigir al login
    if (!isValid && router.currentRoute.value.meta.requiresAuth) {
      router.push({ name: 'auth-login' })
    }
  })

  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    checkAuth: authStore.checkAuth,
  }
}
