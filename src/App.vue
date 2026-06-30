<script setup>
import { RouterView } from 'vue-router'
import { useAuthCheck } from '@/composables/useAuthCheck'
import { useThemeStore } from '@/stores/theme'

useThemeStore()
useAuthCheck()
</script>

<template>

  <RouterView />
</template>

<style>
:root {
  --app-bg: #eef1f6;
  --app-text: #0d1b2a;

  --bg-page: #eef1f6;
  --bg-surface: #ffffff;
  --bg-surface-hover: #f1f5f9;
  --bg-elevated: #ffffff;
  --bg-input: #f1f5f9;
  --bg-sidebar: #ffffff;
  --bg-surface-translucent: rgba(255, 255, 255, 0.98);

  --text-primary: #0d1b2a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --text-heading: #00355f;

  --border-color: #e9eef4;
  --border-light: #f1f5f9;
  --border-divider: #e2e8f0;

  --primary: #0f4c81;
  --primary-dark: #00355f;

  --danger: #ba1a1a;
  --bg-danger: #fff0f0;
  --success: #27ae60;

  --shadow-sm: 0 2px 6px rgba(0, 53, 95, 0.08);
  --shadow-md: 0 8px 24px rgba(0, 53, 95, 0.12);
}

.dark {
  --app-bg: #0b1120;
  --app-text: #e2e8f0;

  --bg-page: #0b1120;
  --bg-surface: #141d2b;
  --bg-surface-hover: #1e293b;
  --bg-elevated: #1a2332;
  --bg-input: #1e293b;
  --bg-sidebar: #0f1729;
  --bg-surface-translucent: rgba(20, 29, 43, 0.95);

  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-heading: #f1f5f9;

  --border-color: #1e293b;
  --border-light: #1e293b;
  --border-divider: #2d3a4a;

  --primary: #3b82f6;
  --primary-dark: #1d4ed8;

  --danger: #ef4444;
  --bg-danger: rgba(239, 68, 68, 0.1);
  --success: #22c55e;

  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
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
  transition: background 0.3s, color 0.3s;
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