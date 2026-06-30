<script setup>
import { ref } from 'vue';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

const props = defineProps({
  mobile: { type: Boolean, default: false },
  sidebarOpen: { type: Boolean, default: true },
});

const emit = defineEmits(['toggle-sidebar']);

const searchQuery = ref('');
const notificationsCount = ref(3);
const showNotifications = ref(false);

const user = {
  name: 'Admin Usuario',
  role: 'Administrador del Sistema',
  initials: 'AU',
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const notifications = [
  { id: 1, text: 'Torre A, Apt 402 — Acceso de visita concedido.', time: 'hace 2 min', type: 'info' },
  { id: 2, text: 'Sistema ajustó balance químico de la piscina.', time: 'hace 14 min', type: 'system' },
  { id: 3, text: 'Incidente #8402 — Fuga en lobby Torre B.', time: 'hace 42 min', type: 'alert' },
];
</script>

<template>
  <header class="topbar">
    <button
      v-if="props.mobile"
      class="icon-btn menu-btn"
      :class="{ active: props.sidebarOpen }"
      title="Abrir menú"
      @click="emit('toggle-sidebar')"
    >
      <span class="material-symbols-outlined">menu</span>
    </button>

    <!-- Search -->
    <div class="search-wrapper">
      <span class="search-icon material-symbols-outlined">search</span>
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Buscar recursos, residentes o unidades..."
        type="text"
      />
    </div>

    <!-- Right controls -->
    <div class="topbar-right">

      <!-- Theme toggle -->
      <label class="theme-switch" :class="{ 'is-dark': themeStore.isDark }">
        <span class="sun">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g fill="#ffd43b">
              <circle r="5" cy="12" cx="12" />
              <path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z" />
            </g>
          </svg>
        </span>
        <span class="moon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <path d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
          </svg>
        </span>
        <input
          type="checkbox"
          class="theme-input"
          :checked="themeStore.isDark"
          @change="themeStore.toggleTheme()"
        />
        <span class="theme-slider"></span>
      </label>

      <!-- Notifications -->
      <div class="notif-wrapper">
        <button class="icon-btn" :class="{ active: showNotifications }" @click="toggleNotifications">
          <span class="material-symbols-outlined">notifications</span>
          <span v-if="notificationsCount > 0" class="notif-badge">{{ notificationsCount }}</span>
        </button>

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div v-if="showNotifications" class="notif-dropdown">
            <div class="notif-header">
              <span class="notif-title">Notificaciones</span>
              <button class="notif-clear" @click="notificationsCount = 0; showNotifications = false">
                Marcar todas como leídas
              </button>
            </div>
            <div class="notif-list">
              <div
                v-for="n in notifications"
                :key="n.id"
                class="notif-item"
                :class="n.type"
              >
                <div class="notif-dot"></div>
                <div class="notif-body">
                  <p class="notif-text">{{ n.text }}</p>
                  <span class="notif-time">{{ n.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Settings -->
      <button class="icon-btn">
        <span class="material-symbols-outlined">settings</span>
      </button>

      <div class="topbar-divider"></div>

      <!-- User -->
      <div class="user-info">
        <div class="user-text">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-role">{{ user.role }}</span>
        </div>
        <div class="user-avatar">
          {{ user.initials }}
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

.topbar {
  position: sticky;
  top: 0;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.75rem;
  background: var(--bg-surface-translucent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  font-family: 'Plus Jakarta Sans', sans-serif;
  width: 100%;
}

/* ── Search ── */
.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 420px;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--text-muted);
  pointer-events: none;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.search-input {
  width: 100%;
  background: var(--bg-input);
  border: 1.5px solid transparent;
  border-radius: 0.75rem;
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  font-size: 0.875rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--text-primary);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  line-height: 1.5;
}

.search-input::placeholder { color: var(--text-muted); }
.search-input:focus {
  outline: none;
  background: var(--bg-surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent);
}

/* ── Right ── */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover,
.icon-btn.active {
  background: var(--bg-surface-hover);
  color: var(--text-heading);
}

.icon-btn .material-symbols-outlined {
  font-size: 20px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* Notifications badge */
.notif-wrapper { position: relative; }

.notif-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--danger);
  color: #fff;
  font-size: 0.55rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-surface);
  line-height: 1;
}

/* Notifications dropdown */
.notif-dropdown {
  position: absolute;
  top: calc(100% + 0.625rem);
  right: 0;
  width: 320px;
  background: var(--bg-elevated);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  z-index: 100;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.notif-title {
  font-size: 0.8125rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.notif-clear {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 0;
}
.notif-clear:hover { text-decoration: underline; }

.notif-list { padding: 0.5rem 0; }

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.notif-item:hover { background: var(--bg-surface-hover); }

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-item.info .notif-dot    { background: var(--primary); }
.notif-item.system .notif-dot  { background: var(--success); }
.notif-item.alert .notif-dot   { background: var(--danger); }

.notif-body { flex: 1; }

.notif-text {
  font-size: 0.775rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 0.2rem;
}

.notif-time {
  font-size: 0.675rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Divider ── */
.topbar-divider {
  width: 1px;
  height: 28px;
  background: var(--border-divider);
  margin: 0 0.25rem;
}

/* ── User ── */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 0.625rem;
  transition: background 0.15s;
}

.user-info:hover { background: var(--bg-surface-hover); }

.user-text {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 800;
  color: var(--text-heading);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.user-role {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.01em;
}

.user-avatar {
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 0.625rem;
  background: linear-gradient(135deg, #00355f, #0f4c81);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

/* ── Theme Toggle Switch (from Uiverse.io by andrew-demchenk0) ── */
.theme-switch {
  font-size: 17px;
  position: relative;
  display: inline-block;
  width: 56px;
  height: 30px;
  flex-shrink: 0;
}

.theme-switch .theme-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.theme-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #73C0FC;
  transition: .4s;
  border-radius: 30px;
}

.theme-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  border-radius: 20px;
  left: 2px;
  bottom: 2px;
  z-index: 2;
  background-color: #e8e8e8;
  transition: .4s;
}

.sun svg {
  position: absolute;
  top: 5px;
  left: 31px;
  z-index: 1;
  width: 20px;
  height: 20px;
}

.moon svg {
  fill: #73C0FC;
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1;
  width: 22px;
  height: 22px;
}

.theme-switch:hover .sun svg {
  animation: rotate 15s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}

.theme-switch:hover .moon svg {
  animation: tilt 5s linear infinite;
}

@keyframes tilt {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
  100% { transform: rotate(0deg); }
}

.theme-input:checked + .theme-slider {
  background-color: #183153;
}

.theme-input:focus + .theme-slider {
  box-shadow: 0 0 1px #183153;
}

.theme-input:checked + .theme-slider:before {
  transform: translateX(26px);
}

/* Material Symbols */
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 992px) {
  .topbar {
    padding: 0.65rem 0.9rem;
    gap: 0.5rem;
  }

  .menu-btn {
    flex-shrink: 0;
  }

  .search-wrapper {
    max-width: none;
  }

  .search-input {
    font-size: 0.8rem;
    padding: 0.56rem 0.72rem 0.56rem 2.2rem;
  }

  .topbar-right {
    gap: 0.25rem;
  }

  .user-text,
  .topbar-divider {
    display: none;
  }
}
</style>