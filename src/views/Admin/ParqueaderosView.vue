<script setup>
import { ref, computed, onMounted } from 'vue';
import ParqueaderoService from '@/services/Parqueadero.Service';
import ApartamentoService from '@/services/Apartamento.Service';
import ResidenteService from '@/services/Residente.Service';
import UsuarioService from '@/services/Usuario.Service';
import TorreService from '@/services/Torre.Service';
import { swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert';

/* ── Filtros ── */
const filterTipo  = ref('todos');
const searchQuery = ref('');
const currentPage = ref(1);
const perPage     = 8;

/* ── Modal ── */
const showModal   = ref(false);
const modalMode   = ref('crear'); // 'crear' | 'editar' | 'ver'
const selectedEsp = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const activeAutocomplete = ref('');
const autocompleteCloseTimer = ref(null);

const emptyForm = () => ({
  idParqueadero: null,
  apartamentoId: '',
  torreId: '',
  numeroEspacio: '',
  tipoVehiculo: 'carro',
  placa: '',
  residenteId: '',
});
const form = ref(emptyForm());

/* ── Datos ── */
const espacios = ref([]);
const torres = ref([]);
const apartamentos = ref([]);
const residentes = ref([]);
const usuarios = ref([]);
const torreSearch = ref('');
const apartamentoSearch = ref('');
const residenteSearch = ref('');

/* ── Métricas ── */
const metrics = computed(() => {
  const total    = espacios.value.length;
  const carros   = espacios.value.filter(e => e.tipoVehiculo === 'carro').length;
  const motos    = espacios.value.filter(e => e.tipoVehiculo === 'moto').length;
  const bicicletas = espacios.value.filter(e => e.tipoVehiculo === 'bicicleta').length;
  const asignados = espacios.value.filter(e => e.residenteId != null).length;
  return { total, carros, motos, bicicletas, asignados };
});

/* ── Tipo config ── */
const tipoConfig = {
  carro:     { label: 'Carro',     icon: 'directions_car', bg: '#dbeafe', color: '#1e40af' },
  moto:      { label: 'Moto',      icon: 'two_wheeler',    bg: '#d1fae5', color: '#065f46' },
  bicicleta: { label: 'Bicicleta', icon: 'pedal_bike',     bg: '#f3e8ff', color: '#6b21a8' },
};

const safeText = (value) => {
  if (value == null) return '';
  return String(value).toLowerCase();
};

const apartamentosIndex = computed(() => {
  return new Map(apartamentos.value.map((apt) => [Number(apt.idApartamento), apt]));
});

const residentesIndex = computed(() => {
  return new Map(residentes.value.map((res) => [Number(res.idResidente), res]));
});

const usuariosIndex = computed(() => {
  return new Map(usuarios.value.map((usr) => [Number(usr.id), usr]));
});

const torresIndex = computed(() => {
  return new Map(torres.value.map((torre) => [Number(torre.idTorre ?? torre.id), torre]));
});

const getTorreNombre = (espacio) => {
  if (!espacio) return '-';

  const nombreDesdeApi = espacio.torreNombre;
  if (nombreDesdeApi) return nombreDesdeApi;

  if (espacio.torreId == null) return '-';

  const torre = torresIndex.value.get(Number(espacio.torreId));
  return torre?.nombre || '-';
};

const getApartamentoNumero = (espacio) => {
  if (!espacio) return '-';

  const numeroDesdeApi = espacio.numeroApartamento ?? espacio.apartamentoNumero;
  if (numeroDesdeApi) return numeroDesdeApi;

  if (espacio.apartamentoId == null) return '-';

  const apt = apartamentosIndex.value.get(Number(espacio.apartamentoId));
  return apt?.numeroApartamento || apt?.numero || '-';
};

const getResidenteNombre = (espacio) => {
  if (!espacio) return '-';

  if (espacio.residenteNombre) return espacio.residenteNombre;

  if (espacio.residenteId == null) return '-';

  const residente = residentesIndex.value.get(Number(espacio.residenteId));
  const usuario = residente ? usuariosIndex.value.get(Number(residente.usuarioId)) : null;
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim();

  return nombreCompleto || '-';
};

const getTorreLabel = (torre) => {
  return torre.nombre || 'Torre';
};

const getApartamentoLabel = (apartamento) => {
  return apartamento.numeroApartamento || apartamento.numero || 'Sin numero';
};

const getResidenteLabel = (residente) => {
  const usuario = usuariosIndex.value.get(Number(residente.usuarioId));
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim() || `Residente ${residente.idResidente}`;
};

const getApartamentoTorreId = (apartamento) => {
  if (!apartamento) return null;
  const raw = apartamento.torreId ?? apartamento.idTorre;
  if (raw == null || Number.isNaN(Number(raw))) return null;
  return Number(raw);
};

const filteredTorres = computed(() => {
  const term = torreSearch.value.trim().toLowerCase();
  return torres.value
    .filter((torre) => {
      if (!term) return true;
      const id = String(torre.idTorre ?? torre.id ?? '').toLowerCase();
      const nombre = String(torre.nombre ?? '').toLowerCase();
      return id.includes(term) || nombre.includes(term);
    })
    .slice(0, 8);
});

const filteredApartamentos = computed(() => {
  const selectedTorreId = toNumberOrNull(form.value.torreId);
  const term = apartamentoSearch.value.trim().toLowerCase();
  return apartamentos.value
    .filter((apartamento) => {
      const torreId = getApartamentoTorreId(apartamento);
      const matchesTorre = selectedTorreId == null || torreId === selectedTorreId;
      if (!matchesTorre) return false;

      if (!term) return true;
      const id = String(apartamento.idApartamento ?? '').toLowerCase();
      const numero = String(apartamento.numeroApartamento ?? apartamento.numero ?? '').toLowerCase();
      return id.includes(term) || numero.includes(term);
    })
    .slice(0, 8);
});

const filteredResidentes = computed(() => {
  const selectedTorreId = toNumberOrNull(form.value.torreId);
  const selectedApartamentoId = toNumberOrNull(form.value.apartamentoId);
  const term = residenteSearch.value.trim().toLowerCase();
  return residentes.value
    .filter((residente) => {
      const residenteApartamentoId = toNumberOrNull(residente.apartamentoId);
      const residenteApartamento = apartamentosIndex.value.get(Number(residenteApartamentoId));
      const residenteTorreId = getApartamentoTorreId(residenteApartamento);

      const matchesApartamento = selectedApartamentoId == null || residenteApartamentoId === selectedApartamentoId;
      const matchesTorre = selectedTorreId == null || residenteTorreId === selectedTorreId;
      if (!matchesApartamento || !matchesTorre) return false;

      if (!term) return true;
      const label = getResidenteLabel(residente).toLowerCase();
      return label.includes(term);
    })
    .slice(0, 8);
});

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

const selectTorre = (torre) => {
  form.value.torreId = Number(torre.idTorre ?? torre.id);
  torreSearch.value = getTorreLabel(torre);
  form.value.apartamentoId = null;
  apartamentoSearch.value = '';
  form.value.residenteId = null;
  residenteSearch.value = '';
  activeAutocomplete.value = '';
};

const selectApartamento = (apartamento) => {
  form.value.apartamentoId = Number(apartamento.idApartamento);
  apartamentoSearch.value = getApartamentoLabel(apartamento);
  form.value.residenteId = null;
  residenteSearch.value = '';
  activeAutocomplete.value = '';
};

const selectResidente = (residente) => {
  form.value.residenteId = Number(residente.idResidente);
  residenteSearch.value = getResidenteLabel(residente);
  activeAutocomplete.value = '';
};

const onTorreInput = () => {
  form.value.torreId = null;
  form.value.apartamentoId = null;
  apartamentoSearch.value = '';
  form.value.residenteId = null;
  residenteSearch.value = '';
};

const onApartamentoInput = () => {
  form.value.apartamentoId = null;
  form.value.residenteId = null;
  residenteSearch.value = '';
};

const onResidenteInput = () => {
  form.value.residenteId = null;
};

/* ── Filtrado + paginación ── */
const filtered = computed(() => espacios.value.filter(e => {
  const mt = filterTipo.value  === 'todos' || e.tipoVehiculo === filterTipo.value;
  const ms = !searchQuery.value ||
    safeText(e.numeroEspacio).includes(searchQuery.value.toLowerCase()) ||
    safeText(e.placa).includes(searchQuery.value.toLowerCase()) ||
    safeText(getTorreNombre(e)).includes(searchQuery.value.toLowerCase()) ||
    safeText(getApartamentoNumero(e)).includes(searchQuery.value.toLowerCase()) ||
    safeText(getResidenteNombre(e)).includes(searchQuery.value.toLowerCase());
  return mt && ms;
}));

const totalPages  = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const paginated   = computed(() => filtered.value.slice((currentPage.value - 1) * perPage, currentPage.value * perPage));
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || Math.abs(i - currentPage.value) <= 1) pages.push(i);
  }
  return pages;
});

/* ── CRUD ── */
const openCrear  = async () => {
  errorMessage.value = '';
  form.value = emptyForm();
  torreSearch.value = '';
  apartamentoSearch.value = '';
  residenteSearch.value = '';
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value);
    autocompleteCloseTimer.value = null;
  }
  await cargarCatalogos();
  modalMode.value = 'crear';
  showModal.value = true;
};
const openEditar = (e) => {
  errorMessage.value = '';
  form.value = { ...e };
  const torre = torresIndex.value.get(Number(e.torreId));
  const apartamento = apartamentosIndex.value.get(Number(e.apartamentoId));
  const residente = residentesIndex.value.get(Number(e.residenteId));
  torreSearch.value = torre ? getTorreLabel(torre) : '';
  apartamentoSearch.value = apartamento ? getApartamentoLabel(apartamento) : '';
  residenteSearch.value = residente ? getResidenteLabel(residente) : '';
  modalMode.value = 'editar';
  showModal.value = true;
};
const openVer    = (e) => { selectedEsp.value = e; modalMode.value = 'ver'; showModal.value = true; };
const closeModal = () => {
  showModal.value = false;
  activeAutocomplete.value = '';
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value);
    autocompleteCloseTimer.value = null;
  }
};

const toNumberOrNull = (value) => {
  if (value === '' || value == null || Number.isNaN(Number(value))) return null;
  return Number(value);
};

const cargarParqueaderos = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    espacios.value = await ParqueaderoService.listar();
  } catch (error) {
    espacios.value = [];
    errorMessage.value = error?.message || 'No fue posible cargar los parqueaderos.';
  } finally {
    isLoading.value = false;
  }
};

const cargarCatalogos = async () => {
  try {
    const [torresData, apartamentosData, residentesData, usuariosData] = await Promise.all([
      TorreService.listar(),
      ApartamentoService.listar(),
      ResidenteService.listar(),
      UsuarioService.listar(),
    ]);

    torres.value = Array.isArray(torresData) ? torresData : [];
    apartamentos.value = Array.isArray(apartamentosData) ? apartamentosData : [];
    residentes.value = Array.isArray(residentesData) ? residentesData : [];
    usuarios.value = Array.isArray(usuariosData) ? usuariosData : [];
  } catch (error) {
    torres.value = [];
    apartamentos.value = [];
    residentes.value = [];
    usuarios.value = [];
    console.error('No fue posible cargar catalogos de apoyo:', error);
  }
};

const guardar = async () => {
  const payload = {
    idParqueadero: form.value.idParqueadero,
    apartamentoId: toNumberOrNull(form.value.apartamentoId),
    torreId: toNumberOrNull(form.value.torreId),
    numeroEspacio: (form.value.numeroEspacio || '').trim(),
    tipoVehiculo: form.value.tipoVehiculo,
    placa: (form.value.placa || '').trim().toUpperCase(),
    residenteId: toNumberOrNull(form.value.residenteId),
  };

  if (!payload.numeroEspacio || !payload.tipoVehiculo) {
    errorMessage.value = 'Numero de espacio y tipo de vehiculo son obligatorios.';
    await swalError(errorMessage.value);
    return;
  }

  isSaving.value = true;
  errorMessage.value = '';

  try {
    if (modalMode.value === 'crear') {
      await ParqueaderoService.crear(payload);
    } else {
      await ParqueaderoService.actualizar(payload.idParqueadero, payload);
    }

    closeModal();
    await cargarParqueaderos();
    swalSuccess(modalMode.value === 'crear' ? 'Parqueadero creado correctamente.' : 'Parqueadero actualizado correctamente.');
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible guardar el parqueadero.';
    await swalError(errorMessage.value);
  } finally {
    isSaving.value = false;
  }
};

const eliminar = async (id) => {
  const confirmResult = await swalConfirmDelete('este parqueadero');
  if (!confirmResult.isConfirmed) {
    return;
  }

  errorMessage.value = '';

  try {
    await ParqueaderoService.eliminar(id);
    await cargarParqueaderos();
    await swalSuccess('Parqueadero eliminado correctamente.');
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible eliminar el parqueadero.';
    await swalError(errorMessage.value);
  }
};
const goPage   = (p)  => { if (p >= 1 && p <= totalPages.value) currentPage.value = p; };

onMounted(async () => {
  await Promise.all([cargarParqueaderos(), cargarCatalogos()]);
});
</script>

<template>
    <div class="park-view">

      <!-- ── Encabezado ── -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Gestión de Parqueaderos</h2>
          <p class="page-sub">Formulario y tabla adaptados a la entidad Parqueadero.</p>
        </div>
        <button class="create-btn" @click="openCrear">
          <span class="icon">add_circle</span>
          Crear Espacio
        </button>
      </div>

      <!-- ── Métricas ── -->
      <div class="metrics-grid">
        <!-- Total -->
        <div class="metric-card" style="border-left-color:#00355f">
          <div class="metric-top">
            <div class="metric-icon" style="background:#d2e4ff">
              <span class="icon" style="color:#00355f">grid_view</span>
            </div>
            <span class="metric-tag">TOTAL</span>
          </div>
          <h3 class="metric-val">{{ metrics.total }}</h3>
          <p class="metric-lbl">Espacios registrados</p>
        </div>

        <!-- Carros -->
        <div class="metric-card" style="border-left-color:#27ae60">
          <div class="metric-top">
            <div class="metric-icon" style="background:#d1fae5">
              <span class="icon" style="color:#065f46">directions_car</span>
            </div>
            <span class="metric-tag">CARROS</span>
          </div>
          <h3 class="metric-val">{{ metrics.carros }}</h3>
          <p class="metric-lbl">Espacios para carro</p>
        </div>

        <!-- Motos -->
        <div class="metric-card" style="border-left-color:#3b82f6">
          <div class="metric-top">
            <div class="metric-icon" style="background:#dbeafe">
              <span class="icon" style="color:#1e40af">two_wheeler</span>
            </div>
            <span class="metric-tag">MOTOS</span>
          </div>
          <h3 class="metric-val">{{ metrics.motos }}</h3>
          <p class="metric-lbl">Espacios para moto</p>
        </div>

        <!-- Asignados -->
        <div class="metric-card" style="border-left-color:#6b21a8">
          <div class="metric-top">
            <div class="metric-icon" style="background:#ede9fe">
              <span class="icon" style="color:#6b21a8">person</span>
            </div>
            <span class="metric-tag">ASIGNADOS</span>
          </div>
          <h3 class="metric-val">{{ metrics.asignados }}</h3>
          <p class="metric-lbl">Con residente asociado</p>
        </div>
      </div>

      <!-- ── Tabla ── -->
      <div class="table-card">
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <!-- Filtros -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-wrap">
              <span class="icon search-ic">search</span>
              <input v-model="searchQuery" class="search-input" placeholder="Buscar por espacio, placa, apartamento o residente" @input="currentPage = 1"/>
            </div>
            <div class="filter-group">
              <label class="filter-lbl">Tipo</label>
              <select v-model="filterTipo" class="filter-select" @change="currentPage = 1">
                <option value="todos">Todos</option>
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
                <option value="bicicleta">Bicicleta</option>
              </select>
            </div>
          </div>
          <div class="filter-actions">
            <button class="filter-action-btn">
              <span class="icon">filter_list</span> Filtros
            </button>
            <button class="filter-action-btn">
              <span class="icon">download</span> Exportar
            </button>
          </div>
        </div>

        <!-- Tabla de datos -->
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Número Espacio</th>
                <th>Torre</th>
                <th>Apartamento</th>
                <th>Residente</th>
                <th>Tipo Vehículo</th>
                <th>Placa</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="7" class="empty-state">
                  <span class="icon empty-icon">hourglass_top</span>
                  <p>Cargando parqueaderos...</p>
                </td>
              </tr>
              <tr v-for="esp in isLoading ? [] : paginated" :key="esp.idParqueadero" class="data-row">

                <!-- Número de espacio -->
                <td>
                  <span class="space-id">{{ esp.numeroEspacio }}</span>
                </td>

                <!-- Torre -->
                <td>{{ getTorreNombre(esp) }}</td>

                <!-- Apartamento -->
                <td>{{ getApartamentoNumero(esp) }}</td>

                <!-- Residente -->
                <td>{{ getResidenteNombre(esp) }}</td>

                <!-- Tipo -->
                <td>
                  <div class="tipo-cell">
                    <div class="tipo-icon" :style="{ background: tipoConfig[esp.tipoVehiculo]?.bg || '#f1f5f9' }">
                      <span class="icon" :style="{ color: tipoConfig[esp.tipoVehiculo]?.color || '#475569' }">
                        {{ tipoConfig[esp.tipoVehiculo]?.icon || 'local_parking' }}
                      </span>
                    </div>
                    <span class="tipo-label">{{ (tipoConfig[esp.tipoVehiculo]?.label || esp.tipoVehiculo || '-').toUpperCase() }}</span>
                  </div>
                </td>

                <!-- Placa -->
                <td>
                  <span v-if="esp.placa" class="placa-badge">{{ esp.placa }}</span>
                  <span v-else class="no-placa">N/A</span>
                </td>

                <!-- Acciones -->
                <td class="text-right">
                  <div class="actions-row">
                    <button class="action-btn view" title="Ver" @click="openVer(esp)">
                      <span class="icon">visibility</span>
                    </button>
                    <button class="action-btn edit" title="Editar" @click="openEditar(esp)">
                      <span class="icon">edit</span>
                    </button>
                    <button class="action-btn delete" title="Eliminar" @click="eliminar(esp.idParqueadero)">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!isLoading && paginated.length === 0">
                <td colspan="7" class="empty-state">
                  <span class="icon empty-icon">search_off</span>
                  <p>No se encontraron espacios con los filtros aplicados.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="pagination-bar">
          <span class="pagination-info">
            Mostrando {{ ((currentPage - 1) * perPage) + 1 }}–{{ Math.min(currentPage * perPage, filtered.length) }}
            de {{ filtered.length }} espacios
          </span>
          <div class="pagination-controls">
            <button class="page-btn arrow" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
              <span class="icon">chevron_left</span>
            </button>
            <template v-for="(p, i) in visiblePages" :key="p">
              <span v-if="i > 0 && p - visiblePages[i-1] > 1" class="page-ellipsis">…</span>
              <button class="page-btn" :class="{ active: p === currentPage }" @click="goPage(p)">{{ p }}</button>
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

            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon">
                  <span class="icon">local_parking</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ modalMode === 'crear' ? 'Nuevo Espacio' : modalMode === 'editar' ? 'Editar Espacio' : 'Detalle del Espacio' }}
                  </h3>
                  <p class="modal-sub">
                    {{ modalMode === 'crear' ? 'Complete los datos de la entidad Parqueadero.' : modalMode === 'editar' ? `Modificando #${form.idParqueadero}` : 'Información general del espacio.' }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal">
                <span class="icon">close</span>
              </button>
            </div>

            <!-- Ver -->
            <div v-if="modalMode === 'ver' && selectedEsp" class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Número Espacio</span>
                  <span class="detail-value mono">{{ selectedEsp.numeroEspacio }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tipo Vehículo</span>
                  <div class="tipo-cell" style="margin-top:4px">
                    <div class="tipo-icon" :style="{ background: tipoConfig[selectedEsp.tipoVehiculo]?.bg || '#f1f5f9' }">
                      <span class="icon" :style="{ color: tipoConfig[selectedEsp.tipoVehiculo]?.color || '#475569' }">{{ tipoConfig[selectedEsp.tipoVehiculo]?.icon || 'local_parking' }}</span>
                    </div>
                    <span class="tipo-label">{{ tipoConfig[selectedEsp.tipoVehiculo]?.label || selectedEsp.tipoVehiculo }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Placa</span>
                  <span v-if="selectedEsp.placa" class="placa-badge">{{ selectedEsp.placa }}</span>
                  <span v-else class="no-placa">N/A</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Torre</span>
                  <span class="detail-value">{{ getTorreNombre(selectedEsp) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Apartamento</span>
                  <span class="detail-value">{{ getApartamentoNumero(selectedEsp) }}</span>
                </div>
                <div class="detail-item full">
                  <span class="detail-label">Residente</span>
                  <span class="detail-value">{{ getResidenteNombre(selectedEsp) }}</span>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
                <button class="btn-primary" @click="openEditar(selectedEsp)">
                  <span class="icon">edit</span> Editar
                </button>
              </div>
            </div>

            <!-- Crear / Editar -->
            <div v-else-if="modalMode !== 'ver'" class="modal-body">
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Número de Espacio</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">local_parking</span>
                    <input v-model="form.numeroEspacio" class="form-input" placeholder="Ej. P1-001" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Tipo de Vehículo</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">{{ tipoConfig[form.tipoVehiculo]?.icon || 'directions_car' }}</span>
                    <select v-model="form.tipoVehiculo" class="form-input">
                      <option value="carro">Carro</option>
                      <option value="moto">Moto</option>
                      <option value="bicicleta">Bicicleta</option>
                    </select>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Torre</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">home</span>
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
                      placeholder="Busca apartamento por número o ID"
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
                  <label class="form-label">Placa</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">pin</span>
                    <input v-model="form.placa" class="form-input" placeholder="Ej. ABC-123" style="text-transform:uppercase"/>
                  </div>
                </div>
                <div class="form-field full">
                  <label class="form-label">Residente</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">person</span>
                    <input
                      v-model="residenteSearch"
                      class="form-input"
                      type="text"
                      placeholder="Busca residente por nombre"
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
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="isSaving" @click="guardar">
                  <span class="icon">{{ modalMode === 'crear' ? 'add_circle' : 'save' }}</span>
                  {{ isSaving ? 'Guardando...' : (modalMode === 'crear' ? 'Crear Espacio' : 'Guardar Cambios') }}
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
.park-view { display: flex; flex-direction: column; gap: 1.75rem; font-family: 'Plus Jakarta Sans', sans-serif; }

/* ─── HEADER ─── */
.page-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.page-title  { font-size: 1.875rem; font-weight: 800; color: #00355f; letter-spacing: -0.04em; margin: 0 0 0.25rem; line-height: 1.15; }
.page-sub    { font-size: 0.875rem; color: #64748b; margin: 0; font-weight: 500; }

.create-btn {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #00355f, #0f4c81);
  color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 700;
  border: none; border-radius: 0.75rem; padding: 0.75rem 1.25rem; cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,53,95,0.28); transition: transform 0.2s, box-shadow 0.2s;
}
.create-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,53,95,0.32); }
.create-btn .icon { font-size: 18px; }

/* ─── MÉTRICAS ─── */
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.125rem; }

.metric-card {
  background: #fff; border-radius: 1rem; padding: 1.25rem;
  border-left: 4px solid #00355f;
  box-shadow: 0 1px 3px rgba(0,53,95,0.05), 0 4px 12px rgba(0,53,95,0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}
.metric-card:hover { box-shadow: 0 4px 16px rgba(0,53,95,0.1); transform: translateY(-1px); }

.metric-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.875rem; }
.metric-icon { width: 2.375rem; height: 2.375rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; }
.metric-icon .icon { font-size: 20px; }
.metric-tag  { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
.metric-val  { font-size: 1.875rem; font-weight: 800; color: #00355f; letter-spacing: -0.04em; margin: 0 0 0.2rem; line-height: 1; }
.metric-lbl  { font-size: 0.775rem; color: #64748b; font-weight: 500; margin: 0; }

.metric-ratio-row { display: flex; align-items: baseline; gap: 0.5rem; }
.metric-ratio-lbl { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

.ratio-bar { display: flex; width: 100%; height: 4px; border-radius: 99px; overflow: hidden; margin-top: 0.625rem; background: #e2e8f0; }
.ratio-fill.carros { background: #0f4c81; }
.ratio-fill.motos  { background: #4edea3; }

/* ─── TABLA CARD ─── */
.table-card { background: #fff; border-radius: 1.25rem; box-shadow: 0 1px 3px rgba(0,53,95,0.05), 0 4px 16px rgba(0,53,95,0.06); overflow: hidden; }
.error-banner {
  margin: 0;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* Filter bar */
.filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.875rem; padding: 1.125rem 1.5rem; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
.filter-left { display: flex; align-items: center; gap: 0.875rem; flex-wrap: wrap; }
.filter-actions { display: flex; gap: 0.5rem; }

.search-wrap { position: relative; }
.search-ic   { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 16px; color: #94a3b8; pointer-events: none; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.search-input {
  background: #f1f5f9; border: 1.5px solid transparent; border-radius: 0.625rem;
  padding: 0.55rem 0.875rem 0.55rem 2.5rem; font-size: 0.8125rem;
  font-family: 'Plus Jakarta Sans', sans-serif; color: #0d1b2a; width: 230px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input::placeholder { color: #b0bac5; }
.search-input:focus { outline: none; background: #fff; border-color: #0f4c81; box-shadow: 0 0 0 3px rgba(15,76,129,0.1); }

.filter-group { display: flex; align-items: center; gap: 0.5rem; }
.filter-lbl   { font-size: 0.75rem; font-weight: 700; color: #64748b; }
.filter-select {
  background: #f1f5f9; border: 1.5px solid transparent; border-radius: 0.625rem;
  padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.8125rem;
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; color: #334155;
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.625rem center;
}
.filter-select:focus { outline: none; border-color: #0f4c81; background-color: #fff; }

.filter-action-btn {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; font-weight: 700; color: #64748b;
  background: #f1f5f9; border: none; border-radius: 0.625rem;
  padding: 0.5rem 0.875rem; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
  transition: background 0.15s, color 0.15s;
}
.filter-action-btn:hover { background: #e2e8f0; color: #00355f; }
.filter-action-btn .icon { font-size: 16px; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

/* Tabla */
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
.data-table { width: 100%; min-width: 980px; border-collapse: collapse; text-align: left; }
.data-table thead tr { background: #f8fafc; }
.data-table th { padding: 0.875rem 1.125rem; font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.data-row td { padding: 0.875rem 1.125rem; font-size: 0.8125rem; color: #475569; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: #f8fafc; }
.text-right { text-align: right; }

.space-id { font-weight: 800; color: #00355f; font-size: 0.9rem; font-family: 'Courier New', monospace; }

.tipo-cell  { display: flex; align-items: center; gap: 0.625rem; }
.tipo-icon  { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tipo-icon .icon { font-size: 16px; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.tipo-label { font-size: 0.8rem; font-weight: 700; color: #334155; }

.placa-badge { font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155; border-radius: 0.375rem; padding: 0.2rem 0.5rem; }
.no-placa   { font-size: 0.75rem; color: #94a3b8; font-style: italic; }

.estado-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.625rem; font-weight: 800; letter-spacing: 0.05em; white-space: nowrap; }
.estado-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.resident-cell   { display: flex; align-items: center; gap: 0.625rem; }
.resident-avatar { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 800; flex-shrink: 0; letter-spacing: 0.03em; }
.resident-info   { display: flex; flex-direction: column; }
.resident-name   { font-size: 0.8125rem; font-weight: 700; color: #0d1b2a; line-height: 1.2; }
.resident-apt    { font-size: 0.65rem; color: #94a3b8; font-weight: 600; }
.no-resident     { font-size: 0.775rem; color: #94a3b8; font-style: italic; }

.actions-row { display: flex; align-items: center; justify-content: flex-end; gap: 2px; }
.action-btn  { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 0.5rem; cursor: pointer; transition: background 0.15s, color 0.15s; }
.action-btn .icon { font-size: 18px; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.action-btn.view   { color: #94a3b8; } .action-btn.view:hover   { background: rgba(15,76,129,0.08); color: #0f4c81; }
.action-btn.edit   { color: #94a3b8; } .action-btn.edit:hover   { background: rgba(15,76,129,0.08); color: #0f4c81; }
.action-btn.delete { color: #94a3b8; } .action-btn.delete:hover { background: rgba(186,26,26,0.08); color: #ba1a1a; }

.empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; }
.empty-icon  { font-size: 48px; display: block; margin-bottom: 0.75rem; font-variation-settings: 'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 48; }

/* ─── PAGINACIÓN ─── */
.pagination-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 0.875rem 1.5rem; background: #fafbfc; border-top: 1px solid #f1f5f9; }
.pagination-info { font-size: 0.8rem; font-weight: 500; color: #64748b; }
.pagination-controls { display: flex; align-items: center; gap: 0.375rem; }
.page-btn { width: 2.25rem; height: 2.25rem; display: flex; align-items: center; justify-content: center; border: 1.5px solid #e2e8f0; border-radius: 0.625rem; background: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; font-weight: 700; color: #475569; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #94a3b8; color: #00355f; }
.page-btn.active  { background: linear-gradient(135deg,#00355f,#0f4c81); color: #fff; border-color: transparent; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn.arrow .icon { font-size: 18px; }
.page-ellipsis { color: #94a3b8; font-weight: 700; padding: 0 0.25rem; }


/* ─── MODAL ─── */
.modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; padding: 1.5rem; backdrop-filter: blur(4px); }
.modal-box     { background: #fff; border-radius: 1.5rem; width: 100%; max-width: 520px; box-shadow: 0 24px 64px rgba(0,53,95,0.2); overflow: hidden; }

.modal-header    { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.5rem 1.75rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
.modal-title-row { display: flex; align-items: center; gap: 0.875rem; }
.modal-title-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; background: linear-gradient(135deg,#00355f,#0f4c81); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-title-icon .icon { font-size: 20px; color: #fff; font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.modal-title { font-size: 1.125rem; font-weight: 800; color: #0d1b2a; margin: 0 0 0.2rem; letter-spacing: -0.03em; }
.modal-sub   { font-size: 0.775rem; color: #64748b; margin: 0; font-weight: 500; }
.modal-close { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: none; border-radius: 0.5rem; cursor: pointer; color: #64748b; transition: background 0.15s; flex-shrink: 0; }
.modal-close:hover { background: #e2e8f0; }
.modal-close .icon { font-size: 18px; }

.modal-body { padding: 1.5rem 1.75rem; }

.detail-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 1.125rem; margin-bottom: 1.5rem; }
.detail-item.full { grid-column: 1 / -1; }
.detail-label { display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 0.375rem; }
.detail-value { font-size: 0.9rem; font-weight: 700; color: #0d1b2a; }
.detail-value.mono { font-family: 'Courier New', monospace; font-size: 0.825rem; color: #475569; }

.form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.form-field { display: flex; flex-direction: column; gap: 0.375rem; }
.form-field.full { grid-column: 1 / -1; }
.form-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; }
.form-input-wrap { position: relative; display: flex; align-items: center; }
.form-icon  { position: absolute; left: 0.75rem; font-size: 16px; color: #94a3b8; pointer-events: none; z-index: 1; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.form-input {
  width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
  padding: 0.7rem 0.875rem 0.7rem 2.5rem; font-size: 0.875rem;
  font-family: 'Plus Jakarta Sans', sans-serif; color: #0d1b2a;
  transition: border-color 0.2s, box-shadow 0.2s; appearance: none;
}
.form-input::placeholder { color: #b0bac5; }
.form-input:focus { outline: none; background: #fff; border-color: #0f4c81; box-shadow: 0 0 0 3px rgba(15,76,129,0.12); }

.autocomplete-wrap { position: relative; }

.autocomplete-list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  box-shadow: 0 4px 12px rgba(15, 76, 129, 0.16);
}

.autocomplete-item {
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.autocomplete-item:hover {
  background: #0f4c81;
  color: #fff;
}

.autocomplete-item:first-child {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.autocomplete-item:last-child {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; padding-top: 1.25rem; border-top: 1px solid #f1f5f9; }
.btn-secondary { background: #f1f5f9; color: #475569; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 700; border: none; border-radius: 0.75rem; padding: 0.7rem 1.25rem; cursor: pointer; transition: background 0.15s; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary { display: flex; align-items: center; gap: 0.375rem; background: linear-gradient(135deg,#00355f,#0f4c81); color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 700; border: none; border-radius: 0.75rem; padding: 0.7rem 1.25rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,53,95,0.22); transition: transform 0.2s, box-shadow 0.2s; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,53,95,0.3); }
.btn-primary:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: 0 4px 12px rgba(0,53,95,0.22); }
.btn-primary .icon { font-size: 16px; font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.96) translateY(8px); }

/* Material Symbols */
.icon { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; direction: ltr; font-feature-settings: 'liga'; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

@media (max-width: 1024px) {
  .filter-bar { padding: 1rem; }
  .filter-left, .filter-actions { width: 100%; }
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
  .data-row td:nth-child(1)::before { content: 'Numero espacio'; }
  .data-row td:nth-child(2)::before { content: 'Torre'; }
  .data-row td:nth-child(3)::before { content: 'Apartamento'; }
  .data-row td:nth-child(4)::before { content: 'Residente'; }
  .data-row td:nth-child(5)::before { content: 'Tipo vehiculo'; }
  .data-row td:nth-child(6)::before { content: 'Placa'; }
  .data-row td:nth-child(7)::before { content: 'Acciones'; }
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
  .detail-grid,
  .form-grid { grid-template-columns: 1fr; }
}
</style>