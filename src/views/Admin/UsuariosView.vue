<script setup>
import { ref, computed, onMounted } from 'vue';
import UsuarioService from '../../services/Usuario.Service';
import ResidenteService from '@/services/Residente.Service';
import CorreoMasivoService from '../../services/CorreoMasivo.Service';
import { swalConfirmAction, swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert';

/* ── Filtros ── */
const filterRol    = ref('todos');
const filterEstado = ref('todos');
const searchQuery  = ref('');
const currentPage  = ref(1);
const perPage      = 8;

/* ── Modal ── */
const showModal    = ref(false);
const modalMode    = ref('crear');
const selectedUser = ref(null);
const showPassModal = ref(false);
const passUserId   = ref(null);
const isSaving = ref(false);
const isLoadingUsers = ref(false);
const formError = ref('');

const emptyForm = () => ({
  id: '', nombre: '', apellido: '', email: '', identificacion: '',
  telefono: '', rol: '', estado: 'activo',
  claveHash: '', ultimoAcceso: '', permisos: [],
  residenteId: null,
});
const form = ref(emptyForm());
const residentes = ref([]);
const residenteSearch = ref('');
const activeAutocomplete = ref('');
const autocompleteCloseTimer = ref(null);
const showEmailModal = ref(false);
const isSendingMassEmail = ref(false);
const emailForm = ref({
  subject: '',
  body: '',
});

/* ── Roles config ── */
const rolConfig = {
  administrador: { label: 'Administrador', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe', icon: 'home' },
  vigilante:     { label: 'Vigilante',     bg: '#d1fae5', color: '#065f46', border: '#a7f3d0', icon: 'shield'  },
  mantenimiento: { label: 'Mantenimiento', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: 'construction' },
  residente:     { label: 'Residente',     bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe', icon: 'apartment' },
};

const estadoConfig = {
  activo:    { label: 'Activo',    bg: '#d1fae5', color: '#065f46', dot: '#27ae60' },
  inactivo:  { label: 'Inactivo',  bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  suspendido:{ label: 'Suspendido',bg: '#ffdad6', color: '#93000a', dot: '#ba1a1a' },
};

/* ── Datos ── */
const usuarios = ref([]);

const fullName = (u) => `${u.nombre || ''} ${u.apellido || ''}`.trim();
const isEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());

/* ── Métricas ── */
const metrics = computed(() => ({
  total:        usuarios.value.length,
  admins:       usuarios.value.filter(u => u.rol === 'administrador').length,
  residentes:   usuarios.value.filter(u => u.rol === 'residente').length,
  activosHoy:   usuarios.value.filter(u => u.estado === 'activo').length,
}));

/* ── Avatares ── */
const avatarColors = [
  { bg: '#dbeafe', color: '#1e40af' }, { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef3c7', color: '#92400e' }, { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fce7f3', color: '#9d174d' }, { bg: '#ffedd5', color: '#9a3412' },
  { bg: '#f0fdf4', color: '#14532d' }, { bg: '#f5f3ff', color: '#4c1d95' },
];
const avatarColor = (str) => avatarColors[(str?.charCodeAt(0) || 0) % avatarColors.length];
const initials    = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '–';

/* ── Filtrado + paginación ── */
const filtered = computed(() => usuarios.value.filter(u => {
  const mr = filterRol.value    === 'todos' || u.rol    === filterRol.value;
  const me = filterEstado.value === 'todos' || u.estado === filterEstado.value;
  const userId = String(u.id ?? '').toLowerCase();
  const ms = !searchQuery.value ||
    fullName(u).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.value.toLowerCase())  ||
    u.identificacion.includes(searchQuery.value)                     ||
    userId.includes(searchQuery.value.toLowerCase());
  return mr && me && ms;
}));

const totalPages   = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const paginated    = computed(() => filtered.value.slice((currentPage.value-1)*perPage, currentPage.value*perPage));
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++)
    if (i===1 || i===totalPages.value || Math.abs(i-currentPage.value)<=1) pages.push(i);
  return pages;
});

const destinatariosCorreoMasivo = computed(() =>
  usuarios.value.filter(u => u.estado === 'activo' && isEmailValido(u.email))
);

const getResidenteNombreCompleto = (r) => {
  if (r.nombre || r.apellido) return (r.nombre + ' ' + (r.apellido || '')).trim()
  if (r.usuarioNombre || r.usuarioApellido) return (r.usuarioNombre + ' ' + (r.usuarioApellido || '')).trim()
  return 'Residente ' + r.idResidente
}

const filteredResidentes = computed(() => {
  const term = residenteSearch.value.trim().toLowerCase()
  return residentes.value
    .filter((r) => {
      if (!term) return true
      const full = getResidenteNombreCompleto(r).toLowerCase()
      return full.includes(term)
    })
    .slice(0, 8)
})

const selectResidente = (residente) => {
  form.value.residenteId = residente.idResidente
  form.value.nombre = residente.nombre || residente.usuarioNombre || ''
  form.value.apellido = residente.apellido || residente.usuarioApellido || ''
  residenteSearch.value = getResidenteNombreCompleto(residente)
  activeAutocomplete.value = ''
}

const onResidenteInput = () => {
  form.value.residenteId = null
}

const clearAutocompleteUsr = () => {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
  }
  autocompleteCloseTimer.value = setTimeout(() => {
    activeAutocomplete.value = ''
    autocompleteCloseTimer.value = null
  }, 180)
}

const openAutocompleteUsr = (field) => {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
    autocompleteCloseTimer.value = null
  }
  activeAutocomplete.value = field
}

/* ── CRUD ── */
const openCrear   = () => { formError.value = ''; form.value = emptyForm(); residenteSearch.value = ''; modalMode.value = 'crear'; showModal.value = true; };
const openEditar  = (u) => {
  formError.value = ''
  form.value = {...u, claveHash: '', residenteId: u.residenteId ?? null}
  const res = residentes.value.find(r => r.idResidente === u.residenteId)
  residenteSearch.value = res ? getResidenteNombreCompleto(res) : ''
  modalMode.value = 'editar'
  showModal.value = true
};
const openVer     = (u) => { selectedUser.value = u; modalMode.value = 'ver'; showModal.value = true; };
const closeModal  = () => { showModal.value = false; formError.value = ''; };

const validarFormulario = () => {
  if (!form.value.nombre?.trim() && !form.value.residenteId) return 'El nombre es obligatorio o selecciona un residente.';
  if (!form.value.apellido?.trim() && !form.value.residenteId) return 'El apellido es obligatorio o selecciona un residente.';
  if (!form.value.email?.trim()) return 'El correo electrónico es obligatorio.';
  if (!form.value.identificacion?.trim()) return 'La identificación es obligatoria.';
  if (modalMode.value === 'crear' && !form.value.claveHash?.trim()) return 'La contraseña temporal es obligatoria.';
  return '';
};

const cargarUsuarios = async () => {
  isLoadingUsers.value = true;
  try {
    const [usuariosData, residentesData] = await Promise.all([
      UsuarioService.listar(),
      ResidenteService.listar(),
    ])
    usuarios.value = Array.isArray(usuariosData) ? usuariosData : []
    residentes.value = Array.isArray(residentesData) ? residentesData : []
  } catch (error) {
    console.error('Error cargando datos:', error);
  } finally {
    isLoadingUsers.value = false;
  }
};

const guardar = async () => {
  formError.value = validarFormulario();
  if (formError.value) {
    await swalError(formError.value);
    return;
  }

  isSaving.value = true;
  try {
    if (modalMode.value === 'crear') {
      const creado = await UsuarioService.crear(form.value);
      usuarios.value.unshift(creado);
    } else {
      const actualizado = await UsuarioService.actualizar(form.value.id, form.value);
      const idx = usuarios.value.findIndex(u => u.id === form.value.id);
      if (idx !== -1) usuarios.value[idx] = actualizado;
    }
    closeModal();
    swalSuccess(modalMode.value === 'crear' ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.');
  } catch (error) {
    formError.value = error?.message || 'No fue posible guardar el usuario. Verifica los datos e inténtalo de nuevo.';
    await swalError(formError.value);
    console.error('Error guardando usuario:', error);
  } finally {
    isSaving.value = false;
  }
};

const cambiarEstado = async (usuario, estadoObjetivo) => {
  const accion = estadoObjetivo === 'activo' ? 'activar' : 'suspender';
  const nombreUsuario = fullName(usuario) || `usuario ${usuario.id}`;
  const confirmResult = await swalConfirmAction({
    title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
    text: `Se va a ${accion} a ${nombreUsuario}.`,
    confirmButtonText: `Sí, ${accion}`,
  });

  if (!confirmResult.isConfirmed) {
    return;
  }

  const u = usuarios.value.find(item => item.id === usuario.id);
  if (u) {
    u.estado = estadoObjetivo;
    await swalSuccess(`Usuario ${estadoObjetivo === 'activo' ? 'activado' : 'suspendido'} correctamente.`);
  }
};

const eliminar = async (id) => {
  const confirmResult = await swalConfirmDelete('este usuario');
  if (!confirmResult.isConfirmed) {
    return;
  }

  try {
    await UsuarioService.eliminar(id);
    usuarios.value = usuarios.value.filter(u => u.id !== id);
    await swalSuccess('Usuario eliminado correctamente.');
  } catch (error) {
    await swalError(error?.message || 'No fue posible eliminar el usuario.');
    console.error('Error eliminando usuario:', error);
  }
};
const goPage   = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p; };

const openEmailModal = () => {
  emailForm.value = { subject: '', body: '' };
  showEmailModal.value = true;
};

const closeEmailModal = () => {
  if (isSendingMassEmail.value) return;
  showEmailModal.value = false;
};

const enviarCorreosMasivos = async () => {
  const subject = emailForm.value.subject?.trim() || '';
  const body = emailForm.value.body?.trim() || '';

  if (!subject) {
    await swalError('El asunto es obligatorio.');
    return;
  }

  if (!body) {
    await swalError('El cuerpo del mensaje es obligatorio.');
    return;
  }

  if (!destinatariosCorreoMasivo.value.length) {
    await swalError('No hay usuarios activos con correo válido para enviar.');
    return;
  }

  const confirmResult = await swalConfirmAction({
    title: '¿Enviar correos masivos?',
    text: `Se enviará el mensaje a ${destinatariosCorreoMasivo.value.length} usuario(s) activo(s).`,
    confirmButtonText: 'Sí, enviar correos',
    icon: 'question',
  });

  if (!confirmResult.isConfirmed) {
    return;
  }

  isSendingMassEmail.value = true;
  let envioExitoso = false;
  try {
    const response = await CorreoMasivoService.enviarMasivo({
      subject,
      body,
      recipients: destinatariosCorreoMasivo.value,
    });

    envioExitoso = true;
    await swalSuccess(response?.message || 'Correos masivos enviados correctamente.');
  } catch (error) {
    await swalError(error?.message || 'No fue posible enviar los correos masivos.');
    console.error('Error enviando correos masivos:', error);
  } finally {
    isSendingMassEmail.value = false;
    if (envioExitoso) {
      showEmailModal.value = false;
    }
  }
};

const openPassReset = async (usuario) => {
  const nombreUsuario = fullName(usuario) || `usuario ${usuario.id}`;
  const confirmResult = await swalConfirmAction({
    title: '¿Restablecer contraseña?',
    text: `Se enviará un enlace de restablecimiento a ${nombreUsuario}.`,
    confirmButtonText: 'Sí, enviar enlace',
    icon: 'question',
  });

  if (!confirmResult.isConfirmed) {
    return;
  }

  await swalSuccess('Enlace de restablecimiento enviado correctamente.');
};

onMounted(() => {
  cargarUsuarios();
});
</script>

<template>
    <div class="usr-view">

      <!-- ── Encabezado ── -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Gestión de Usuarios</h2>
          <p class="page-sub">Control centralizado de acceso para administradores, residentes y personal.</p>
        </div>
        <div class="header-actions">
          <button class="mass-email-btn" @click="openEmailModal">
            <span class="icon">mail</span>
            Correos Masivos
          </button>
          <button class="create-btn" @click="openCrear">
            <span class="icon">person_add</span>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- ── Métricas ── -->
      <div class="metrics-grid">

        <!-- Total -->
        <div class="metric-card" style="border-left-color:#00355f">
          <div class="metric-top">
            <div class="metric-icon" style="background:rgba(0,53,95,0.08)">
              <span class="icon" style="color:#00355f">group</span>
            </div>
            <span class="metric-tag">TOTAL</span>
          </div>
          <h3 class="metric-val">{{ metrics.total.toLocaleString() }}</h3>
          <p class="metric-lbl">Usuarios registrados</p>
        </div>

        <!-- Admins -->
        <div class="metric-card" style="border-left-color:#1e40af">
          <div class="metric-top">
            <div class="metric-icon" style="background:#dbeafe">
              <span class="icon" style="color:#1e40af">shield</span>
            </div>
            <span class="metric-tag">ADMINS</span>
          </div>
          <h3 class="metric-val">{{ metrics.admins }}</h3>
          <p class="metric-lbl">Gestores del sistema</p>
        </div>

        <!-- Residentes -->
        <div class="metric-card" style="border-left-color:#5b21b6">
          <div class="metric-top">
            <div class="metric-icon" style="background:#ede9fe">
              <span class="icon" style="color:#5b21b6">apartment</span>
            </div>
            <span class="metric-tag">RESIDENTES</span>
          </div>
          <h3 class="metric-val">{{ metrics.residentes.toLocaleString() }}</h3>
          <p class="metric-lbl">Usuarios residentes</p>
        </div>

        <!-- Activos hoy -->
        <div class="metric-card accent-green">
          <div class="metric-top">
            <div class="metric-icon" style="background:rgba(111,251,190,0.3)">
              <span class="icon" style="color:#005539;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24">bolt</span>
            </div>
            <span class="metric-tag" style="color:rgba(255,255,255,0.6)">HOY</span>
          </div>
          <h3 class="metric-val" style="color:#fff">{{ metrics.activosHoy }}</h3>
          <p class="metric-lbl" style="color:rgba(255,255,255,0.75)">Usuarios activos hoy</p>
        </div>

      </div>

      <!-- ── Tabla ── -->
      <div class="table-card">

        <!-- Filtros -->
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-wrap">
              <span class="icon search-ic">search</span>
              <input v-model="searchQuery" class="search-input" placeholder="Buscar por nombre, email o ID…" @input="currentPage=1"/>
            </div>
            <div class="filter-group">
              <label class="filter-lbl">Rol</label>
              <select v-model="filterRol" class="filter-select" @change="currentPage=1">
                <option value="todos">Todos</option>
                <option value="administrador">Administrador</option>
                <option value="vigilante">Vigilante</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="residente">Residente</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-lbl">Estado</label>
              <select v-model="filterEstado" class="filter-select" @change="currentPage=1">
                <option value="todos">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>
          <div class="filter-actions">
            <button class="filter-action-btn">
              <span class="icon">filter_list</span> Filtrar
            </button>
            <button class="filter-action-btn">
              <span class="icon">download</span> Exportar
            </button>
          </div>
        </div>

        <!-- Tabla datos -->
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Identificación</th>
                <th>Contacto</th>
                <th>Residente</th>
                <th>Rol</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in paginated"
                :key="u.id"
                class="data-row"
                :class="{ dimmed: u.estado !== 'activo' }"
              >
                <!-- Nombre -->
                <td>
                  <div class="user-cell">
                    <div class="u-avatar" :style="{ background: avatarColor(fullName(u)).bg, color: avatarColor(fullName(u)).color }">
                      {{ initials(fullName(u)) }}
                    </div>
                    <div class="u-info">
                      <p class="u-name">{{ fullName(u) }}</p>
                    </div>
                  </div>
                </td>

                <!-- Identificación -->
                <td><span class="td-id">{{ u.identificacion }}</span></td>

                <!-- Contacto -->
                <td><span class="td-tel">{{ u.telefono }}</span></td>

                <!-- Residente -->
                <td>
                  <span v-if="u.residenteId" class="residente-badge" :class="u.residenteTipoResidente === 'PROPIETARIO' ? 'propietario' : 'arrendatario'">
                    <span class="icon">apartment</span>
                    {{ u.residenteTipoResidente === 'PROPIETARIO' ? 'Propietario' : u.residenteTipoResidente === 'ARRENDATARIO' ? 'Arrendatario' : 'Residente' }}
                  </span>
                  <span v-else class="no-residente">-</span>
                </td>

                <!-- Rol -->
                <td>
                  <span
                    class="rol-badge"
                    :style="{
                      background:   rolConfig[u.rol]?.bg,
                      color:        rolConfig[u.rol]?.color,
                      borderColor:  rolConfig[u.rol]?.border,
                    }"
                  >
                    <span class="icon rol-icon">{{ rolConfig[u.rol]?.icon }}</span>
                    {{ rolConfig[u.rol]?.label }}
                  </span>
                </td>

                <!-- Estado -->
                <td>
                  <span class="estado-badge" :style="{ background: estadoConfig[u.estado].bg, color: estadoConfig[u.estado].color }">
                    <span class="estado-dot" :style="{ background: estadoConfig[u.estado].dot }"></span>
                    {{ estadoConfig[u.estado].label }}
                  </span>
                </td>

                
                <!-- Acciones -->
                <td class="text-right">
                  <div class="actions-row">
                    <button class="action-btn view"    title="Ver perfil"         @click="openVer(u)">
                      <span class="icon">visibility</span>
                    </button>
                    <button class="action-btn edit"    title="Editar"             @click="openEditar(u)">
                      <span class="icon">edit</span>
                    </button>
                    <button class="action-btn pass"    title="Restablecer clave"  @click="openPassReset(u)">
                      <span class="icon">lock_reset</span>
                    </button>
                    <button
                      class="action-btn"
                      :class="u.estado === 'suspendido' ? 'activate' : 'suspend'"
                      :title="u.estado === 'suspendido' ? 'Activar usuario' : 'Suspender'"
                      @click="cambiarEstado(u, u.estado === 'suspendido' ? 'activo' : 'suspendido')"
                    >
                      <span class="icon">{{ u.estado === 'suspendido' ? 'lock_open' : 'block' }}</span>
                    </button>
                    <button class="action-btn delete"  title="Eliminar"           @click="eliminar(u.id)">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="paginated.length === 0">
                <td colspan="8" class="empty-state">
                  <span class="icon empty-icon">manage_search</span>
                  <p>{{ isLoadingUsers ? 'Cargando usuarios...' : 'No se encontraron usuarios con los filtros aplicados.' }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="pagination-bar">
          <span class="pagination-info">
            Mostrando <strong>{{ ((currentPage-1)*perPage)+1 }}</strong>–<strong>{{ Math.min(currentPage*perPage, filtered.length) }}</strong>
            de <strong>{{ filtered.length }}</strong> usuarios registrados
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

      <!-- Footer -->
      <div class="page-footer-note">
        <span>© 2024 Sistema Urbansys Residential Platform.</span>
        <span class="dot">•</span>
        <span>Todos los derechos reservados.</span>
      </div>

    </div>

    <!-- ══════════ MODAL USUARIO ══════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">

            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon">
                  <span class="icon">{{ modalMode==='ver' ? 'manage_accounts' : modalMode==='crear' ? 'person_add' : 'edit' }}</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ modalMode==='crear' ? 'Nuevo Usuario' : modalMode==='editar' ? 'Editar Usuario' : 'Perfil de Usuario' }}
                  </h3>
                  <p class="modal-sub">
                    {{ modalMode==='crear' ? 'Complete la información del nuevo usuario.' : modalMode==='editar' ? `Modificando ${form.nombre}` : 'Información general del usuario.' }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal"><span class="icon">close</span></button>
            </div>

            <!-- ── Ver ── -->
            <div v-if="modalMode==='ver' && selectedUser" class="modal-body detail-modal-body">
              <section class="detail-hero">
                <div
                  class="detail-hero-icon"
                  :style="{ background: avatarColor(fullName(selectedUser)).bg, color: avatarColor(fullName(selectedUser)).color }"
                >
                  {{ initials(fullName(selectedUser)) }}
                </div>
                <div>
                  <p class="detail-hero-kicker">Usuario #{{ selectedUser.id }}</p>
                  <h4 class="detail-hero-title">{{ fullName(selectedUser) }}</h4>
                  <p class="detail-hero-sub">{{ selectedUser.email }}</p>
                </div>
                <div class="detail-hero-meta">
                  <span class="rol-badge" :style="{ background: rolConfig[selectedUser.rol]?.bg, color: rolConfig[selectedUser.rol]?.color, borderColor: rolConfig[selectedUser.rol]?.border }">
                    <span class="icon rol-icon">{{ rolConfig[selectedUser.rol]?.icon }}</span>
                    {{ rolConfig[selectedUser.rol]?.label }}
                  </span>
                  <span class="estado-badge" :style="{ background: estadoConfig[selectedUser.estado].bg, color: estadoConfig[selectedUser.estado].color }">
                    <span class="estado-dot" :style="{ background: estadoConfig[selectedUser.estado].dot }"></span>
                    {{ estadoConfig[selectedUser.estado].label }}
                  </span>
                </div>
              </section>

              <div class="detail-card-grid">
                <article class="detail-card">
                  <p class="detail-card-title"><span class="icon">badge</span> Identidad</p>
                  <div class="detail-grid compact-grid single-column">
                    <div class="detail-item full">
                      <span class="detail-label">Identificación</span>
                      <p class="detail-value">{{ selectedUser.identificacion }}</p>
                    </div>
                    <div class="detail-item full">
                      <span class="detail-label">Teléfono</span>
                      <p class="detail-value">{{ selectedUser.telefono }}</p>
                    </div>
                  </div>
                </article>

                <article class="detail-card detail-card-alert">
                  <p class="detail-card-title"><span class="icon">account_circle</span> Estado de la cuenta</p>
                  <p class="detail-value">{{ estadoConfig[selectedUser.estado].label }}</p>
                </article>
              </div>

              <!-- Acciones rápidas en modal -->
              <div class="quick-actions">
                <button class="quick-btn blue" @click="openEditar(selectedUser)">
                  <span class="icon">edit</span> Editar
                </button>
                <button class="quick-btn amber" @click="openPassReset(selectedUser); closeModal()">
                  <span class="icon">lock_reset</span> Restablecer Clave
                </button>
                <button
                  class="quick-btn"
                  :class="selectedUser.estado === 'suspendido' ? 'green' : 'red'"
                  @click="cambiarEstado(selectedUser, selectedUser.estado==='suspendido'?'activo':'suspendido')"
                >
                  <span class="icon">{{ selectedUser.estado==='suspendido' ? 'lock_open' : 'block' }}</span>
                  {{ selectedUser.estado==='suspendido' ? 'Activar' : 'Suspender' }}
                </button>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
              </div>
            </div>

            <!-- ── Crear / Editar ── -->
            <div v-else-if="modalMode!=='ver'" class="modal-body">
              <div class="form-grid">
                <div class="form-field autocomplete-field full">
                  <label class="form-label">Usuario (Residente)</label>
                  <div class="form-input-wrap autocomplete-wrap">
                    <span class="form-icon icon">person_search</span>
                    <input
                      v-model="residenteSearch"
                      class="form-input"
                      type="text"
                      placeholder="Buscar residente por nombre..."
                      @focus="openAutocompleteUsr('residente')"
                      @blur="clearAutocompleteUsr"
                      @input="onResidenteInput"
                    />
                    <div v-if="activeAutocomplete === 'residente' && filteredResidentes.length > 0" class="autocomplete-dropdown">
                      <div
                        v-for="r in filteredResidentes"
                        :key="r.idResidente"
                        class="autocomplete-item"
                        @click="selectResidente(r)"
                      >
                        {{ getResidenteNombreCompleto(r) }}
                      </div>
                    </div>
                  </div>
                  <div v-if="form.residenteId && form.nombre" class="residente-selected-info">
                    <span class="icon">check_circle</span>
                    {{ form.nombre }} {{ form.apellido }}
                  </div>
                </div>
                <input v-model="form.nombre" type="hidden" />
                <input v-model="form.apellido" type="hidden" />
                <div class="form-field">
                  <label class="form-label">Correo Electrónico</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">mail</span>
                    <input v-model="form.email" class="form-input" placeholder="correo@email.com" type="email"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Identificación</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">badge</span>
                    <input v-model="form.identificacion" class="form-input" placeholder="Ej. 1.032.455.890"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Teléfono</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">phone</span>
                    <input v-model="form.telefono" class="form-input" placeholder="+57 300 000 0000" type="tel"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Rol del Sistema</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">{{ rolConfig[form.rol]?.icon || 'manage_accounts' }}</span>
                    <select v-model="form.rol" class="form-input">
                      <option value="">Seleccionar rol...</option>
                      <option value="administrador">Administrador</option>
                      <option value="vigilante">Vigilante</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="residente">Residente</option>
                    </select>
                  </div>
                </div>
                <div class="form-field" v-if="modalMode==='crear'">
                  <label class="form-label">Contraseña Temporal</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">lock</span>
                    <input v-model="form.claveHash" class="form-input" placeholder="Asignar contraseña temporal" type="password"/>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Estado</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">flag</span>
                    <select v-model="form.estado" class="form-input">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Info de seguridad -->
              <div class="security-notice" v-if="modalMode==='crear'">
                <span class="icon" style="font-size:16px;color:#0f4c81">info</span>
                <p>Se enviará un correo con las credenciales de acceso al usuario registrado.</p>
              </div>

              <div class="security-notice" v-if="formError" style="background:rgba(186,26,26,.07);border-color:rgba(186,26,26,.2)">
                <span class="icon" style="font-size:16px;color:#ba1a1a">error</span>
                <p>{{ formError }}</p>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="isSaving" @click="guardar">
                  <span class="icon">{{ modalMode==='crear' ? 'person_add' : 'save' }}</span>
                  {{ isSaving ? 'Guardando...' : (modalMode==='crear' ? 'Crear Usuario' : 'Guardar Cambios') }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════ MODAL CORREOS MASIVOS ══════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEmailModal" class="modal-overlay" @click.self="closeEmailModal">
          <div class="modal-box" style="max-width:620px">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon" style="background:linear-gradient(135deg,#0f4c81,#2563eb)">
                  <span class="icon">outgoing_mail</span>
                </div>
                <div>
                  <h3 class="modal-title">Correos Electrónicos Masivos</h3>
                  <p class="modal-sub">Envío a usuarios activos con correo válido.</p>
                </div>
              </div>
              <button class="modal-close" :disabled="isSendingMassEmail" @click="closeEmailModal"><span class="icon">close</span></button>
            </div>

            <form class="modal-body" @submit.prevent="enviarCorreosMasivos">
              <div class="form-grid" style="grid-template-columns:1fr; margin-bottom:1rem;">
                <div class="form-field">
                  <label class="form-label">Asunto</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">title</span>
                    <input
                      v-model="emailForm.subject"
                      class="form-input"
                      placeholder="Ingrese el asunto del mensaje..."
                      :disabled="isSendingMassEmail"
                      required
                    />
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label">Cuerpo del mensaje</label>
                  <div class="form-input-wrap textarea-wrap">
                    <textarea
                      v-model="emailForm.body"
                      class="form-input form-textarea"
                      rows="8"
                      placeholder="Escriba el contenido del mensaje que se enviará a todos los usuarios activos..."
                      :disabled="isSendingMassEmail"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              <div class="security-notice" style="margin-bottom:0;">
                <span class="icon" style="font-size:16px;color:#0f4c81">info</span>
                <p>
                  El correo se enviará automáticamente a
                  <strong>{{ destinatariosCorreoMasivo.length }}</strong>
                  usuario(s) con estado activo y correo electrónico válido.
                </p>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" type="button" :disabled="isSendingMassEmail" @click="closeEmailModal">Cancelar</button>
                <button class="btn-primary" type="submit" :disabled="isSendingMassEmail">
                  <span class="icon">send</span>
                  {{ isSendingMassEmail ? 'Enviando...' : 'Enviar Correos' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════ MODAL RESTABLECER CONTRASEÑA ══════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPassModal" class="modal-overlay" @click.self="showPassModal=false">
          <div class="modal-box" style="max-width:420px">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                  <span class="icon">lock_reset</span>
                </div>
                <div>
                  <h3 class="modal-title">Restablecer Contraseña</h3>
                  <p class="modal-sub">{{ passUserId }}</p>
                </div>
              </div>
              <button class="modal-close" @click="showPassModal=false"><span class="icon">close</span></button>
            </div>
            <div class="modal-body">
              <div class="pass-reset-body">
                <div class="pass-icon-wrap">
                  <span class="icon pass-big-icon">lock_reset</span>
                </div>
                <p class="pass-desc">Se enviará un enlace de restablecimiento al correo asociado al usuario <strong>{{ passUserId }}</strong>. El enlace expirará en <strong>30 minutos</strong>.</p>
                <div class="security-notice">
                  <span class="icon" style="font-size:16px;color:#f59e0b">warning</span>
                  <p>Esta acción cerrará todas las sesiones activas del usuario.</p>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" @click="showPassModal=false">Cancelar</button>
                <button class="btn-amber" @click="showPassModal=false">
                  <span class="icon">send</span> Enviar Enlace
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
.usr-view { display:flex; flex-direction:column; gap:1.75rem; font-family:'Plus Jakarta Sans',sans-serif; }

/* ─── HEADER ─── */
.page-header { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
.page-title  { font-size:1.875rem; font-weight:800; color:#00355f; letter-spacing:-0.04em; margin:0 0 .25rem; line-height:1.15; }
.page-sub    { font-size:.875rem; color:#64748b; margin:0; font-weight:500; }

.header-actions { display:flex; align-items:center; gap:.65rem; flex-wrap:wrap; }

.mass-email-btn {
  display:flex; align-items:center; gap:.5rem;
  background:linear-gradient(135deg,#0f4c81,#2563eb); color:#fff;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700;
  border:none; border-radius:.75rem; padding:.75rem 1.15rem; cursor:pointer;
  box-shadow:0 4px 14px rgba(37,99,235,.24); transition:transform .2s,box-shadow .2s;
}
.mass-email-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(37,99,235,.28); }
.mass-email-btn .icon { font-size:18px; }

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
.metric-card.accent-green { background:linear-gradient(135deg,#005539,#003c27); border-left-color:transparent; }

.metric-top  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:.875rem; }
.metric-icon { width:2.375rem; height:2.375rem; border-radius:.625rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.metric-icon .icon { font-size:20px; }
.metric-tag  { font-size:.6rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; }
.metric-val  { font-size:2rem; font-weight:800; color:#00355f; letter-spacing:-0.04em; margin:0 0 .2rem; line-height:1; }
.metric-lbl  { font-size:.775rem; color:#64748b; font-weight:500; margin:0; }

/* ─── TABLA CARD ─── */
.table-card { background:#fff; border-radius:1.25rem; box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 16px rgba(0,53,95,.06); overflow:hidden; }

.filter-bar   { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.875rem; padding:1.125rem 1.5rem; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
.filter-left  { display:flex; align-items:center; gap:.875rem; flex-wrap:wrap; }
.filter-actions { display:flex; gap:.5rem; }

.search-wrap { position:relative; }
.search-ic   { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); font-size:16px; color:#94a3b8; pointer-events:none; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.search-input {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.55rem .875rem .55rem 2.5rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a; width:240px;
  transition:border-color .2s,box-shadow .2s;
}
.search-input::placeholder { color:#b0bac5; }
.search-input:focus { outline:none; background:#fff; border-color:#0f4c81; box-shadow:0 0 0 3px rgba(15,76,129,.1); }

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
  display:flex; align-items:center; gap:.375rem;
  font-size:.8125rem; font-weight:700; color:#64748b;
  background:#f1f5f9; border:none; border-radius:.625rem;
  padding:.5rem .875rem; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
  transition:background .15s,color .15s;
}
.filter-action-btn:hover { background:#e2e8f0; color:#00355f; }
.filter-action-btn .icon { font-size:16px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

.table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
.data-table   { width:100%; min-width:980px; border-collapse:collapse; text-align:left; }
.data-table thead tr { background:#f8fafc; }
.data-table th { padding:.875rem 1.125rem; font-size:.625rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
.data-row td  { padding:.875rem 1.125rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.data-row:last-child td { border-bottom:none; }
.data-row:hover td { background:#f8fafc; }
.data-row.dimmed { opacity:.65; }
.text-right { text-align:right; }

.user-cell { display:flex; align-items:center; gap:.75rem; }
.u-avatar  { width:2.25rem; height:2.25rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:800; flex-shrink:0; }
.u-name    { font-size:.8375rem; font-weight:700; color:#0d1b2a; margin:0 0 1px; }
.u-email   { font-size:.7rem; color:#94a3b8; margin:0; font-weight:500; }

.td-id     { font-family:'Courier New',monospace; font-size:.775rem; font-weight:600; color:#334155; }
.td-tel    { font-size:.8rem; font-weight:600; color:#334155; }
.td-access { font-size:.775rem; color:#94a3b8; font-weight:600; }

.rol-badge    {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.25rem .75rem; border-radius:99px; font-size:.625rem; font-weight:800;
  border:1px solid transparent; white-space:nowrap;
}
.rol-icon     { font-size:13px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.estado-badge { display:inline-flex; align-items:center; gap:.375rem; padding:.25rem .75rem; border-radius:99px; font-size:.625rem; font-weight:800; }
.estado-dot   { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.residente-badge {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.25rem .75rem; border-radius:99px; font-size:.625rem; font-weight:800;
  border:1px solid transparent; white-space:nowrap;
}
.residente-badge.propietario { background:#dbeafe; color:#1e40af; border-color:#bfdbfe; }
.residente-badge.arrendatario { background:#cbe7f5; color:#304a55; border-color:#b0d4e8; }
.residente-badge .icon { font-size:13px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.no-residente { color:#94a3b8; font-weight:600; font-size:.8rem; }

/* Acciones */
.actions-row { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.action-btn  { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:.5rem; cursor:pointer; transition:background .15s,color .15s; color:#94a3b8; }
.action-btn .icon { font-size:17px; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.action-btn.view:hover     { background:rgba(15,76,129,.08);  color:#0f4c81;  }
.action-btn.edit:hover     { background:rgba(15,76,129,.08);  color:#0f4c81;  }
.action-btn.pass:hover     { background:rgba(245,158,11,.1);  color:#d97706;  }
.action-btn.suspend:hover  { background:rgba(186,26,26,.08);  color:#ba1a1a;  }
.action-btn.activate:hover { background:rgba(39,174,96,.08);  color:#27ae60;  }
.action-btn.delete:hover   { background:rgba(186,26,26,.08);  color:#ba1a1a;  }

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

/* Footer */
.page-footer-note { display:flex; align-items:center; justify-content:center; gap:.75rem; font-size:.7rem; font-weight:500; color:#94a3b8; padding:.5rem 0 1rem; }
.page-footer-note .dot { font-size:.5rem; }

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

/* Profile hero */
.profile-hero { display:flex; align-items:center; gap:1.125rem; background:#f8fafc; border-radius:1rem; padding:1.125rem; margin-bottom:1.25rem; }
.profile-avatar-lg { width:3.5rem; height:3.5rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:800; flex-shrink:0; }
.profile-info  { flex:1; }
.profile-name  { font-size:1.125rem; font-weight:800; color:#0d1b2a; margin:0 0 .2rem; letter-spacing:-.02em; }
.profile-email { font-size:.775rem; color:#64748b; margin:0 0 .5rem; }
.profile-badges { display:flex; gap:.5rem; flex-wrap:wrap; }

/* Detail grid */
.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.125rem; margin-bottom:1.25rem; }
.detail-item.full { grid-column:1/-1; }
.detail-label { display:block; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:.375rem; }
.detail-value { font-size:.9rem; font-weight:700; color:#0d1b2a; }
.detail-value.mono { font-family:'Courier New',monospace; font-size:.825rem; color:#475569; }

/* Quick actions */
.quick-actions { display:flex; gap:.625rem; flex-wrap:wrap; margin-bottom:1.25rem; padding:1rem; background:#f8fafc; border-radius:.75rem; }
.quick-btn { display:flex; align-items:center; gap:.375rem; font-size:.75rem; font-weight:700; border:none; border-radius:.625rem; padding:.5rem .875rem; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity .15s,transform .15s; }
.quick-btn:hover { opacity:.85; transform:translateY(-1px); }
.quick-btn .icon { font-size:15px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.quick-btn.blue   { background:#dbeafe; color:#1e40af; }
.quick-btn.amber  { background:#fef3c7; color:#92400e; }
.quick-btn.green  { background:#d1fae5; color:#065f46; }
.quick-btn.red    { background:#ffdad6; color:#93000a; }

/* Form */
.form-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem; }
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
.textarea-wrap .form-icon { top:1rem; transform:none; }
.form-textarea { min-height:170px; resize:vertical; padding-left:2.5rem; }
.form-input::placeholder { color:#b0bac5; }
.form-input:focus { outline:none; background:#fff; border-color:#0f4c81; box-shadow:0 0 0 3px rgba(15,76,129,.12); }
.autocomplete-field { position:relative; }
.autocomplete-wrap { position:relative; }
.autocomplete-dropdown {
  position:absolute; top:100%; left:0; right:0; z-index:50;
  background:#fff; border:1px solid #e2e8f0; border-radius:.75rem;
  box-shadow:0 6px 20px rgba(0,0,0,.1); max-height:220px; overflow-y:auto;
  margin-top:4px;
}
.autocomplete-item {
  padding:.65rem 1rem; font-size:.8125rem; color:#334155; cursor:pointer;
  transition:background .1s; border-bottom:1px solid #f8fafc;
}
.autocomplete-item:last-child { border-bottom:none; }
.autocomplete-item:hover { background:#f1f5f9; color:#00355f; }
.residente-selected-info {
  display:flex; align-items:center; gap:.5rem;
  margin-top:.5rem; padding:.4rem .75rem;
  background:#d1fae5; color:#065f46;
  border-radius:.625rem; font-size:.775rem; font-weight:600;
}
.residente-selected-info .icon { font-size:16px; color:#27ae60; }

/* Security notice */
.security-notice { display:flex; align-items:flex-start; gap:.625rem; background:rgba(15,76,129,.05); border:1px solid rgba(15,76,129,.12); border-radius:.75rem; padding:.75rem 1rem; margin-bottom:1.125rem; }
.security-notice p { font-size:.775rem; color:#334155; margin:0; font-weight:500; line-height:1.6; }

.modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; padding-top:1.25rem; border-top:1px solid #f1f5f9; flex-shrink:0; }
.btn-secondary { background:#f1f5f9; color:#475569; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; transition:background .15s; }
.btn-secondary:hover { background:#e2e8f0; }
.btn-primary { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,53,95,.22); transition:transform .2s,box-shadow .2s; }
.btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(0,53,95,.3); }
.btn-primary .icon { font-size:16px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

/* Modal contraseña */
.pass-reset-body { display:flex; flex-direction:column; align-items:center; text-align:center; padding:.5rem 0 1.25rem; gap:1rem; }
.pass-icon-wrap  { width:4rem; height:4rem; border-radius:50%; background:#fef3c7; display:flex; align-items:center; justify-content:center; }
.pass-big-icon   { font-size:32px; color:#d97706; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 40; }
.pass-desc       { font-size:.8375rem; color:#334155; line-height:1.6; margin:0; }
.pass-desc strong { color:#0d1b2a; font-weight:800; }

.btn-amber { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; box-shadow:0 4px 12px rgba(217,119,6,.25); transition:transform .2s; }
.btn-amber:hover { transform:translateY(-1px); }
.btn-amber .icon { font-size:16px; font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-box,.modal-leave-to .modal-box { transform:scale(.96) translateY(8px); }

/* Material Symbols */
.icon { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; font-feature-settings:'liga'; -webkit-font-feature-settings:'liga'; -webkit-font-smoothing:antialiased; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }

@media (max-width: 1024px) {
  .filter-bar { padding:1rem; }
  .filter-left, .filter-actions { width:100%; }
  .search-wrap { width:100%; }
  .search-input { width:100%; }
  .filter-group { width:calc(50% - .45rem); }
  .filter-select { width:100%; }
  .pagination-bar { padding:.875rem 1rem; }
}

@media (max-width: 768px) {
  .page-header { align-items:flex-start; }
  .header-actions { width:100%; }
  .create-btn, .mass-email-btn { width:100%; justify-content:center; }
  .metrics-grid { grid-template-columns:1fr; }
  .filter-group { width:100%; }
  .filter-actions { justify-content:flex-end; }
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
  .data-row td:nth-child(2)::before { content:'Identificacion'; }
  .data-row td:nth-child(3)::before { content:'Contacto'; }
  .data-row td:nth-child(4)::before { content:'Residente'; }
  .data-row td:nth-child(5)::before { content:'Rol'; }
  .data-row td:nth-child(6)::before { content:'Estado'; }
  .data-row td:nth-child(7)::before { content:'Acciones'; }
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