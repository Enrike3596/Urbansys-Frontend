<script setup>
import { ref, computed, onMounted } from 'vue'
import ApartamentoService from '@/services/Apartamento.Service'
import VehiculoService from '@/services/Vehiculo.Service'
import ReservasService from '@/services/Reservas.Service'
import SalonComunalService from '@/services/SalonComunal.Service'
import NovedadService from '@/services/Novedad.Service'
import MascotaService from '@/services/Mascota.Service'

const loading = ref(true)
const apartamentos = ref([])
const vehiculos = ref([])
const reservas = ref([])
const salones = ref([])
const novedades = ref([])
const mascotas = ref([])

const totalAptos = computed(() => apartamentos.value.length)
const ocupados = computed(() => apartamentos.value.filter(a => a.estado === 'ocupado').length)
const disponibles = computed(() => apartamentos.value.filter(a => !a.estado || a.estado === 'disponible').length)

const pctOcupacion = computed(() => {
  if (totalAptos.value === 0) return 0
  return Math.round((ocupados.value / totalAptos.value) * 100)
})

const totalVehiculos = computed(() => vehiculos.value.length)

const novedadesAbiertas = computed(() => novedades.value.filter(n => n.estado === 'abierta').length)

const reservasPorSalon = computed(() => {
  const map = {}
  for (const r of reservas.value) {
    if (r.salonComunalId == null) continue
    map[r.salonComunalId] = (map[r.salonComunalId] || 0) + 1
  }
  return Object.entries(map)
    .map(([id, total]) => {
      const salon = salones.value.find(s => s.idSalonComunal === Number(id))
      return { salonId: Number(id), nombre: salon?.nombre || 'Salon #' + id, total }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
})

const maxReservas = computed(() => {
  if (reservasPorSalon.value.length === 0) return 1
  return Math.max(...reservasPorSalon.value.map(r => r.total))
})

const novedadesPorTipo = computed(() => {
  const order = ['seguridad', 'mantenimiento', 'convivencia', 'visitante', 'otro']
  const counts = { seguridad: 0, mantenimiento: 0, convivencia: 0, visitante: 0, otro: 0 }
  for (const n of novedades.value) {
    if (counts[n.tipo] !== undefined) counts[n.tipo]++
    else counts.otro++
  }
  return order.map(t => ({ tipo: t, total: counts[t] }))
})

const maxNovedadesTipo = computed(() => Math.max(1, ...novedadesPorTipo.value.map(t => t.total)))

const novedadesColumnas = computed(() => {
  const n = novedadesPorTipo.value.length
  if (n === 0) return []
  const chartW = 260
  const chartH = 130
  const gap = chartW / n
  const barWidth = Math.min(gap * 0.55, 32)
  const max = maxNovedadesTipo.value
  return novedadesPorTipo.value.map((item, i) => {
    const barH = (item.total / max) * chartH
    return {
      x: 20 + i * gap + (gap - barWidth) / 2,
      y: 155 - barH,
      w: barWidth,
      h: Math.max(barH, 2),
      tipo: item.tipo,
      total: item.total,
    }
  })
})

const tipoColors = {
  seguridad: '#991b1b', mantenimiento: '#92400e',
  convivencia: '#1e40af', visitante: '#6b21a8', otro: '#475569',
}
const tipoLabels = {
  seguridad: 'Seguridad', mantenimiento: 'Mantenimiento',
  convivencia: 'Convivencia', visitante: 'Visitante', otro: 'Otro',
}

const vehiculosPorTipo = computed(() => {
  const counts = {}
  for (const v of vehiculos.value) {
    const tipo = v.tipoVehiculo?.toLowerCase() || 'otro'
    counts[tipo] = (counts[tipo] || 0) + 1
  }
  return Object.entries(counts)
    .map(([tipo, total]) => ({ tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1), total }))
    .sort((a, b) => b.total - a.total)
})

const maxVehiculosTipo = computed(() => Math.max(1, ...vehiculosPorTipo.value.map(t => t.total)))

const lineDots = computed(() => {
  const data = vehiculosPorTipo.value
  const n = data.length
  if (n === 0) return []
  const xStart = 45
  const xEnd = 265
  const yBase = 140
  const yScale = 110
  const max = maxVehiculosTipo.value
  const step = n > 1 ? (xEnd - xStart) / (n - 1) : 0
  return data.map((item, i) => {
    const x = n > 1 ? xStart + i * step : (xStart + xEnd) / 2
    const y = yBase - (item.total / max) * yScale
    return { x, y, label: item.tipo, total: item.total }
  })
})

const linePoints = computed(() => lineDots.value.map(p => `${p.x},${p.y}`).join(' '))

const totalMascotas = computed(() => mascotas.value.length)

const mascotasPorTipo = computed(() => {
  const counts = {}
  for (const m of mascotas.value) {
    const tipo = m.tipo || 'otro'
    counts[tipo] = (counts[tipo] || 0) + 1
  }
  return Object.entries(counts)
    .map(([tipo, total]) => ({ tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1), total }))
    .sort((a, b) => b.total - a.total)
})

const mascotaColors = ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#27ae60', '#94a3b8']

const R2 = 44
const C2 = 2 * Math.PI * R2

const mascotaSegments = computed(() => {
  const total = totalMascotas.value
  if (total === 0) return []
  let offset = 0
  return mascotasPorTipo.value.map((item, i) => {
    const pct = item.total / total
    const seg = {
      dasharray: `${C2 * pct} ${C2 * (1 - pct)}`,
      dashoffset: -offset,
      color: mascotaColors[i % mascotaColors.length],
      ...item,
    }
    offset += C2 * pct
    return seg
  })
})

const CHART_RADIUS = 44
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS

const ocupadosOffset = computed(() => {
  return CHART_CIRCUMFERENCE * (1 - pctOcupacion.value / 100)
})

onMounted(async () => {
  try {
    const [aptos, vehs, ress, sals, novs, mscs] = await Promise.all([
      ApartamentoService.listar(),
      VehiculoService.listar(),
      ReservasService.listar(),
      SalonComunalService.listar(),
      NovedadService.listar(),
      MascotaService.listar(),
    ])
    apartamentos.value = Array.isArray(aptos) ? aptos : []
    vehiculos.value = Array.isArray(vehs) ? vehs : []
    reservas.value = Array.isArray(ress) ? ress : []
    salones.value = Array.isArray(sals) ? sals : []
    novedades.value = Array.isArray(novs) ? novs : []
    mascotas.value = Array.isArray(mscs) ? mscs : []
  } catch (e) {
    console.error('Error cargando dashboard:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <section class="dash-header">
      <div class="dash-header-text">
        <h2 class="dash-title">Panel de Control</h2>
        <p class="dash-subtitle">Resumen general del conjunto residencial.</p>
      </div>
      <div class="dash-date">
        <span class="material-symbols-outlined">calendar_today</span>
        <span>{{ new Date().toLocaleDateString('es-CO', { dateStyle: 'long' }) }}</span>
      </div>
    </section>

    <div v-if="loading" class="loading-state">
      <span class="material-symbols-outlined loading-icon">sync</span>
      <p>Cargando datos del conjunto...</p>
    </div>

    <template v-else>
      <section class="metrics-grid">
        <div class="metric-card" style="border-left-color:#00355f">
          <div class="metric-top">
            <div class="metric-icon" style="background:#d2e4ff">
              <span class="material-symbols-outlined" style="color:#00355f">apartment</span>
            </div>
          </div>
          <p class="metric-label">Total Apartamentos</p>
          <h3 class="metric-value">{{ totalAptos }}</h3>
          <p class="metric-sub">Unidades registradas</p>
        </div>

        <div class="metric-card" style="border-left-color:#27ae60">
          <div class="metric-top">
            <div class="metric-icon" style="background:#d1fae5">
              <span class="material-symbols-outlined" style="color:#065f46">home</span>
            </div>
            <div class="chart-ring-wrap">
              <svg width="52" height="52" viewBox="0 0 100 100">
                <circle cx="50" cy="50" :r="CHART_RADIUS" fill="none" stroke="#e2e8f0" stroke-width="10" />
                <circle cx="50" cy="50" :r="CHART_RADIUS" fill="none" stroke="#27ae60" stroke-width="10"
                  :stroke-dasharray="CHART_CIRCUMFERENCE"
                  :stroke-dashoffset="ocupadosOffset"
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)" />
              </svg>
              <span class="chart-ring-label">{{ pctOcupacion }}%</span>
            </div>
          </div>
          <p class="metric-label">Ocupados</p>
          <h3 class="metric-value">{{ ocupados }}</h3>
          <p class="metric-sub">{{ disponibles }} disponibles</p>
        </div>

        <div class="metric-card" style="border-left-color:#0f4c81">
          <div class="metric-top">
            <div class="metric-icon" style="background:#dbeafe">
              <span class="material-symbols-outlined" style="color:#1e40af">directions_car</span>
            </div>
          </div>
          <p class="metric-label">Vehículos</p>
          <h3 class="metric-value">{{ totalVehiculos }}</h3>
          <p class="metric-sub">Registrados en el conjunto</p>
        </div>

        <div class="metric-card" style="border-left-color:#8b5cf6">
          <div class="metric-top">
            <div class="metric-icon" style="background:#f3e8ff">
              <span class="material-symbols-outlined" style="color:#7c3aed">pets</span>
            </div>
          </div>
          <p class="metric-label">Mascotas</p>
          <h3 class="metric-value">{{ totalMascotas }}</h3>
          <p class="metric-sub">Registradas en el conjunto</p>
        </div>
      </section>

      <section class="charts-grid">
        <div class="chart-panel">
          <div class="panel-header"><h4 class="panel-title">Ocupación</h4></div>
          <div class="donut-wrap">
            <svg width="180" height="180" viewBox="0 0 100 100">
              <circle cx="50" cy="50" :r="CHART_RADIUS" fill="none" stroke="#f1f5f9" stroke-width="12" />
              <circle cx="50" cy="50" :r="CHART_RADIUS" fill="none" stroke="#27ae60" stroke-width="12"
                :stroke-dasharray="CHART_CIRCUMFERENCE"
                :stroke-dashoffset="ocupadosOffset"
                stroke-linecap="round"
                transform="rotate(-90 50 50)" />
            </svg>
            <div class="donut-center">
              <span class="donut-pct">{{ pctOcupacion }}%</span>
              <span class="donut-lbl">Ocupación</span>
            </div>
          </div>
          <div class="donut-legend">
            <div class="legend-item"><span class="legend-dot" style="background:#27ae60"></span>Ocupados <strong>{{ ocupados }}</strong></div>
            <div class="legend-item"><span class="legend-dot" style="background:#f1f5f9"></span>Disponibles <strong>{{ disponibles }}</strong></div>
          </div>
        </div>

        <div class="chart-panel">
          <div class="panel-header"><h4 class="panel-title">Novedades por Tipo</h4></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:.75rem">
            <svg width="100%" height="200" viewBox="0 0 300 200" style="max-width:300px">
              <line x1="22" y1="155" x2="278" y2="155" stroke="#e2e8f0" stroke-width="1" />
              <g v-for="col in novedadesColumnas" :key="col.tipo">
                <rect :x="col.x" :y="col.y" :width="col.w" :height="col.h" :fill="tipoColors[col.tipo] || '#94a3b8'" rx="4" ry="4" />
              </g>
              <text v-if="novedadesColumnas.length === 0" x="150" y="100" text-anchor="middle" font-size="12" fill="#94a3b8">Sin datos</text>
            </svg>
            <div class="chart-legend">
              <div v-for="item in novedadesPorTipo" :key="item.tipo" class="legend-item">
                <span class="legend-dot" :style="{ background: tipoColors[item.tipo] }"></span>
                <span>{{ tipoLabels[item.tipo] }} <strong>{{ item.total }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-panel">
          <div class="panel-header"><h4 class="panel-title">Vehículos por Tipo</h4></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:.75rem">
            <svg width="100%" height="200" viewBox="0 0 300 200" style="max-width:300px">
              <line x1="40" y1="140" x2="275" y2="140" stroke="#e2e8f0" stroke-width="1" />
              <polyline v-if="lineDots.length > 1" :points="linePoints" fill="none" stroke="#0f4c81" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
              <circle v-for="(pt, i) in lineDots" :key="i" :cx="pt.x" :cy="pt.y" r="5" fill="#0f4c81" stroke="#fff" stroke-width="2.5" />
              <text v-for="(pt, i) in lineDots" :key="'v'+i" :x="pt.x" :y="pt.y - 14" text-anchor="middle" font-size="12"
                font-family="Plus Jakarta Sans,sans-serif" font-weight="800" fill="#0d1b2a">{{ pt.total }}</text>
              <text v-for="(pt, i) in lineDots" :key="'l'+i" :x="pt.x" y="162" text-anchor="middle" font-size="10"
                font-family="Plus Jakarta Sans,sans-serif" font-weight="700" fill="#475569">{{ pt.label }}</text>
              <text v-if="lineDots.length === 0" x="150" y="100" text-anchor="middle" font-size="12" fill="#94a3b8">Sin datos</text>
            </svg>
            <div class="chart-legend">
              <div v-for="(item, i) in vehiculosPorTipo" :key="item.tipo" class="legend-item">
                <span class="legend-dot" style="background:#0f4c81"></span>
                <span>{{ item.tipo }} <strong>{{ item.total }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-panel">
          <div class="panel-header"><h4 class="panel-title">Mascotas por Tipo</h4></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:.75rem">
            <div class="donut-wrap">
              <svg width="180" height="180" viewBox="0 0 100 100">
                <circle cx="50" cy="50" :r="R2" fill="none" stroke="#f1f5f9" stroke-width="12" />
                <circle v-for="(seg, i) in mascotaSegments" :key="i" cx="50" cy="50" :r="R2"
                  fill="none" :stroke="seg.color" stroke-width="12"
                  :stroke-dasharray="seg.dasharray" :stroke-dashoffset="seg.dashoffset"
                  stroke-linecap="round" transform="rotate(-90 50 50)" />
              </svg>
              <div class="donut-center">
                <span class="donut-pct">{{ totalMascotas }}</span>
                <span class="donut-lbl">Total</span>
              </div>
            </div>
            <div class="chart-legend">
              <div v-for="(item, i) in mascotasPorTipo" :key="item.tipo" class="legend-item">
                <span class="legend-dot" :style="{ background: mascotaColors[i % mascotaColors.length] }"></span>
                <span>{{ item.tipo }} <strong>{{ item.total }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bottom-grid">
        <div class="chart-panel">
          <div class="panel-header"><h4 class="panel-title">Reservas por Salón</h4></div>
          <div class="bars-wrap">
            <div v-for="item in reservasPorSalon" :key="item.salonId" class="bar-row">
              <span class="bar-label">{{ item.nombre }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: (item.total / maxReservas * 100) + '%' }"></div>
              </div>
              <span class="bar-count">{{ item.total }}</span>
            </div>
            <div v-if="reservasPorSalon.length === 0" class="empty-chart">No hay reservas registradas</div>
          </div>
        </div>


      </section>
    </template>
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

.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.dash-title {
  font-size: 2rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.04em;
  margin: 0 0 0.25rem;
  line-height: 1.15;
}

.dash-subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: #94a3b8;
}

.loading-icon { font-size: 48px; animation: spin 1.5s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.metric-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.375rem;
  border-left: 4px solid #00355f;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 4px 12px rgba(0,53,95,0.05);
  transition: box-shadow 0.2s, transform 0.2s;
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

.chart-ring-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.chart-ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 800;
  color: #00355f;
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ba1a1a;
  animation: pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
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

.metric-value {
  font-size: 2rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.04em;
  margin: 0;
  line-height: 1;
}

.metric-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  margin: 0.375rem 0 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .charts-grid { grid-template-columns: 1fr 1fr; }
}

@media (min-width: 1300px) {
  .charts-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
}

.chart-panel {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 4px 12px rgba(0,53,95,0.04);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.03em;
  margin: 0;
}

.donut-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-pct {
  font-size: 1.75rem;
  font-weight: 800;
  color: #00355f;
  line-height: 1;
}

.donut-lbl {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-top: 0.2rem;
}

.donut-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.25rem;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.25rem;
  padding: 0.25rem 0.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: #475569;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .bottom-grid { grid-template-columns: 1fr 1fr; }
}

.bars-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bar-label {
  width: 120px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0f4c81, #2f74ad);
  border-radius: 99px;
  transition: width 0.6s ease;
  min-width: 4px;
}

.bar-count {
  width: 28px;
  text-align: right;
  font-size: 0.8125rem;
  font-weight: 800;
  color: #00355f;
}

.empty-chart, .empty-feed {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.feed-section {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 4px 12px rgba(0,53,95,0.04);
}

.feed-grid {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.feed-card {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  background: #f8fafc;
  border-radius: 0.875rem;
  padding: 0.875rem;
  border-left: 3px solid transparent;
  transition: background 0.15s;
}

.feed-card:hover { background: #fff; }
.feed-card.abierta { border-left-color: #3b82f6; }
.feed-card.en_proceso { border-left-color: #f59e0b; }
.feed-card.cerrada { border-left-color: #27ae60; }

.feed-card-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-card-icon .material-symbols-outlined { font-size: 16px; font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.feed-card-icon.seguridad { background:#fee2e2; color:#991b1b; }
.feed-card-icon.mantenimiento { background:#fef3c7; color:#92400e; }
.feed-card-icon.convivencia { background:#dbeafe; color:#1e40af; }
.feed-card-icon.visitante { background:#f3e8ff; color:#6b21a8; }
.feed-card-icon.otro { background:#f1f5f9; color:#475569; }

.feed-card-body { flex: 1; min-width: 0; }
.feed-card-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.15rem; }
.feed-card-title { font-size: 0.8125rem; font-weight: 700; color: #0d1b2a; }
.feed-card-date { font-size: 0.6rem; font-weight: 600; color: #94a3b8; white-space: nowrap; }
.feed-card-desc { font-size: 0.725rem; color: #64748b; margin: 0.15rem 0 0.4rem; line-height: 1.5; }
.feed-card-badges { display: flex; flex-wrap: wrap; gap: 0.375rem; }

.chip {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.03em;
}

.tipo-chip.seguridad { background:#fee2e2; color:#991b1b; }
.tipo-chip.mantenimiento { background:#fef3c7; color:#92400e; }
.tipo-chip.convivencia { background:#dbeafe; color:#1e40af; }
.tipo-chip.visitante { background:#f3e8ff; color:#6b21a8; }
.tipo-chip.otro { background:#f1f5f9; color:#475569; }

.estado-chip.abierta { background:#dbeafe; color:#1e40af; }
.estado-chip.en_proceso { background:#fef3c7; color:#92400e; }
.estado-chip.cerrada { background:#d1fae5; color:#065f46; }

.prioridad-chip.prio-1 { background:#fee2e2; color:#991b1b; }
.prioridad-chip.prio-2 { background:#fef3c7; color:#92400e; }
.prioridad-chip.prio-3 { background:#dbeafe; color:#1e40af; }

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
