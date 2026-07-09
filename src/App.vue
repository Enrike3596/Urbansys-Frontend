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
  --app-bg: #f4f7fb;
  --app-text: #0d1b2a;

  --bg-page: #f4f7fb;
  --bg-surface: #ffffff;
  --bg-surface-hover: #f1f5f9;
  --bg-elevated: #ffffff;
  --bg-input: #f1f5f9;
  --bg-sidebar: rgba(255, 255, 255, 0.94);
  --bg-surface-translucent: rgba(255, 255, 255, 0.86);

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

  --shadow-sm: 0 2px 6px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 10px 28px rgba(15, 23, 42, 0.1);
}

.dark {
  --app-bg: #07111f;
  --app-text: #dbe4f0;

  --bg-page: #07111f;
  --bg-surface: #0f1724;
  --bg-surface-hover: #162235;
  --bg-elevated: #111a28;
  --bg-input: #132131;
  --bg-sidebar: rgba(10, 18, 31, 0.96);
  --bg-surface-translucent: rgba(15, 23, 36, 0.82);

  --text-primary: #e5edf8;
  --text-secondary: #a7b4c7;
  --text-muted: #7e8ba0;
  --text-heading: #f7fbff;

  --border-color: #1a2737;
  --border-light: #162334;
  --border-divider: #243447;

  --primary: #60a5fa;
  --primary-dark: #2563eb;

  --danger: #f87171;
  --bg-danger: rgba(248, 113, 113, 0.12);
  --success: #34d399;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.32);
  --shadow-md: 0 16px 36px rgba(0, 0, 0, 0.44);
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
  background:
    radial-gradient(1200px circle at top left, rgba(59, 130, 246, 0.14), transparent 34%),
    radial-gradient(900px circle at top right, rgba(15, 76, 129, 0.08), transparent 26%),
    var(--app-bg);
  color: var(--app-text);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background 0.3s, color 0.3s;
}

html {
  color-scheme: light;
}

html.dark {
  color-scheme: dark;
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