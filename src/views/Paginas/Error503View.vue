<script setup>

import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';

const checkStatus = () => {
  // Abrir página de estado del sistema o recargar
  window.location.reload()
}

const contactSupport = () => {
  // Abrir formulario de contacto/soporte
  window.open('mailto:soporte@urbansys.com')
}
</script>

<template>
  <section class="error-page">
    <div class="bg-orb bg-orb-left" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-right" aria-hidden="true"></div>

    <main class="error-card">
      <p class="eyebrow">Servicio temporalmente no disponible</p>

      <header class="brand-block">
        <div class="logo-wrapper">
          <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
        </div>
      </header>

      <div class="shield" aria-hidden="true">
        <svg viewBox="0 0 64 64" class="shield-icon" role="img">
          <circle cx="32" cy="32" r="24" fill="currentColor" />
          <rect x="20" y="18" width="24" height="6" rx="3" fill="#ecfdf5" />
          <rect x="20" y="30" width="24" height="6" rx="3" fill="#ecfdf5" />
          <rect x="20" y="42" width="16" height="6" rx="3" fill="#ecfdf5" />
          <path d="M44 43h8" stroke="#047857" stroke-width="4" stroke-linecap="round" />
        </svg>
      </div>

      <h1>Servicio en Mantenimiento</h1>
      <p class="message">
        El sistema no esta disponible por una ventana de mantenimiento o una saturacion temporal. Revisa el estado en unos minutos.
      </p>

      <div class="actions">
        <button class="btn btn-primary" type="button" @click="checkStatus">Verificar estado</button>
        <button class="btn btn-ghost" type="button" @click="contactSupport">Soporte tecnico</button>
      </div>

      <p class="code">503 Service Unavailable</p>
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
  background: linear-gradient(140deg, #ecfdf5 0%, #eef2ff 58%, #f0fdfa 100%);
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
  background: #a7f3d0;
  top: -120px;
  left: -120px;
}

.bg-orb-right {
  background: #bfdbfe;
  right: -120px;
  bottom: -120px;
}

.error-card {
  position: relative;
  width: min(660px, 100%);
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
  background: #d1fae5;
  color: #065f46;
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
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
}

.shield-icon {
  width: 56px;
  height: 56px;
  color: #d1fae5;
}

h1 {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  line-height: 1.15;
  font-weight: 800;
  color: #134e4a;
}

.message {
  margin: 14px auto 0;
  max-width: 54ch;
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
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: #f8fafc;
  box-shadow: 0 10px 20px rgba(5, 150, 105, 0.25);
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