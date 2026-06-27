<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'
import { useAuthValidation } from '@/composables/useAuthValidation'
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';

const router    = useRouter()
const authStore = useAuthStore()

// ── FIX PRINCIPAL: desestructurar showError desde el composable ──
// Antes: const { errorMessage, clearError, validateLoginForm } = useAuthValidation()
// Faltaba incluir showError → causaba "showError is not defined" en línea 36
const { errorMessage, clearError, showError, validateLoginForm } = useAuthValidation()

const correoElectronico = ref('')
const clave             = ref('')
const showPassword      = ref(false)
const isLoading         = ref(false)

const handleLogin = async () => {
  clearError()
  authStore.clearError()

  if (!validateLoginForm(correoElectronico.value, clave.value)) return

  isLoading.value = true
  try {
    await authStore.login(correoElectronico.value, clave.value)
    router.replace('/dashboard')
  } catch (error) {
    console.error('Error en el componente de Login:', error)
    showError(authStore.error || 'Error al intentar iniciar sesión.')
  } finally {
    isLoading.value = false
  }
}

const goToRegistrar         = () => router.push('/auth/registrar')
const goToRecuperarContraseña = () => router.push('/auth/recuperar')
const togglePassword        = () => { showPassword.value = !showPassword.value }
</script>

<template>
  <main class="login-canvas">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>

    <div class="login-card">
      <div class="accent-bar"></div>

      <header class="brand-header">
        <div class="logo-wrapper">
          <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
        </div>
        <h1 class="headline">Bienvenido de nuevo</h1>
        <p class="subheadline">Accede a tu panel de gestión residencial</p>
      </header>

      <form class="form-body" @submit.prevent="handleLogin">

        <!-- Banner de error -->
        <div v-if="errorMessage || authStore.error" class="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ errorMessage || authStore.error }}</p>
        </div>

        <!-- Email -->
        <div class="field">
          <label class="field-label" for="email">Correo electrónico</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </span>
            <input
              id="email"
              v-model="correoElectronico"
              class="field-input"
              type="email"
              placeholder="ejemplo@urbansys.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="field">
          <div class="field-label-row">
            <label class="field-label" for="password">Contraseña</label>
            <button class="forgot-btn" type="button" @click="goToRecuperarContraseña">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              id="password"
              v-model="clave"
              class="field-input has-toggle"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
            <button class="toggle-btn" type="button" @click="togglePassword">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember Me -->
        <label class="remember-label" style="opacity:0.5;cursor:not-allowed">
          <div class="check-box"></div>
          <span class="remember-text">Recordarme en este dispositivo</span>
        </label>

        <!-- Submit -->
        <button class="submit-btn" type="submit" :disabled="authStore.loading || isLoading">
          <span class="btn-content" v-if="!authStore.loading && !isLoading">
            <span>Iniciar Sesión</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </span>
          <span v-else>
            <svg class="spinner-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
          </span>
        </button>
      </form>

      <footer class="card-footer">
        <p class="footer-text">
          ¿No tienes cuenta?
          <button class="register-btn" type="button" @click="goToRegistrar">Regístrate aquí</button>
        </p>
      </footer>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.login-canvas {
  flex: 1; width: 100vw; min-height: 100dvh;
  margin-inline: calc(50% - 50vw);
  background: #eef1f6; display: flex; align-items: center;
  justify-content: center; padding: 1.5rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative; overflow: hidden;
}

.bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
.bg-orb-1 { width: 400px; height: 400px; background: rgba(0,53,95,0.08); top: -80px; right: -80px; }
.bg-orb-2 { width: 300px; height: 300px; background: rgba(77,168,218,0.1); bottom: -60px; left: -60px; }

.login-card {
  background: #fff; width: 100%; max-width: 420px; border-radius: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 8px 24px rgba(0,53,95,0.1), 0 32px 64px rgba(0,53,95,0.08);
  overflow: hidden; position: relative; border: 1px solid rgba(0,53,95,0.07);
}

.accent-bar { height: 4px; background: linear-gradient(90deg,#00355f 0%,#1a6fad 50%,#4DA8DA 100%); }

.brand-header { padding: 2rem 2rem 1.25rem; text-align: center; }
.logo-wrapper { display: inline-flex; align-items: center; margin-bottom: 1.25rem; }
.brand-logo { width: 10rem; height: 9rem; margin-top: -0.8rem; margin-bottom: -0.5rem; object-fit: contain; display: block; }

.headline { font-size: 1.5rem; font-weight: 800; color: #0d1b2a; letter-spacing: -0.03em; line-height: 1.2; margin: 0 0 0.375rem; }
.subheadline { font-size: 0.8125rem; color: #64748b; margin: 0; font-weight: 500; }

.form-body { padding: 0 2rem 1.5rem; display: flex; flex-direction: column; gap: 1.125rem; }

.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field-label-row { display: flex; align-items: center; justify-content: space-between; }
.field-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 0.875rem; color: #94a3b8; display: flex; align-items: center; pointer-events: none; transition: color 0.2s; }

.field-input {
  width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
  padding: 0.8125rem 0.875rem 0.8125rem 2.75rem; font-size: 0.9rem;
  font-family: 'Plus Jakarta Sans', sans-serif; color: #0d1b2a;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; line-height: 1.5;
}
.field-input.has-toggle { padding-right: 2.75rem; }
.field-input::placeholder { color: #b0bac5; }
.field-input:hover { background: #fff; border-color: #94a3b8; }
.field-input:focus { outline: none; background: #fff; border-color: #0f4c81; box-shadow: 0 0 0 3px rgba(15,76,129,0.12); }
.input-wrapper:focus-within .input-icon { color: #0f4c81; }

.toggle-btn { position: absolute; right: 0.875rem; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; padding: 0; transition: color 0.2s; }
.toggle-btn:hover { color: #0f4c81; }

.forgot-btn { background: none; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.7rem; font-weight: 600; color: #0f4c81; padding: 0; }
.forgot-btn:hover { color: #00355f; text-decoration: underline; text-underline-offset: 2px; }

.remember-label { display: flex; align-items: center; gap: 0.625rem; user-select: none; }
.check-box { width: 1.125rem; height: 1.125rem; border-radius: 0.375rem; border: 2px solid #cbd5e1; flex-shrink: 0; background: transparent; }
.remember-text { font-size: 0.8125rem; font-weight: 500; color: #475569; }

.submit-btn {
  width: 100%; background: linear-gradient(135deg,#00355f 0%,#0f4c81 100%); color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9375rem; font-weight: 700;
  border: none; border-radius: 0.75rem; padding: 0.9375rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(0,53,95,0.28); margin-top: 0.25rem;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,53,95,0.32); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.85; cursor: not-allowed; }
.btn-content { display: flex; align-items: center; gap: 0.5rem; }
.spinner-svg { animation: spin 0.9s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.card-footer { padding: 1.125rem 2rem 1.625rem; border-top: 1px solid #f1f5f9; text-align: center; }
.footer-text { font-size: 0.8125rem; color: #64748b; font-weight: 500; margin: 0; display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }

.register-btn {
  background: linear-gradient(135deg,#00355f 0%,#0f4c81 100%); color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; font-weight: 700;
  border: none; border-radius: 0.5rem; padding: 0.4375rem 1rem; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(0,53,95,0.2);
}
.register-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,53,95,0.28); }

/* ── Error banner ── */
.error-banner {
  display: flex; align-items: flex-start; gap: 0.625rem;
  background-color: #fff0f0; color: #93000a;
  border: 1px solid #fecaca; border-radius: 0.75rem;
  padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; line-height: 1.5;
}
.error-banner p { margin: 0; }
</style>