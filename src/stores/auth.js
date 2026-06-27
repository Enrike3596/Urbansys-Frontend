// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService, { extractRole } from '@/services/Auth.Service'

export const useAuthStore = defineStore('auth', () => {
  const user            = ref(null)
  const isAuthenticated = ref(false)
  const loading         = ref(false)
  const error           = ref(null)
  const authChecked     = ref(false)

  let authCheckPromise = null

  const userRole = computed(() => user.value?.rol || null)

  const userName = computed(() => {
    if (!user.value) return ''
    return user.value.nombres
      ? `${user.value.nombres} ${user.value.apellidos || ''}`.trim()
      : user.value.correoElectronico || user.value.email || ''
  })

  const normalizeUser = (userData) => ({
    ...userData,
    correoElectronico: userData.email || userData.correoElectronico,
    rol: extractRole(userData.roles || userData.authorities),
  })

  const login = async (correoElectronico, clave) => {
    loading.value = true
    error.value   = null
    try {
      // authService.login ya retorna los datos del usuario
      const userData        = await authService.login(correoElectronico, clave)
      user.value            = normalizeUser(userData)
      isAuthenticated.value = true
      sessionStorage.setItem('authenticated', 'true')
      return user.value
    } catch (e) {
      error.value = e?.message || 'Credenciales inválidas o error de conexión'
      console.error('Error en login:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    error.value   = null
    try {
      return await authService.register(userData)
    } catch (e) {
      error.value = 'Error al registrar usuario'
      console.error('Error en registro:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── checkAuth para verificar sesión activa ──
  const checkAuth = async () => {
    if (authCheckPromise) return authCheckPromise

    authCheckPromise = (async () => {
    try {
      // skipErrorRedirect = true para no redirigir si no está autenticado
      const userData        = await authService.getCurrentUser()
      
      // Si getData retorna null (401 esperado), no autenticar silenciosamente
      if (!userData) {
        user.value            = null
        isAuthenticated.value = false
        sessionStorage.removeItem('authenticated')
        authChecked.value = true
        return false
      }
      
      user.value            = normalizeUser(userData)
      isAuthenticated.value = true
      sessionStorage.setItem('authenticated', 'true')
      authChecked.value = true
      return true
    } catch (error) {
      // Si falla (error de red, etc) simplemente no autenticar
      user.value            = null
      isAuthenticated.value = false
      sessionStorage.removeItem('authenticated')
      authChecked.value = true
      return false
    } finally {
      authCheckPromise = null
    }
    })()

    return authCheckPromise
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (e) {
      console.error('Error en logout:', e)
    } finally {
      user.value            = null
      isAuthenticated.value = false
      sessionStorage.removeItem('authenticated')
    }
  }

  const clearError = () => { error.value = null }

  return {
    user,
    isAuthenticated,
    loading,
    error,
    authChecked,
    userRole,
    userName,
    login,
    register,
    checkAuth,  // ── ya existe, no da error ──
    logout,
    clearError,
  }
})