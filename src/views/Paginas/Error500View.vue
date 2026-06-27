<script setup>
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png';


const retry = () => {
  window.location.reload()
}

const contactSupport = () => {
  window.open('mailto:soporte@urbansys.com?subject=Error%20500%20-%20Reporte%20de%20Problema')
}
</script>

<template>
  <section class="error-page">
    <div class="bg-orb bg-orb-left" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-right" aria-hidden="true"></div>

    <main class="error-card">
      <p class="eyebrow">Error del servidor</p>

      <header class="brand-block">
        <div class="logo-wrapper">
          <img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
        </div>
      </header>

      <div class="shield" aria-hidden="true">
        <svg viewBox="0 0 64 64" class="shield-icon" role="img">
          <rect x="8" y="10" width="48" height="44" rx="8" fill="currentColor" />
          <rect x="16" y="18" width="32" height="6" rx="3" fill="#fee2e2" />
          <rect x="16" y="30" width="22" height="6" rx="3" fill="#fee2e2" />
          <circle cx="47" cy="46" r="7" fill="#fee2e2" />
          <path d="M44 43l6 6M50 43l-6 6" stroke="#b91c1c" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>

      <h1>Error Interno del Servidor</h1>
      <p class="message">
        Ocurrio un problema inesperado procesando tu solicitud. Puedes intentar nuevamente en unos segundos o reportar el incidente a soporte.
      </p>

      <div class="actions">
        <button class="btn btn-primary" type="button" @click="retry">Reintentar</button>
        <button class="btn btn-ghost" type="button" @click="contactSupport">Contactar soporte</button>
      </div>

      <p class="code">500 Internal Server Error</p>
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
  background: linear-gradient(140deg, #fff1f2 0%, #f1f5f9 55%, #eef2ff 100%);
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
  background: #fecaca;
  top: -120px;
  left: -120px;
}

.bg-orb-right {
  background: #c7d2fe;
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
  background: #fee2e2;
  color: #991b1b;
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
  background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%);
}

.shield-icon {
  width: 56px;
  height: 56px;
  color: #fecaca;
}

h1 {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  line-height: 1.15;
  font-weight: 800;
  color: #3f1d1d;
}

.message {
  margin: 14px auto 0;
  max-width: 52ch;
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
  background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%);
  color: #f8fafc;
  box-shadow: 0 10px 20px rgba(153, 27, 27, 0.25);
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