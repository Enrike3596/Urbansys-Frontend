<script setup>
import { ref, computed, onMounted } from 'vue';
import ApartamentoService from '../../services/Apartamento.Service';
import TorreService from '../../services/Torre.Service';
import { swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert';
/* ── Filtros ── */
const filterTorreId  = ref('todas');
const filterEstado = ref('todos');
const searchQuery  = ref('');
const currentPage  = ref(1);
const perPage      = 8;

/* ── Modal ── */
const showModal    = ref(false);
const modalMode    = ref('crear'); // 'crear' | 'editar' | 'ver'
const selectedApt  = ref(null);
const isLoadingApartamentos = ref(false);
const isLoadingTorres = ref(false);
const isSaving = ref(false);
const formError = ref('');

const emptyForm = () => ({
  idApartamento: '',
  numeroApartamento: '',
  piso: '',
  torreId: '',
  estado: 'disponible',
});

const form = ref(emptyForm());
const torres = ref([]);

const apartments = ref([]);

const getTorreLabel = (torreId) => {
  const torre = torres.value.find((t) => Number(t.idTorre) === Number(torreId));
  if (!torre) {
    return torreId ? `Torre #${torreId}` : 'Sin torre';
  }

  return torre.nombre ? torre.nombre : `Torre #${torre.idTorre}`;
};

/* ── Métricas ── */
const metrics = computed(() => ({
  total:         apartments.value.length,
  ocupados:      apartments.value.filter(a => a.estado === 'ocupado').length,
  disponibles:   apartments.value.filter(a => a.estado === 'disponible').length,
}));

/* ── Tabla filtrada + paginada ── */
const filtered = computed(() => {
  return apartments.value.filter(a => {
    const matchTorre  = filterTorreId.value === 'todas' || Number(a.torreId) === Number(filterTorreId.value);
    const matchEstado = filterEstado.value === 'todos'  || a.estado === filterEstado.value;
    const matchSearch = !searchQuery.value ||
      String(a.idApartamento).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      String(a.numeroApartamento).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      String(a.piso).includes(searchQuery.value) ||
      String(a.torreId).includes(searchQuery.value);
    return matchTorre && matchEstado && matchSearch;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filtered.value.slice(start, start + perPage);
});

const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || Math.abs(i - currentPage.value) <= 1) {
      pages.push(i);
    }
  }
  return pages;
});

/* ── Helpers de estado ── */
const estadoConfig = {
  ocupado:       { label: 'Ocupado',       bg: '#d1fae5', color: '#065f46', dot: '#27ae60' },
  disponible:    { label: 'Disponible',    bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
};

const cargarApartamentos = async () => {
  isLoadingApartamentos.value = true;
  try {
    apartments.value = await ApartamentoService.listar();
  } catch (error) {
    console.error('Error cargando apartamentos:', error);
    apartments.value = [];
  } finally {
    isLoadingApartamentos.value = false;
  }
};

const cargarTorres = async () => {
  isLoadingTorres.value = true;
  try {
    torres.value = await TorreService.listar();
  } catch (error) {
    console.error('Error cargando torres:', error);
    torres.value = [];
  } finally {
    isLoadingTorres.value = false;
  }
};

/* ── Acciones ── */
const openCrear = () => {
  formError.value = '';
  form.value  = emptyForm();
  modalMode.value = 'crear';
  showModal.value = true;
};

const openEditar = (apt) => {
  formError.value = '';
  form.value  = {
    idApartamento: apt.idApartamento,
    numeroApartamento: apt.numeroApartamento,
    piso: apt.piso,
    torreId: apt.torreId,
    estado: apt.estado || 'disponible',
  };
  modalMode.value = 'editar';
  showModal.value = true;
};

const openVer = (apt) => {
  selectedApt.value = apt;
  modalMode.value   = 'ver';
  showModal.value   = true;
};

const closeModal = () => { showModal.value = false; formError.value = ''; };

const guardar = async () => {
  formError.value = '';

  const payload = {
    numeroApartamento: form.value.numeroApartamento?.trim() || '',
    piso: form.value.piso,
    torreId: form.value.torreId,
    estado: form.value.estado,
  };

  if (!payload.numeroApartamento || payload.piso == null || !payload.torreId || !payload.estado) {
    formError.value = 'Debes completar numero, piso, torre y estado.';
    await swalError(formError.value);
    return;
  }

  isSaving.value = true;
  try {
    if (modalMode.value === 'crear') {
      const creado = await ApartamentoService.crear(payload);
      apartments.value.unshift(creado);
    } else {
      const actualizado = await ApartamentoService.actualizar(form.value.idApartamento, payload);
      const idx = apartments.value.findIndex(a => a.idApartamento === form.value.idApartamento);
      if (idx !== -1) apartments.value[idx] = actualizado;
    }
    closeModal();
    swalSuccess(modalMode.value === 'crear' ? 'Apartamento creado correctamente.' : 'Apartamento actualizado correctamente.');
  } catch (error) {
    formError.value = error?.message || 'No fue posible guardar el apartamento.';
    await swalError(formError.value);
    console.error('Error guardando apartamento:', error);
  } finally {
    isSaving.value = false;
  }
};

const eliminar = async (id) => {
  const confirmResult = await swalConfirmDelete('este apartamento');
  if (!confirmResult.isConfirmed) {
    return;
  }

  try {
    await ApartamentoService.eliminar(id);
    apartments.value = apartments.value.filter(a => a.idApartamento !== id);
    await swalSuccess('Apartamento eliminado correctamente.');
  } catch (error) {
    await swalError(error?.message || 'No fue posible eliminar el apartamento.');
    console.error('Error eliminando apartamento:', error);
  }
};

/* ── Paginación ── */
const goPage = (p) => {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p;
};

onMounted(() => {
  cargarApartamentos();
  cargarTorres();
});
</script>

<template>
  <div class="apts-view">

      <!-- ── Encabezado ── -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Gestión de Apartamentos</h2>
          <p class="page-sub">Control centralizado de unidades habitacionales y residentes.</p>
        </div>
        <button class="create-btn" @click="openCrear">
          <span class="icon">add_circle</span>
          Crear Apartamento
        </button>
      </div>

      <!-- ── Métricas ── -->
      <div class="metrics-grid">
        <div class="metric-card" style="border-left-color:#00355f">
          <div class="metric-top">
            <div class="metric-icon" style="background:#d2e4ff">
              <span class="icon" style="color:#00355f">apartment</span>
            </div>
            <span class="metric-tag">TOTAL</span>
          </div>
          <h3 class="metric-val">{{ metrics.total }}</h3>
          <p class="metric-lbl">Unidades registradas</p>
        </div>
        <div class="metric-card" style="border-left-color:#27ae60">
          <div class="metric-top">
            <div class="metric-icon" style="background:#d1fae5">
              <span class="icon" style="color:#065f46">done_all</span>
            </div>
            <span class="metric-tag">OCUPADOS</span>
          </div>
          <h3 class="metric-val">{{ metrics.ocupados }}</h3>
          <p class="metric-lbl">{{ ((metrics.ocupados / metrics.total) * 100).toFixed(1) }}% Ocupación</p>
        </div>
        <div class="metric-card" style="border-left-color:#3b82f6">
          <div class="metric-top">
            <div class="metric-icon" style="background:#dbeafe">
              <span class="icon" style="color:#1e40af">event_available</span>
            </div>
            <span class="metric-tag">DISPONIBLES</span>
          </div>
          <h3 class="metric-val">{{ metrics.disponibles }}</h3>
          <p class="metric-lbl">Listos para entrega</p>
        </div>
        <div class="metric-card" style="border-left-color:#ba1a1a">
          <div class="metric-top">
            <div class="metric-icon" style="background:#ffdad6">
              <span class="icon" style="color:#ba1a1a">construction</span>
            </div>
            <span class="metric-tag">TORRES ASIGNADAS</span>
          </div>
          <h3 class="metric-val">{{ new Set(apartments.map(a => a.torreId)).size }}</h3>
          <p class="metric-lbl">Con apartamentos registrados</p>
        </div>
      </div>

      <!-- ── Tabla ── -->
      <div class="table-card">

        <!-- Filtros -->
        <div class="filter-bar">
          <div class="filter-left">
            <!-- Búsqueda -->
            <div class="search-wrap">
              <span class="icon search-ic">search</span>
              <input v-model="searchQuery" class="search-input" placeholder="Buscar por ID, número o torre…" type="text" @input="currentPage = 1"/>
            </div>

            <div class="filter-group">
              <label class="filter-lbl">Torre</label>
              <select v-model="filterTorreId" class="filter-select" @change="currentPage = 1">
                <option value="todas">Todas</option>
                <option v-for="torre in torres" :key="torre.idTorre" :value="torre.idTorre">
                  {{ torre.nombre }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-lbl">Estado</label>
              <select v-model="filterEstado" class="filter-select" @change="currentPage = 1">
                <option value="todos">Todos</option>
                <option value="ocupado">Ocupado</option>
                <option value="disponible">Disponible</option>
              </select>
            </div>
          </div>

          <button class="advanced-btn">
            <span class="icon">filter_list</span>
            Filtros Avanzados
          </button>
        </div>

        <!-- Tabla de datos -->
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Apartamento</th>
                <th>Piso</th>
                <th>Torre</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apt in paginated" :key="apt.idApartamento" class="data-row">
                <!-- Número -->
                <td>
                  <div class="apt-num-cell">
                    <div class="apt-icon">
                      <span class="icon">door_front</span>
                    </div>
                    <span class="apt-num">{{ apt.numeroApartamento }}</span>
                  </div>
                </td>

                <!-- Piso -->
                <td class="td-piso">Piso {{ apt.piso }}</td>

                <!-- Torre -->
                <td>
                  <span class="torre-badge">{{ apt.torreId }}</span>
                </td>

                <!-- Estado -->
                <td>
                  <span
                    class="estado-badge"
                    :style="{
                      background: estadoConfig[apt.estado]?.bg || '#f1f5f9',
                      color: estadoConfig[apt.estado]?.color || '#475569',
                    }"
                  >
                    <span
                      class="estado-dot"
                      :style="{ background: estadoConfig[apt.estado]?.dot || '#94a3b8' }"
                    ></span>
                    {{ (estadoConfig[apt.estado]?.label || apt.estado || 'SIN ESTADO').toUpperCase() }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="text-right">
                  <div class="actions-row">
                    <button class="action-btn view" title="Ver detalles" @click="openVer(apt)">
                      <span class="icon">visibility</span>
                    </button>
                    <button class="action-btn edit" title="Editar" @click="openEditar(apt)">
                      <span class="icon">edit</span>
                    </button>
                    <button class="action-btn delete" title="Eliminar" @click="eliminar(apt.idApartamento)">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-if="paginated.length === 0">
                <td colspan="5" class="empty-state">
                  <span class="icon empty-icon">search_off</span>
                  <p>{{ isLoadingApartamentos ? 'Cargando apartamentos...' : 'No se encontraron apartamentos con los filtros aplicados.' }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="pagination-bar">
          <span class="pagination-info">
            Mostrando {{ ((currentPage - 1) * perPage) + 1 }}–{{ Math.min(currentPage * perPage, filtered.length) }}
            de {{ filtered.length }} apartamentos
          </span>

          <div class="pagination-controls">
            <button class="page-btn arrow" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
              <span class="icon">chevron_left</span>
            </button>

            <template v-for="(p, i) in visiblePages" :key="p">
              <span v-if="i > 0 && p - visiblePages[i-1] > 1" class="page-ellipsis">…</span>
              <button
                class="page-btn"
                :class="{ active: p === currentPage }"
                @click="goPage(p)"
              >
                {{ p }}
              </button>
            </template>

            <button class="page-btn arrow" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">
              <span class="icon">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ══════════ MODAL ══════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">

            <!-- Barra superior -->
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon">
                  <span class="icon">{{ modalMode === 'ver' ? 'apartment' : modalMode === 'crear' ? 'add_circle' : 'edit' }}</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ modalMode === 'crear' ? 'Nuevo Apartamento' : modalMode === 'editar' ? 'Editar Apartamento' : 'Detalle Apartamento' }}
                  </h3>
                  <p class="modal-sub">
                    {{ modalMode === 'crear' ? 'Complete los datos para registrar la unidad.' : modalMode === 'editar' ? `Modificando ${form.idApartamento}` : `ID: ${selectedApt?.idApartamento}` }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal">
                <span class="icon">close</span>
              </button>
            </div>

            <!-- ── Modo ver ── -->
            <div v-if="modalMode === 'ver' && selectedApt" class="modal-body detail-modal-body">
              <section class="detail-hero">
                <div class="detail-hero-icon">
                  <span class="icon">apartment</span>
                </div>
                <div>
                  <p class="detail-hero-kicker">Apartamento #{{ selectedApt.idApartamento }}</p>
                  <h4 class="detail-hero-title">{{ selectedApt.numeroApartamento }}</h4>
                  <p class="detail-hero-sub">Piso {{ selectedApt.piso }} · Torre {{ getTorreLabel(selectedApt.torreId) }}</p>
                </div>
                <div class="detail-hero-meta">
                  <span
                    class="estado-badge"
                    :style="{
                      background: estadoConfig[selectedApt.estado]?.bg || '#f1f5f9',
                      color: estadoConfig[selectedApt.estado]?.color || '#475569',
                      borderColor: estadoConfig[selectedApt.estado]?.dot || '#94a3b8',
                    }"
                  >
                    <span class="estado-dot" :style="{ background: estadoConfig[selectedApt.estado]?.dot || '#94a3b8' }"></span>
                    {{ (estadoConfig[selectedApt.estado]?.label || selectedApt.estado || 'SIN ESTADO').toUpperCase() }}
                  </span>
                </div>
              </section>

              <div class="detail-card-grid">
                <article class="detail-card">
                  <p class="detail-card-title"><span class="icon">domain</span> Ubicación</p>
                  <div class="detail-grid compact-grid single-column">
                    <div class="detail-item full">
                      <span class="detail-label">Número</span>
                      <p class="detail-value">{{ selectedApt.numeroApartamento }}</p>
                    </div>
                    <div class="detail-item full">
                      <span class="detail-label">Piso</span>
                      <p class="detail-value">Piso {{ selectedApt.piso }}</p>
                    </div>
                    <div class="detail-item full">
                      <span class="detail-label">Torre</span>
                      <p class="detail-value">{{ getTorreLabel(selectedApt.torreId) }}</p>
                    </div>
                  </div>
                </article>

                <article class="detail-card detail-card-alert">
                  <p class="detail-card-title"><span class="icon">flag</span> Estado</p>
                  <p class="empty-detail-msg" style="border-style:solid; background:#fff;">
                    {{ (estadoConfig[selectedApt.estado]?.label || selectedApt.estado || 'Sin estado') }}
                  </p>
                </article>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
                <button class="btn-primary" @click="openEditar(selectedApt)">
                  <span class="icon">edit</span> Editar
                </button>
              </div>
            </div>

            <!-- ── Modo crear / editar ── -->
            <div v-else-if="modalMode !== 'ver'" class="modal-body">
              <p v-if="formError" style="margin:0 0 1rem;color:#ba1a1a;font-size:.8125rem;font-weight:600;">{{ formError }}</p>
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Número de Apartamento</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">door_front</span>
                    <input v-model="form.numeroApartamento" class="form-input" placeholder="Ej. 1002" type="text"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Piso</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">layers</span>
                    <input v-model.number="form.piso" class="form-input" placeholder="Ej. 10" type="number" min="1"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Torre</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">domain</span>
                    <select v-model="form.torreId" class="form-input" :disabled="isLoadingTorres">
                      <option value="">Selecciona una torre</option>
                      <option v-for="torre in torres" :key="torre.idTorre" :value="torre.idTorre">
                        {{ torre.nombre }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Estado</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">flag</span>
                    <select v-model="form.estado" class="form-input">
                      <option value="disponible">Disponible</option>
                      <option value="ocupado">Ocupado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="isSaving" @click="guardar">
                  <span class="icon">{{ modalMode === 'crear' ? 'add_circle' : 'save' }}</span>
                  {{ isSaving ? 'Guardando...' : (modalMode === 'crear' ? 'Crear Apartamento' : 'Guardar Cambios') }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ─────── BASE ─────── */
.apts-view {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ─────── HEADER ─────── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.04em;
  margin: 0 0 0.25rem;
  line-height: 1.15;
}

.page-sub {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #00355f, #0f4c81);
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,53,95,0.28);
  transition: transform 0.2s, box-shadow 0.2s;
}
.create-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,53,95,0.32); }
.create-btn .icon { font-size: 18px; }

/* ─────── MÉTRICAS ─────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.125rem;
}

.metric-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.25rem;
  border-left: 4px solid #00355f;
  box-shadow: 0 1px 3px rgba(0,53,95,0.05), 0 4px 12px rgba(0,53,95,0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}
.metric-card:hover { box-shadow: 0 4px 16px rgba(0,53,95,0.1); transform: translateY(-1px); }

.metric-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.metric-icon {
  width: 2.375rem; height: 2.375rem;
  border-radius: 0.625rem;
  display: flex; align-items: center; justify-content: center;
}
.metric-icon .icon { font-size: 20px; font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

.metric-tag {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
}

.metric-val {
  font-size: 1.875rem;
  font-weight: 800;
  color: #00355f;
  letter-spacing: -0.04em;
  margin: 0 0 0.2rem;
  line-height: 1;
}

.metric-lbl {
  font-size: 0.775rem;
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

/* ─────── TABLA CARD ─────── */
.table-card {
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,53,95,0.05), 0 4px 16px rgba(0,53,95,0.06);
  overflow: hidden;
}

/* Filter bar */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.875rem;
  padding: 1.125rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.filter-left { display: flex; align-items: center; gap: 0.875rem; flex-wrap: wrap; }

.search-wrap { position: relative; }
.search-ic {
  position: absolute;
  left: 0.75rem; top: 50%; transform: translateY(-50%);
  font-size: 16px; color: #94a3b8; pointer-events: none;
  font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
}
.search-input {
  background: #f1f5f9;
  border: 1.5px solid transparent;
  border-radius: 0.625rem;
  padding: 0.55rem 0.875rem 0.55rem 2.5rem;
  font-size: 0.8125rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #0d1b2a;
  width: 220px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input::placeholder { color: #b0bac5; }
.search-input:focus { outline: none; background: #fff; border-color: #0f4c81; box-shadow: 0 0 0 3px rgba(15,76,129,0.1); }

.filter-group { display: flex; align-items: center; gap: 0.5rem; }
.filter-lbl { font-size: 0.75rem; font-weight: 700; color: #64748b; }

.filter-select {
  background: #f1f5f9;
  border: 1.5px solid transparent;
  border-radius: 0.625rem;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
  transition: border-color 0.2s;
}
.filter-select:focus { outline: none; border-color: #0f4c81; background-color: #fff; }

.advanced-btn {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; font-weight: 700; color: #0f4c81;
  background: none; border: none; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: color 0.2s;
}
.advanced-btn:hover { color: #00355f; }
.advanced-btn .icon { font-size: 18px; }

/* Tabla */
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }

.data-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  text-align: left;
}

.data-table thead tr { background: #f8fafc; }

.data-table th {
  padding: 0.875rem 1.125rem;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}

.data-row td {
  padding: 0.9rem 1.125rem;
  font-size: 0.8125rem;
  color: #475569;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}

.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: #f8fafc; }

.td-id   { font-family: 'Courier New', monospace; font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
.td-piso { font-weight: 600; color: #334155; }
.text-right { text-align: right; }

.apt-num-cell { display: flex; align-items: center; gap: 0.625rem; }
.apt-icon {
  width: 2rem; height: 2rem;
  border-radius: 0.5rem;
  background: #dbeafe;
  display: flex; align-items: center; justify-content: center;
}
.apt-icon .icon { font-size: 16px; color: #1e40af; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.apt-num { font-weight: 800; color: #00355f; font-size: 0.9rem; }

.torre-badge {
  display: inline-flex;
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 700;
}

.estado-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.estado-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatars-row { display: flex; align-items: center; gap: 4px; }

.avatar-pill {
  width: 2rem; height: 2rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.575rem; font-weight: 800;
  letter-spacing: 0.03em;
  border: 2px solid #fff;
}

.no-residents { font-size: 0.775rem; color: #94a3b8; font-style: italic; }

/* Actions */
.actions-row { display: flex; align-items: center; justify-content: flex-end; gap: 2px; }

.action-btn {
  width: 2rem; height: 2rem;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 0.5rem;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.action-btn .icon { font-size: 18px; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.action-btn.view   { color: #94a3b8; }
.action-btn.view:hover   { background: rgba(15,76,129,0.08); color: #0f4c81; }
.action-btn.edit   { color: #94a3b8; }
.action-btn.edit:hover   { background: rgba(15,76,129,0.08); color: #0f4c81; }
.action-btn.delete { color: #94a3b8; }
.action-btn.delete:hover { background: rgba(186,26,26,0.08); color: #ba1a1a; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}
.empty-icon { font-size: 48px; display: block; margin-bottom: 0.75rem; font-variation-settings: 'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 48; }

/* ─────── PAGINACIÓN ─────── */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
}

.pagination-info { font-size: 0.8rem; font-weight: 500; color: #64748b; }

.pagination-controls { display: flex; align-items: center; gap: 0.375rem; }

.page-btn {
  width: 2.25rem; height: 2.25rem;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.625rem;
  background: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.8rem; font-weight: 700;
  color: #475569; cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #94a3b8; color: #00355f; }
.page-btn.active { background: linear-gradient(135deg,#00355f,#0f4c81); color: #fff; border-color: transparent; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn.arrow .icon { font-size: 18px; }

.page-ellipsis { color: #94a3b8; font-weight: 700; padding: 0 0.25rem; }

/* ─────── MODAL ─────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem;
  backdrop-filter: blur(4px);
}

.modal-box {
  background: #fff;
  border-radius: 1.5rem;
  width: 100%; max-width: 520px;
  box-shadow: 0 24px 64px rgba(0,53,95,0.2);
  overflow: hidden;
}

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title-row { display: flex; align-items: center; gap: 0.875rem; }

.modal-title-icon {
  width: 2.5rem; height: 2.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg,#00355f,#0f4c81);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.modal-title-icon .icon { font-size: 20px; color: #fff; font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

.modal-title { font-size: 1.125rem; font-weight: 800; color: #0d1b2a; margin: 0 0 0.2rem; letter-spacing: -0.03em; }
.modal-sub   { font-size: 0.775rem; color: #64748b; margin: 0; font-weight: 500; }

.modal-close {
  width: 2rem; height: 2rem;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; border: none; border-radius: 0.5rem;
  cursor: pointer; color: #64748b; transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.modal-close:hover { background: #e2e8f0; color: #0d1b2a; }
.modal-close .icon { font-size: 18px; }

.modal-body { padding: 1.5rem 1.75rem; }

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.125rem;
  margin-bottom: 1.5rem;
}
.detail-item.full { grid-column: 1 / -1; }
.detail-label { display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 0.375rem; }
.detail-value { font-size: 0.9rem; font-weight: 700; color: #0d1b2a; }
.detail-value.mono { font-family: 'Courier New', monospace; font-size: 0.825rem; color: #475569; }

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-field { display: flex; flex-direction: column; gap: 0.375rem; }

.form-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; }

.form-input-wrap { position: relative; display: flex; align-items: center; }

.form-icon {
  position: absolute; left: 0.75rem; font-size: 16px;
  color: #94a3b8; pointer-events: none; z-index: 1;
  font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
}

.form-input {
  width: 100%;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.7rem 0.875rem 0.7rem 2.5rem;
  font-size: 0.875rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #0d1b2a;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
}
.form-input::placeholder { color: #b0bac5; }
.form-input:focus { outline: none; background: #fff; border-color: #0f4c81; box-shadow: 0 0 0 3px rgba(15,76,129,0.12); }

/* Modal footer */
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.btn-secondary {
  background: #f1f5f9; color: #475569;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  border: none; border-radius: 0.75rem;
  padding: 0.7rem 1.25rem;
  cursor: pointer; transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-primary {
  display: flex; align-items: center; gap: 0.375rem;
  background: linear-gradient(135deg,#00355f,#0f4c81);
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  border: none; border-radius: 0.75rem;
  padding: 0.7rem 1.25rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,53,95,0.22);
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,53,95,0.3); }
.btn-primary .icon { font-size: 16px; font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

/* Modal transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.96) translateY(8px); }

/* Material Symbols */
.icon {
  font-family: 'Material Symbols Outlined';
  font-weight: normal; font-style: normal;
  font-size: 24px; line-height: 1;
  letter-spacing: normal; text-transform: none;
  display: inline-block; white-space: nowrap;
  direction: ltr;
  font-feature-settings: 'liga';
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
}

@media (max-width: 1024px) {
  .filter-bar { padding: 1rem; }
  .filter-left { width: 100%; }
  .search-wrap { width: 100%; }
  .search-input { width: 100%; }
  .filter-group { width: calc(50% - 0.45rem); }
  .filter-select { width: 100%; }
  .pagination-bar { padding: 0.875rem 1rem; }
}

@media (max-width: 768px) {
  .page-header { align-items: flex-start; }
  .create-btn { width: 100%; justify-content: center; }
  .metrics-grid { grid-template-columns: 1fr; }
  .filter-group { width: 100%; }
  .table-scroll { overflow: visible; margin: 0; padding: 0; }
  .data-table { min-width: 0; width: 100%; }
  .data-table thead { display: none; }
  .data-table tbody { display: grid; gap: 0.9rem; padding: 0.85rem; }
  .data-row {
    position: relative;
    display: block;
    overflow: hidden;
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    border: 1px solid #dbe5f0;
    border-radius: 1rem;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }
  .data-row::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0f4c81, #2f74ad);
  }
  .data-row td {
    display: grid;
    grid-template-columns: minmax(100px, 40%) 1fr;
    align-items: start;
    gap: 0.55rem;
    padding: 0.68rem 0.82rem;
    border-bottom: 1px dashed #e6edf5;
  }
  .data-row td::before {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    margin: 0;
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    background: #eef3f8;
    color: #5b6b80;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .data-row td:nth-child(1)::before { content: 'Apartamento'; }
  .data-row td:nth-child(2)::before { content: 'Piso'; }
  .data-row td:nth-child(3)::before { content: 'Torre'; }
  .data-row td:nth-child(4)::before { content: 'Estado'; }
  .data-row td:nth-child(5)::before { content: 'Acciones'; }
  .data-row td:last-child { border-bottom: none; }
  .data-row td.text-right { text-align: left; }
  .actions-row { justify-content: flex-start; flex-wrap: wrap; gap: 0.4rem; }
  .action-btn { width: 2.15rem; height: 2.15rem; border: 1px solid #e2e8f0; background: #fff; }
  .data-table tbody tr:not(.data-row) td { display: block; }
  .pagination-bar { flex-direction: column; align-items: flex-start; }
  .pagination-controls { width: 100%; overflow-x: auto; padding-bottom: 0.2rem; }
  .modal-overlay { padding: 0.75rem; }
  .modal-header,
  .modal-body { padding: 1rem; }
  .form-grid,
  .detail-grid { grid-template-columns: 1fr; }
}
</style>