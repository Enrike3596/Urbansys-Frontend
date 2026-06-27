import { useRouter } from 'vue-router'

/**
 * Composable para manejar errores HTTP y redirigir a páginas de error
 * Uso: const { handleError, handleHttpError } = useErrorHandler()
 */
export function useErrorHandler() {
  const router = useRouter()

  /**
   * Maneja errores HTTP y redirige a la página correspondiente
   * @param {number} statusCode - Código HTTP de error
   * @param {string} errorMessage - Mensaje de error opcional
   */
  const handleHttpError = (statusCode, errorMessage = '') => {
    switch (statusCode) {
      case 401:
        // No autenticado
        router.push({ name: 'error-401' })
        break
      case 403:
        // Sin permisos
        router.push({ name: 'error-403' })
        break
      case 404:
        // No encontrado
        router.push({ name: 'error-404' })
        break
      case 500:
      case 502:
      case 504:
        // Error del servidor
        router.push({ name: 'error-500' })
        break
      case 503:
        // Servicio no disponible
        router.push({ name: 'error-503' })
        break
      default:
        // Error genérico
        console.error(`Error ${statusCode}:`, errorMessage)
    }
  }

  /**
   * Maneja errores de promesa y redirige apropiadamente
   * @param {Error} error - Error capturado
   */
  const handleError = (error) => {
    if (error.response) {
      // Error response del servidor
      handleHttpError(error.response.status, error.message)
    } else if (error.request) {
      // No hay respuesta del servidor
      router.push({ name: 'error-503' })
    } else {
      // Error en la solicitud
      console.error('Error:', error.message)
    }
  }

  return {
    handleError,
    handleHttpError,
  }
}
