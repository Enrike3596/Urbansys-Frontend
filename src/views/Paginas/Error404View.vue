<script setup>
import { useRouter } from 'vue-router'
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';

const router = useRouter()

const goHome = () => {
  router.push({ name: 'dashboard' })
}

const contactSupport = () => {
  window.open('mailto:soporte@urbansys.com?subject=Reporte%20Página%20No%20Encontrada')
}
</script>

<template>
  <section class="error-page">
    <div class="bg-orb bg-orb-left" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-right" aria-hidden="true"></div>

    <main class="error-card">
      <p class="eyebrow">Error de recurso</p>

      <header class="brand-block">
        <div class="logo-wrapper">
          <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
        </div>
      </header>

      <div class="shield" aria-hidden="true">
        <svg viewBox="0 0 64 64" class="shield-icon" role="img">
          <circle cx="32" cy="32" r="26" fill="currentColor" />
          <path d="M22 22h20v4H22zM22 30h14v4H22zM22 38h12v4H22z" fill="#ecfeff" />
          <path d="M40 38l10 10" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" />
          <circle cx="40" cy="38" r="7" fill="none" stroke="#06b6d4" stroke-width="4" />
        </svg>
      </div>

      <h1>Pagina No Encontrada</h1>
      <p class="message">
        La ruta que intentas abrir no existe o fue movida. Puedes volver al panel principal o contactar soporte para recibir ayuda.
      </p>

      <div class="actions">
        <button class="btn btn-primary" type="button" @click="goHome">Volver al inicio</button>
        <button class="btn btn-ghost" type="button" @click="contactSupport">Contactar soporte</button>
      </div>

      <p class="code">404 Not Found</p>
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
  background: linear-gradient(140deg, #f0f9ff 0%, #e9f1fb 55%, #eef8ff 100%);
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.45;
}

.bg-orb-left {
  background: #bae6fd;
  top: -120px;
  left: -120px;
}

.bg-orb-right {
  background: #a7f3d0;
  right: -120px;
  bottom: -120px;
}

.error-card {
  position: relative;
  width: min(640px, 100%);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
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
  background: #cffafe;
  color: #0e7490;
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
  background: linear-gradient(135deg, #0f4c81 0%, #0ea5e9 100%);
}

.shield-icon {
  width: 56px;
  height: 56px;
  color: #cffafe;
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
  max-width: 50ch;
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