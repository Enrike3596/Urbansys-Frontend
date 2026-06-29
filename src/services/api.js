import { useRouter } from 'vue-router'

/**
 * Servicio de API Global con manejo automático de errores
 * Encapsula las llamadas fetch y redirige a las páginas de error apropiadas
 */

const API_URL = '/api'
const RAW_ENDPOINTS = ['/logout']
let router = null

// Inyectar router cuando esté disponible (en main.js)
export function initApiService(routerInstance) {
  router = routerInstance
}

/**
 * Helper para mapear códigos de error HTTP a rutas
 */
function getErrorRouteName(statusCode) {
  switch (statusCode) {
    case 401:
      return 'error-401'
    case 403:
      return 'error-403'
    case 404:
      return 'error-404'
    case 500:
    case 502:
    case 504:
      return 'error-500'
    case 503:
      return 'error-503'
    default:
      return 'error-500'
  }
}

/**
 * Realiza una llamada fetch con manejo automático de errores
 * @param {string} endpoint - URL del endpoint (sin /api)
 * @param {object} options - Opciones de fetch
 * @param {boolean} skipErrorRedirect - Si es true, no redirige en error
 * @returns {Promise<Response|null>}
 */
export async function apiFetch(endpoint, options = {}, skipErrorRedirect = false) {
  const useRawEndpoint = RAW_ENDPOINTS.some(rawEndpoint => endpoint.startsWith(rawEndpoint))
  const url = endpoint.startsWith('http') || useRawEndpoint ? endpoint : `${API_URL}${endpoint}`
  const fetchOptions = {
    credentials: 'include',
    ...options,
  }

  // No loguear endpoint si es una verificación de auth con skipErrorRedirect
  if (!(skipErrorRedirect && endpoint.includes('auth'))) {
    console.log(`[API] ${fetchOptions.method || 'GET'} ${endpoint}`)
  }

  try {
    const response = await fetch(url, fetchOptions)

    // Solo loguear si hay error real (no 401 esperado con skipErrorRedirect)
    if (!response.ok && !(response.status === 401 && skipErrorRedirect)) {
      console.log(`[API] Respuesta ${endpoint}: ${response.status}`)
    }

    // Si no es exitoso y no queremos skipear redirección
    if (!response.ok && !skipErrorRedirect && router) {
      const errorRoute = getErrorRouteName(response.status)
      // Esperar un momento antes de redirigir para permitir limpiar estado
      setTimeout(() => {
        router.push({ name: errorRoute })
      }, 100)
      return null
    }

    return response
  } catch (error) {
    console.error(`[API] Error en ${endpoint}:`, error)
    // Error de conexión o parsing
    if (!skipErrorRedirect && router) {
      router.push({ name: 'error-503' })
    }
    throw error
  }
}

/**
 * Realiza una llamada fetch y parsea JSON con manejo de errores
 * @param {string} endpoint - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @param {boolean} skipErrorRedirect - Si es true, no redirige en error y retorna null
 * @returns {Promise<object|null>}
 */
export async function apiFetchJson(endpoint, options = {}, skipErrorRedirect = false) {
  const response = await apiFetch(endpoint, options, skipErrorRedirect)

  if (!response) return null

  // Si hay error y skipErrorRedirect = true, retornar null en lugar de lanzar excepción
  if (!response.ok) {
    if (skipErrorRedirect) {
      return null
    }
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

/**
 * Realiza una llamada GET
 */
export async function apiGet(endpoint, skipErrorRedirect = false) {
  return apiFetchJson(endpoint, { method: 'GET' }, skipErrorRedirect)
}

/**
 * Realiza una llamada POST
 */
export async function apiPost(endpoint, data, skipErrorRedirect = false) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
  return apiFetchJson(endpoint, options, skipErrorRedirect)
}

/**
 * Realiza una llamada PUT
 */
export async function apiPut(endpoint, data, skipErrorRedirect = false) {
  const options = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
  return apiFetchJson(endpoint, options, skipErrorRedirect)
}

/**
 * Realiza una llamada DELETE
 */
export async function apiDelete(endpoint, skipErrorRedirect = false) {
  return apiFetchJson(endpoint, { method: 'DELETE' }, skipErrorRedirect)
}

/**
 * Realiza una llamada PATCH
 */
export async function apiPatch(endpoint, data, skipErrorRedirect = false) {
  const options = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
  return apiFetchJson(endpoint, options, skipErrorRedirect)
}

export default {
  initApiService,
  apiFetch,
  apiFetchJson,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPatch,
}
