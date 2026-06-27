<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';

const router = useRouter();

const formData = ref({
  fullname: '',
  nit: '',
  email: '',
  address: '',
  adminNombre: '',
  adminApellido: '',
  adminIdentificacion: '',
  adminTelefono: '',
  password: '',
  confirmPassword: '',
  terms: false,
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const passwordStrength = computed(() => {
  const p = formData.value.password;
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
});

const strengthLabel = computed(() => {
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  return labels[passwordStrength.value] || '';
});

const strengthColor = computed(() => {
  const colors = ['', '#e74c3c', '#f39c12', '#3498db', '#27ae60'];
  return colors[passwordStrength.value] || '';
});

const passwordsMatch = computed(() => {
  return (
    formData.value.confirmPassword.length > 0 &&
    formData.value.password === formData.value.confirmPassword
  );
});

const handleSubmit = async (e) => {
  e.preventDefault();
  errorMessage.value = '';

  if (!passwordsMatch.value) {
    errorMessage.value = 'Las contraseñas no coinciden';
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      nombreConjunto:      formData.value.fullname,
      nit:                 formData.value.nit,
      email:               formData.value.email,
      direccion:           formData.value.address,
      adminNombre:         formData.value.adminNombre,
      adminApellido:       formData.value.adminApellido,
      adminIdentificacion: formData.value.adminIdentificacion,
      adminTelefono:       formData.value.adminTelefono,
      adminPassword:       formData.value.password,
    };

    const response = await fetch('/api/conjuntos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.value = data.message || 'Error al registrar';
      return;
    }

    router.push('/auth/login');

  } catch (error) {
    errorMessage.value = 'Error de conexión con el servidor';
    console.error('Error en registro:', error);
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => router.push('/auth/login');
</script>

<template>
  <main class="register-canvas">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>

    <div class="register-card">
      <div class="accent-bar"></div>

      <div class="card-inner">
        <!-- Header -->
        <header class="card-header">
          <div class="logo-wrapper">
            <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
          </div>
          <div class="header-text">
            <h1 class="card-title">Crear Cuenta</h1>
            <p class="card-subtitle">Registra tu conjunto y administrador.</p>
          </div>
        </header>

        <!-- Form -->
        <form class="register-form" @submit="handleSubmit">

          <!-- Nombre del Conjunto + NIT -->
          <div class="fields-row">
            <div class="field">
              <label class="field-label" for="fullname">Nombre del Conjunto</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                </span>
                <input v-model="formData.fullname" class="field-input" id="fullname"
                  placeholder="Ej. Alameda del Porvenir" required type="text"/>
              </div>
            </div>
            <div class="field">
              <label class="field-label" for="nit">Número de NIT</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </span>
                <input v-model="formData.nit" class="field-input" id="nit"
                  placeholder="830.999.999-0" required type="text"/>
              </div>
            </div>
          </div>

          <!-- Correo -->
          <div class="field">
            <label class="field-label" for="email">Correo Electrónico</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input v-model="formData.email" class="field-input" id="email"
                placeholder="nombre@conjunto.com" required type="email"/>
            </div>
          </div>

          <!-- Dirección -->
          <div class="field">
            <label class="field-label" for="address">Dirección</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8.5 8.5 0 0 1 17 0"/>
                </svg>
              </span>
              <input v-model="formData.address" class="field-input" id="address"
                placeholder="Ej. Calle 123 # 4-3" required type="text"/>
            </div>
          </div>

          <!-- Nombre + Apellido Administrador -->
          <div class="fields-row">
            <div class="field">
              <label class="field-label" for="adminNombre">Nombre Administrador</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                </span>
                <input v-model="formData.adminNombre" class="field-input" id="adminNombre"
                  placeholder="Nombre" required type="text"/>
              </div>
            </div>
            <div class="field">
              <label class="field-label" for="adminApellido">Apellido Administrador</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                </span>
                <input v-model="formData.adminApellido" class="field-input" id="adminApellido"
                  placeholder="Apellido" required type="text"/>
              </div>
            </div>
          </div>

          <!-- Identificación + Teléfono -->
          <div class="fields-row">
            <div class="field">
              <label class="field-label" for="adminIdentificacion">Identificación</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h4"/>
                  </svg>
                </span>
                <input v-model="formData.adminIdentificacion" class="field-input" id="adminIdentificacion"
                  placeholder="Cédula" required type="text"/>
              </div>
            </div>
            <div class="field">
              <label class="field-label" for="adminTelefono">Teléfono</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <input v-model="formData.adminTelefono" class="field-input" id="adminTelefono"
                  placeholder="3001234567" type="tel"/>
              </div>
            </div>
          </div>

          <!-- Contraseñas -->
          <div class="fields-row">
            <div class="field">
              <label class="field-label" for="password">Contraseña</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input v-model="formData.password" class="field-input has-toggle" id="password"
                  :placeholder="showPassword ? 'Mín. 8 caracteres' : '••••••••'"
                  required :type="showPassword ? 'text' : 'password'" autocomplete="new-password"/>
                <button class="toggle-btn" type="button" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </button>
              </div>
              <div class="strength-bar-wrapper" v-if="formData.password.length > 0">
                <div class="strength-segments">
                  <div v-for="i in 4" :key="i" class="strength-seg"
                    :style="{ background: i <= passwordStrength ? strengthColor : '#e2e8f0' }"></div>
                </div>
                <span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="confirm-password">Confirmar Contraseña</label>
              <div class="input-wrapper">
                <span class="input-icon" :class="{ 'icon-match': passwordsMatch }">
                  <svg v-if="!passwordsMatch || !formData.confirmPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <input v-model="formData.confirmPassword" class="field-input has-toggle"
                  :class="{ 'input-match': passwordsMatch }" id="confirm-password"
                  :placeholder="showConfirmPassword ? 'Repite tu contraseña' : '••••••••'"
                  required :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password"/>
                <button class="toggle-btn" type="button" @click="showConfirmPassword = !showConfirmPassword">
                  <svg v-if="!showConfirmPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Error banner -->
          <div v-if="errorMessage" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{{ errorMessage }}</p>
          </div>

          <!-- Términos -->
          <label class="terms-label">
            <div class="check-box" :class="{ checked: formData.terms }"
              @click="formData.terms = !formData.terms">
              <svg v-if="formData.terms" width="11" height="11" viewBox="0 0 12 12" fill="none"
                stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="2,6 5,9 10,3"/>
              </svg>
            </div>
            <span class="terms-text">
              Al registrarte, aceptas nuestros
              <a href="#" class="terms-link">Términos de Servicio</a>
              y la <a href="#" class="terms-link">Política de Privacidad</a>.
            </span>
          </label>

          <!-- Submit -->
          <button class="submit-btn" type="submit" :disabled="isLoading || !formData.terms">
            <span class="btn-content" v-if="!isLoading">
              <span>Crear Cuenta</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </span>
            <svg v-else class="spinner-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </button>
        </form>

        <!-- Badges de confianza -->
        <div class="trust-row">
          <div class="trust-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Cifrado SSL</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            <span>Datos protegidos</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>+12k usuarios</span>
          </div>
        </div>

        <!-- Footer -->
        <footer class="card-footer">
          <p class="footer-text">
            ¿Ya tienes cuenta?
            <button class="login-btn" type="button" @click="goToLogin">Inicia sesión</button>
          </p>
        </footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.register-canvas {
  flex: 1; width: 100vw; min-height: 100dvh;
  margin-inline: calc(50% - 50vw);
  background: #eef1f6; display: flex; align-items: center;
  justify-content: center; padding: 2rem 1.25rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative; overflow: hidden;
}

.bg-orb { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
.bg-orb-1 { width: 500px; height: 500px; background: rgba(0,53,95,0.09); top: -130px; right: -100px; }
.bg-orb-2 { width: 350px; height: 350px; background: rgba(77,168,218,0.1); bottom: -100px; left: -80px; }
.bg-orb-3 { width: 200px; height: 200px; background: rgba(111,251,190,0.07); top: 45%; left: 35%; }

.register-card {
  background: #ffffff; width: 100%; max-width: 680px; border-radius: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 8px 24px rgba(0,53,95,0.1), 0 32px 64px rgba(0,53,95,0.08);
  overflow: hidden; border: 1px solid rgba(0,53,95,0.07); position: relative;
}

.accent-bar { height: 4px; background: linear-gradient(90deg, #00355f 0%, #1a6fad 50%, #4DA8DA 100%); }

.card-inner { padding: 2rem 2.25rem; }
@media (min-width: 540px) { .card-inner { padding: 2.25rem 2.75rem; } }

.card-header {
  display: flex; align-items: center; gap: 1.25rem;
  margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;
}

.logo-wrapper { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.brand-logo { width: 10rem; height: 9rem; margin-top: -0.8rem; margin-bottom: -0.8rem; object-fit: contain; display: block; }

.header-text { border-left: 2px solid #e2e8f0; padding-left: 1.25rem; }
.card-title { font-size: 1.5rem; font-weight: 800; color: #0d1b2a; letter-spacing: -0.04em; line-height: 1.2; margin: 0 0 0.2rem; }
.card-subtitle { font-size: 0.8125rem; color: #64748b; margin: 0; font-weight: 500; }

.register-form { display: flex; flex-direction: column; gap: 1rem; }

.fields-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 480px) { .fields-row { grid-template-columns: 1fr 1fr; } }

.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 0.875rem; color: #94a3b8; display: flex; align-items: center; pointer-events: none; transition: color 0.2s; z-index: 1; }
.icon-match { color: #27ae60 !important; }

.field-input {
  width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
  padding: 0.75rem 0.875rem 0.75rem 2.625rem; font-size: 0.875rem;
  font-family: 'Plus Jakarta Sans', sans-serif; color: #0d1b2a;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; line-height: 1.5;
}
.field-input.has-toggle { padding-right: 2.625rem; }
.field-input.input-match { border-color: #27ae60; }
.field-input::placeholder { color: #b0bac5; }
.field-input:hover { background: #fff; border-color: #94a3b8; }
.field-input:focus { outline: none; background: #fff; border-color: #0f4c81; box-shadow: 0 0 0 3px rgba(15,76,129,0.12); }
.input-wrapper:focus-within .input-icon { color: #0f4c81; }

.toggle-btn { position: absolute; right: 0.875rem; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; padding: 0; transition: color 0.2s; z-index: 1; }
.toggle-btn:hover { color: #0f4c81; }

.strength-bar-wrapper { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
.strength-segments { display: flex; gap: 3px; flex: 1; }
.strength-seg { height: 3px; flex: 1; border-radius: 99px; transition: background 0.3s; }
.strength-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; transition: color 0.3s; }

.error-banner {
  display: flex; align-items: flex-start; gap: 0.625rem;
  background-color: #fff0f0; color: #93000a;
  border: 1px solid #fecaca; border-radius: 0.75rem;
  padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; line-height: 1.5;
}
.error-banner p { margin: 0; }

.terms-label { display: flex; align-items: flex-start; gap: 0.625rem; cursor: pointer; padding-top: 0.125rem; }
.check-box { width: 1.125rem; height: 1.125rem; border-radius: 0.375rem; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; transition: border-color 0.2s, background-color 0.2s; }
.check-box.checked { background: #0f4c81; border-color: #0f4c81; }
.terms-label:hover .check-box:not(.checked) { border-color: #0f4c81; background: rgba(15,76,129,0.06); }
.terms-text { font-size: 0.775rem; font-weight: 500; color: #64748b; line-height: 1.6; }
.terms-link { color: #0f4c81; font-weight: 700; text-decoration: none; }
.terms-link:hover { text-decoration: underline; text-underline-offset: 2px; }

.submit-btn {
  width: 100%; background: linear-gradient(135deg, #00355f 0%, #0f4c81 100%); color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9375rem; font-weight: 700;
  border: none; border-radius: 0.75rem; padding: 0.9375rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 4px 14px rgba(0,53,95,0.28); margin-top: 0.25rem;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,53,95,0.32); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-content { display: flex; align-items: center; gap: 0.5rem; }
.spinner-svg { animation: spin 0.9s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.trust-row {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  margin-top: 1.25rem; padding: 0.875rem 1rem; background: #f8fafc;
  border-radius: 0.75rem; border: 1px solid #e9eef4; flex-wrap: wrap;
}
.trust-badge { display: flex; align-items: center; gap: 0.375rem; font-size: 0.725rem; font-weight: 600; color: #475569; }
.trust-badge svg { color: #0f4c81; }
.trust-divider { width: 1px; height: 14px; background: #cbd5e1; }

.card-footer { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #f1f5f9; text-align: center; }
.footer-text { font-size: 0.8125rem; color: #64748b; font-weight: 500; margin: 0; display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }
.login-btn {
  background: linear-gradient(135deg, #00355f 0%, #0f4c81 100%); color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; font-weight: 700;
  border: none; border-radius: 0.5rem; padding: 0.4375rem 1rem; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(0,53,95,0.2);
}
.login-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,53,95,0.28); }
</style>