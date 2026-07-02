<script setup>
import { computed, onMounted, ref } from 'vue'
import ReservasService from '@/services/Reservas.Service'
import SalonComunalService from '@/services/SalonComunal.Service'
import ApartamentoService from '@/services/Apartamento.Service'
import ResidenteService from '@/services/Residente.Service'
import UsuarioService from '@/services/Usuario.Service'
import TorreService from '@/services/Torre.Service'
import { swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert'

const searchQuery = ref('')
const filterEstado = ref('todos')
const currentPage = ref(1)
const perPage = 8

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const activeAutocomplete = ref('')
const autocompleteCloseTimer = ref(null)

const showModal = ref(false)
const modalMode = ref('crear')
const selectedReserva = ref(null)

const reservas = ref([])
const salones = ref([])
const torres = ref([])
const apartamentos = ref([])
const residentes = ref([])
const usuarios = ref([])
const salonSearch = ref('')
const torreSearch = ref('')
const apartamentoSearch = ref('')
const residenteSearch = ref('')

const emptyForm = () => ({
  idReservaSalon: null,
  salonComunalId: '',
  apartamentoId: '',
  torreId: '',
  residenteId: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  estado: 'pendiente',
})

const form = ref(emptyForm())

const estadoConfig = {
  pendiente: { label: 'Pendiente', bg: '#fef3c7', color: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  confirmada: { label: 'Confirmada', bg: '#d1fae5', color: '#065f46', border: '#a7f3d0', dot: '#27ae60' },
  cancelada: { label: 'Cancelada', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' },
  finalizada: { label: 'Finalizada', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' },
}

const metrics = computed(() => {
  const total = reservas.value.length
  const pendientes = reservas.value.filter((item) => item.estado === 'pendiente').length
  const confirmadas = reservas.value.filter((item) => item.estado === 'confirmada').length
  const canceladas = reservas.value.filter((item) => item.estado === 'cancelada').length

  return { total, pendientes, confirmadas, canceladas }
})

const salonesIndex = computed(() => new Map(salones.value.map((salon) => [Number(salon.idSalonComunal), salon])))
const torresIndex = computed(() => new Map(torres.value.map((torre) => [Number(torre.idTorre ?? torre.id), torre])))
const apartamentosIndex = computed(() => new Map(apartamentos.value.map((apt) => [Number(apt.idApartamento), apt])))
const residentesIndex = computed(() => new Map(residentes.value.map((res) => [Number(res.idResidente), res])))
const usuariosIndex = computed(() => new Map(usuarios.value.map((usr) => [Number(usr.id), usr])))
const residentePorTorreYApto = computed(() => {
  const map = new Map()
  for (const r of residentes.value) {
    const key = `${r.torreId ?? ''}|${r.apartamentoId ?? ''}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return map
})

function getSalonNombre(item) {
  if (!item) return '-'

  const nombreDesdeApi = item.salonComunalNombre ?? item.nombreSalonComunal
  if (nombreDesdeApi) return nombreDesdeApi

  if (item.salonComunalId == null) return '-'
  const salon = salonesIndex.value.get(Number(item.salonComunalId))
  return salon?.nombre || '-'
}

function getApartamentoNumero(item) {
  if (!item) return '-'

  const numeroDesdeApi = item.numeroApartamento ?? item.apartamentoNumero
  if (numeroDesdeApi) return numeroDesdeApi

  if (item.apartamentoId == null) return '-'
  const apartamento = apartamentosIndex.value.get(Number(item.apartamentoId))
  return apartamento?.numeroApartamento || apartamento?.numero || '-'
}

function getTorreNombre(item) {
  if (!item) return '-'

  const nombreDesdeApi = item.torreNombre
  if (nombreDesdeApi) return nombreDesdeApi

  if (item.torreId == null) return '-'
  const torre = torresIndex.value.get(Number(item.torreId))
  return torre?.nombre || '-'
}

function getResidenteNombre(item) {
  if (!item) return '-'

  if (item.residenteNombre) return item.residenteNombre

  if (item.residenteId == null) return '-'
  const residente = residentesIndex.value.get(Number(item.residenteId))
  if (!residente) return '-'
  const nombre = residente.nombre || residente.usuarioNombre || ''
  const apellido = residente.apellido || residente.usuarioApellido || ''
  const directo = `${nombre} ${apellido}`.trim()
  if (directo) return directo
  const usuario = usuariosIndex.value.get(Number(residente.usuarioId))
  const fromUsuario = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
  return fromUsuario || '-'
}

function getSalonLabel(salon) {
  return salon?.nombre || 'Salon'
}

function getTorreLabel(torre) {
  return torre?.nombre || 'Torre'
}

function getApartamentoLabel(apartamento) {
  return apartamento?.numeroApartamento || apartamento?.numero || 'Sin numero'
}

function getResidenteLabel(residente) {
  if (!residente) return ''
  const nombre = residente.nombre || residente.usuarioNombre || ''
  const apellido = residente.apellido || residente.usuarioApellido || ''
  const directo = `${nombre} ${apellido}`.trim()
  if (directo) return directo
  const usuario = usuariosIndex.value.get(Number(residente.usuarioId))
  const fromUsuario = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
  if (fromUsuario) return fromUsuario
  return `Residente ${residente.idResidente}`
}

function getApartamentoTorreId(apartamento) {
  if (!apartamento) return null
  const raw = apartamento.torreId ?? apartamento.idTorre
  if (raw == null || Number.isNaN(Number(raw))) return null
  return Number(raw)
}

const filteredSalones = computed(() => {
  const term = salonSearch.value.trim().toLowerCase()

  return salones.value
    .filter((salon) => {
      if (!term) return true
      const nombre = String(salon.nombre ?? '').toLowerCase()
      const id = String(salon.idSalonComunal ?? '').toLowerCase()
      return nombre.includes(term) || id.includes(term)
    })
    .slice(0, 8)
})

const filteredTorres = computed(() => {
  const term = torreSearch.value.trim().toLowerCase()

  return torres.value
    .filter((torre) => {
      if (!term) return true
      const nombre = String(torre.nombre ?? '').toLowerCase()
      const id = String(torre.idTorre ?? torre.id ?? '').toLowerCase()
      return nombre.includes(term) || id.includes(term)
    })
    .slice(0, 8)
})

const filteredApartamentos = computed(() => {
  const selectedTorreId = toNumberOrNull(form.value.torreId)
  if (selectedTorreId == null) return []

  const term = apartamentoSearch.value.trim().toLowerCase()

  return apartamentos.value
    .filter((apartamento) => {
      const torreId = getApartamentoTorreId(apartamento)
      if (torreId !== selectedTorreId) return false
      if (!term) return true

      const numero = String(apartamento.numeroApartamento ?? apartamento.numero ?? '').toLowerCase()
      const id = String(apartamento.idApartamento ?? '').toLowerCase()
      return numero.includes(term) || id.includes(term)
    })
    .slice(0, 8)
})

const filteredResidentes = computed(() => {
  const selectedTorreId = toNumberOrNull(form.value.torreId)
  const selectedApartamentoId = toNumberOrNull(form.value.apartamentoId)
  if (selectedTorreId == null || selectedApartamentoId == null) return []

  const term = residenteSearch.value.trim().toLowerCase()

  return residentes.value
    .filter((residente) => {
      const residenteApartamentoId = toNumberOrNull(residente.apartamentoId)
      if (residenteApartamentoId !== selectedApartamentoId) return false

      const residenteApartamento = apartamentosIndex.value.get(Number(residenteApartamentoId))
      const residenteTorreId = getApartamentoTorreId(residenteApartamento)
      if (residenteTorreId !== selectedTorreId) return false

      if (!term) return true
      return getResidenteLabel(residente).toLowerCase().includes(term)
    })
    .slice(0, 8)
})

function clearAutocomplete() {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
  }

  autocompleteCloseTimer.value = setTimeout(() => {
    activeAutocomplete.value = ''
    autocompleteCloseTimer.value = null
  }, 180)
}

function openAutocomplete(field) {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
    autocompleteCloseTimer.value = null
  }

  activeAutocomplete.value = field
}

function selectSalon(salon) {
  form.value.salonComunalId = Number(salon.idSalonComunal)
  salonSearch.value = getSalonLabel(salon)
  activeAutocomplete.value = ''
}

function selectTorre(torre) {
  form.value.torreId = Number(torre.idTorre ?? torre.id)
  torreSearch.value = getTorreLabel(torre)
  form.value.apartamentoId = null
  apartamentoSearch.value = ''
  form.value.residenteId = null
  residenteSearch.value = ''
  activeAutocomplete.value = ''
}

function selectApartamento(apartamento) {
  form.value.apartamentoId = Number(apartamento.idApartamento)
  apartamentoSearch.value = getApartamentoLabel(apartamento)
  activeAutocomplete.value = ''
  autoAsignarResidente()
}

function autoAsignarResidente() {
  const torreId = form.value.torreId
  const aptoId = form.value.apartamentoId
  if (!torreId || !aptoId) {
    form.value.residenteId = null
    residenteSearch.value = ''
    return
  }
  const key = `${torreId}|${aptoId}`
  const encontrados = residentePorTorreYApto.value.get(key)
  if (encontrados && encontrados.length === 1) {
    const r = encontrados[0]
    form.value.residenteId = Number(r.idResidente)
    residenteSearch.value = getResidenteLabel(r)
  } else {
    form.value.residenteId = null
    residenteSearch.value = ''
  }
}

function selectResidente(residente) {
  form.value.residenteId = Number(residente.idResidente)
  residenteSearch.value = getResidenteLabel(residente)
  activeAutocomplete.value = ''
}

function onSalonInput() {
  form.value.salonComunalId = null
}

function onTorreInput() {
  form.value.torreId = null
  form.value.apartamentoId = null
  apartamentoSearch.value = ''
  form.value.residenteId = null
  residenteSearch.value = ''
}

function onApartamentoInput() {
  form.value.apartamentoId = null
  form.value.residenteId = null
  residenteSearch.value = ''
}

function onResidenteInput() {
  form.value.residenteId = null
}

const filtered = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()

  return reservas.value.filter((item) => {
    const matchesEstado = filterEstado.value === 'todos' || item.estado === filterEstado.value
    if (!matchesEstado) {
      return false
    }

    if (!term) {
      return true
    }

    return (
      String(getSalonNombre(item)).toLowerCase().includes(term)
      || String(getResidenteNombre(item)).toLowerCase().includes(term)
      || String(getApartamentoNumero(item)).toLowerCase().includes(term)
      || String(getTorreNombre(item)).toLowerCase().includes(term)
      || String(item.torreId ?? '').toLowerCase().includes(term)
      || String(item.fecha ?? '').toLowerCase().includes(term)
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const visiblePages = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i += 1) {
    if (i === 1 || i === totalPages.value || Math.abs(i - currentPage.value) <= 1) {
      pages.push(i)
    }
  }
  return pages
})

function toNumberOrNull(value) {
  if (value === '' || value == null || Number.isNaN(Number(value))) {
    return null
  }
  return Number(value)
}

async function cargarReservas() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await ReservasService.listar()
    reservas.value = Array.isArray(data) ? data : []
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    reservas.value = []
    errorMessage.value = error?.message || 'No fue posible cargar las reservas.'
  } finally {
    loading.value = false
  }
}

async function cargarCatalogos() {
  try {
    const [salonesData, torresData, apartamentosData, residentesData, usuariosData] = await Promise.all([
      SalonComunalService.listar(),
      TorreService.listar(),
      ApartamentoService.listar(),
      ResidenteService.listar(),
      UsuarioService.listar(),
    ])

    salones.value = Array.isArray(salonesData) ? salonesData : []
    torres.value = Array.isArray(torresData) ? torresData : []
    apartamentos.value = Array.isArray(apartamentosData) ? apartamentosData : []
    residentes.value = Array.isArray(residentesData) ? residentesData : []
    usuarios.value = Array.isArray(usuariosData) ? usuariosData : []
  } catch (error) {
    salones.value = []
    torres.value = []
    apartamentos.value = []
    residentes.value = []
    usuarios.value = []
    console.error('No fue posible cargar catalogos de reservas:', error)
  }
}

async function openCrear() {
  form.value = emptyForm()
  salonSearch.value = ''
  torreSearch.value = ''
  apartamentoSearch.value = ''
  residenteSearch.value = ''
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
    autocompleteCloseTimer.value = null
  }
  await cargarCatalogos()
  modalMode.value = 'crear'
  showModal.value = true
}

function openEditar(item) {
  form.value = { ...item }
  const salon = salonesIndex.value.get(Number(item.salonComunalId))
  const torre = torresIndex.value.get(Number(item.torreId))
  const apartamento = apartamentosIndex.value.get(Number(item.apartamentoId))
  const residente = residentesIndex.value.get(Number(item.residenteId))
  salonSearch.value = salon ? getSalonLabel(salon) : ''
  torreSearch.value = torre ? getTorreLabel(torre) : ''
  apartamentoSearch.value = apartamento ? getApartamentoLabel(apartamento) : ''
  residenteSearch.value = residente ? getResidenteLabel(residente) : ''
  modalMode.value = 'editar'
  showModal.value = true
}

function openVer(item) {
  selectedReserva.value = item
  modalMode.value = 'ver'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  activeAutocomplete.value = ''
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
    autocompleteCloseTimer.value = null
  }
}

async function guardar() {
  const payload = {
    salonComunalId: toNumberOrNull(form.value.salonComunalId),
    apartamentoId: toNumberOrNull(form.value.apartamentoId),
    torreId: toNumberOrNull(form.value.torreId),
    residenteId: toNumberOrNull(form.value.residenteId),
    fecha: form.value.fecha,
    horaInicio: form.value.horaInicio,
    horaFin: form.value.horaFin,
    estado: form.value.estado,
  }

  if (!payload.salonComunalId || !payload.residenteId || !payload.fecha || !payload.horaInicio || !payload.horaFin) {
    errorMessage.value = 'Salon comunal, residente, fecha, hora inicio y hora fin son obligatorios.'
    await swalError(errorMessage.value)
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    if (modalMode.value === 'crear') {
      await ReservasService.crear(payload)
    } else {
      await ReservasService.actualizar(form.value.idReservaSalon, payload)
    }

    closeModal()
    await cargarReservas()
    swalSuccess(modalMode.value === 'crear' ? 'Reserva creada correctamente.' : 'Reserva actualizada correctamente.')
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible guardar la reserva.'
    await swalError(errorMessage.value)
  } finally {
    saving.value = false
  }
}

async function eliminar(idReservaSalon) {
  const confirmResult = await swalConfirmDelete('esta reserva')
  if (!confirmResult.isConfirmed) {
    return
  }

  errorMessage.value = ''

  try {
    await ReservasService.eliminar(idReservaSalon)
    await cargarReservas()
    await swalSuccess('Reserva eliminada correctamente.')
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible eliminar la reserva.'
    await swalError(errorMessage.value)
  }
}

function goPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

onMounted(() => {
  Promise.all([cargarReservas(), cargarCatalogos()])
})
</script>

<template>
  <div class="res-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">Reservas de salon</h2>
        <p class="page-sub">Vista conectada con Spring Boot para el modulo de reservas.</p>
      </div>
      <button class="create-btn" @click="openCrear">
        <span class="icon">add_circle</span>
        Nueva reserva
      </button>
    </div>

    <div class="metrics-grid">
      <div class="metric-card" style="border-left-color:#00355f">
        <p class="metric-lbl">Total</p>
        <h3 class="metric-val">{{ metrics.total }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#f59e0b">
        <p class="metric-lbl">Pendientes</p>
        <h3 class="metric-val">{{ metrics.pendientes }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#27ae60">
        <p class="metric-lbl">Confirmadas</p>
        <h3 class="metric-val">{{ metrics.confirmadas }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#64748b">
        <p class="metric-lbl">Canceladas</p>
        <h3 class="metric-val">{{ metrics.canceladas }}</h3>
      </div>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-wrap">
            <span class="icon search-ic">search</span>
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="Buscar por salon, residente, apto, torre o fecha"
              @input="currentPage = 1"
            />
          </div>
          <div class="filter-group">
            <label class="filter-lbl">Estado</label>
            <select v-model="filterEstado" class="filter-select" @change="currentPage = 1">
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Salon</th>
              <th>Apartamento</th>
              <th>Torre</th>
              <th>Residente</th>
              <th>Fecha</th>
              <th>Hora inicio</th>
              <th>Hora fin</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="empty-state">Cargando reservas...</td>
            </tr>
            <tr v-else-if="paginated.length === 0">
              <td colspan="9" class="empty-state">No hay reservas para mostrar.</td>
            </tr>
            <tr v-for="item in paginated" v-else :key="item.idReservaSalon" class="data-row">
              <td>{{ getSalonNombre(item) }}</td>
              <td>{{ getApartamentoNumero(item) }}</td>
              <td>{{ getTorreNombre(item) }}</td>
              <td>{{ getResidenteNombre(item) }}</td>
              <td>{{ item.fecha }}</td>
              <td>{{ item.horaInicio }}</td>
              <td>{{ item.horaFin }}</td>
              <td>
                <span
                  class="estado-badge"
                  :style="{
                    background: estadoConfig[item.estado]?.bg || '#f1f5f9',
                    color: estadoConfig[item.estado]?.color || '#475569',
                    borderColor: estadoConfig[item.estado]?.border || '#e2e8f0',
                  }"
                >
                  <span class="estado-dot" :style="{ background: estadoConfig[item.estado]?.dot || '#94a3b8' }"></span>
                  {{ estadoConfig[item.estado]?.label || item.estado }}
                </span>
              </td>
              <td class="text-right">
                <div class="actions-row">
                  <button class="action-btn view" title="Ver" @click="openVer(item)">
                    <span class="icon">visibility</span>
                  </button>
                  <button class="action-btn edit" title="Editar" @click="openEditar(item)">
                    <span class="icon">edit</span>
                  </button>
                  <button class="action-btn delete" title="Eliminar" @click="eliminar(item.idReservaSalon)">
                    <span class="icon">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <span class="pagination-info">
          Mostrando {{ filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filtered.length) }}
          de {{ filtered.length }} reservas
        </span>
        <div class="pagination-controls">
          <button class="page-btn arrow" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
            <span class="icon">chevron_left</span>
          </button>
          <template v-for="(p, i) in visiblePages" :key="p">
            <span v-if="i > 0 && p - visiblePages[i - 1] > 1" class="page-ellipsis">...</span>
            <button class="page-btn" :class="{ active: p === currentPage }" @click="goPage(p)">{{ p }}</button>
          </template>
          <button class="page-btn arrow" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">
            <span class="icon">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon">
                  <span class="icon">event_available</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ modalMode === 'crear' ? 'Nueva reserva' : modalMode === 'editar' ? 'Editar reserva' : 'Detalle reserva' }}
                  </h3>
                  <p class="modal-sub">
                    {{ modalMode === 'ver' ? 'Información detallada de la reserva.' : 'Complete los campos de la entidad.' }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal"><span class="icon">close</span></button>
            </div>

            <div v-if="modalMode === 'ver' && selectedReserva" class="modal-body">
              <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Salon comunal</span><p class="detail-value">{{ getSalonNombre(selectedReserva) }}</p></div>
                <div class="detail-item"><span class="detail-label">Apartamento</span><p class="detail-value">{{ getApartamentoNumero(selectedReserva) }}</p></div>
                <div class="detail-item"><span class="detail-label">Torre</span><p class="detail-value">{{ getTorreNombre(selectedReserva) }}</p></div>
                <div class="detail-item"><span class="detail-label">Residente</span><p class="detail-value">{{ getResidenteNombre(selectedReserva) }}</p></div>
                <div class="detail-item"><span class="detail-label">Fecha</span><p class="detail-value">{{ selectedReserva.fecha }}</p></div>
                <div class="detail-item"><span class="detail-label">Hora inicio</span><p class="detail-value">{{ selectedReserva.horaInicio }}</p></div>
                <div class="detail-item"><span class="detail-label">Hora fin</span><p class="detail-value">{{ selectedReserva.horaFin }}</p></div>
                <div class="detail-item full"><span class="detail-label">Estado</span><p class="detail-value">{{ estadoConfig[selectedReserva.estado]?.label || selectedReserva.estado }}</p></div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
                <button class="btn-primary" @click="openEditar(selectedReserva)">
                  <span class="icon">edit</span>
                  Editar
                </button>
              </div>
            </div>

            <div v-else class="modal-body">
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Salon comunal</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">meeting_room</span>
                    <input
                      v-model="salonSearch"
                      class="form-input"
                      type="text"
                      placeholder="Buscar salon"
                      @focus="openAutocomplete('salon')"
                      @blur="clearAutocomplete"
                      @input="onSalonInput"
                    />
                    <ul v-if="activeAutocomplete === 'salon' && filteredSalones.length" class="autocomplete-list">
                      <li
                        v-for="salon in filteredSalones"
                        :key="salon.idSalonComunal"
                        class="autocomplete-item"
                        @mousedown.prevent="selectSalon(salon)"
                      >
                        {{ getSalonLabel(salon) }}
                      </li>
                    </ul>
                  </div>
                </div>
                
                 <div class="form-field">
                  <label class="form-label">Torre</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">domain</span>
                    <input
                      v-model="torreSearch"
                      class="form-input"
                      type="text"
                      placeholder="Buscar torre"
                      @focus="openAutocomplete('torre')"
                      @blur="clearAutocomplete"
                      @input="onTorreInput"
                    />
                    <ul v-if="activeAutocomplete === 'torre' && filteredTorres.length" class="autocomplete-list">
                      <li
                        v-for="torre in filteredTorres"
                        :key="torre.idTorre ?? torre.id"
                        class="autocomplete-item"
                        @mousedown.prevent="selectTorre(torre)"
                      >
                        {{ getTorreLabel(torre) }}
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Apartamento</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">apartment</span>
                    <input
                      v-model="apartamentoSearch"
                      class="form-input"
                      type="text"
                      placeholder="Selecciona torre para ver apartamentos"
                      @focus="openAutocomplete('apartamento')"
                      @blur="clearAutocomplete"
                      @input="onApartamentoInput"
                    />
                    <ul v-if="activeAutocomplete === 'apartamento' && filteredApartamentos.length" class="autocomplete-list">
                      <li
                        v-for="apartamento in filteredApartamentos"
                        :key="apartamento.idApartamento"
                        class="autocomplete-item"
                        @mousedown.prevent="selectApartamento(apartamento)"
                      >
                        {{ getApartamentoLabel(apartamento) }}
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Residente</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">person</span>
                    <input
                      v-model="residenteSearch"
                      class="form-input"
                      type="text"
                      placeholder="Selecciona torre y apartamento"
                      @focus="openAutocomplete('residente')"
                      @blur="clearAutocomplete"
                      @input="onResidenteInput"
                    />
                    <ul v-if="activeAutocomplete === 'residente' && filteredResidentes.length" class="autocomplete-list">
                      <li
                        v-for="residente in filteredResidentes"
                        :key="residente.idResidente"
                        class="autocomplete-item"
                        @mousedown.prevent="selectResidente(residente)"
                      >
                        {{ getResidenteLabel(residente) }}
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Fecha</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">calendar_today</span>
                    <input v-model="form.fecha" class="form-input" type="date" />
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Estado</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">flag</span>
                    <select v-model="form.estado" class="form-input">
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Hora inicio</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">schedule</span>
                    <input v-model="form.horaInicio" class="form-input" type="time" />
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Hora fin</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">schedule</span>
                    <input v-model="form.horaFin" class="form-input" type="time" />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="saving" @click="guardar">
                  <span class="icon">{{ modalMode === 'crear' ? 'add_circle' : 'save' }}</span>
                  {{ saving ? 'Guardando...' : modalMode === 'crear' ? 'Crear reserva' : 'Guardar cambios' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

.res-view { display:flex; flex-direction:column; gap:1.75rem; font-family:'Plus Jakarta Sans',sans-serif; }

.page-header { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
.page-title  { font-size:1.875rem; font-weight:800; color:#00355f; letter-spacing:-0.04em; margin:0 0 0.25rem; line-height:1.15; }
.page-sub    { font-size:0.875rem; color:#64748b; margin:0; font-weight:500; }

.create-btn {
  display:flex; align-items:center; gap:0.5rem;
  background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:0.875rem; font-weight:700;
  border:none; border-radius:0.75rem; padding:0.75rem 1.25rem; cursor:pointer;
  box-shadow:0 4px 14px rgba(0,53,95,0.28);
}

.metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1.125rem; }
.metric-card {
  background:#fff; border-radius:1rem; padding:1.25rem;
  border-left:4px solid #00355f;
  box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 12px rgba(0,53,95,.05);
}
.metric-lbl { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:0 0 .25rem; }
.metric-val { font-size:1.75rem; font-weight:800; color:#00355f; margin:0; }

.table-card { background:#fff; border-radius:1.25rem; box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 16px rgba(0,53,95,.06); overflow:hidden; }

.filter-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.875rem; padding:1.125rem 1.5rem; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
.filter-left { display:flex; align-items:center; gap:.875rem; flex-wrap:wrap; }
.search-wrap { position:relative; }
.search-ic { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); font-size:16px; color:#94a3b8; pointer-events:none; }
.search-input {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.55rem .875rem .55rem 2.5rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a; width:300px;
}
.search-input:focus { outline:none; background:#fff; border-color:#0f4c81; }

.filter-group { display:flex; align-items:center; gap:.5rem; }
.filter-lbl { font-size:.75rem; font-weight:700; color:#64748b; }
.filter-select {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.5rem .75rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; color:#334155;
}
.filter-select:focus { outline:none; border-color:#0f4c81; background-color:#fff; }

.alert { margin:1rem 1.25rem 0; border-radius:.75rem; padding:.75rem .9rem; font-size:.8125rem; font-weight:600; }
.alert.error { background:#ffebee; color:#9f1239; border:1px solid #fecdd3; }

.table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
.data-table { width:100%; min-width:1000px; border-collapse:collapse; text-align:left; }
.data-table thead tr { background:#f8fafc; }
.data-table th { padding:.875rem 1rem; font-size:.625rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
.data-row td { padding:.875rem 1rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.data-row:last-child td { border-bottom:none; }
.data-row:hover td { background:#f8fafc; }
.text-right { text-align:right; }

.estado-badge { display:inline-flex; align-items:center; gap:.375rem; padding:.25rem .75rem; border-radius:99px; font-size:.625rem; font-weight:800; border:1px solid transparent; white-space:nowrap; }
.estado-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

.actions-row { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.action-btn { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:.5rem; cursor:pointer; color:#94a3b8; }
.action-btn.view:hover { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.edit:hover { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.delete:hover { background:rgba(186,26,26,.08); color:#ba1a1a; }

.empty-state { text-align:center; padding:3rem 1rem; color:#94a3b8; }

.pagination-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.75rem; padding:.875rem 1.5rem; background:#fafbfc; border-top:1px solid #f1f5f9; }
.pagination-info { font-size:.8rem; font-weight:500; color:#64748b; }
.pagination-controls { display:flex; align-items:center; gap:.375rem; }
.page-btn { width:2.25rem; height:2.25rem; display:flex; align-items:center; justify-content:center; border:1.5px solid #e2e8f0; border-radius:.625rem; background:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.8rem; font-weight:700; color:#475569; cursor:pointer; }
.page-btn:hover:not(:disabled) { background:#f1f5f9; border-color:#94a3b8; color:#00355f; }
.page-btn.active { background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; border-color:transparent; }
.page-btn:disabled { opacity:.4; cursor:not-allowed; }
.page-btn.arrow .icon { font-size:18px; }
.page-ellipsis { color:#94a3b8; font-weight:700; padding:0 .25rem; }

.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(4px); }
.modal-box { background:#fff; border-radius:1.5rem; width:100%; max-width:680px; box-shadow:0 24px 64px rgba(0,53,95,.2); overflow:hidden; }
.modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.5rem 1.75rem 1.25rem; border-bottom:1px solid #f1f5f9; }
.modal-title-row { display:flex; align-items:center; gap:.875rem; }
.modal-title-icon { width:2.5rem; height:2.5rem; border-radius:.75rem; background:linear-gradient(135deg,#00355f,#0f4c81); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.modal-title-icon .icon { font-size:20px; color:#fff; }
.modal-title { font-size:1.125rem; font-weight:800; color:#0d1b2a; margin:0 0 .2rem; }
.modal-sub { font-size:.775rem; color:#64748b; margin:0; font-weight:500; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border:none; border-radius:.5rem; cursor:pointer; color:#64748b; }
.modal-body { padding:1.5rem 1.75rem; }

.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem; }
.detail-item { display:flex; flex-direction:column; gap:.25rem; }
.detail-item.full { grid-column:1/-1; }
.detail-label { display:block; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; }
.detail-value { font-size:.9rem; font-weight:700; color:#0d1b2a; margin:0; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem; }
.form-field { display:flex; flex-direction:column; gap:.375rem; }
.form-label { font-size:.6875rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#374151; }
.form-input-wrap { position:relative; display:flex; align-items:center; }
.autocomplete-wrap { position:relative; }
.form-icon { position:absolute; left:.75rem; font-size:16px; color:#94a3b8; pointer-events:none; z-index:1; }
.form-input {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:.75rem;
  padding:.7rem .875rem .7rem 2.5rem; font-size:.875rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a;
}
.form-input:focus { outline:none; background:#fff; border-color:#0f4c81; box-shadow:0 0 0 3px rgba(15,76,129,.12); }

.autocomplete-list {
  position:absolute;
  z-index:20;
  top:calc(100% + .35rem);
  left:0;
  right:0;
  margin:0;
  padding:.25rem;
  list-style:none;
  max-height:220px;
  overflow-y:auto;
  background:#fff;
  border:1px solid #e2e8f0;
  border-radius:.625rem;
  box-shadow:0 4px 12px rgba(15,76,129,.16);
}

.autocomplete-item {
  padding:.65rem .75rem;
  border-radius:.5rem;
  font-size:.8125rem;
  font-weight:500;
  color:#334155;
  cursor:pointer;
  transition:background .15s ease,color .15s ease;
}

.autocomplete-item:hover {
  background:#0f4c81;
  color:#fff;
}

.autocomplete-item:first-child {
  border-top-left-radius:.5rem;
  border-top-right-radius:.5rem;
}

.autocomplete-item:last-child {
  border-bottom-left-radius:.5rem;
  border-bottom-right-radius:.5rem;
}

.modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; padding-top:1.25rem; border-top:1px solid #f1f5f9; }
.btn-secondary { background:#f1f5f9; color:#475569; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; }
.btn-primary { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; }
.btn-primary:disabled { opacity:.6; cursor:not-allowed; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s ease,transform .2s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-box,.modal-leave-to .modal-box { transform:scale(.96) translateY(8px); }

.icon {
  font-family:'Material Symbols Outlined';
  font-weight:normal;
  font-style:normal;
  font-size:24px;
  line-height:1;
  letter-spacing:normal;
  text-transform:none;
  display:inline-block;
  white-space:nowrap;
  direction:ltr;
  font-feature-settings:'liga';
  -webkit-font-feature-settings:'liga';
  -webkit-font-smoothing:antialiased;
  font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
}

@media (max-width: 900px) {
  .page-header { align-items:flex-start; }
  .create-btn { width:100%; justify-content:center; }
  .metrics-grid { grid-template-columns:1fr; }
  .filter-bar { padding:1rem; }
  .filter-left { width:100%; }
  .search-wrap { width:100%; }
  .search-input { width:100%; }
  .filter-group { width:100%; }
  .filter-select { width:100%; }
  .table-scroll { overflow:visible; margin:0; padding:0; }
  .data-table { min-width:0; width:100%; }
  .data-table thead { display:none; }
  .data-table tbody { display:grid; gap:.9rem; padding:.85rem; }
  .data-row {
    position:relative;
    display:block;
    overflow:hidden;
    background:linear-gradient(180deg,#ffffff,#fbfdff);
    border:1px solid #dbe5f0;
    border-radius:1rem;
    box-shadow:0 10px 24px rgba(15,23,42,.08);
  }
  .data-row::before {
    content:'';
    position:absolute;
    top:0;
    left:0;
    right:0;
    height:3px;
    background:linear-gradient(90deg,#0f4c81,#2f74ad);
  }
  .data-row td {
    display:grid;
    grid-template-columns:minmax(100px,40%) 1fr;
    align-items:start;
    gap:.55rem;
    padding:.68rem .82rem;
    border-bottom:1px dashed #e6edf5;
  }
  .data-row td::before {
    display:inline-flex;
    align-items:center;
    width:fit-content;
    margin:0;
    padding:.18rem .5rem;
    border-radius:999px;
    background:#eef3f8;
    color:#5b6b80;
    font-size:.58rem;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .data-row td:nth-child(1)::before { content:'Salon'; }
  .data-row td:nth-child(2)::before { content:'Apartamento'; }
  .data-row td:nth-child(3)::before { content:'Torre'; }
  .data-row td:nth-child(4)::before { content:'Residente'; }
  .data-row td:nth-child(5)::before { content:'Fecha'; }
  .data-row td:nth-child(6)::before { content:'Hora inicio'; }
  .data-row td:nth-child(7)::before { content:'Hora fin'; }
  .data-row td:nth-child(8)::before { content:'Estado'; }
  .data-row td:nth-child(9)::before { content:'Acciones'; }
  .data-row td:last-child { border-bottom:none; }
  .data-row td.text-right { text-align:left; }
  .actions-row { justify-content:flex-start; flex-wrap:wrap; gap:.4rem; }
  .action-btn { width:2.15rem; height:2.15rem; border:1px solid #e2e8f0; background:#fff; }
  .data-table tbody tr:not(.data-row) td { display:block; }
  .pagination-bar { padding:.875rem 1rem; flex-direction:column; align-items:flex-start; }
  .pagination-controls { width:100%; overflow-x:auto; padding-bottom:.2rem; }
  .modal-overlay { padding:.75rem; }
  .modal-header, .modal-body { padding:1rem; }
  .form-grid { grid-template-columns:1fr; }
  .detail-grid { grid-template-columns:1fr; }
}
</style>
