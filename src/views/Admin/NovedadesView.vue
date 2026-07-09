<script setup>
import { ref, computed, onMounted } from 'vue';
import NovedadService from '../../services/Novedad.Service';
import TorreService from '../../services/Torre.Service';
import ApartamentoService from '../../services/Apartamento.Service';
import ResidenteService from '../../services/Residente.Service';
import { swalConfirmDelete, swalError, swalSuccess, swalTextareaPrompt } from '@/utils/sweetalert';

const searchQuery  = ref('');
const filterTipo   = ref('todos');
const filterEstado = ref('todos');
const currentPage  = ref(1);
const perPage      = 8;

const showModal    = ref(false);
const modalMode    = ref('crear');
const selectedNovedad = ref(null);
const isSaving = ref(false);
const isLoading = ref(false);
const formError = ref('');

const activeAutocomplete = ref('');
const autocompleteCloseTimer = ref(null);
const apartamentoSearch = ref('');

const emptyForm = () => ({
  idNovedad: '',
  titulo: '',
  descripcion: '',
  tipo: '',
  estado: 'abierta',
  prioridad: null,
  planAccion: '',
  solucion: '',
  reportadoPorId: '',
  apartamentoId: '',
  torreId: '',
  fechaInicioProceso: '',
  fechaCierre: '',
});

const form = ref(emptyForm());

const novedades = ref([]);
const torres = ref([]);
const apartamentos = ref([]);
const residentes = ref([]);

const estadoConfig = {
  abierta:    { label: 'Abierta',    bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  en_proceso: { label: 'En Proceso', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  cerrada:    { label: 'Cerrada',    bg: '#d1fae5', color: '#065f46', dot: '#27ae60' },
};

const tipoConfig = {
  seguridad:     { label: 'Seguridad',     icon: 'security',           bg: '#fee2e2', color: '#991b1b' },
  mantenimiento: { label: 'Mantenimiento', icon: 'build',             bg: '#fef3c7', color: '#92400e' },
  convivencia:   { label: 'Convivencia',   icon: 'people',            bg: '#dbeafe', color: '#1e40af' },
  visitante:     { label: 'Visitante',     icon: 'person_pin',        bg: '#f3e8ff', color: '#6b21a8' },
  otro:          { label: 'Otro',          icon: 'more_horiz',        bg: '#f1f5f9', color: '#475569' },
};

const metrics = computed(() => {
  const total = novedades.value.length;
  const abiertas = novedades.value.filter(n => n.estado === 'abierta').length;
  const enProceso = novedades.value.filter(n => n.estado === 'en_proceso').length;
  const cerradas = novedades.value.filter(n => n.estado === 'cerrada').length;
  return { total, abiertas, enProceso, cerradas };
});

const filtered = computed(() => novedades.value.filter(n => {
  const matchTipo = filterTipo.value === 'todos' || n.tipo === filterTipo.value;
  const matchEstado = filterEstado.value === 'todos' || n.estado === filterEstado.value;
  const matchSearch = !searchQuery.value ||
    n.titulo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    n.descripcion.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    String(n.idNovedad ?? n.id).toLowerCase().includes(searchQuery.value.toLowerCase());
  return matchTipo && matchEstado && matchSearch;
}));

const totalPages   = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const paginated    = computed(() => filtered.value.slice((currentPage.value - 1) * perPage, currentPage.value * perPage));
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++)
    if (i === 1 || i === totalPages.value || Math.abs(i - currentPage.value) <= 1) pages.push(i);
  return pages;
});

const filteredApartamentos = computed(() => {
  const selectedTorreId = toNumberOrNull(form.value.torreId);
  const term = apartamentoSearch.value.trim().toLowerCase();
  return apartamentos.value
    .filter(a => {
      const torreId = getApartamentoTorreId(a);
      if (selectedTorreId == null || torreId !== selectedTorreId) return false;
      if (!term) return true;
      const id = String(a.idApartamento ?? '').toLowerCase();
      const numero = String(a.numeroApartamento ?? a.numero ?? '').toLowerCase();
      return id.includes(term) || numero.includes(term);
    })
    .slice(0, 8);
});

const residenteIndex = computed(() => {
  const map = new Map();
  for (const r of residentes.value) {
    const key = `${r.torreId ?? ''}|${r.apartamentoId ?? ''}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return map;
});

const lookupResidenteNombre = (torreId, aptId) => {
  if (!torreId || !aptId) return '';
  const key = `${torreId}|${aptId}`;
  const encontrados = residenteIndex.value.get(key);
  if (!encontrados || encontrados.length === 0) return '';
  const r = encontrados[0];
  const nombre = r.nombre || r.usuarioNombre || '';
  const apellido = r.apellido || r.usuarioApellido || '';
  return `${nombre} ${apellido}`.trim() || '';
};

const reportadoPorNombre = computed(() => lookupResidenteNombre(form.value.torreId, form.value.apartamentoId));

const verTorreNombre = computed(() => {
  if (!selectedNovedad.value?.torreId) return '—';
  const t = torres.value.find(t => Number(t.idTorre ?? t.id) === Number(selectedNovedad.value.torreId));
  return t ? getTorreLabel(t) : `Torre #${selectedNovedad.value.torreId}`;
});

const verApartamentoLabel = computed(() => {
  if (!selectedNovedad.value?.apartamentoId) return '—';
  const a = apartamentos.value.find(apt => Number(apt.idApartamento) === Number(selectedNovedad.value.apartamentoId));
  return a ? getApartamentoLabel(a) : `Apto #${selectedNovedad.value.apartamentoId}`;
});

const verReportadoPorNombre = computed(() => {
  if (!selectedNovedad.value) return '—';
  const nombre = lookupResidenteNombre(selectedNovedad.value.torreId, selectedNovedad.value.apartamentoId);
  return nombre || (selectedNovedad.value.reportadoPorId ? `ID: ${selectedNovedad.value.reportadoPorId}` : '—');
});

function getTorreLabel(torre) {
  return torre.nombre || 'Torre';
}

function getApartamentoLabel(apartamento) {
  return apartamento.numeroApartamento || apartamento.numero || 'Sin numero';
}

function getApartamentoTorreId(apartamento) {
  if (!apartamento) return null;
  const raw = apartamento.torreId ?? apartamento.idTorre;
  if (raw == null || Number.isNaN(Number(raw))) return null;
  return Number(raw);
}

function toNumberOrNull(value) {
  if (value === '' || value == null || Number.isNaN(Number(value))) return null;
  return Number(value);
}

const clearAutocomplete = () => {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value);
  }
  autocompleteCloseTimer.value = setTimeout(() => {
    activeAutocomplete.value = '';
    autocompleteCloseTimer.value = null;
  }, 180);
};

const openAutocomplete = (field) => {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value);
    autocompleteCloseTimer.value = null;
  }
  activeAutocomplete.value = field;
};

const selectApartamento = (apartamento) => {
  form.value.apartamentoId = Number(apartamento.idApartamento);
  apartamentoSearch.value = getApartamentoLabel(apartamento);
  activeAutocomplete.value = '';
};

const onTorreChange = () => {
  form.value.apartamentoId = null;
  apartamentoSearch.value = '';
};

const onApartamentoInput = () => {
  form.value.apartamentoId = null;
};

const openCrear = () => {
  formError.value = '';
  form.value = emptyForm();
  apartamentoSearch.value = '';
  modalMode.value = 'crear';
  showModal.value = true;
};

const openEditar = (n) => {
  formError.value = '';
  const torre = torres.value.find(t => Number(t.idTorre ?? t.id) === Number(n.torreId));
  const apartamento = apartamentos.value.find(a => Number(a.idApartamento) === Number(n.apartamentoId));
  form.value = {
    idNovedad: Number(n.idNovedad ?? n.id ?? 0),
    titulo: n.titulo ?? '',
    descripcion: n.descripcion ?? '',
    tipo: n.tipo ?? 'otro',
    estado: n.estado ?? 'abierta',
    prioridad: n.prioridad ?? null,
    planAccion: n.planAccion ?? '',
    solucion: n.solucion ?? '',
    reportadoPorId: n.reportadoPorId ?? '',
    apartamentoId: n.apartamentoId ?? '',
    torreId: n.torreId ?? '',
    fechaInicioProceso: n.fechaInicioProceso ?? '',
    fechaCierre: n.fechaCierre ?? '',
  };
  apartamentoSearch.value = apartamento ? getApartamentoLabel(apartamento) : '';
  modalMode.value = 'editar';
  showModal.value = true;
};

const openVer = (n) => {
  selectedNovedad.value = n;
  modalMode.value = 'ver';
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; formError.value = ''; };

const cargarDatos = async () => {
  isLoading.value = true;
  try {
    novedades.value = await NovedadService.listar();
  } catch (error) {
    console.error('Error cargando novedades:', error);
    novedades.value = [];
  } finally {
    isLoading.value = false;
  }
};

const cargarCatalogos = async () => {
  try {
    const [torresData, apartamentosData, residentesData] = await Promise.all([
      TorreService.listar(),
      ApartamentoService.listar(),
      ResidenteService.listar(),
    ]);
    torres.value = Array.isArray(torresData) ? torresData : [];
    apartamentos.value = Array.isArray(apartamentosData) ? apartamentosData : [];
    residentes.value = Array.isArray(residentesData) ? residentesData : [];
  } catch (error) {
    console.error('Error cargando catalogos:', error);
  }
};

const guardar = async () => {
  formError.value = '';
  const titulo = form.value.titulo?.trim();
  const descripcion = form.value.descripcion?.trim();
  const tipo = form.value.tipo;
  const estado = form.value.estado;

  if (!titulo || !descripcion || !tipo) {
    formError.value = 'Debes completar titulo, descripcion y tipo.';
    await swalError(formError.value);
    return;
  }

  if (modalMode.value === 'editar') {
    if (estado === 'en_proceso' && !form.value.planAccion?.trim()) {
      formError.value = 'Debes indicar el plan de accion al pasar a En Proceso.';
      await swalError(formError.value);
      return;
    }
    if (estado === 'cerrada' && !form.value.solucion?.trim()) {
      formError.value = 'Debes indicar la solucion al pasar a Cerrada.';
      await swalError(formError.value);
      return;
    }
  }

  isSaving.value = true;
  try {
    if (modalMode.value === 'crear') {
      const creado = await NovedadService.crear({
        titulo,
        descripcion,
        tipo,
        prioridad: form.value.prioridad || null,
        reportadoPorId: form.value.reportadoPorId || null,
        apartamentoId: form.value.apartamentoId || null,
        torreId: form.value.torreId || null,
      });
      novedades.value.unshift(creado);
    } else {
      const actualizado = await NovedadService.actualizar(form.value.idNovedad, {
        titulo,
        descripcion,
        tipo,
        estado: form.value.estado,
        prioridad: form.value.prioridad || null,
        planAccion: form.value.planAccion?.trim() || null,
        solucion: form.value.solucion?.trim() || null,
        reportadoPorId: form.value.reportadoPorId || null,
        apartamentoId: form.value.apartamentoId || null,
        torreId: form.value.torreId || null,
        fechaInicioProceso: form.value.fechaInicioProceso || null,
        fechaCierre: form.value.fechaCierre || null,
      });
      const idx = novedades.value.findIndex(n => (n.idNovedad ?? n.id) === form.value.idNovedad);
      if (idx !== -1) novedades.value[idx] = actualizado;
    }
    closeModal();
    swalSuccess(modalMode.value === 'crear' ? 'Novedad creada correctamente.' : 'Novedad actualizada correctamente.');
  } catch (error) {
    formError.value = error?.message || 'No fue posible guardar la novedad.';
    await swalError(formError.value);
    console.error('Error guardando novedad:', error);
  } finally {
    isSaving.value = false;
  }
};

const eliminar = async (id) => {
  const confirmResult = await swalConfirmDelete('esta novedad');
  if (!confirmResult.isConfirmed) return;

  try {
    await NovedadService.eliminar(id);
    novedades.value = novedades.value.filter(n => (n.idNovedad ?? n.id) !== id);
    await swalSuccess('Novedad eliminada correctamente.');
  } catch (error) {
    await swalError(error?.message || 'No fue posible eliminar la novedad.');
    console.error('Error eliminando novedad:', error);
  }
};

const cambiarEstado = async (item, nuevoEstado) => {
  if (nuevoEstado === 'en_proceso') {
    const { value: planAccion, isConfirmed } = await swalTextareaPrompt({
      title: 'Iniciar Proceso',
      description: 'Describe el plan de acción a seguir para dejar trazabilidad clara del caso.',
      placeholder: 'Describe el plan de acción...',
      confirmButtonText: 'Iniciar proceso',
      icon: 'play_arrow',
      accent: '#f59e0b',
      validationMessage: 'El plan de acción es obligatorio',
    });
    if (!isConfirmed) return;
    await NovedadService.iniciarProceso(item.idNovedad, planAccion);
  } else if (nuevoEstado === 'cerrada') {
    const { value: solucion, isConfirmed } = await swalTextareaPrompt({
      title: 'Cerrar Novedad',
      description: 'Registra la solución aplicada para conservar un historial claro del cierre.',
      placeholder: 'Describe la solución...',
      confirmButtonText: 'Cerrar novedad',
      icon: 'task_alt',
      accent: '#27ae60',
      validationMessage: 'La solución es obligatoria',
    });
    if (!isConfirmed) return;
    await NovedadService.cerrar(item.idNovedad, solucion);
  }
  await cargarDatos();
  swalSuccess(nuevoEstado === 'en_proceso' ? 'Proceso iniciado correctamente.' : 'Novedad cerrada correctamente.');
};

const goPage = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p; };

const prioridadLabel = (p) => {
  if (p == null) return 'Sin prioridad';
  return p === 1 ? 'Alta' : p === 2 ? 'Media' : p === 3 ? 'Baja' : 'Sin prioridad';
};

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  try {
    const d = new Date(fecha);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fecha;
  }
};

onMounted(async () => {
  await Promise.all([cargarDatos(), cargarCatalogos()]);
});
</script>

<template>
  <div class="novedades-view">

    <div class="page-header">
      <div>
        <h2 class="page-title">Gesti&oacute;n de Novedades</h2>
        <p class="page-sub">Registro y seguimiento de incidentes, alertas y eventos de la comunidad.</p>
      </div>
      <div class="header-actions">
        <div class="search-wrap-header">
          <span class="icon search-ic-h">search</span>
          <input v-model="searchQuery" class="search-input-header" placeholder="Buscar novedad..." @input="currentPage = 1" />
        </div>
        <button class="create-btn" @click="openCrear">
          <span class="icon">add_circle</span>
          Nueva Novedad
        </button>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card" style="border-left-color:#00355f">
        <div class="metric-top">
          <div>
            <p class="metric-lbl">Total Novedades</p>
            <h3 class="metric-val">{{ metrics.total }}</h3>
          </div>
          <div class="metric-icon" style="background:#d2e4ff">
            <span class="icon" style="color:#00355f">campaign</span>
          </div>
        </div>
        <div class="metric-trend">
          <span class="icon">trending_up</span> Registro general
        </div>
      </div>

      <div class="metric-card" style="border-left-color:#3b82f6">
        <div class="metric-top">
          <div>
            <p class="metric-lbl">Abiertas</p>
            <h3 class="metric-val">{{ metrics.abiertas }}</h3>
          </div>
          <div class="metric-icon" style="background:#dbeafe">
            <span class="icon" style="color:#1e40af">pending</span>
          </div>
        </div>
        <p class="metric-sub-txt">Pendientes de atenci&oacute;n</p>
      </div>

      <div class="metric-card" style="border-left-color:#f59e0b">
        <div class="metric-top">
          <div>
            <p class="metric-lbl">En Proceso</p>
            <h3 class="metric-val">{{ metrics.enProceso }}</h3>
          </div>
          <div class="metric-icon" style="background:#fef3c7">
            <span class="icon" style="color:#92400e">engineering</span>
          </div>
        </div>
        <p class="metric-sub-txt">En curso de resoluci&oacute;n</p>
      </div>

      <div class="metric-card" style="border-left-color:#27ae60">
        <div class="metric-top">
          <div>
            <p class="metric-lbl">Cerradas</p>
            <h3 class="metric-val">{{ metrics.cerradas }}</h3>
          </div>
          <div class="metric-icon" style="background:#d1fae5">
            <span class="icon" style="color:#065f46">check_circle</span>
          </div>
        </div>
        <p class="metric-sub-txt" style="color:#27ae60;font-weight:700">Resueltas satisfactoriamente</p>
      </div>
    </div>

    <div class="table-card">
      <div class="table-head-bar">
        <h3 class="table-head-title">Listado de Novedades</h3>
        <div class="table-head-right">
          <div class="filter-group">
            <label class="filter-lbl">Tipo</label>
            <select v-model="filterTipo" class="filter-select" @change="currentPage = 1">
              <option value="todos">Todos</option>
              <option value="seguridad">Seguridad</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="convivencia">Convivencia</option>
              <option value="visitante">Visitante</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-lbl">Estado</label>
            <select v-model="filterEstado" class="filter-select" @change="currentPage = 1">
              <option value="todos">Todos</option>
              <option value="abierta">Abierta</option>
              <option value="en_proceso">En Proceso</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>T&iacute;tulo</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha Reporte</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in paginated" :key="n.idNovedad ?? n.id" class="data-row">
              <td>
                <div class="novedad-title-cell">
                  <div class="novedad-icon" :style="{ background: (tipoConfig[n.tipo] || tipoConfig.otro).bg }">
                    <span class="icon" :style="{ color: (tipoConfig[n.tipo] || tipoConfig.otro).color }">
                      {{ (tipoConfig[n.tipo] || tipoConfig.otro).icon }}
                    </span>
                  </div>
                  <div>
                    <span class="novedad-titulo">{{ n.titulo }}</span>
                    <p class="novedad-desc-preview">{{ n.descripcion?.substring(0, 60) }}{{ n.descripcion?.length > 60 ? '...' : '' }}</p>
                  </div>
                </div>
              </td>

              <td>
                <span class="tipo-badge" :style="{ background: (tipoConfig[n.tipo] || tipoConfig.otro).bg, color: (tipoConfig[n.tipo] || tipoConfig.otro).color }">
                  <span class="icon tipo-badge-icon">{{ (tipoConfig[n.tipo] || tipoConfig.otro).icon }}</span>
                  {{ (tipoConfig[n.tipo] || tipoConfig.otro).label }}
                </span>
              </td>

              <td>
                <span class="prioridad-badge" :class="'prio-' + (n.prioridad || 0)">{{ prioridadLabel(n.prioridad) }}</span>
              </td>

              <td>
                <span class="estado-badge" :style="{ background: (estadoConfig[n.estado] || estadoConfig.abierta).bg, borderColor: (estadoConfig[n.estado] || estadoConfig.abierta).dot }">
                  <span class="estado-dot" :style="{ background: (estadoConfig[n.estado] || estadoConfig.abierta).dot }"></span>
                  {{ (estadoConfig[n.estado] || estadoConfig.abierta).label }}
                </span>
              </td>

              <td>
                <span class="fecha-txt">{{ formatFecha(n.fechaReporte) }}</span>
              </td>

              <td class="text-right">
                <div class="actions-row">
                  <template v-if="n.estado === 'abierta'">
                    <button class="action-btn process" title="Iniciar Proceso" @click="cambiarEstado(n, 'en_proceso')">
                      <span class="icon">engineering</span>
                    </button>
                  </template>
                  <template v-else-if="n.estado === 'en_proceso'">
                    <button class="action-btn close-novedad" title="Cerrar" @click="cambiarEstado(n, 'cerrada')">
                      <span class="icon">check_circle</span>
                    </button>
                  </template>
                  <button class="action-btn view" title="Ver detalle" @click="openVer(n)">
                    <span class="icon">visibility</span>
                  </button>
                  <button class="action-btn edit" title="Editar" @click="openEditar(n)" :disabled="n.estado === 'cerrada'">
                    <span class="icon">edit</span>
                  </button>
                  <button class="action-btn delete" title="Eliminar" @click="eliminar(n.idNovedad ?? n.id)">
                    <span class="icon">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="paginated.length === 0">
              <td colspan="6" class="empty-state">
                <span class="icon empty-icon">campaign</span>
                <p>{{ isLoading ? 'Cargando novedades...' : 'No se encontraron novedades con los filtros aplicados.' }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <span class="pagination-info">
          Mostrando <strong>{{ ((currentPage - 1) * perPage) + 1 }}</strong>&ndash;<strong>{{ Math.min(currentPage * perPage, filtered.length) }}</strong>
          de <strong>{{ filtered.length }}</strong> novedades registradas
        </span>
        <div class="pagination-controls">
          <button class="page-btn arrow" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
            <span class="icon">chevron_left</span>
          </button>
          <template v-for="(p, i) in visiblePages" :key="p">
            <span v-if="i > 0 && p - visiblePages[i - 1] > 1" class="page-ellipsis">&hellip;</span>
            <button class="page-btn" :class="{ active: p === currentPage }" @click="goPage(p)">{{ p }}</button>
          </template>
          <button class="page-btn arrow" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">
            <span class="icon">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- ══════════ MODAL NOVEDAD ══════════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">

          <div class="modal-header">
            <div class="modal-title-row">
              <div class="modal-title-icon">
                <span class="icon">{{ modalMode === 'ver' ? 'campaign' : modalMode === 'crear' ? 'add_circle' : 'edit' }}</span>
              </div>
              <div>
                <h3 class="modal-title">
                  {{ modalMode === 'crear' ? 'Nueva Novedad' : modalMode === 'editar' ? 'Editar Novedad' : 'Detalle de Novedad' }}
                </h3>
                <p class="modal-sub">
                  {{ modalMode === 'crear' ? 'Registra un incidente o evento de la comunidad.' : modalMode === 'editar' ? 'Actualizando novedad #' + (form.idNovedad || '-') : 'Informaci&oacute;n completa de la novedad.' }}
                </p>
              </div>
            </div>
            <button class="modal-close" @click="closeModal"><span class="icon">close</span></button>
          </div>

          <!-- ── Ver ── -->
          <div v-if="modalMode === 'ver' && selectedNovedad" class="modal-body detail-modal-body">
            <section class="detail-hero">
              <div class="detail-hero-icon" :style="{ background: (tipoConfig[selectedNovedad.tipo] || tipoConfig.otro).bg, color: (tipoConfig[selectedNovedad.tipo] || tipoConfig.otro).color }">
                <span class="icon">{{ (tipoConfig[selectedNovedad.tipo] || tipoConfig.otro).icon }}</span>
              </div>
              <div>
                <p class="detail-hero-kicker">Novedad #{{ selectedNovedad.idNovedad ?? selectedNovedad.id }}</p>
                <h4 class="detail-hero-title">{{ selectedNovedad.titulo }}</h4>
                <p class="detail-hero-sub">{{ selectedNovedad.descripcion || 'Sin descripción.' }}</p>
              </div>
              <div class="detail-hero-meta">
                <span class="tipo-badge" :style="{ background: (tipoConfig[selectedNovedad.tipo] || tipoConfig.otro).bg, color: (tipoConfig[selectedNovedad.tipo] || tipoConfig.otro).color }">
                  {{ (tipoConfig[selectedNovedad.tipo] || tipoConfig.otro).label }}
                </span>
                <span class="estado-badge" :style="{ background: (estadoConfig[selectedNovedad.estado] || estadoConfig.abierta).bg, borderColor: (estadoConfig[selectedNovedad.estado] || estadoConfig.abierta).dot }">
                  <span class="estado-dot" :style="{ background: (estadoConfig[selectedNovedad.estado] || estadoConfig.abierta).dot }"></span>
                  {{ (estadoConfig[selectedNovedad.estado] || estadoConfig.abierta).label }}
                </span>
              </div>
            </section>

            <div class="detail-card-grid">
              <article class="detail-card">
                <p class="detail-card-title"><span class="icon">description</span> Descripción</p>
                <p class="detail-value" style="font-weight:600; color:#334155; line-height:1.6;">{{ selectedNovedad.descripcion || 'Sin descripción.' }}</p>
              </article>

              <article class="detail-card">
                <p class="detail-card-title"><span class="icon">info</span> Gestión</p>
                <div class="detail-grid compact-grid single-column">
                  <div class="detail-item full">
                    <span class="detail-label">Fecha de reporte</span>
                    <p class="detail-value">{{ formatFecha(selectedNovedad.fechaReporte) }}</p>
                  </div>
                  <div class="detail-item full">
                    <span class="detail-label">Prioridad</span>
                    <p class="detail-value">{{ prioridadLabel(selectedNovedad.prioridad) }}</p>
                  </div>
                  <div class="detail-item full">
                    <span class="detail-label">Plan de acción</span>
                    <p class="detail-value">{{ selectedNovedad.planAccion || '—' }}</p>
                  </div>
                  <div class="detail-item full">
                    <span class="detail-label">Solución</span>
                    <p class="detail-value">{{ selectedNovedad.solucion || '—' }}</p>
                  </div>
                </div>
              </article>

              <article class="detail-card detail-card-alert">
                <p class="detail-card-title"><span class="icon">schedule</span> Seguimiento</p>
                <div class="detail-grid compact-grid">
                  <div class="detail-item">
                    <span class="detail-label">Inicio proceso</span>
                    <p class="detail-value">{{ formatFecha(selectedNovedad.fechaInicioProceso) }}</p>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Fecha de cierre</span>
                    <p class="detail-value">{{ formatFecha(selectedNovedad.fechaCierre) }}</p>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Reportado por</span>
                    <p class="detail-value">{{ verReportadoPorNombre }}</p>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Torre</span>
                    <p class="detail-value">{{ verTorreNombre }}</p>
                  </div>
                  <div class="detail-item full">
                    <span class="detail-label">Apartamento</span>
                    <p class="detail-value">{{ verApartamentoLabel }}</p>
                  </div>
                </div>
              </article>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">Cerrar</button>
              <button class="btn-primary" @click="openEditar(selectedNovedad)" :disabled="selectedNovedad.estado === 'cerrada'">
                <span class="icon">edit</span> Editar
              </button>
            </div>
          </div>

          <!-- ── Crear / Editar ── -->
          <div v-else-if="modalMode !== 'ver'" class="modal-body">
            <p v-if="formError" class="form-error-msg">{{ formError }}</p>

            <div class="form-grid">
              <div class="form-field full">
                <label class="form-label">T&iacute;tulo</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">campaign</span>
                  <input v-model="form.titulo" class="form-input" placeholder="Ej. Fuga de agua en pasillo principal" />
                </div>
              </div>

              <div class="form-field full">
                <label class="form-label">Descripci&oacute;n</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">description</span>
                  <textarea v-model="form.descripcion" class="form-input form-textarea" placeholder="Describe detalladamente la novedad..."></textarea>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">Tipo</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">category</span>
                  <select v-model="form.tipo" class="form-input">
                    <option value="" disabled>Seleccione un tipo de novedad</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="convivencia">Convivencia</option>
                    <option value="visitante">Visitante</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div class="form-field" v-if="modalMode === 'editar'">
                <label class="form-label">Estado</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">flag</span>
                  <select v-model="form.estado" class="form-input">
                    <option value="abierta">Abierta</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">Prioridad</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">priority_high</span>
                  <select v-model.number="form.prioridad" class="form-input">
                    <option :value="null">Sin prioridad</option>
                    <option :value="1">Alta</option>
                    <option :value="2">Media</option>
                    <option :value="3">Baja</option>
                  </select>
                </div>
              </div>

              <div class="form-field full" v-if="modalMode === 'editar' && form.estado === 'en_proceso'">
                <label class="form-label">Plan de Acci&oacute;n</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">assignment</span>
                  <textarea v-model="form.planAccion" class="form-input form-textarea" placeholder="Describe el plan de acci&oacute;n a seguir..."></textarea>
                </div>
              </div>

              <div class="form-field full" v-if="modalMode === 'editar' && form.estado === 'cerrada'">
                <label class="form-label">Soluci&oacute;n</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">check_circle</span>
                  <textarea v-model="form.solucion" class="form-input form-textarea" placeholder="Describe la soluci&oacute;n aplicada..."></textarea>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">Torre</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">domain</span>
                    <select v-model.number="form.torreId" class="form-input" @change="onTorreChange">
                      <option value="">Selecciona una torre</option>
                      <option
                        v-for="torre in torres"
                        :key="torre.idTorre ?? torre.id"
                        :value="torre.idTorre ?? torre.id"
                      >
                        {{ getTorreLabel(torre) }}
                      </option>
                    </select>
                </div>
              </div>

              <div class="form-field autocomplete-field">
                <label class="form-label">Apartamento</label>
                <div class="form-input-wrap autocomplete-wrap">
                  <span class="form-icon icon">apartment</span>
                  <input
                    v-model="apartamentoSearch"
                    class="form-input"
                    type="text"
                    placeholder="Selecciona torre primero..."
                    :disabled="!form.torreId"
                    @focus="openAutocomplete('apartamento')"
                    @blur="clearAutocomplete"
                    @input="onApartamentoInput"
                  />
                  <div v-if="activeAutocomplete === 'apartamento' && filteredApartamentos.length > 0" class="autocomplete-dropdown">
                    <div
                      v-for="apartamento in filteredApartamentos"
                      :key="apartamento.idApartamento"
                      class="autocomplete-item"
                      @mousedown.prevent="selectApartamento(apartamento)"
                    >
                      {{ getApartamentoLabel(apartamento) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">Reportado por</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">person</span>
                  <input
                    class="form-input"
                    type="text"
                    :value="reportadoPorNombre || 'Selecciona torre y apartamento...'"
                    placeholder="Se auto-asigna al seleccionar torre y apto."
                    readonly
                  />
                </div>
              </div>

              <div class="form-field" v-if="modalMode === 'editar'">
                <label class="form-label">Fecha de Cierre</label>
                <div class="form-input-wrap">
                  <span class="form-icon icon">calendar_today</span>
                  <input v-model="form.fechaCierre" class="form-input" placeholder="YYYY-MM-DDTHH:mm" type="datetime-local" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">Cancelar</button>
              <button class="btn-primary" :disabled="isSaving" @click="guardar">
                <span class="icon">{{ modalMode === 'crear' ? 'add_circle' : 'save' }}</span>
                {{ isSaving ? 'Guardando...' : (modalMode === 'crear' ? 'Crear Novedad' : 'Guardar Cambios') }}
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

.novedades-view { display:flex; flex-direction:column; gap:1.75rem; font-family:'Plus Jakarta Sans',sans-serif; }

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
.metric-trend { display:flex; align-items:center; gap:.25rem; font-size:.7rem; font-weight:700; color:#27ae60; margin-top:.5rem; }
.metric-trend .icon { font-size:14px; }
.metric-sub-txt { font-size:.75rem; color:#64748b; font-weight:500; margin:.375rem 0 0; }

.table-card { background:#fff; border-radius:1.25rem; box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 16px rgba(0,53,95,.06); overflow:hidden; }

.table-head-bar { display:flex; align-items:center; justify-content:space-between; padding:1.125rem 1.5rem; border-bottom:1px solid #f1f5f9; background:#fafbfc; flex-wrap:wrap; gap:.75rem; }
.table-head-title { font-size:1.0625rem; font-weight:800; color:#00355f; letter-spacing:-0.03em; margin:0; }
.table-head-right { display:flex; align-items:center; gap:.625rem; }

.filter-group { display:flex; align-items:center; gap:.5rem; }
.filter-lbl   { font-size:.75rem; font-weight:700; color:#64748b; white-space:nowrap; }
.filter-select {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.5rem 2rem .5rem .75rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; color:#334155;
  cursor:pointer; appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right .625rem center;
}
.filter-select:focus { outline:none; border-color:#0f4c81; background-color:#fff; }

.table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
.data-table   { width:100%; min-width:900px; border-collapse:collapse; text-align:left; }
.data-table thead tr { background:#f8fafc; }
.data-table th { padding:.875rem 1.125rem; font-size:.625rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
.data-row td  { padding:.875rem 1.125rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.data-row:last-child td { border-bottom:none; }
.data-row:hover td { background:#f8fafc; }
.text-right { text-align:right; }

.novedad-title-cell { display:flex; align-items:flex-start; gap:.625rem; }
.novedad-icon { width:2rem; height:2rem; border-radius:.5rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.novedad-icon .icon { font-size:16px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.novedad-titulo { font-size:.875rem; font-weight:800; color:#00355f; display:block; }
.novedad-desc-preview { font-size:.7rem; color:#94a3b8; margin:.125rem 0 0; line-height:1.3; }

.tipo-badge { display:inline-flex; align-items:center; gap:.375rem; padding:.25rem .625rem; border-radius:99px; font-size:.65rem; font-weight:700; }
.tipo-badge-icon { font-size:14px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 20; }

.estado-badge { display:inline-flex; align-items:center; gap:.375rem; padding:.25rem .75rem; border-radius:99px; font-size:.625rem; font-weight:800; border:1px solid transparent; }
.estado-dot   { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

.prioridad-badge { display:inline-flex; align-items:center; padding:.25rem .65rem; border-radius:99px; font-size:.6rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
.prioridad-badge.prio-1 { background:#fee2e2; color:#991b1b; }
.prioridad-badge.prio-2 { background:#fef3c7; color:#92400e; }
.prioridad-badge.prio-3 { background:#dbeafe; color:#1e40af; }
.prioridad-badge.prio-0 { background:#f1f5f9; color:#94a3b8; }

.fecha-txt { font-size:.75rem; font-weight:600; color:#64748b; white-space:nowrap; }

.actions-row { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.action-btn  { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:.5rem; cursor:pointer; transition:background .15s,color .15s; color:#94a3b8; }
.action-btn .icon { font-size:18px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.action-btn.view:hover   { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.edit:hover   { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.delete:hover { background:rgba(186,26,26,.08);  color:#ba1a1a; }
.action-btn.process:hover { background:rgba(245,158,11,.08); color:#f59e0b; }
.action-btn.close-novedad:hover { background:rgba(39,174,96,.08); color:#27ae60; }
.action-btn:disabled { opacity:.4; cursor:not-allowed; }

.empty-state { text-align:center; padding:3rem 1rem; color:#94a3b8; }
.empty-icon  { font-size:48px; display:block; margin-bottom:.75rem; font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 48; }

.pagination-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.75rem; padding:.875rem 1.5rem; background:#fafbfc; border-top:1px solid #f1f5f9; }
.pagination-info { font-size:.8rem; font-weight:500; color:#64748b; }
.pagination-controls { display:flex; align-items:center; gap:.375rem; }
.page-btn { width:2.25rem; height:2.25rem; display:flex; align-items:center; justify-content:center; border:1.5px solid #e2e8f0; border-radius:.625rem; background:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.8rem; font-weight:700; color:#475569; cursor:pointer; transition:background .15s,border-color .15s,color .15s; }
.page-btn:hover:not(:disabled) { background:#f1f5f9; border-color:#94a3b8; color:#00355f; }
.page-btn.active { background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; border-color:transparent; }
.page-btn:disabled { opacity:.4; cursor:not-allowed; }
.page-btn.arrow .icon { font-size:18px; }
.page-ellipsis { color:#94a3b8; font-weight:700; padding:0 .25rem; }

.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(4px); }
.modal-box     { background:#fff; border-radius:1.5rem; width:100%; max-width:620px; box-shadow:0 24px 64px rgba(0,53,95,.2); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }

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

.form-error-msg { margin:0 0 1rem; color:#ba1a1a; font-size:.8125rem; font-weight:600; }

.novedad-hero { display:flex; align-items:flex-start; gap:1rem; background:#f8fafc; border-radius:1rem; padding:1.125rem; margin-bottom:1.25rem; }
.novedad-hero-icon { width:3.25rem; height:3.25rem; border-radius:.875rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.novedad-hero-icon .icon { font-size:28px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 32; }
.novedad-hero-titulo { font-size:1.0625rem; font-weight:800; color:#0d1b2a; margin:0 0 .25rem; letter-spacing:-.02em; }
.novedad-hero-desc { font-size:.775rem; color:#64748b; margin:0 0 .625rem; line-height:1.55; }
.novedad-hero-badges { display:flex; align-items:center; gap:.5rem; margin-top:.25rem; }

.detail-section { margin-bottom:1.25rem; }
.detail-section-title { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:0 0 .5rem; }
.detail-desc-text { font-size:.9rem; font-weight:500; color:#334155; line-height:1.6; background:#f8fafc; border-radius:.75rem; padding:1rem; margin:0; }

.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.125rem; margin-bottom:1.5rem; }
.detail-label { display:block; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:.375rem; }
.detail-value { font-size:.9rem; font-weight:700; color:#0d1b2a; }
.detail-value.mono { font-family:'Courier New',monospace; font-size:.825rem; color:#475569; }

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
.form-input:disabled { background:#f1f5f9; cursor:not-allowed; color:#94a3b8; }
.form-input[readonly] { background:#f1f5f9; cursor:default; color:#0d1b2a; font-weight:600; }
.form-textarea { resize:vertical; min-height:90px; }
select.form-input { cursor:pointer; }

.autocomplete-field { position:relative; }
.autocomplete-wrap { position:relative; }

.autocomplete-dropdown {
  position:absolute; top:100%; left:0; right:0; z-index:100;
  background:#fff; border:1px solid #e2e8f0;
  border-radius:.625rem; box-shadow:0 4px 12px rgba(15,76,129,.16);
  max-height:220px; overflow-y:auto; padding:.25rem;
  margin:0;
}

.autocomplete-item {
  padding:.65rem .75rem; font-size:.8125rem; color:#334155;
  cursor:pointer; border-radius:.5rem;
  font-weight:500; transition:background .15s ease,color .15s ease;
}
.autocomplete-item:hover { background:#0f4c81; color:#fff; }

.modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; padding-top:1.25rem; border-top:1px solid #f1f5f9; flex-shrink:0; }
.btn-secondary { background:#f1f5f9; color:#475569; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; transition:background .15s; }
.btn-secondary:hover { background:#e2e8f0; }
.btn-primary { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,53,95,.22); transition:transform .2s,box-shadow .2s; }
.btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(0,53,95,.3); }
.btn-primary .icon { font-size:16px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.btn-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-box,.modal-leave-to .modal-box { transform:scale(.96) translateY(8px); }

.icon { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; font-feature-settings:'liga'; -webkit-font-feature-settings:'liga'; -webkit-font-smoothing:antialiased; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

@media (max-width: 1024px) {
  .header-actions { width:100%; }
  .search-wrap-header { width:100%; }
  .search-input-header { width:100%; }
  .table-head-bar { flex-direction:column; align-items:stretch; }
  .table-head-right { justify-content:flex-end; }
  .pagination-bar { padding:.875rem 1rem; }
}

@media (max-width: 768px) {
  .page-header { align-items:flex-start; }
  .create-btn { width:100%; justify-content:center; }
  .metrics-grid { grid-template-columns:1fr; }
  .table-head-title { width:100%; }
  .table-head-right { flex-wrap:wrap; }
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
  .data-row td:nth-child(1)::before { content:'Titulo'; }
  .data-row td:nth-child(2)::before { content:'Tipo'; }
  .data-row td:nth-child(3)::before { content:'Prioridad'; }
  .data-row td:nth-child(4)::before { content:'Estado'; }
  .data-row td:nth-child(5)::before { content:'Fecha Reporte'; }
  .data-row td:nth-child(6)::before { content:'Acciones'; }
  .data-row td:last-child { border-bottom:none; }
  .data-row td.text-right { text-align:left; }
  .actions-row { justify-content:flex-start; flex-wrap:wrap; gap:.4rem; }
  .action-btn { width:2.15rem; height:2.15rem; border:1px solid #e2e8f0; background:#fff; }
  .data-table tbody tr:not(.data-row) td { display:block; }
  .pagination-bar { flex-direction:column; align-items:flex-start; }
  .pagination-controls { width:100%; overflow-x:auto; padding-bottom:.2rem; }
  .modal-overlay { padding:.75rem; }
  .modal-header, .modal-body { padding:1rem; }
  .detail-grid, .form-grid { grid-template-columns:1fr; }
}
</style>
