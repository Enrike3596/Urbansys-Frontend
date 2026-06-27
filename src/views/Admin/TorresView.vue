<script setup>
import { ref, computed, onMounted } from 'vue';
import TorreService from '../../services/Torre.Service';
import { swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert';

/* ── Filtros ── */
const searchQuery  = ref('');
const currentPage  = ref(1);
const perPage      = 8;

/* ── Modal ── */
const showModal    = ref(false);
const modalMode    = ref('crear');
const selectedTorre = ref(null);
const showReportModal = ref(false);
const isSaving = ref(false);
const isLoadingTorres = ref(false);
const formError = ref('');

const emptyForm = () => ({
  idTorre: '',
  nombre: '',
  numeroTorre: '',
});
const form = ref(emptyForm());

/* ── Datos ── */
const torres = ref([]);

/* ── Métricas ── */
const metrics = computed(() => {
  const total = torres.value.length;
  const numeros = torres.value
    .map(t => Number(t.numeroTorre ?? t.numero))
    .filter(n => !Number.isNaN(n));

  const minNumero = numeros.length ? Math.min(...numeros) : 0;
  const maxNumero = numeros.length ? Math.max(...numeros) : 0;
  const promedio = numeros.length
    ? Math.round(numeros.reduce((acc, n) => acc + n, 0) / numeros.length)
    : 0;

  return { total, minNumero, maxNumero, promedio };
});

/* ── Filtrado + paginación ── */
const filtered = computed(() => torres.value.filter(t => {
  const ms = !searchQuery.value ||
    t.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    String(t.idTorre ?? t.id).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    String(t.numeroTorre ?? t.numero).toLowerCase().includes(searchQuery.value.toLowerCase());
  return ms;
}));

const totalPages   = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const paginated    = computed(() => filtered.value.slice((currentPage.value-1)*perPage, currentPage.value*perPage));
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++)
    if (i===1 || i===totalPages.value || Math.abs(i-currentPage.value)<=1) pages.push(i);
  return pages;
});

/* ── CRUD ── */
const openCrear   = () => {
  formError.value = '';
  form.value = emptyForm();
  modalMode.value = 'crear';
  showModal.value = true;
};
const openEditar  = (t) => {
  formError.value = '';
  form.value = {
    idTorre: Number(t.idTorre ?? t.id ?? 0),
    nombre: t.nombre ?? '',
    numeroTorre: t.numeroTorre ?? t.numero ?? '',
  };
  modalMode.value = 'editar';
  showModal.value = true;
};
const openVer     = (t) => { selectedTorre.value = t; modalMode.value = 'ver'; showModal.value = true; };
const closeModal  = () => { showModal.value = false; formError.value = ''; };

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

const guardar = async () => {
  formError.value = '';
  const nombre = form.value.nombre?.trim();
  const numeroTorre = Number(form.value.numeroTorre);

  if (!nombre || Number.isNaN(numeroTorre) || numeroTorre <= 0) {
    formError.value = 'Debes ingresar un nombre y un numero de torre valido.';
    await swalError(formError.value);
    return;
  }

  isSaving.value = true;
  try {
    if (modalMode.value === 'crear') {
      const creado = await TorreService.crear({ nombre, numeroTorre });
      torres.value.unshift(creado);
    } else {
      const actualizado = await TorreService.actualizar(form.value.idTorre, { nombre, numeroTorre });
      const idx = torres.value.findIndex(t => (t.idTorre ?? t.id) === form.value.idTorre);
      if (idx !== -1) {
        torres.value[idx] = actualizado;
      }
    }
    closeModal();
    swalSuccess(modalMode.value === 'crear' ? 'Torre creada correctamente.' : 'Torre actualizada correctamente.');
  } catch (error) {
    formError.value = error?.message || 'No fue posible guardar la torre.';
    await swalError(formError.value);
    console.error('Error guardando torre:', error);
  } finally {
    isSaving.value = false;
  }
};

const eliminar = async (id) => {
  const confirmResult = await swalConfirmDelete('esta torre');
  if (!confirmResult.isConfirmed) {
    return;
  }

  try {
    await TorreService.eliminar(id);
    torres.value = torres.value.filter(t => (t.idTorre ?? t.id) !== id);
    await swalSuccess('Torre eliminada correctamente.');
  } catch (error) {
    await swalError(error?.message || 'No fue posible eliminar la torre.');
    console.error('Error eliminando torre:', error);
  }
};
const goPage   = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p; };

onMounted(() => {
  cargarTorres();
});
</script>

<template>
    <div class="torres-view">

      <!-- ── Encabezado ── -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Gestión de Torres</h2>
          <p class="page-sub">Control estructural y distribución de unidades residenciales.</p>
        </div>
        <div class="header-actions">
          <div class="search-wrap-header">
            <span class="icon search-ic-h">search</span>
            <input v-model="searchQuery" class="search-input-header" placeholder="Buscar torre…" @input="currentPage=1"/>
          </div>
          <button class="create-btn" @click="openCrear">
            <span class="icon">add_business</span>
            Nueva Torre
          </button>
        </div>
      </div>

      <!-- ── Métricas ── -->
      <div class="metrics-grid">

        <!-- Total Torres -->
        <div class="metric-card" style="border-left-color:#00355f">
          <div class="metric-top">
            <div>
              <p class="metric-lbl">Total Torres</p>
              <h3 class="metric-val">{{ metrics.total }}</h3>
            </div>
            <div class="metric-icon" style="background:#d2e4ff">
              <span class="icon" style="color:#00355f">domain</span>
            </div>
          </div>
          <div class="metric-trend">
            <span class="icon">trending_up</span> 2 nuevas este mes
          </div>
        </div>

        <!-- Apartamentos -->
        <div class="metric-card" style="border-left-color:#48626e">
          <div class="metric-top">
            <div>
              <p class="metric-lbl">Numero Minimo</p>
              <h3 class="metric-val">{{ metrics.minNumero }}</h3>
            </div>
            <div class="metric-icon" style="background:#cbe7f5">
              <span class="icon" style="color:#304a55">arrow_downward</span>
            </div>
          </div>
          <p class="metric-sub-txt">Promedio: {{ metrics.promedio }}</p>
        </div>

        <!-- Max Ocupación -->
        <div class="metric-card" style="border-left-color:#27ae60">
          <div class="metric-top">
            <div>
              <p class="metric-lbl">Numero Maximo</p>
              <h3 class="metric-val">{{ metrics.maxNumero }}</h3>
            </div>
            <div class="metric-icon" style="background:#d1fae5">
              <span class="icon" style="color:#065f46">group</span>
            </div>
          </div>
          <p class="metric-sub-txt" style="color:#27ae60;font-weight:700">Torre numericamente mas alta</p>
        </div>

        <!-- Mantenimiento -->
        <div class="metric-card" style="border-left-color:#ba1a1a">
          <div class="metric-top">
            <div>
              <p class="metric-lbl">Rango Numerico</p>
              <h3 class="metric-val">{{ metrics.minNumero }} - {{ metrics.maxNumero }}</h3>
            </div>
            <div class="metric-icon" style="background:#ffdad6">
              <span class="icon" style="color:#ba1a1a">build</span>
            </div>
          </div>
          <p class="metric-sub-txt" style="color:#ba1a1a;font-style:italic;font-weight:700">Basado en numeroTorre</p>
        </div>

      </div>

      <!-- ── Tabla ── -->
      <div class="table-card">

        <!-- Cabecera tabla -->
        <div class="table-head-bar">
          <h3 class="table-head-title">Listado de Torres</h3>
          <div class="table-head-right">
            <button class="filter-action-btn">
              <span class="icon">filter_list</span>
            </button>
            <button class="filter-action-btn">
              <span class="icon">download</span>
            </button>
          </div>
        </div>

        <!-- Tabla -->
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre de la Torre</th>
                <th>N° Torre</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in paginated"
                :key="t.idTorre ?? t.id"
                class="data-row"
              >
                <!-- Nombre -->
                <td>
                  <div class="torre-name-cell">
                    <div class="torre-icon">
                      <span class="icon">domain</span>
                    </div>
                    <span class="torre-name">{{ t.nombre }}</span>
                  </div>
                </td>

                <!-- Número -->
                <td>
                  <span class="num-badge">{{ t.numeroTorre ?? t.numero }}</span>
                </td>

                <!-- Acciones -->
                <td class="text-right">
                  <div class="actions-row">
                    <button class="action-btn view" title="Ver detalle" @click="openVer(t)">
                      <span class="icon">visibility</span>
                    </button>
                    <button class="action-btn edit" title="Editar" @click="openEditar(t)">
                      <span class="icon">edit</span>
                    </button>
                    <button class="action-btn delete" title="Eliminar" @click="eliminar(t.idTorre ?? t.id)">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="paginated.length === 0">
                <td colspan="3" class="empty-state">
                  <span class="icon empty-icon">domain_disabled</span>
                  <p>{{ isLoadingTorres ? 'Cargando torres...' : 'No se encontraron torres con los filtros aplicados.' }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="pagination-bar">
          <span class="pagination-info">
            Mostrando <strong>{{ ((currentPage-1)*perPage)+1 }}</strong>–<strong>{{ Math.min(currentPage*perPage, filtered.length) }}</strong>
            de <strong>{{ filtered.length }}</strong> torres registradas
          </span>
          <div class="pagination-controls">
            <button class="page-btn arrow" :disabled="currentPage===1" @click="goPage(currentPage-1)">
              <span class="icon">chevron_left</span>
            </button>
            <template v-for="(p,i) in visiblePages" :key="p">
              <span v-if="i>0 && p-visiblePages[i-1]>1" class="page-ellipsis">…</span>
              <button class="page-btn" :class="{ active: p===currentPage }" @click="goPage(p)">{{ p }}</button>
            </template>
            <button class="page-btn arrow" :disabled="currentPage===totalPages" @click="goPage(currentPage+1)">
              <span class="icon">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ══════════ MODAL TORRE ══════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">

            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon">
                  <span class="icon">{{ modalMode==='ver' ? 'domain' : modalMode==='crear' ? 'add_business' : 'edit' }}</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ modalMode==='crear' ? 'Nueva Torre' : modalMode==='editar' ? 'Editar Torre' : 'Detalle de Torre' }}
                  </h3>
                  <p class="modal-sub">
                    {{ modalMode==='crear' ? 'Complete la información de la nueva torre.' : modalMode==='editar' ? `Modificando torre #${form.idTorre || '-'}` : 'Información general de la torre.' }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal"><span class="icon">close</span></button>
            </div>

            <!-- ── Ver ── -->
            <div v-if="modalMode==='ver' && selectedTorre" class="modal-body">

              <!-- Hero torre -->
              <div class="torre-hero">
                <div class="torre-hero-icon">
                  <span class="icon">domain</span>
                </div>
                <div class="torre-hero-info">
                  <h4 class="torre-hero-name">{{ selectedTorre.nombre }}</h4>
                  <p class="torre-hero-desc">Informacion general de la torre registrada.</p>
                </div>
              </div>

              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Numero Torre</span>
                  <span class="num-badge" style="display:inline-flex">{{ selectedTorre.numeroTorre ?? selectedTorre.numero }}</span>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
                <button class="btn-primary" @click="openEditar(selectedTorre)">
                  <span class="icon">edit</span> Editar
                </button>
              </div>
            </div>

            <!-- ── Crear / Editar ── -->
            <div v-else-if="modalMode!=='ver'" class="modal-body">
              <p v-if="formError" style="margin:0 0 1rem;color:#ba1a1a;font-size:.8125rem;font-weight:600;">{{ formError }}</p>
              <div class="form-grid">
                <div class="form-field full">
                  <label class="form-label">Nombre de la Torre</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">domain</span>
                    <input v-model="form.nombre" class="form-input" placeholder="Ej. Torre A - Arrecifes"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Número de Torre</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">apartment</span>
                    <input v-model.number="form.numeroTorre" class="form-input" placeholder="Ej. 1" type="number" min="1"/>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="isSaving" @click="guardar">
                  <span class="icon">{{ modalMode==='crear' ? 'add_business' : 'save' }}</span>
                  {{ isSaving ? 'Guardando...' : (modalMode==='crear' ? 'Crear Torre' : 'Guardar Cambios') }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════ MODAL REPORTE ══════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showReportModal" class="modal-overlay" @click.self="showReportModal=false">
          <div class="modal-box" style="max-width:440px">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon" style="background:linear-gradient(135deg,#27ae60,#065f46)">
                  <span class="icon">description</span>
                </div>
                <div>
                  <h3 class="modal-title">Reporte Estructural PDF</h3>
                  <p class="modal-sub">Resumen para la junta administrativa</p>
                </div>
              </div>
              <button class="modal-close" @click="showReportModal=false"><span class="icon">close</span></button>
            </div>
            <div class="modal-body">
              <div class="report-options">
                <label class="report-option">
                  <input type="checkbox" checked class="report-check"/> Distribución por torre
                </label>
                <label class="report-option">
                  <input type="checkbox" checked class="report-check"/> Estado de ocupación
                </label>
                <label class="report-option">
                  <input type="checkbox" class="report-check"/> Historial de mantenimiento
                </label>
                <label class="report-option">
                  <input type="checkbox" class="report-check"/> Datos del administrador
                </label>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" @click="showReportModal=false">Cancelar</button>
                <button class="btn-green" @click="showReportModal=false">
                  <span class="icon">download</span> Generar PDF
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

/* ─── BASE ─── */
.torres-view { display:flex; flex-direction:column; gap:1.75rem; font-family:'Plus Jakarta Sans',sans-serif; }

/* ─── HEADER ─── */
.page-header { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
.page-title  { font-size:1.875rem; font-weight:800; color:#00355f; letter-spacing:-0.04em; margin:0 0 .25rem; line-height:1.15; }
.page-sub    { font-size:.875rem; color:#64748b; margin:0; font-weight:500; }

.header-actions { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }

.search-wrap-header { position:relative; }
.search-ic-h { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); font-size:16px; color:#94a3b8; pointer-events:none; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.search-input-header {
  background:#fff; border:1.5px solid #e2e8f0; border-radius:.75rem;
  padding:.625rem .875rem .625rem 2.5rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a; width:220px;
  transition:border-color .2s,box-shadow .2s;
}
.search-input-header::placeholder { color:#b0bac5; }
.search-input-header:focus { outline:none; border-color:#0f4c81; box-shadow:0 0 0 3px rgba(15,76,129,.1); }

.create-btn {
  display:flex; align-items:center; gap:.5rem;
  background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700;
  border:none; border-radius:.75rem; padding:.75rem 1.25rem; cursor:pointer;
  box-shadow:0 4px 14px rgba(0,53,95,.28); transition:transform .2s,box-shadow .2s;
}
.create-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,53,95,.32); }
.create-btn .icon { font-size:18px; }

/* ─── MÉTRICAS ─── */
.metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1.125rem; }

.metric-card {
  background:#fff; border-radius:1rem; padding:1.25rem;
  border-left:4px solid #00355f;
  box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 12px rgba(0,53,95,.05);
  transition:box-shadow .2s,transform .2s;
}
.metric-card:hover { box-shadow:0 4px 16px rgba(0,53,95,.1); transform:translateY(-1px); }

.metric-top  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:.75rem; }
.metric-icon { width:2.375rem; height:2.375rem; border-radius:.625rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.metric-icon .icon { font-size:20px; }
.metric-lbl  { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:0 0 .25rem; }
.metric-val  { font-size:2rem; font-weight:800; color:#00355f; letter-spacing:-0.04em; margin:0; line-height:1; }
.metric-val-sm { font-size:1.375rem; font-weight:800; color:#00355f; letter-spacing:-0.03em; margin:0; line-height:1.1; }
.metric-trend { display:flex; align-items:center; gap:.25rem; font-size:.7rem; font-weight:700; color:#27ae60; margin-top:.5rem; }
.metric-trend .icon { font-size:14px; }
.metric-sub-txt { font-size:.75rem; color:#64748b; font-weight:500; margin:.375rem 0 0; }

.ocp-bar  { width:100%; height:5px; background:#e2e8f0; border-radius:99px; overflow:hidden; margin-top:.625rem; margin-bottom:.375rem; }
.ocp-fill { height:100%; background:#27ae60; border-radius:99px; transition:width .5s; }

/* ─── TABLA ─── */
.table-card { background:#fff; border-radius:1.25rem; box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 16px rgba(0,53,95,.06); overflow:hidden; }

.table-head-bar { display:flex; align-items:center; justify-content:space-between; padding:1.125rem 1.5rem; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
.table-head-title { font-size:1.0625rem; font-weight:800; color:#00355f; letter-spacing:-0.03em; margin:0; }
.table-head-right { display:flex; align-items:center; gap:.625rem; }

.filter-group { display:flex; align-items:center; gap:.5rem; }
.filter-lbl   { font-size:.75rem; font-weight:700; color:#64748b; }
.filter-select {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.5rem 2rem .5rem .75rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; color:#334155;
  cursor:pointer; appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right .625rem center;
}
.filter-select:focus { outline:none; border-color:#0f4c81; background-color:#fff; }

.filter-action-btn {
  width:2.25rem; height:2.25rem; display:flex; align-items:center; justify-content:center;
  font-size:.8125rem; font-weight:700; color:#64748b;
  background:#f1f5f9; border:none; border-radius:.625rem;
  cursor:pointer; transition:background .15s,color .15s;
}
.filter-action-btn:hover { background:#e2e8f0; color:#00355f; }
.filter-action-btn .icon { font-size:18px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

.table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
.data-table   { width:100%; min-width:900px; border-collapse:collapse; text-align:left; }
.data-table thead tr { background:#f8fafc; }
.data-table th { padding:.875rem 1.125rem; font-size:.625rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
.data-row td  { padding:.875rem 1.125rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.data-row:last-child td { border-bottom:none; }
.data-row:hover td { background:#f8fafc; }
.data-row.dimmed { opacity:.6; }
.text-right { text-align:right; }

.td-id { font-family:'Courier New',monospace; font-size:.775rem; font-weight:600; color:#94a3b8; }

.torre-name-cell { display:flex; align-items:center; gap:.625rem; }
.torre-icon { width:2rem; height:2rem; border-radius:.5rem; background:#d2e4ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.torre-icon .icon { font-size:16px; color:#00355f; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.torre-name { font-size:.875rem; font-weight:800; color:#00355f; }

.num-badge { display:inline-flex; padding:.2rem .625rem; background:#f1f5f9; border-radius:99px; font-size:.75rem; font-weight:800; color:#334155; }

.td-pisos { font-weight:700; color:#334155; }
.td-unit  { font-size:.7rem; color:#94a3b8; font-weight:500; margin-left:.25rem; }

.apt-count-cell { display:flex; align-items:center; gap:.375rem; }
.apt-count { font-weight:800; color:#0d1b2a; font-size:.9rem; }

.mini-bar  { width:60px; height:3px; background:#e2e8f0; border-radius:99px; overflow:hidden; margin-top:.375rem; }
.mini-fill { height:100%; border-radius:99px; transition:width .4s; }

.td-admin { font-size:.775rem; font-weight:600; color:#334155; }

.estado-badge { display:inline-flex; align-items:center; gap:.375rem; padding:.25rem .75rem; border-radius:99px; font-size:.625rem; font-weight:800; border:1px solid transparent; }
.estado-dot   { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

.actions-row { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.action-btn  { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:.5rem; cursor:pointer; transition:background .15s,color .15s; color:#94a3b8; }
.action-btn .icon { font-size:18px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.action-btn.apts:hover   { background:#d2e4ff; color:#00355f; }
.action-btn.view:hover   { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.edit:hover   { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.delete:hover { background:rgba(186,26,26,.08);  color:#ba1a1a; }

.empty-state { text-align:center; padding:3rem 1rem; color:#94a3b8; }
.empty-icon  { font-size:48px; display:block; margin-bottom:.75rem; font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 48; }

/* Paginación */
.pagination-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.75rem; padding:.875rem 1.5rem; background:#fafbfc; border-top:1px solid #f1f5f9; }
.pagination-info { font-size:.8rem; font-weight:500; color:#64748b; }
.pagination-controls { display:flex; align-items:center; gap:.375rem; }
.page-btn { width:2.25rem; height:2.25rem; display:flex; align-items:center; justify-content:center; border:1.5px solid #e2e8f0; border-radius:.625rem; background:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.8rem; font-weight:700; color:#475569; cursor:pointer; transition:background .15s,border-color .15s,color .15s; }
.page-btn:hover:not(:disabled) { background:#f1f5f9; border-color:#94a3b8; color:#00355f; }
.page-btn.active { background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; border-color:transparent; }
.page-btn:disabled { opacity:.4; cursor:not-allowed; }
.page-btn.arrow .icon { font-size:18px; }
.page-ellipsis { color:#94a3b8; font-weight:700; padding:0 .25rem; }

/* ─── BOTTOM GRID ─── */
.bottom-grid { display:grid; grid-template-columns:1fr; gap:1.25rem; }
@media (min-width:768px) { .bottom-grid { grid-template-columns:1fr 1fr; } }

/* ─── MODAL ─── */
.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(4px); }
.modal-box     { background:#fff; border-radius:1.5rem; width:100%; max-width:560px; box-shadow:0 24px 64px rgba(0,53,95,.2); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }

.modal-header    { display:flex; align-items:flex-start; justify-content:space-between; padding:1.5rem 1.75rem 1.25rem; border-bottom:1px solid #f1f5f9; flex-shrink:0; }
.modal-title-row { display:flex; align-items:center; gap:.875rem; }
.modal-title-icon{ width:2.5rem; height:2.5rem; border-radius:.75rem; background:linear-gradient(135deg,#00355f,#0f4c81); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.modal-title-icon .icon { font-size:20px; color:#fff; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.modal-title { font-size:1.125rem; font-weight:800; color:#0d1b2a; margin:0 0 .2rem; letter-spacing:-.03em; }
.modal-sub   { font-size:.775rem; color:#64748b; margin:0; font-weight:500; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border:none; border-radius:.5rem; cursor:pointer; color:#64748b; transition:background .15s; flex-shrink:0; }
.modal-close:hover { background:#e2e8f0; }
.modal-close .icon { font-size:18px; }

.modal-body { padding:1.5rem 1.75rem; overflow-y:auto; }

/* Torre hero */
.torre-hero { display:flex; align-items:flex-start; gap:1rem; background:#f8fafc; border-radius:1rem; padding:1.125rem; margin-bottom:1.25rem; }
.torre-hero-icon { width:3.25rem; height:3.25rem; border-radius:.875rem; background:linear-gradient(135deg,#d2e4ff,#a0c9ff); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.torre-hero-icon .icon { font-size:28px; color:#00355f; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 32; }
.torre-hero-name { font-size:1.0625rem; font-weight:800; color:#0d1b2a; margin:0 0 .25rem; letter-spacing:-.02em; }
.torre-hero-desc { font-size:.775rem; color:#64748b; margin:0 0 .625rem; line-height:1.55; }

/* Torre stats */
.torre-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:.75rem; margin-bottom:1.25rem; }
.torre-stat  { background:#f8fafc; border-radius:.75rem; padding:.75rem; display:flex; align-items:center; gap:.5rem; }
.torre-stat-icon { font-size:18px; color:#0f4c81; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; flex-shrink:0; }
.torre-stat-lbl  { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8; margin:0 0 .125rem; }
.torre-stat-val  { font-size:.9rem; font-weight:800; color:#0d1b2a; margin:0; }

/* Detail grid */
.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.125rem; margin-bottom:1.5rem; }
.detail-label { display:block; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:.375rem; }
.detail-value { font-size:.9rem; font-weight:700; color:#0d1b2a; }
.detail-value.mono { font-family:'Courier New',monospace; font-size:.825rem; color:#475569; }

/* Form */
.form-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; }
.form-field { display:flex; flex-direction:column; gap:.375rem; }
.form-field.full { grid-column:1/-1; }
.form-label { font-size:.6875rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#374151; }
.form-input-wrap { position:relative; display:flex; align-items:center; }
.form-icon  { position:absolute; left:.75rem; font-size:16px; color:#94a3b8; pointer-events:none; z-index:1; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.form-input {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:.75rem;
  padding:.7rem .875rem .7rem 2.5rem; font-size:.875rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a;
  transition:border-color .2s,box-shadow .2s; appearance:none;
}
.form-input::placeholder { color:#b0bac5; }
.form-input:focus { outline:none; background:#fff; border-color:#0f4c81; box-shadow:0 0 0 3px rgba(15,76,129,.12); }
.form-textarea { resize:vertical; min-height:80px; }

.modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; padding-top:1.25rem; border-top:1px solid #f1f5f9; flex-shrink:0; }
.btn-secondary { background:#f1f5f9; color:#475569; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; transition:background .15s; }
.btn-secondary:hover { background:#e2e8f0; }
.btn-apts { display:flex; align-items:center; gap:.375rem; background:#d2e4ff; color:#00355f; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; transition:background .15s; }
.btn-apts:hover { background:#a0c9ff; }
.btn-apts .icon { font-size:16px; }
.btn-primary { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,53,95,.22); transition:transform .2s,box-shadow .2s; }
.btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(0,53,95,.3); }
.btn-primary .icon { font-size:16px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

/* Report modal */
.report-options { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.5rem; padding:1rem; background:#f8fafc; border-radius:.75rem; }
.report-option  { display:flex; align-items:center; gap:.625rem; font-size:.875rem; font-weight:600; color:#334155; cursor:pointer; }
.report-check   { width:1rem; height:1rem; border-radius:.25rem; accent-color:#0f4c81; cursor:pointer; }

.btn-green { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#27ae60,#065f46); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; box-shadow:0 4px 12px rgba(39,174,96,.25); transition:transform .2s; }
.btn-green:hover { transform:translateY(-1px); }
.btn-green .icon { font-size:16px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-box,.modal-leave-to .modal-box { transform:scale(.96) translateY(8px); }

/* Material Symbols */
.icon { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; font-feature-settings:'liga'; -webkit-font-feature-settings:'liga'; -webkit-font-smoothing:antialiased; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

@media (max-width: 1024px) {
  .header-actions { width:100%; }
  .search-wrap-header { width:100%; }
  .search-input-header { width:100%; }
  .table-head-bar { padding:1rem; flex-wrap:wrap; gap:.75rem; }
  .table-head-right { width:100%; justify-content:flex-end; }
  .pagination-bar { padding:.875rem 1rem; }
}

@media (max-width: 768px) {
  .page-header { align-items:flex-start; }
  .create-btn { width:100%; justify-content:center; }
  .metrics-grid { grid-template-columns:1fr; }
  .table-head-title { width:100%; }
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
  .data-row td:nth-child(1)::before { content:'Nombre de la torre'; }
  .data-row td:nth-child(2)::before { content:'Numero de torre'; }
  .data-row td:nth-child(3)::before { content:'Acciones'; }
  .data-row td:last-child { border-bottom:none; }
  .data-row td.text-right { text-align:left; }
  .actions-row { justify-content:flex-start; flex-wrap:wrap; gap:.4rem; }
  .action-btn { width:2.15rem; height:2.15rem; border:1px solid #e2e8f0; background:#fff; }
  .data-table tbody tr:not(.data-row) td { display:block; }
  .pagination-bar { flex-direction:column; align-items:flex-start; }
  .pagination-controls { width:100%; overflow-x:auto; padding-bottom:.2rem; }
  .modal-overlay { padding:.75rem; }
  .modal-header, .modal-body { padding:1rem; }
  .torre-stats, .detail-grid, .form-grid { grid-template-columns:1fr; }
}
</style>