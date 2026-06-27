<script setup>
import { RouterView } from 'vue-router'
import { useAuthCheck } from '@/composables/useAuthCheck'

// Verificar autenticación cuando la app se monta (especialmente al refrescar)
useAuthCheck()
</script>

<template>

  <RouterView />
</template>

<style>
:root {
  --app-bg: #eef1f6;
  --app-text: #0d1b2a;
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  background: var(--app-bg);
  color: var(--app-text);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* Transición suave solo para vistas de autenticación */
.auth-enter-active,
.auth-leave-active {
  transition: opacity 180ms ease, transform 200ms ease;
}
.auth-enter-from,
.auth-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* Transición de contenido dentro del dashboard (solo el slot) */
.dash-content-enter-active,
.dash-content-leave-active {
  transition: opacity 120ms ease;
}
.dash-content-enter-from,
.dash-content-leave-to {
  opacity: 0;
}
</style>