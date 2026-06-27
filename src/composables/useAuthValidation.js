// src/composables/useAuthValidation.js
// Composable para validaciones de formularios de autenticación

import { ref } from 'vue'

export function useAuthValidation() {
  const errorMessage = ref('')

  const clearError = () => {
    errorMessage.value = ''
  }

  const showError = (msg) => {
    errorMessage.value = msg
  }

  /**
   * Valida formato de email
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return false

    const localPart = email.split('@')[0]
    if (localPart.length < 3) return false

    const domain = email.split('@')[1]
    if (!domain || domain.length < 4) return false

    const domainParts = domain.split('.')
    const extension = domainParts[domainParts.length - 1]
    if (!extension || extension.length < 2) return false

    if (/[.\-_]{2,}/.test(email) || /^[.\-_]/.test(email) || /[.\-_]$/.test(email)) return false

    return true
  }

  /**
   * Valida fortaleza de contraseña
   * Retorna array de errores encontrados
   */
  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) errors.push('Al menos 8 caracteres.')
    if (!/[A-Z]/.test(password)) errors.push('Al menos 1 letra mayúscula.')
    if (!/[a-z]/.test(password)) errors.push('Al menos 1 letra minúscula.')
    if (!/[0-9]/.test(password)) errors.push('Al menos 1 número.')
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('Al menos 1 símbolo especial.')
    return errors
  }

  /**
   * Valida formulario de login
   */
  const validateLoginForm = (correo, clave) => {
    clearError()

    if (!correo.trim()) {
      showError('El correo electrónico es obligatorio')
      return false
    }
    if (!validateEmail(correo)) {
      showError('Ingresa un correo electrónico válido')
      return false
    }
    if (!clave.trim()) {
      showError('La contraseña es obligatoria')
      return false
    }

    return true
  }

  /**
   * Valida formulario de registro
   */
  const validateRegisterForm = (correo, clave, confirmarClave) => {
    clearError()

    if (!correo.trim()) {
      showError('El correo electrónico es obligatorio')
      return false
    }
    if (!validateEmail(correo)) {
      showError('Ingresa un correo electrónico válido')
      return false
    }

    const passwordErrors = validatePassword(clave)
    if (passwordErrors.length > 0) {
      showError('Tu contraseña debe contener:\n' + passwordErrors.join('\n'))
      return false
    }

    if (!confirmarClave.trim()) {
      showError('Debes confirmar tu contraseña')
      return false
    }
    if (clave !== confirmarClave) {
      showError('Las contraseñas no coinciden')
      return false
    }

    return true
  }

  /**
   * Valida formulario de recuperación
   */
  const validateRecoveryForm = (correo) => {
    clearError()

    if (!correo.trim()) {
      showError('Por favor ingresa tu correo electrónico')
      return false
    }
    if (!validateEmail(correo)) {
      showError('El correo electrónico no es válido')
      return false
    }

    return true
  }

  /**
   * Valida formulario de restablecimiento
   */
  const validateResetForm = (nuevaPassword, confirmarPassword) => {
    clearError()

    if (!nuevaPassword || !confirmarPassword) {
      showError('Por favor completa ambos campos')
      return false
    }

    const passwordErrors = validatePassword(nuevaPassword)
    if (passwordErrors.length > 0) {
      showError('Tu contraseña debe contener:\n' + passwordErrors.join('\n'))
      return false
    }

    if (nuevaPassword !== confirmarPassword) {
      showError('Las contraseñas no coinciden')
      return false
    }

    return true
  }

  return {
    errorMessage,
    clearError,
    showError,
    validateEmail,
    validatePassword,
    validateLoginForm,
    validateRegisterForm,
    validateRecoveryForm,
    validateResetForm,
  }
}
