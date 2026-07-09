<script setup>
import { computed, onMounted, ref } from 'vue'
import SalonComunalService from '@/services/SalonComunal.Service'
import { swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert'

const searchQuery = ref('')
const currentPage = ref(1)
const perPage = 8

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const showModal = ref(false)
const modalMode = ref('crear')
const selectedSalon = ref(null)

const salones = ref([])

const emptyForm = () => ({
  idSalonComunal: null,
  nombre: '',
  capacidad: '',
  descripcion: '',
})

const form = ref(emptyForm())

const metrics = computed(() => {
  const total = salones.value.length
  const capacidadTotal = salones.value.reduce((acc, item) => acc + (Number(item.capacidad) || 0), 0)

  return {
    total,
    capacidadTotal,
    capacidadPromedio: total ? Math.round(capacidadTotal / total) : 0,
  }
})

const filtered = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()
  if (!term) {
    return salones.value
  }

  return salones.value.filter((item) => {
    const nombre = (item.nombre || '').toLowerCase()
    const id = String(item.idSalonComunal ?? '')
    return nombre.includes(term) || id.includes(term)
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

async function cargarSalones() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await SalonComunalService.listar()
    salones.value = Array.isArray(data) ? data : []
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    salones.value = []
    errorMessage.value = error?.message || 'No fue posible cargar los salones comunales.'
  } finally {
    loading.value = false
  }
}

function openCrear() {
  form.value = emptyForm()
  modalMode.value = 'crear'
  showModal.value = true
}

function openEditar(item) {
  form.value = {
    idSalonComunal: item.idSalonComunal,
    nombre: item.nombre || '',
    capacidad: item.capacidad ?? '',
    descripcion: item.descripcion || '',
  }
  modalMode.value = 'editar'
  showModal.value = true
}

function openVer(item) {
  selectedSalon.value = item
  modalMode.value = 'ver'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function guardar() {
  const nombre = form.value.nombre?.trim()
  const capacidad = Number(form.value.capacidad)

  if (!nombre) {
    errorMessage.value = 'El nombre es obligatorio.'
    await swalError(errorMessage.value)
    return
  }

  if (!Number.isInteger(capacidad) || capacidad <= 0) {
    errorMessage.value = 'La capacidad debe ser un numero entero mayor a 0.'
    await swalError(errorMessage.value)
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const payload = {
      nombre,
      capacidad,
      descripcion: form.value.descripcion?.trim() || '',
    }

    if (modalMode.value === 'crear') {
      await SalonComunalService.crear(payload)
    } else {
      await SalonComunalService.actualizar(form.value.idSalonComunal, payload)
    }

    closeModal()
    await cargarSalones()
    swalSuccess(modalMode.value === 'crear' ? 'Salon comunal creado correctamente.' : 'Salon comunal actualizado correctamente.')
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible guardar el salon comunal.'
    await swalError(errorMessage.value)
  } finally {
    saving.value = false
  }
}

async function eliminar(idSalonComunal) {
  const confirmResult = await swalConfirmDelete('este salon comunal')
  if (!confirmResult.isConfirmed) {
    return
  }

  errorMessage.value = ''

  try {
    await SalonComunalService.eliminar(idSalonComunal)
    await cargarSalones()
    await swalSuccess('Salon comunal eliminado correctamente.')
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible eliminar el salon comunal.'
    await swalError(errorMessage.value)
  }
}

function goPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

onMounted(() => {
  cargarSalones()
})
</script>

<template>
  <div class="salon-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">Salones comunales</h2>
        <p class="page-sub">Gestion de salones segun la entidad del sistema.</p>
      </div>
      <button class="create-btn" @click="openCrear">
        <span class="icon">add_circle</span>
        Nuevo salon
      </button>
    </div>

    <div class="metrics-grid">
      <div class="metric-card" style="border-left-color:#00355f">
        <p class="metric-lbl">Total salones</p>
        <h3 class="metric-val">{{ metrics.total }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#3dd197">
        <p class="metric-lbl">Capacidad total</p>
        <h3 class="metric-val">{{ metrics.capacidadTotal }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#48626e">
        <p class="metric-lbl">Promedio</p>
        <h3 class="metric-val">{{ metrics.capacidadPromedio }}</h3>
      </div>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <h4 class="table-title">Listado de salones comunales</h4>
        <div class="search-wrap">
          <span class="icon search-ic">search</span>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Buscar por nombre o ID..."
            @input="currentPage = 1"
          />
        </div>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Capacidad</th>
              <th>Descripcion</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="empty-state">Cargando salones comunales...</td>
            </tr>
            <tr v-else-if="paginated.length === 0">
              <td colspan="4" class="empty-state">No hay registros para mostrar.</td>
            </tr>
            <tr v-for="item in paginated" v-else :key="item.idSalonComunal" class="data-row">
              <td>
                <span class="name-cell">{{ item.nombre }}</span>
              </td>
              <td>{{ item.capacidad }}</td>
              <td>
                <p class="td-desc">{{ item.descripcion || 'Sin descripcion' }}</p>
              </td>
              <td class="text-right">
                <div class="actions-row">
                  <button class="action-btn view" title="Ver detalle" @click="openVer(item)">
                    <span class="icon">visibility</span>
                  </button>
                  <button class="action-btn edit" title="Editar" @click="openEditar(item)">
                    <span class="icon">edit</span>
                  </button>
                  <button class="action-btn delete" title="Eliminar" @click="eliminar(item.idSalonComunal)">
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
          Mostrando {{ filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1 }}–
          {{ Math.min(currentPage * perPage, filtered.length) }} de {{ filtered.length }}
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
                  <span class="icon">{{ modalMode === 'ver' ? 'meeting_room' : modalMode === 'crear' ? 'add_circle' : 'edit' }}</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{
                      modalMode === 'crear'
                        ? 'Nuevo salon comunal'
                        : modalMode === 'editar'
                          ? 'Editar salon comunal'
                          : 'Detalle del salon'
                    }}
                  </h3>
                  <p class="modal-sub">
                    {{
                      modalMode === 'ver'
                        ? 'Información detallada del salón.'
                        : 'Complete los campos requeridos por la entidad.'
                    }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal"><span class="icon">close</span></button>
            </div>

            <div v-if="modalMode === 'ver' && selectedSalon" class="modal-body detail-modal-body">
              <section class="detail-hero">
                <div class="detail-hero-icon">
                  <span class="icon">meeting_room</span>
                </div>
                <div>
                  <p class="detail-hero-kicker">Salón comunal #{{ selectedSalon.idSalonComunal }}</p>
                  <h4 class="detail-hero-title">{{ selectedSalon.nombre }}</h4>
                  <p class="detail-hero-sub">Capacidad para {{ selectedSalon.capacidad }} personas</p>
                </div>
                <div class="detail-hero-meta">
                  <span class="detail-meta-pill">
                    <span class="icon">groups</span>
                    {{ selectedSalon.capacidad }} cupos
                  </span>
                </div>
              </section>

              <div class="detail-card-grid">
                <article class="detail-card">
                  <p class="detail-card-title"><span class="icon">info</span> Datos generales</p>
                  <div class="detail-grid compact-grid single-column">
                    <div class="detail-item full">
                      <span class="detail-label">Nombre</span>
                      <p class="detail-value">{{ selectedSalon.nombre }}</p>
                    </div>
                    <div class="detail-item full">
                      <span class="detail-label">Capacidad</span>
                      <p class="detail-value">{{ selectedSalon.capacidad }}</p>
                    </div>
                  </div>
                </article>

                <article class="detail-card detail-card-alert">
                  <p class="detail-card-title"><span class="icon">description</span> Descripción</p>
                  <p v-if="selectedSalon.descripcion" class="detail-value">{{ selectedSalon.descripcion }}</p>
                  <p v-else class="empty-detail-msg">Sin descripcion.</p>
                </article>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
                <button class="btn-primary" @click="openEditar(selectedSalon)">
                  <span class="icon">edit</span>
                  Editar
                </button>
              </div>
            </div>

            <div v-else class="modal-body">
              <div class="form-grid">
                <div class="form-field full">
                  <label class="form-label">Nombre</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">meeting_room</span>
                    <input v-model="form.nombre" class="form-input" placeholder="Ej. Salon principal" />
                  </div>
                </div>

                <div class="form-field full">
                  <label class="form-label">Capacidad</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">groups</span>
                    <input
                      v-model="form.capacidad"
                      class="form-input"
                      placeholder="Ej. 50"
                      type="number"
                      min="1"
                    />
                  </div>
                </div>

                <div class="form-field full">
                  <label class="form-label">Descripcion</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon" style="top:.75rem;align-self:flex-start">description</span>
                    <textarea
                      v-model="form.descripcion"
                      class="form-input form-textarea"
                      rows="3"
                      placeholder="Detalle del salon comunal"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="saving" @click="guardar">
                  <span class="icon">{{ modalMode === 'crear' ? 'add_circle' : 'save' }}</span>
                  {{ saving ? 'Guardando...' : modalMode === 'crear' ? 'Crear' : 'Actualizar' }}
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

.salon-view { display:flex; flex-direction:column; gap:1.25rem; font-family:'Plus Jakarta Sans',sans-serif; }

.page-header { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
.page-title  { font-size:1.75rem; font-weight:800; color:#00355f; margin:0 0 .25rem; line-height:1.15; }
.page-sub    { font-size:.875rem; color:#64748b; margin:0; font-weight:500; }

.create-btn {
  display:flex; align-items:center; gap:.5rem;
  background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700;
  border:none; border-radius:.75rem; padding:.75rem 1.25rem; cursor:pointer;
}

.metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1rem; }
.metric-card {
  background:#fff; border-radius:1rem; padding:1rem;
  border-left:4px solid #00355f;
  box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 12px rgba(0,53,95,.05);
}
.metric-lbl { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:0 0 .25rem; }
.metric-val { font-size:1.5rem; font-weight:800; color:#00355f; margin:0; }

.table-card { background:#fff; border-radius:1rem; box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 16px rgba(0,53,95,.06); overflow:hidden; }
.filter-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.875rem; padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
.table-title { font-size:1rem; font-weight:800; color:#00355f; margin:0; }

.search-wrap { position:relative; }
.search-ic { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); font-size:16px; color:#94a3b8; pointer-events:none; }
.search-input {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.55rem .875rem .55rem 2.5rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a; width:240px;
}
.search-input:focus { outline:none; background:#fff; border-color:#0f4c81; }

.alert { margin:1rem 1.25rem 0; border-radius:.75rem; padding:.75rem .9rem; font-size:.8125rem; font-weight:600; }
.alert.error { background:#ffebee; color:#9f1239; border:1px solid #fecdd3; }

.table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
.data-table { width:100%; min-width:760px; border-collapse:collapse; text-align:left; }
.data-table thead tr { background:#f8fafc; }
.data-table th { padding:.875rem 1rem; font-size:.625rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
.data-row td { padding:.875rem 1rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.data-row:hover td { background:#f8fafc; }
.name-cell { font-size:.875rem; font-weight:700; color:#00355f; }
.td-desc { font-size:.78rem; color:#64748b; max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0; }
.text-right { text-align:right; }

.actions-row { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.action-btn { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:.5rem; cursor:pointer; color:#94a3b8; }
.action-btn.view:hover { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.edit:hover { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.delete:hover { background:rgba(186,26,26,.08); color:#ba1a1a; }

.empty-state { text-align:center; padding:2rem 1rem; color:#94a3b8; }

.pagination-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.75rem; padding:.875rem 1.25rem; background:#fafbfc; border-top:1px solid #f1f5f9; }
.pagination-info { font-size:.8rem; font-weight:500; color:#64748b; }
.pagination-controls { display:flex; align-items:center; gap:.375rem; }
.page-btn { width:2.25rem; height:2.25rem; display:flex; align-items:center; justify-content:center; border:1.5px solid #e2e8f0; border-radius:.625rem; background:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.8rem; font-weight:700; color:#475569; cursor:pointer; }
.page-btn:hover:not(:disabled) { background:#f1f5f9; border-color:#94a3b8; color:#00355f; }
.page-btn.active { background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; border-color:transparent; }
.page-btn:disabled { opacity:.4; cursor:not-allowed; }
.page-btn.arrow .icon { font-size:18px; }
.page-ellipsis { color:#94a3b8; font-weight:700; padding:0 .25rem; }

.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(4px); }
.modal-box { background:#fff; border-radius:1.25rem; width:100%; max-width:560px; box-shadow:0 24px 64px rgba(0,53,95,.2); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }
.modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.25rem 1.5rem 1rem; border-bottom:1px solid #f1f5f9; }
.modal-title-row { display:flex; align-items:center; gap:.875rem; }
.modal-title-icon { width:2.5rem; height:2.5rem; border-radius:.75rem; background:linear-gradient(135deg,#00355f,#0f4c81); display:flex; align-items:center; justify-content:center; }
.modal-title-icon .icon { font-size:20px; color:#fff; }
.modal-title { font-size:1.05rem; font-weight:800; color:#0d1b2a; margin:0 0 .2rem; }
.modal-sub { font-size:.775rem; color:#64748b; margin:0; font-weight:500; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border:none; border-radius:.5rem; cursor:pointer; color:#64748b; }
.modal-body { padding:1.25rem 1.5rem; overflow-y:auto; }

.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.detail-item { display:flex; flex-direction:column; gap:.25rem; }
.detail-item.full { grid-column:1/-1; }
.detail-label { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; }
.detail-value { margin:0; color:#334155; font-size:.9rem; font-weight:600; }

.form-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem; }
.form-field { display:flex; flex-direction:column; gap:.375rem; }
.form-field.full { grid-column:1/-1; }
.form-label { font-size:.6875rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#374151; }
.form-input-wrap { position:relative; display:flex; align-items:center; }
.form-icon { position:absolute; left:.75rem; font-size:16px; color:#94a3b8; pointer-events:none; z-index:1; }
.form-input {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:.75rem;
  padding:.7rem .875rem .7rem 2.5rem; font-size:.875rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a;
}
.form-input:focus { outline:none; background:#fff; border-color:#0f4c81; }
.form-textarea { resize:vertical; min-height:80px; }

.modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; padding-top:1rem; border-top:1px solid #f1f5f9; }
.btn-secondary { background:#f1f5f9; color:#475569; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; }
.btn-primary { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; }
.btn-primary:disabled { opacity:.6; cursor:not-allowed; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s ease; }
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

@media (max-width: 768px) {
  .page-header { align-items:flex-start; }
  .create-btn { width:100%; justify-content:center; }
  .metrics-grid { grid-template-columns:1fr; }
  .filter-bar { padding:.9rem 1rem; }
  .table-title { width:100%; }
  .search-wrap { width:100%; }
  .search-input { width:100%; }
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
  .data-row td:nth-child(1)::before { content:'Nombre'; }
  .data-row td:nth-child(2)::before { content:'Capacidad'; }
  .data-row td:nth-child(3)::before { content:'Descripcion'; }
  .data-row td:nth-child(4)::before { content:'Acciones'; }
  .data-row td:last-child { border-bottom:none; }
  .data-row td.text-right { text-align:left; }
  .actions-row { justify-content:flex-start; flex-wrap:wrap; gap:.4rem; }
  .action-btn { width:2.15rem; height:2.15rem; border:1px solid #e2e8f0; background:#fff; }
  .data-table tbody tr:not(.data-row) td { display:block; }
  .pagination-bar { padding:.875rem 1rem; flex-direction:column; align-items:flex-start; }
  .pagination-controls { width:100%; overflow-x:auto; padding-bottom:.2rem; }
  .modal-overlay { padding:.75rem; }
  .modal-header, .modal-body { padding:1rem; }
  .detail-grid { grid-template-columns:1fr; }
  .form-grid { grid-template-columns:1fr; }
}
</style>
