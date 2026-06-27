<script setup>
import { useRouter } from 'vue-router'
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';


const router = useRouter()

const goToLogin = () => {
  router.push({ name: 'auth-login' })
}

const goHome = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <section class="error-page">
    <div class="bg-orb bg-orb-left" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-right" aria-hidden="true"></div>

    <main class="error-card">
      <p class="eyebrow">Error de autenticacion</p>

      <header class="brand-block">
        <div class="logo-wrapper">
          <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
        </div>
      </header>

      <div class="shield" aria-hidden="true">
        <svg viewBox="0 0 64 64" class="shield-icon" role="img">
          <path d="M32 4l24 8v18c0 14.1-9.2 26.9-24 30C17.2 56.9 8 44.1 8 30V12l24-8z" fill="currentColor" />
          <path d="M32 18a7 7 0 0 0-7 7v3h-2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2h-2v-3a7 7 0 0 0-7-7zm-4 10v-3a4 4 0 0 1 8 0v3h-8z" fill="#f8fafc" />
        </svg>
      </div>

      <h1>Acceso Restringido</h1>
      <p class="message">
        Tu sesion expiro o no cuenta con credenciales validas. Inicia sesion nuevamente para continuar en Urbansys.
      </p>

      <div class="actions">
        <button class="btn btn-primary" type="button" @click="goToLogin">Ir al login</button>
        <button class="btn btn-ghost" type="button" @click="goHome">Volver al inicio</button>
      </div>

      <p class="code">401 Unauthorized</p>
    </main>
  </section>
</template>

<style scoped>
.error-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(140deg, #f5f7fa 0%, #e9eff6 60%, #eff7f4 100%);
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
}

.bg-orb-left {
  background: #9dd3ff;
  top: -120px;
  left: -120px;
}

.bg-orb-right {
  background: #98f5cc;
  right: -120px;
  bottom: -120px;
}

.error-card {
  position: relative;
  width: min(640px, 100%);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
  padding: 34px 28px;
  text-align: center;
  color: #1e293b;
}

.eyebrow {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dff2ff;
  color: #0b5f92;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-block { 
  padding: 2rem 2rem 1.25rem; 
  text-align: center; 
}
.logo-wrapper { 
  display: inline-flex; 
  align-items: center; 
  margin-bottom: 1.25rem; 
}
.brand-logo { 
  width: 10rem;
  height: 9rem; 
  margin-top: -0.8rem; 
  margin-bottom: -0.5rem; 
  object-fit: contain; 
  display: block; 
}


.shield {
  width: 88px;
  height: 88px;
  margin: 8px auto 14px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0a4b78 0%, #0d6ea7 100%);
}

.shield-icon {
  width: 56px;
  height: 56px;
  color: #e2f3ff;
}

h1 {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  line-height: 1.15;
  font-weight: 800;
  color: #0f2f4a;
}

.message {
  margin: 14px auto 0;
  max-width: 46ch;
  color: #334155;
  font-size: 1.02rem;
}

.actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  border: none;
  border-radius: 12px;
  font-size: 0.98rem;
  font-weight: 700;
  padding: 12px 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #005a8f 0%, #0d79b4 100%);
  color: #f8fafc;
  box-shadow: 0 10px 20px rgba(2, 74, 116, 0.25);
}

.btn-ghost {
  background: #eef2f7;
  color: #0f2f4a;
}

.btn-ghost:hover {
  background: #e3e9f0;
}

.code {
  margin-top: 20px;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .error-card {
    border-radius: 20px;
    padding: 24px 18px;
  }

  .btn {
    width: 100%;
  }
}
</style>