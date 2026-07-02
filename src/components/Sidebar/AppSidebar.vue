<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  mobile: { type: Boolean, default: false },
  open: { type: Boolean, default: true },
})

const emit = defineEmits(['navigate', 'close'])

const router = useRouter();
const route  = useRoute();
const authStore = useAuthStore()

const navItems = [
  { label: 'Dashboard',    icon: 'dashboard',       to: '/dashboard' },
  { label: 'Apartamentos', icon: 'apartment',       to: '/dashboard/apartamentos' },
  { label: 'Parqueaderos', icon: 'local_parking',   to: '/dashboard/parqueaderos' },
  { label: 'Reservas',     icon: 'event_available', to: '/dashboard/reservas' },
  { label: 'Salón Común',  icon: 'meeting_room',    to: '/dashboard/salon' },
  { label: 'Torres',       icon: 'domain',          to: '/dashboard/torres' },
  { label: 'Novedades',    icon: 'campaign',        to: '/dashboard/novedades' },
  { label: 'Residentes',   icon: 'group',           to: '/dashboard/residentes' },
  { label: 'Usuarios',     icon: 'person',          to: '/dashboard/usuarios' },
];

// startsWith para que subrutas también resalten el ítem correcto
const isActive = (path) => {
  if (path === '/dashboard') return route.path === '/dashboard';
  return route.path.startsWith(path);
};

const goTo = (path) => {
  router.push(path);
  emit('navigate');
};
const logout = async () => {
  await authStore.logout()
  await router.replace({ name: 'auth-login' })
}
</script>

<template>
  <div>
    <div
      v-if="props.mobile && props.open"
      class="sidebar-backdrop"
      @click="emit('close')"
    ></div>

    <aside
      class="sidebar"
      :class="{
        'is-mobile': props.mobile,
        'is-open': props.open,
      }"
    >
    <!-- Brand -->
    <div class="sidebar-brand">
      <img
        src="@/assets/Img/LogoUrbansys-Photoroom.png"
        alt="Urbansys Logo"
        class="logo-img"
      />
    </div>

    <!-- New Entry Button -->
    <div class="sidebar-action">
      <button class="new-entry-btn">
        <span class="material-symbols-outlined">add_circle</span>
        <span>Nueva Entrada</span>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
        @click="goTo(item.to)"
      >
        <span class="material-symbols-outlined nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="isActive(item.to)" class="active-dot"></span>
      </button>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button class="nav-item">
        <span class="material-symbols-outlined nav-icon">help_outline</span>
        <span class="nav-label">Soporte</span>
      </button>
      <button class="nav-item danger" @click="logout">
        <span class="material-symbols-outlined nav-icon">logout</span>
        <span class="nav-label">Cerrar Sesión</span>
      </button>
    </div>
    </aside>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');


.sidebar {
  flex: 0 0 260px;
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  font-family: 'Plus Jakarta Sans', sans-serif;
  z-index: 50;
  overflow: hidden;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(2px);
  z-index: 45;
}

/* ── Brand ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  min-height: 80px;
  overflow: hidden;
}

.logo-img {
  width: 220px;
  height: 70px;
  object-fit: contain;
  object-position: center;
  transform: scale(1.8);  /* zoom para eliminar espacio transparente */
  transform-origin: center center;
}

/* ── Action ── */
.sidebar-action { padding: 1rem 1.25rem 0.5rem; flex-shrink: 0; }

.new-entry-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: linear-gradient(135deg, #00355f 0%, #0f4c81 100%);
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  border: none; border-radius: 0.75rem;
  padding: 0.8rem 1rem; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 53, 95, 0.22);
  transition: transform 0.2s, box-shadow 0.2s;
}
.new-entry-btn:hover  { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0, 53, 95, 0.3); }
.new-entry-btn:active { transform: translateY(0); }
.new-entry-btn .material-symbols-outlined { font-size: 20px; }

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.875rem;
  display: flex; flex-direction: column; gap: 2px;
}

.nav-item {
  width: 100%;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 0.875rem;
  border: none; border-radius: 0.625rem; background: transparent;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.875rem; font-weight: 600; color: var(--text-secondary);
  text-align: left;
  transition: background 0.15s, color 0.15s;
  position: relative;
}
.nav-item:hover         { background: var(--bg-surface-hover); color: var(--text-heading); }
.nav-item.active        { background: color-mix(in srgb, var(--primary-dark) 7%, transparent); color: var(--text-heading); font-weight: 700; }
.nav-item.danger        { color: var(--danger); }
.nav-item.danger:hover  { background: var(--bg-danger); color: var(--danger); }

.nav-icon {
  font-size: 20px; flex-shrink: 0;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.nav-item.active .nav-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.nav-label { flex: 1; }

.active-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--primary); flex-shrink: 0;
}

/* ── Footer ── */
.sidebar-footer {
  padding: 0.875rem;
  border-top: 1px solid var(--border-light);
  display: flex; flex-direction: column; gap: 2px;
  flex-shrink: 0;
}

/* Material Symbols */
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal; font-style: normal;
  font-size: 24px; line-height: 1;
  letter-spacing: normal; text-transform: none;
  display: inline-block; white-space: nowrap;
  word-wrap: normal; direction: ltr;
  font-feature-settings: 'liga';
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 992px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: min(84vw, 320px);
    max-width: 320px;
    flex-basis: auto;
    transform: translateX(-110%);
    transition: transform 0.24s ease;
    box-shadow: 0 12px 28px rgba(2, 6, 23, 0.24);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }
}
</style>