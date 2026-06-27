<script setup>
import { ref } from 'vue';

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
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid #e9eef4;
  box-shadow: 0 2px 6px rgba(0, 53, 95, 0.08);
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
  color: #94a3b8;
  pointer-events: none;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.search-input {
  width: 100%;
  background: #f1f5f9;
  border: 1.5px solid transparent;
  border-radius: 0.75rem;
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  font-size: 0.875rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #0d1b2a;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  line-height: 1.5;
}

.search-input::placeholder { color: #94a3b8; }
.search-input:focus {
  outline: none;
  background: #fff;
  border-color: #0f4c81;
  box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
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
  color: #64748b;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover,
.icon-btn.active {
  background: #f1f5f9;
  color: #00355f;
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
  background: #ba1a1a;
  color: #fff;
  font-size: 0.55rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  line-height: 1;
}

/* Notifications dropdown */
.notif-dropdown {
  position: absolute;
  top: calc(100% + 0.625rem);
  right: 0;
  width: 320px;
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e9eef4;
  box-shadow: 0 8px 24px rgba(0, 53, 95, 0.12), 0 2px 8px rgba(0, 53, 95, 0.06);
  overflow: hidden;
  z-index: 100;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.notif-title {
  font-size: 0.8125rem;
  font-weight: 800;
  color: #0d1b2a;
  letter-spacing: -0.02em;
}

.notif-clear {
  font-size: 0.7rem;
  font-weight: 600;
  color: #0f4c81;
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

.notif-item:hover { background: #f8fafc; }

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-item.info .notif-dot    { background: #0f4c81; }
.notif-item.system .notif-dot  { background: #27ae60; }
.notif-item.alert .notif-dot   { background: #ba1a1a; }

.notif-body { flex: 1; }

.notif-text {
  font-size: 0.775rem;
  font-weight: 500;
  color: #334155;
  line-height: 1.5;
  margin: 0 0 0.2rem;
}

.notif-time {
  font-size: 0.675rem;
  font-weight: 600;
  color: #94a3b8;
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
  background: #e2e8f0;
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

.user-info:hover { background: #f1f5f9; }

.user-text {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 800;
  color: #00355f;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.user-role {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
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