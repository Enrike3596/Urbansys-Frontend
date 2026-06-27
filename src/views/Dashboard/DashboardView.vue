<script setup>

const metrics = [
  {
    label: 'Total Residentes',
    value: '1,284',
    icon: 'group',
    badge: '+2.4%',
    badgeType: 'success',
    accent: '#00355f',
    iconBg: '#d2e4ff',
    iconColor: '#00355f',
  },
  {
    label: 'Ocupación',
    value: '98.2%',
    sub: '412/420 unidades',
    icon: 'apartment',
    accent: '#4edea3',
    iconBg: '#6ffbbe',
    iconColor: '#003c27',
  },
  {
    label: 'Reservas Activas',
    value: '14',
    badge: 'Hoy',
    badgeType: 'neutral',
    icon: 'event_available',
    accent: '#cbe7f5',
    iconBg: '#cbe7f5',
    iconColor: '#48626e',
  },
  {
    label: 'Incidentes Pendientes',
    value: '08',
    icon: 'report_problem',
    alert: true,
    accent: '#ffdad6',
    iconBg: '#ffdad6',
    iconColor: '#ba1a1a',
  },
];

const activities = [
  {
    id: 1,
    title: 'Torre A, Apt 402',
    desc: 'Acceso de visita concedido mediante llave digital.',
    time: 'hace 2 min',
    type: 'info',
    initials: 'TA',
  },
  {
    id: 2,
    title: 'Alerta del Sistema',
    desc: 'Balance químico de la piscina ajustado automáticamente.',
    time: 'hace 14 min',
    type: 'system',
    initials: 'SY',
  },
  {
    id: 3,
    title: 'Incidente #8402',
    desc: 'Fuga de agua reportada en el lobby de Torre B.',
    time: 'hace 42 min',
    type: 'alert',
    initials: '!',
  },
];

const reservations = [
  {
    id: 1,
    name: 'James D. Parker',
    unit: 'Apt 501',
    initials: 'JD',
    color: '#dbeafe',
    textColor: '#1e40af',
    facility: 'Área BBQ',
    facilityIcon: 'restaurant',
    time: 'Mañana, 18:00',
    duration: '2 Horas',
  },
  {
    id: 2,
    name: 'Sarah Miller',
    unit: 'Torre C, 120',
    initials: 'SM',
    color: '#d1fae5',
    textColor: '#065f46',
    facility: 'Cancha de Tenis',
    facilityIcon: 'sports_tennis',
    time: 'Oct 26, 08:30',
    duration: '1 Hora',
  },
  {
    id: 3,
    name: 'Robert Kincaid',
    unit: 'Apt 104',
    initials: 'RK',
    color: '#f1f5f9',
    textColor: '#475569',
    facility: 'Sala de Reuniones',
    facilityIcon: 'groups',
    time: 'Oct 27, 14:00',
    duration: '4 Horas',
  },
];
</script>

<template>
    <div class="dashboard">

      <!-- ── Encabezado ── -->
      <section class="dash-header">
        <div class="dash-header-text">
          <h2 class="dash-title">Resumen Operacional</h2>
          <p class="dash-subtitle">
            Bienvenido. Los sistemas operan dentro de los parámetros esperados con
            <strong class="highlight">98% de ocupación</strong> en todas las torres.
          </p>
        </div>
        <div class="dash-date">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>{{ new Date().toLocaleDateString('es-CO', { dateStyle: 'long' }) }}</span>
        </div>
      </section>

      <!-- ── Métricas ── -->
      <section class="metrics-grid">
        <div
          v-for="m in metrics"
          :key="m.label"
          class="metric-card"
          :style="{ borderLeftColor: m.accent }"
        >
          <div class="metric-top">
            <div class="metric-icon" :style="{ background: m.iconBg }">
              <span class="material-symbols-outlined" :style="{ color: m.iconColor }">{{ m.icon }}</span>
            </div>
            <span v-if="m.badge" class="metric-badge" :class="m.badgeType">{{ m.badge }}</span>
            <span v-if="m.alert" class="alert-dot"></span>
          </div>
          <p class="metric-label">{{ m.label }}</p>
          <div class="metric-value-row">
            <h3 class="metric-value">{{ m.value }}</h3>
            <span v-if="m.sub" class="metric-sub">{{ m.sub }}</span>
          </div>
        </div>
      </section>

      <!-- ── Feed + Reservas ── -->
      <section class="data-grid">

        <!-- Live Feed -->
        <div class="feed-panel">
          <div class="panel-header">
            <h4 class="panel-title">Feed en Vivo</h4>
            <button class="view-all-btn">Ver todo</button>
          </div>
          <div class="feed-list">
            <div
              v-for="a in activities"
              :key="a.id"
              class="feed-item"
              :class="a.type"
            >
              <div class="feed-avatar" :class="a.type">
                {{ a.initials }}
              </div>
              <div class="feed-body">
                <p class="feed-title">{{ a.title }}</p>
                <p class="feed-desc">{{ a.desc }}</p>
                <span class="feed-time">{{ a.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reservas pendientes -->
        <div class="reservations-panel">
          <div class="panel-header">
            <h4 class="panel-title">Reservas Pendientes</h4>
            <div class="panel-actions">
              <button class="icon-action-btn">
                <span class="material-symbols-outlined">filter_list</span>
              </button>
              <button class="icon-action-btn">
                <span class="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="res-table">
              <thead>
                <tr>
                  <th>Residente</th>
                  <th>Instalación</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th class="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in reservations" :key="r.id" class="res-row">
                  <td>
                    <div class="res-resident">
                      <div class="res-avatar" :style="{ background: r.color, color: r.textColor }">
                        {{ r.initials }}
                      </div>
                      <div>
                        <p class="res-name">{{ r.name }}</p>
                        <p class="res-unit">{{ r.unit }}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="res-facility">
                      <span class="material-symbols-outlined res-facility-icon">{{ r.facilityIcon }}</span>
                      <span>{{ r.facility }}</span>
                    </div>
                  </td>
                  <td>
                    <p class="res-time">{{ r.time }}</p>
                    <p class="res-duration">{{ r.duration }}</p>
                  </td>
                  <td>
                    <span class="status-badge">Verificando</span>
                  </td>
                  <td class="text-right">
                    <button class="approve-btn">Aprobar</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="table-footer">
              <button class="see-more-btn">
                <span>Ver más solicitudes</span>
                <span class="material-symbols-outlined">keyboard_arrow_down</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 1.5rem 2rem;
  width: 100%;
  box-sizing: border-box;
}

/* ── Header ── */
.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.dash-title {
  font-size: 2rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.04em;
  margin: 0 0 0.375rem;
  line-height: 1.15;
}

.dash-subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
}

.highlight { color: #005539; font-weight: 700; }

.dash-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.625rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.dash-date .material-symbols-outlined { font-size: 16px; }

/* ── Metrics ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.metric-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.375rem;
  border-left: 4px solid #00355f;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 4px 12px rgba(0,53,95,0.05);
  transition: box-shadow 0.2s, transform 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.metric-card:hover {
  box-shadow: 0 4px 16px rgba(0,53,95,0.1);
  transform: translateY(-1px);
}

.metric-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.metric-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon .material-symbols-outlined {
  font-size: 20px;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.metric-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 99px;
}

.metric-badge.success { background: #d1fae5; color: #065f46; }
.metric-badge.neutral { background: #f1f5f9; color: #475569; }

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ba1a1a;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.75); }
}

.metric-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  margin: 0 0 0.25rem;
}

.metric-value-row { display: flex; align-items: baseline; gap: 0.5rem; }

.metric-value {
  font-size: 2rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.04em;
  margin: 0;
  line-height: 1;
}

.metric-sub { font-size: 0.75rem; color: #94a3b8; font-style: italic; }

/* ── Data grid ── */
.data-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .data-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.panel-title {
  font-size: 1.0625rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.03em;
  margin: 0;
}

.view-all-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f4c81;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 0;
}
.view-all-btn:hover { text-decoration: underline; }

/* Feed */
.feed-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.feed-list { display: flex; flex-direction: column; gap: 0.75rem; }

.feed-item {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  background: #f8fafc;
  border-radius: 0.875rem;
  padding: 0.875rem;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.feed-item:hover { background: #fff; }
.feed-item.info    { border-left-color: #0f4c81; }
.feed-item.system  { border-left-color: #27ae60; }
.feed-item.alert   { border-left-color: #ba1a1a; }

.feed-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: 0.05em;
}

.feed-avatar.info   { background: #dbeafe; color: #1e40af; }
.feed-avatar.system { background: #d1fae5; color: #065f46; }
.feed-avatar.alert  { background: #ffdad6; color: #ba1a1a; }

.feed-title { font-size: 0.8125rem; font-weight: 700; color: #0d1b2a; margin: 0 0 0.2rem; }
.feed-desc  { font-size: 0.75rem; color: #64748b; margin: 0 0 0.375rem; line-height: 1.5; }
.feed-time  { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }

/* Reservations */
.reservations-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.panel-actions { display: flex; gap: 0.5rem; }

.icon-action-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #64748b;
  transition: background 0.15s, color 0.15s;
}

.icon-action-btn:hover { background: #e2e8f0; color: #00355f; }
.icon-action-btn .material-symbols-outlined { font-size: 18px; }

.table-wrapper {
  background: #fff;
  border-radius: 1rem;
  overflow: auto;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 4px 12px rgba(0,53,95,0.04);
  width: 100%;
  box-sizing: border-box;
}

.res-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  box-sizing: border-box;
}

.res-table thead tr {
  background: #f8fafc;
}

.res-table th {
  padding: 0.875rem 1rem;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
}

.res-row td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f8fafc;
  font-size: 0.8125rem;
  color: #475569;
  vertical-align: middle;
}

.res-row:hover td { background: #f8fafc; }
.res-row:last-child td { border-bottom: none; }

.res-resident { display: flex; align-items: center; gap: 0.625rem; }

.res-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: 0.05em;
}

.res-name { font-size: 0.8125rem; font-weight: 700; color: #0d1b2a; margin: 0 0 1px; }
.res-unit { font-size: 0.65rem; color: #94a3b8; font-weight: 600; margin: 0; }

.res-facility { display: flex; align-items: center; gap: 0.375rem; }
.res-facility-icon { font-size: 16px; color: #94a3b8; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

.res-time { font-size: 0.8125rem; font-weight: 600; color: #334155; margin: 0 0 1px; }
.res-duration { font-size: 0.65rem; color: #94a3b8; font-weight: 600; margin: 0; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  background: #cbe7f5;
  color: #304a55;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.approve-btn {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f4c81;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 0;
  transition: color 0.15s;
}
.approve-btn:hover { color: #00355f; }

.text-right { text-align: right; }

.table-footer {
  padding: 0.875rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.see-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: color 0.15s;
}

.see-more-btn:hover { color: #00355f; }
.see-more-btn .material-symbols-outlined { font-size: 18px; }

/* ── Bottom grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  padding-bottom: 1rem;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .bottom-grid { grid-template-columns: 1fr 1fr; }
}

@media (min-width: 1024px) {
  .bottom-grid { grid-template-columns: 1fr 1fr 1fr; }
}

/* Energy card */
.energy-card {
  background: linear-gradient(135deg, #00355f 0%, #0f4c81 100%);
  border-radius: 1.25rem;
  padding: 1.5rem;
  color: #fff;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
}

.energy-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.6);
  margin: 0 0 0.375rem;
}

.energy-value {
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
}

.energy-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}

.e-bar {
  flex: 1;
  background: rgba(255,255,255,0.8);
  border-radius: 3px 3px 0 0;
  min-height: 4px;
}

.energy-glow {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(77,168,218,0.3);
  bottom: -60px;
  right: -40px;
  filter: blur(40px);
}

/* Maintenance card */
.maintenance-card {
  background: #6ffbbe;
  border-radius: 1.25rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
}

.maintenance-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #005236;
  margin: 0 0 0.375rem;
}

.maintenance-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: #002113;
  letter-spacing: -0.03em;
  margin: 0 0 0.25rem;
}

.maintenance-time {
  font-size: 0.8rem;
  color: rgba(0,33,19,0.6);
  margin: 0;
  font-weight: 500;
}

.maintenance-icon {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  width: 3rem;
  height: 3rem;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.4);
  color: #002113;
}

.maintenance-ring {
  position: absolute;
  top: -1rem;
  left: -1rem;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  border: 8px solid rgba(0,82,54,0.1);
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
</style>