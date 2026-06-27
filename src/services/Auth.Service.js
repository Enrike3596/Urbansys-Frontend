// src/Services/Auth.Service.js
// Servicio para operaciones de autenticación
// Conectado al backend Spring Boot
// Usa el servicio api.js para manejo automático de errores HTTP

import { apiGet, apiPost, apiFetch } from './api'

/**
 * Helper para hacer llamadas con datos form-urlencoded
 * Usado para endpoints que requieren application/x-www-form-urlencoded
 */
async function fetchFormUrlEncoded(endpoint, data, skipErrorRedirect = false, extraHeaders = {}) {
  const formData = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })

  return apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...extraHeaders },
    body: formData.toString(),
  }, skipErrorRedirect)
}

async function resolveConjuntoIdByEmail(email) {
  const conjunto = await apiGet(`/conjuntos/buscar-por-email?email=${encodeURIComponent(email)}`, true)
  const conjuntoId = conjunto?.id
  if (!conjuntoId) {
    throw new Error('No se encontró un conjunto asociado a este correo')
  }
  return conjuntoId
}

/**
 * Extrae el primer rol del array de authorities que devuelve Spring Security
 * Ejemplo: [{"authority":"ROLE_Administrador"}] → "Administrador"
 */
export function extractRole(authorities) {
  if (!authorities || !authorities.length) return null
  const authority = authorities[0]?.authority || authorities[0]
  return typeof authority === 'string' ? authority.replace('ROLE_', '') : null
}

export default {
  /**
   * Inicia sesión con correo y contraseña.
   * El backend responde JSON directamente (200 éxito / 401 fallo)
   * POST /process-login (form-urlencoded para Spring Security)
   */
  async login(correoElectronico, clave) {
    try {
      const conjuntoId = await resolveConjuntoIdByEmail(correoElectronico)

      // Hacer login con form-urlencoded (sin redirección automática de errores)
      const response = await fetchFormUrlEncoded(
        '/process-login',
        { correoElectronico, clave },
        true, // skipErrorRedirect: true para manejar 401 como error de credenciales
        { 'X-Conjunto-ID': String(conjuntoId) }
      )

      if (!response || !response.ok) {
        // Intentar extraer el mensaje real del backend
        try {
          const contentType = response?.headers?.get?.('content-type') || ''
          if (contentType.includes('application/json')) {
            const payload = await response.json()
            const message = payload?.message || payload?.error
            if (message) throw new Error(message)
          }
          const text = await response.text().catch(() => '')
          if (text) throw new Error(text)
        } catch (e) {
          // Si el parsing lanza, usamos su mensaje
          if (e?.message) throw e
        }

        if (response?.status === 401) {
          throw new Error('Credenciales inválidas')
        }
        throw new Error('No fue posible iniciar sesión')
      }

      // Login exitoso — obtenemos los datos completos del usuario
      try {
        const userData = await this.getCurrentUser()
        if (!userData) {
          throw new Error('Error al obtener datos del usuario')
        }
        return userData
      } catch (userError) {
        // Si falla traer el usuario después de login exitoso, mostrar error apropiado
        throw new Error(
          userError.message.includes('HTTP 401')
            ? 'Sesión expirada. Por favor intenta de nuevo.'
            : userError.message || 'Error al obtener datos del usuario'
        )
      }
    } catch (error) {
      console.error('Login error:', error.message)
      throw error
    }
  },

  /**
   * Registra un nuevo usuario
   * POST /auth/registrar
   */
  async register(userData) {
    try {
      const response = await fetchFormUrlEncoded(
        '/auth/registrar',
        {
          correoElectronico: userData.correoElectronico,
          clave: userData.clave,
          confirmarClave: userData.confirmarClave,
        },
        true // skipErrorRedirect: true para validación personalizada
      )

      if (!response || !response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido')
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      // Validar que la URL sea la esperada (onboarding = registro exitoso)
      if (!response.url.includes('/onboarding')) {
        throw new Error('El correo electrónico ya está registrado o los datos son inválidos.')
      }

      return { success: true }
    } catch (error) {
      console.error('Register error:', error.message)
      throw error
    }
  },

  /**
   * Solicita recuperación de contraseña
   * POST /api/recuperacion/solicitar
   */
  async solicitarRecuperacion(email) {
    return apiPost('/recuperacion/solicitar', { email })
  },

  /**
   * Valida token de recuperación
   * GET /api/recuperacion/validar-token?token=...
   */
  async validarToken(token) {
    return apiGet(`/recuperacion/validar-token?token=${encodeURIComponent(token)}`)
  },

  /**
   * Restablece contraseña con token
   * POST /api/recuperacion/restablecer
   */
  async restablecerPassword(token, password) {
    return apiPost('/recuperacion/restablecer', { token, password })
  },

  /**
   * Verifica si el usuario está autenticado
   * GET /api/auth/check
   */
  async checkAuth() {
    return apiGet('/auth/check', true) // skipErrorRedirect: true para no redirigir en error
  },

  /**
   * Obtiene el usuario actual
   * GET /api/auth/current-user
   */
  async getCurrentUser() {
    try {
      const response = await apiGet('/auth/current-user', true) // skipErrorRedirect: true

      // Si no hay respuesta (error de red), retornar null silenciosamente
      if (!response) {
        return null
      }

      // Si la respuesta indica que no está autenticado (success: false), retornar null
      if (!response.success) {
        return null
      }

      // Si hay datos de usuario, retornar
      return response
    } catch (error) {
      // No logear errores de autenticación - es comportamiento esperado
      // Simplemente retornar null para indicar que no hay usuario
      return null
    }
  },

  /**
   * Cierra sesión.
   * POST /logout
   */
  async logout() {
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'include',
      redirect: 'manual',
    })
    return response
  },
}