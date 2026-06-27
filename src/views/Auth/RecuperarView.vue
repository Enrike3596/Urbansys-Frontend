<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';
import AuthService from '../../services/Auth.Service';

const router = useRouter();

const email = ref('');
const isLoading = ref(false);
const isSubmitted = ref(false);
const submitError = ref('');

const handleSubmit = async (e) => {
  e.preventDefault();

  submitError.value = '';
  if (!email.value?.trim()) {
    submitError.value = 'El correo electrónico es obligatorio.';
    return;
  }

  isLoading.value = true;
  try {
    const response = await AuthService.solicitarRecuperacion(email.value.trim());
    if (response?.error) {
      throw new Error(response.error);
    }

    isSubmitted.value = true;
  } catch (error) {
    submitError.value = error?.message || 'No fue posible enviar el correo de recuperación. Intenta nuevamente.';
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/auth/login');
};
</script>

<template>
  <main class="recover-canvas">
    <!-- Fondo decorativo -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>

    <div class="recover-card">
      <div class="accent-bar"></div>

      <div class="card-inner">

        <!-- ── Estado normal: formulario ── -->
        <template v-if="!isSubmitted">
          <!-- Header -->
          <header class="card-header">
            <div class="logo-wrapper">
              <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
            </div>
            <div class="header-text">
              <h1 class="card-title">Recuperar Contraseña</h1>
              <p class="card-subtitle">Te enviaremos instrucciones a tu correo.</p>
            </div>
          </header>

          <!-- Aviso informativo -->
          <div class="info-banner">
            <div class="info-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
            </div>
            <p class="info-text">
              Introduce tu correo y recibirás un enlace para restablecer tu contraseña de forma segura.
            </p>
          </div>

          <!-- Formulario -->
          <form class="recover-form" @submit="handleSubmit">
            <div class="field">
              <label class="field-label" for="email">Correo Electrónico</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  v-model="email"
                  class="field-input"
                  id="email"
                  placeholder="ejemplo@urbansys.com"
                  required
                  type="email"
                  autocomplete="email"
                />
              </div>
            </div>

            <button class="submit-btn" type="submit" :disabled="isLoading">
              <span class="btn-content" v-if="!isLoading">
                <span>Enviar Instrucciones</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </span>
              <svg v-else class="spinner-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </button>

            <p v-if="submitError" class="error-message">{{ submitError }}</p>
          </form>
        </template>

        <!-- ── Estado éxito: confirmación ── -->
        <template v-else>
          <div class="success-state">
            <div class="success-icon-wrapper">
              <div class="success-icon-ring"></div>
              <div class="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <h2 class="success-title">¡Correo Enviado!</h2>
            <p class="success-desc">
              Hemos enviado las instrucciones de recuperación a
              <strong>{{ email }}</strong>.
              Revisa también tu carpeta de spam.
            </p>
            <div class="success-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <span>El enlace expirará en 30 minutos.</span>
            </div>
          </div>
        </template>

        <!-- ── Footer siempre visible ── -->
        <footer class="card-footer">
          <div class="footer-divider"></div>
          <div class="footer-links">
            <button class="back-btn" type="button" @click="goToLogin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
              </svg>
              <span>Volver al inicio de sesión</span>
            </button>
            <div class="secure-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Acceso Seguro</span>
            </div>
          </div>
          <p class="support-text">
            ¿Necesitas ayuda adicional?
            <a href="#" class="support-link">Contactar Soporte Técnico</a>
          </p>
        </footer>

      </div>
    </div>
  </main>
</template>

<style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Canvas ── */
  .recover-canvas {
    flex: 1;
    width: 100vw;
    min-height: 100dvh;
    margin-inline: calc(50% - 50vw);
    background: #eef1f6;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.25rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }
  .bg-orb-1 { width: 420px; height: 420px; background: rgba(0,53,95,0.09); top: -100px; right: -80px; }
  .bg-orb-2 { width: 300px; height: 300px; background: rgba(77,168,218,0.1); bottom: -80px; left: -60px; }

  /* ── Card ── */
  .recover-card {
    background: #ffffff;
    width: 100%;
    max-width: 440px;
    border-radius: 1.5rem;
    box-shadow:
      0 1px 3px rgba(0,53,95,0.06),
      0 8px 24px rgba(0,53,95,0.1),
      0 32px 64px rgba(0,53,95,0.08);
    overflow: hidden;
    border: 1px solid rgba(0,53,95,0.07);
    position: relative;
  }

  .accent-bar {
    height: 4px;
    background: linear-gradient(90deg, #00355f 0%, #1a6fad 50%, #4DA8DA 100%);
  }

  .card-inner {
    padding: 2rem 2.25rem 2rem;
  }

  /* ── Header ── */
  .card-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .brand-logo {
    width: 10rem;
    height: 9rem;
    margin-top: -0.5rem;
    margin-bottom: -0.5rem;
    object-fit: contain;
    display: block;
  }

  .logo-name {
    font-size: 1rem;
    font-weight: 800;
    color: #00355f;
    letter-spacing: -0.03em;
  }

  .header-text {
    border-left: 2px solid #e2e8f0;
    padding-left: 1.25rem;
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0d1b2a;
    letter-spacing: -0.03em;
    line-height: 1.2;
    margin: 0 0 0.2rem;
  }

  .card-subtitle {
    font-size: 0.775rem;
    color: #64748b;
    margin: 0;
    font-weight: 500;
  }

  /* ── Info banner ── */
  .info-banner {
    display: flex;
    gap: 0.75rem;
    background: rgba(15, 76, 129, 0.05);
    border: 1px solid rgba(15, 76, 129, 0.12);
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-start;
  }

  .info-icon {
    color: #0f4c81;
    flex-shrink: 0;
    margin-top: 1px;
    display: flex;
  }

  .info-text {
    font-size: 0.8rem;
    color: #334155;
    line-height: 1.6;
    margin: 0;
    font-weight: 500;
  }

  /* ── Form ── */
  .recover-form {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
  }

  .error-message {
    margin: .35rem 0 0;
    color: #ba1a1a;
    font-size: .8rem;
    font-weight: 600;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .field-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #374151;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 0.875rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    pointer-events: none;
    transition: color 0.2s;
    z-index: 1;
  }

  .field-input {
    width: 100%;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 0.8125rem 0.875rem 0.8125rem 2.625rem;
    font-size: 0.9rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0d1b2a;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    line-height: 1.5;
  }

  .field-input::placeholder { color: #b0bac5; }
  .field-input:hover { background: #fff; border-color: #94a3b8; }
  .field-input:focus {
    outline: none;
    background: #fff;
    border-color: #0f4c81;
    box-shadow: 0 0 0 3px rgba(15,76,129,0.12);
  }
  .input-wrapper:focus-within .input-icon { color: #0f4c81; }

  /* ── Submit ── */
  .submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #00355f 0%, #0f4c81 100%);
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.2px;
    border: none;
    border-radius: 0.75rem;
    padding: 0.9375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, opacity 0.2s;
    box-shadow: 0 4px 14px rgba(0,53,95,0.28);
  }

  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,53,95,0.32); }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .btn-content { display: flex; align-items: center; gap: 0.5rem; }

  .spinner-svg { animation: spin 0.9s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* ── Success state ── */
  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0.5rem 0 1rem;
  }

  .success-icon-wrapper {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .success-icon-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(39, 174, 96, 0.1);
    animation: ring-pulse 2s ease-in-out infinite;
  }

  @keyframes ring-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.6; }
  }

  .success-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(39,174,96,0.35);
    position: relative;
  }

  .success-title {
    font-size: 1.375rem;
    font-weight: 800;
    color: #0d1b2a;
    letter-spacing: -0.03em;
    margin: 0 0 0.625rem;
  }

  .success-desc {
    font-size: 0.8375rem;
    color: #64748b;
    line-height: 1.65;
    margin: 0 0 1rem;
    max-width: 300px;
  }

  .success-desc strong {
    color: #0d1b2a;
    font-weight: 700;
  }

  .success-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: rgba(111,251,190,0.1);
    border: 1px solid rgba(111,251,190,0.3);
    border-radius: 99px;
    padding: 0.375rem 0.875rem;
    font-size: 0.725rem;
    font-weight: 600;
    color: #1a6b45;
  }

  /* ── Footer ── */
  .card-footer {
    margin-top: 1.75rem;
  }

  .footer-divider {
    height: 1px;
    background: #f1f5f9;
    margin-bottom: 1.25rem;
  }

  .footer-links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.125rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #0f4c81;
    padding: 0;
    transition: color 0.2s, gap 0.2s;
  }

  .back-btn:hover {
    color: #00355f;
    gap: 0.5rem;
  }

  .secure-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: rgba(111,251,190,0.1);
    border: 1px solid rgba(111,251,190,0.25);
    border-radius: 99px;
    padding: 0.3rem 0.75rem;
    font-size: 0.675rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #1a6b45;
  }

  .support-text {
    font-size: 0.75rem;
    color: #94a3b8;
    text-align: center;
    margin: 0;
    font-weight: 500;
  }

  .support-link {
    color: #0f4c81;
    font-weight: 700;
    text-decoration: none;
    margin-left: 0.25rem;
  }
  .support-link:hover { text-decoration: underline; text-underline-offset: 2px; }
</style>