<script setup>
import { computed, onMounted, ref } from 'vue'
import * as XLSX from 'xlsx'
import ResidenteService from '@/services/Residente.Service'
import ApartamentoService from '@/services/Apartamento.Service'
import TorreService from '@/services/Torre.Service'
import HijoService from '@/services/Hijo.Service'
import MascotaService from '@/services/Mascota.Service'
import AdultoService from '@/services/Adulto.Service'
import VehiculoService from '@/services/Vehiculo.Service'
import { swalConfirmDelete, swalError, swalSuccess } from '@/utils/sweetalert'

const searchQuery = ref('')
const filterTipo = ref('todos')
const filterMascota = ref('todos')
const currentPage = ref(1)
const perPage = 8

const showModal = ref(false)
const modalMode = ref('crear')
const selectedResidente = ref(null)
const selectedResidenteHijos = ref([])
const selectedResidenteMascotas = ref([])
const selectedResidenteAdultos = ref([])
const selectedResidenteVehiculos = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isBulkLoading = ref(false)
const errorMessage = ref('')
const activeAutocomplete = ref('')
const autocompleteCloseTimer = ref(null)
const torreSearch = ref('')
const apartamentoSearch = ref('')
const bulkFile = ref(null)
const bulkRows = ref([])
const bulkPreviewRows = ref([])
const bulkResult = ref(null)
const bulkFileInputRef = ref(null)
const isBulkDragActive = ref(false)

const BULK_HEADERS = [
  'nombreUsuario',
  'apellidoUsuario',
  'identificacionUsuario',
  'emailUsuario',
  'claveUsuario',
  'telefonoUsuario',
  'rolUsuario',
  'torre',
  'apartamento',
  'apartamentoPiso',
  'tipoResidente',
  'hijosNombres',
  'hijosEdades',
  'mascotasTipos',
  'mascotasNombres',
  'mascotasDescripciones',
]

const BULK_HEADERS_DESCRIPTIVE = [
  'Nombre del Usuario',
  'Apellido del Usuario',
  'Identificación del Usuario',
  'Correo del Usuario',
  'Clave del Usuario',
  'Teléfono del Usuario',
  'Rol del Usuario',
  'Torre',
  'Apartamento',
  'Piso',
  'Tipo de residente',
  'Nombre de los Hijos',
  'Edades de los Hijos',
  'Tipo de mascota',
  'Nombre de la Mascota',
  'Descripción de la Mascota',
]

const BULK_REQUIRED_HEADERS = ['torre', 'apartamento', 'tipoResidente']
const BULK_REQUIRED_USER_HEADERS = ['nombreUsuario', 'apellidoUsuario', 'identificacionUsuario', 'emailUsuario', 'claveUsuario']

const emptyForm = () => ({
  idResidente: null,
  nombre: '',
  apellido: '',
  apartamentoId: '',
  torreId: '',
  tipoResidente: 'propietario',
})

const form = ref(emptyForm())
const hijos = ref([])
const mascotas = ref([])
const adultos = ref([])
const vehiculos = ref([])

const residentes = ref([])
const apartamentos = ref([])
const torres = ref([])

const tipoConfig = {
  propietario: { label: 'Propietario', bg: '#dbeafe', color: '#1e40af' },
  arrendatario: { label: 'Arrendatario', bg: '#cbe7f5', color: '#304a55' },
}

const metrics = computed(() => {
  const total = residentes.value.length
  const propietarios = residentes.value.filter((item) => item.tipoResidente === 'propietario').length
  const arrendatarios = residentes.value.filter((item) => item.tipoResidente === 'arrendatario').length
  const conHijos = residentes.value.filter((item) => item.hijos && item.hijos.length > 0).length
  const conMascota = residentes.value.filter((item) => item.mascotas && item.mascotas.length > 0).length

  return { total, propietarios, arrendatarios, conHijos, conMascota }
})

const apartamentosIndex = computed(() => new Map(apartamentos.value.map((apt) => [Number(apt.idApartamento), apt])) )
const torresIndex = computed(() => new Map(torres.value.map((torre) => [Number(torre.idTorre ?? torre.id), torre])) )

function getUsuarioNombre(item) {
  if (!item) return '-'
  if (item.nombre) return (item.nombre + ' ' + (item.apellido || '')).trim()
  if (item.usuarioNombre) return item.usuarioNombre + ' ' + (item.usuarioApellido || '')
  return '-'
}

function getApartamentoNumero(item) {
  if (!item) return '-'

  const numeroDesdeApi = item.numeroApartamento ?? item.apartamentoNumero
  if (numeroDesdeApi) return numeroDesdeApi

  const apt = apartamentosIndex.value.get(Number(item.apartamentoId))
  return apt?.numeroApartamento || apt?.numero || '-'
}

function getTorreNombre(item) {
  if (!item) return '-'

  if (item.torreNombre) return item.torreNombre

  const torre = torresIndex.value.get(Number(item.torreId))
  return torre?.nombre || '-'
}

function getTorreLabel(torre) {
  return torre.nombre || 'Torre'
}

function getApartamentoLabel(apartamento) {
  return apartamento.numeroApartamento || apartamento.numero || 'Sin numero'
}

function getApartamentoTorreId(apartamento) {
  if (!apartamento) return null
  const raw = apartamento.torreId ?? apartamento.idTorre
  if (raw == null || Number.isNaN(Number(raw))) return null
  return Number(raw)
}

const filtered = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()

  return residentes.value.filter((item) => {
    const matchesTipo = filterTipo.value === 'todos' || item.tipoResidente === filterTipo.value
    const hasMascota = item.mascotas && item.mascotas.length > 0
    const matchesMascota =
      filterMascota.value === 'todos'
      || (filterMascota.value === 'si' ? hasMascota : !hasMascota)

    if (!matchesTipo || !matchesMascota) {
      return false
    }

    if (!term) {
      return true
    }

    const mascotaInfo = (item.mascotas && item.mascotas.length > 0) ? item.mascotas[0].tipo || '' : ''
    return (
      (item.nombre || getUsuarioNombre(item)).toLowerCase().includes(term)
      || String(getApartamentoNumero(item)).toLowerCase().includes(term)
      || String(getTorreNombre(item)).toLowerCase().includes(term)
      || (item.tipoResidente || '').toLowerCase().includes(term)
      || mascotaInfo.toLowerCase().includes(term)
    )
  })
})

const filteredTorres = computed(() => {
  const term = torreSearch.value.trim().toLowerCase()
  return torres.value
    .filter((torre) => {
      if (!term) return true
      const id = String(torre.idTorre ?? torre.id ?? '').toLowerCase()
      const nombre = String(torre.nombre ?? '').toLowerCase()
      return id.includes(term) || nombre.includes(term)
    })
    .slice(0, 8)
})

const filteredApartamentos = computed(() => {
  const selectedTorreId = toNumberOrNull(form.value.torreId)
  const term = apartamentoSearch.value.trim().toLowerCase()
  return apartamentos.value
    .filter((apartamento) => {
      const torreId = getApartamentoTorreId(apartamento)
      const matchesTorre = selectedTorreId == null || torreId === selectedTorreId
      if (!matchesTorre) return false

      if (!term) return true
      const id = String(apartamento.idApartamento ?? '').toLowerCase()
      const numero = String(apartamento.numeroApartamento ?? apartamento.numero ?? '').toLowerCase()
      return id.includes(term) || numero.includes(term)
    })
    .slice(0, 8)
})

const clearAutocomplete = () => {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
  }

  autocompleteCloseTimer.value = setTimeout(() => {
    activeAutocomplete.value = ''
    autocompleteCloseTimer.value = null
  }, 180)
}

const openAutocomplete = (field) => {
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
    autocompleteCloseTimer.value = null
  }

  activeAutocomplete.value = field
}

const selectApartamento = (apartamento) => {
  form.value.apartamentoId = Number(apartamento.idApartamento)
  apartamentoSearch.value = getApartamentoLabel(apartamento)
  activeAutocomplete.value = ''
}

const onTorreChange = () => {
  form.value.apartamentoId = null
  apartamentoSearch.value = ''
}

const onApartamentoInput = () => {
  form.value.apartamentoId = null
}

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

function agregarHijo() {
  hijos.value.push({
    idHijo: null,
    residenteId: form.value.idResidente,
    nombreCompleto: '',
    edad: '',
  })
}

function eliminarHijo(index) {
  hijos.value.splice(index, 1)
}

function agregarMascota() {
  mascotas.value.push({
    idMascota: null,
    residenteId: form.value.idResidente,
    tipo: '',
    nombre: '',
    descripcion: '',
  })
}

function eliminarMascota(index) {
  mascotas.value.splice(index, 1)
}

function agregarAdulto() {
  adultos.value.push({
    idAdulto: null,
    residenteId: form.value.idResidente,
    nombre: '',
    apellido: '',
  })
}

function eliminarAdulto(index) {
  adultos.value.splice(index, 1)
}

function agregarVehiculo() {
  vehiculos.value.push({
    idVehiculo: null,
    residenteId: form.value.idResidente,
    tipoVehiculo: '',
    placa: '',
  })
}

function eliminarVehiculo(index) {
  vehiculos.value.splice(index, 1)
}

function openCrear() {
  errorMessage.value = ''
  form.value = emptyForm()
  hijos.value = []
  mascotas.value = []
  adultos.value = []
  vehiculos.value = []
  selectedResidente.value = null
  selectedResidenteHijos.value = []
  selectedResidenteMascotas.value = []
  selectedResidenteAdultos.value = []
  selectedResidenteVehiculos.value = []
  torreSearch.value = ''
  apartamentoSearch.value = ''
  if (autocompleteCloseTimer.value) {
    clearTimeout(autocompleteCloseTimer.value)
    autocompleteCloseTimer.value = null
  }
  modalMode.value = 'crear'
  showModal.value = true
}

function normalizeBulkHeader(header) {
  if (!header) return ''
  return String(header)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\uFEFF/, '')
    .replace(/[_\-\s]/g, '')
    .toLowerCase()
}

// Mapeo de encabezados descriptivos normalizados a técnicos normalizados
const DESC_NORMALIZED_TO_TECH_NORMALIZED = {}
BULK_HEADERS.forEach((tech, i) => {
  const techNormalized = normalizeBulkHeader(tech)
  const descNormalized = normalizeBulkHeader(BULK_HEADERS_DESCRIPTIVE[i])
  DESC_NORMALIZED_TO_TECH_NORMALIZED[descNormalized] = techNormalized
})

function getBulkHeaderIndex(normalizedHeaderIndex, techHeader) {
  const techNormalized = normalizeBulkHeader(techHeader)

  let idx = normalizedHeaderIndex.get(techNormalized)
  if (idx != null) return idx

  for (const [descNormalized, mappedTechNormalized] of Object.entries(DESC_NORMALIZED_TO_TECH_NORMALIZED)) {
    if (mappedTechNormalized === techNormalized) {
      idx = normalizedHeaderIndex.get(descNormalized)
      if (idx != null) return idx
    }
  }

  return null
}

function splitCsvLine(line, separator) {
  return String(line)
    .split(separator)
    .map((segment) => segment.trim())
}

function buildBulkModelFromRawRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length <= 1) {
    return { rows: [], previewRows: [] }
  }

  const rawHeaders = rawRows[0].map((header) => String(header ?? '').trim())
  const normalizedHeaderIndex = new Map(
    rawHeaders.map((header, index) => [normalizeBulkHeader(header), index]),
  )

  const missingHeaders = BULK_REQUIRED_HEADERS.filter(
    (header) => getBulkHeaderIndex(normalizedHeaderIndex, header) == null,
  )
  if (missingHeaders.length > 0) {
    throw new Error(`Encabezados obligatorios faltantes: ${missingHeaders.join(', ')}`)
  }

  const missingUserHeaders = BULK_REQUIRED_USER_HEADERS.filter(
    (header) => getBulkHeaderIndex(normalizedHeaderIndex, header) == null,
  )

  if (missingUserHeaders.length > 0) {
    throw new Error(
      `Encabezados de usuario obligatorios faltantes: ${missingUserHeaders.join(', ')}`,
    )
  }

  const dataRows = rawRows.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))

  const normalizedRows = dataRows.map((row) => {
    const rowObject = {}
    for (const header of BULK_HEADERS) {
      const idx = getBulkHeaderIndex(normalizedHeaderIndex, header)
      rowObject[header] = idx == null ? '' : String(row[idx] ?? '').trim()
    }
    return rowObject
  })

  const previewRows = normalizedRows.slice(0, 8).map((row, index) => ({
    fila: index + 2,
    nombreUsuario: row.nombreUsuario || '-',
    'Nombre del Usuario': row.nombreUsuario || '-',
    emailUsuario: row.emailUsuario || '-',
    'Correo del Usuario': row.emailUsuario || '-',
    apartamento: row.apartamento || '-',
    Apartamento: row.apartamento || '-',
    apartamentoPiso: row.apartamentoPiso || '-',
    Piso: row.apartamentoPiso || '-',
    torre: row.torre || '-',
    Torre: row.torre || '-',
    tipoResidente: row.tipoResidente || '-',
    'Tipo de residente': row.tipoResidente || '-',
    hijosNombres: row.hijosNombres || '-',
    'Nombre de los Hijos': row.hijosNombres || '-',
    hijosEdades: row.hijosEdades || '-',
    'Edades de los Hijos': row.hijosEdades || '-',
    mascotasTipos: row.mascotasTipos || '-',
    'Tipo de mascota': row.mascotasTipos || '-',
    mascotasNombres: row.mascotasNombres || '-',
    'Nombre de la Mascota': row.mascotasNombres || '-',
    mascotasDescripciones: row.mascotasDescripciones || '-',
    'Descripcion de la Mascota': row.mascotasDescripciones || '-',
  }))

  return { rows: normalizedRows, previewRows }
}

function parseRawRowsFromCsv(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const headerLine = lines[0]
  const separator = headerLine.split(';').length > headerLine.split(',').length ? ';' : ','
  return lines.map((line) => splitCsvLine(line, separator))
}

async function parseRawRowsFromExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  if (!workbook.SheetNames.length) {
    return []
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  return aoa.map((row) => row.map((cell) => String(cell ?? '').trim()))
}

function serializeRowsToCsv(rows) {
  const escapeCsv = (value) => {
    const str = String(value ?? '')
    if (/[",;\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [BULK_HEADERS.join(',')]
  for (const row of rows) {
    lines.push(BULK_HEADERS.map((header) => escapeCsv(row[header])).join(','))
  }

  return lines.join('\n')
}

function clearBulkState() {
  bulkFile.value = null
  bulkRows.value = []
  bulkPreviewRows.value = []
  bulkResult.value = null
  isBulkDragActive.value = false

  if (bulkFileInputRef.value) {
    bulkFileInputRef.value.value = ''
  }
}

function triggerBulkFileInput() {
  bulkFileInputRef.value?.click()
}

function removeBulkFile() {
  clearBulkState()
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatBulkError(err) {
  const mensaje = String(err?.mensaje || 'Error de validacion en la carga masiva.')
  const fila = Number(err?.fila)

  if (!Number.isFinite(fila) || fila <= 0) {
    return mensaje
  }

  if (/^fila\s+\d+\s*:/i.test(mensaje)) {
    return mensaje
  }

  return `Fila ${fila}: ${mensaje}`
}

async function onBulkFileChange(event) {
  const file = event?.target?.files?.[0]
  bulkResult.value = null
  isBulkDragActive.value = false

  if (!file) {
    clearBulkState()
    return
  }

  const lowerName = file.name.toLowerCase()
  const isCsv = lowerName.endsWith('.csv')
  const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')

  if (!isCsv && !isExcel) {
    clearBulkState()
    await swalError('Solo se permiten archivos .xlsx, .xls o .csv para la carga masiva.')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    clearBulkState()
    await swalError('El archivo supera el tamano maximo permitido de 10MB.')
    return
  }

  try {
    const rawRows = isExcel ? await parseRawRowsFromExcel(file) : parseRawRowsFromCsv(await file.text())
    const { rows, previewRows } = buildBulkModelFromRawRows(rawRows)

    if (rows.length === 0) {
      clearBulkState()
      await swalError('El archivo no contiene filas con datos para procesar.')
      return
    }

    bulkFile.value = file
    bulkRows.value = rows
    bulkPreviewRows.value = previewRows
  } catch (error) {
    clearBulkState()
    await swalError(error?.message || 'No fue posible leer el archivo seleccionado.')
  }
}

async function handleBulkDrop(event) {
  event.preventDefault()
  isBulkDragActive.value = false
  const file = event?.dataTransfer?.files?.[0]
  if (!file) return
  await onBulkFileChange({ target: { files: [file] } })
}

function handleBulkDragOver(event) {
  event.preventDefault()
}

function handleBulkDragEnter(event) {
  event.preventDefault()
  isBulkDragActive.value = true
}

function handleBulkDragLeave(event) {
  event.preventDefault()
  isBulkDragActive.value = false
}

function openCargaMasiva() {
  errorMessage.value = ''
  clearBulkState()
  modalMode.value = 'masiva'
  showModal.value = true
}

function descargarPlantillaCsv() {
  const data = [
    BULK_HEADERS_DESCRIPTIVE,
    ['Carlos', 'Lopez', '10203040', 'carlos.lopez@urbansys.com', 'Temporal123!', '3001234567', 'RESIDENTE', 'Torre A', '101', '1', 'PROPIETARIO', 'Ana Maria - Luis Mateo', '10 - 7', 'perro - gato', 'Max - Mia', 'Labrador cafe - Gata siames'],
    ['Luisa', 'Garcia', '88990011', 'luisa.garcia@urbansys.com', 'Temporal123!', '3000000000', 'RESIDENTE', 'Torre B', '301', '3', 'ARRENDATARIO', '', '', '', '', ''],
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Residentes')
  XLSX.writeFile(workbook, 'plantilla-carga-residentes.xlsx')
}

async function ejecutarCargaMasiva() {
  if (!bulkFile.value || bulkRows.value.length === 0) {
    await swalError('Debes seleccionar un archivo valido antes de ejecutar la carga masiva.')
    return
  }

  isBulkLoading.value = true
  bulkResult.value = null

  try {
    const csvContent = serializeRowsToCsv(bulkRows.value)
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const archivoCsv = new File([csvBlob], 'usuarios-residentes-carga-masiva.csv', { type: 'text/csv' })

    const resultado = await ResidenteService.cargaMasivaArchivo(archivoCsv)
    bulkResult.value = resultado || null
    await cargarResidentes()

    const creados = resultado?.creados ?? 0
    const fallidos = resultado?.fallidos ?? 0

    if (fallidos > 0) {
      await swalError(`Carga masiva completada con incidencias. Creados: ${creados}, fallidos: ${fallidos}.`)
    } else {
      await swalSuccess(`Carga masiva completada correctamente. Registros creados: ${creados}.`)
      closeModal()
    }
  } catch (error) {
    await swalError(error?.message || 'No fue posible ejecutar la carga masiva.')
  } finally {
    isBulkLoading.value = false
  }
}

async function openEditar(item) {
  errorMessage.value = ''
  form.value = { ...item }
  
  try {
    // Cargar hijos, mascotas, adultos y vehiculos del residente
    hijos.value = await HijoService.listarPorResidente(item.idResidente)
    mascotas.value = await MascotaService.listarPorResidente(item.idResidente)
    adultos.value = await AdultoService.listarPorResidente(item.idResidente)
    vehiculos.value = await VehiculoService.listarPorResidente(item.idResidente)
  } catch (error) {
    hijos.value = []
    mascotas.value = []
    adultos.value = []
    vehiculos.value = []
    console.error('Error cargando hijos, mascotas, adultos y vehiculos:', error)
  }

  const torre = torresIndex.value.get(Number(item.torreId))
  const apartamento = apartamentosIndex.value.get(Number(item.apartamentoId))
  torreSearch.value = torre ? getTorreLabel(torre) : ''
  apartamentoSearch.value = apartamento ? getApartamentoLabel(apartamento) : ''
  modalMode.value = 'editar'
  showModal.value = true
}

async function openVer(item) {
  selectedResidente.value = item
  selectedResidenteHijos.value = Array.isArray(item.hijos) ? item.hijos : []
  selectedResidenteMascotas.value = Array.isArray(item.mascotas) ? item.mascotas : []
  selectedResidenteAdultos.value = Array.isArray(item.adultos) ? item.adultos : []
  selectedResidenteVehiculos.value = Array.isArray(item.vehiculos) ? item.vehiculos : []

  try {
    const [hijosData, mascotasData, adultosData, vehiculosData] = await Promise.all([
      HijoService.listarPorResidente(item.idResidente),
      MascotaService.listarPorResidente(item.idResidente),
      AdultoService.listarPorResidente(item.idResidente),
      VehiculoService.listarPorResidente(item.idResidente),
    ])
    selectedResidenteHijos.value = Array.isArray(hijosData) ? hijosData : []
    selectedResidenteMascotas.value = Array.isArray(mascotasData) ? mascotasData : []
    selectedResidenteAdultos.value = Array.isArray(adultosData) ? adultosData : []
    selectedResidenteVehiculos.value = Array.isArray(vehiculosData) ? vehiculosData : []
  } catch (error) {
    console.error('Error cargando detalle:', error)
  }

  modalMode.value = 'ver'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedResidente.value = null
  selectedResidenteHijos.value = []
  selectedResidenteMascotas.value = []
  selectedResidenteAdultos.value = []
  selectedResidenteVehiculos.value = []
  if (modalMode.value === 'masiva') {
    clearBulkState()
  }
}

async function cargarResidentes() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [residentesData, hijosData, mascotasData, adultosData, vehiculosData] = await Promise.all([
      ResidenteService.listar(),
      HijoService.listar(),
      MascotaService.listar(),
      AdultoService.listar(),
      VehiculoService.listar(),
    ])

    const hijosByResidente = (Array.isArray(hijosData) ? hijosData : []).reduce((acc, hijo) => {
      const residenteId = Number(hijo.residenteId)
      if (!acc.has(residenteId)) acc.set(residenteId, [])
      acc.get(residenteId).push(hijo)
      return acc
    }, new Map())

    const mascotasByResidente = (Array.isArray(mascotasData) ? mascotasData : []).reduce((acc, mascota) => {
      const residenteId = Number(mascota.residenteId)
      if (!acc.has(residenteId)) acc.set(residenteId, [])
      acc.get(residenteId).push(mascota)
      return acc
    }, new Map())

    const adultosByResidente = (Array.isArray(adultosData) ? adultosData : []).reduce((acc, adulto) => {
      const residenteId = Number(adulto.residenteId)
      if (!acc.has(residenteId)) acc.set(residenteId, [])
      acc.get(residenteId).push(adulto)
      return acc
    }, new Map())

    const vehiculosByResidente = (Array.isArray(vehiculosData) ? vehiculosData : []).reduce((acc, vehiculo) => {
      const residenteId = Number(vehiculo.residenteId)
      if (!acc.has(residenteId)) acc.set(residenteId, [])
      acc.get(residenteId).push(vehiculo)
      return acc
    }, new Map())

    residentes.value = (Array.isArray(residentesData) ? residentesData : []).map((residente) => {
      const idResidente = Number(residente.idResidente)
      return {
        ...residente,
        hijos: hijosByResidente.get(idResidente) || [],
        mascotas: mascotasByResidente.get(idResidente) || [],
        adultos: adultosByResidente.get(idResidente) || [],
        vehiculos: vehiculosByResidente.get(idResidente) || [],
      }
    })
  } catch (error) {
    residentes.value = []
    errorMessage.value = error?.message || 'No fue posible cargar los residentes.'
  } finally {
    isLoading.value = false
  }
}

async function cargarCatalogos() {
  try {
    const [apartamentosData, torresData] = await Promise.all([
      ApartamentoService.listar(),
      TorreService.listar(),
    ])

    apartamentos.value = Array.isArray(apartamentosData) ? apartamentosData : []
    torres.value = Array.isArray(torresData) ? torresData : []
  } catch (error) {
    apartamentos.value = []
    torres.value = []
    console.error('No fue posible cargar catalogos de residentes:', error)
  }
}

async function guardar() {
  const nombre = form.value.nombre?.trim()
  const apellido = form.value.apellido?.trim()

  if (!nombre || !apellido) {
    errorMessage.value = 'Nombre, apellido, apartamento, torre y tipo de residente son obligatorios.'
    await swalError(errorMessage.value)
    return
  }

  const payload = {
    idResidente: form.value.idResidente,
    nombre,
    apellido,
    usuarioId: null,
    apartamentoId: toNumberOrNull(form.value.apartamentoId),
    torreId: toNumberOrNull(form.value.torreId),
    tipoResidente: (form.value.tipoResidente || '').toLowerCase(),
  }

  if (!payload.apartamentoId || !payload.torreId || !payload.tipoResidente) {
    errorMessage.value = 'Nombre, apellido, apartamento, torre y tipo de residente son obligatorios.'
    await swalError(errorMessage.value)
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    let residenteGuardado
    if (modalMode.value === 'crear') {
      residenteGuardado = await ResidenteService.crear(payload)
    } else {
      await ResidenteService.actualizar(payload.idResidente, payload)
      residenteGuardado = { idResidente: payload.idResidente }
    }

    // Guardar hijos
    for (const hijo of hijos.value) {
      if (hijo.nombreCompleto.trim()) {
        const hijoPayload = {
          residenteId: residenteGuardado.idResidente,
          nombreCompleto: hijo.nombreCompleto.trim(),
          edad: toNumberOrNull(hijo.edad),
        }
        
        if (hijo.idHijo) {
          await HijoService.actualizar(hijo.idHijo, hijoPayload)
        } else {
          await HijoService.crear(hijoPayload)
        }
      } else if (hijo.idHijo) {
        await HijoService.eliminar(hijo.idHijo)
      }
    }

    // Guardar mascotas
    for (const mascota of mascotas.value) {
      if (mascota.tipo && mascota.nombre.trim()) {
        const mascotaPayload = {
          residenteId: residenteGuardado.idResidente,
          tipo: mascota.tipo,
          nombre: mascota.nombre.trim(),
          descripcion: mascota.descripcion?.trim() || '',
        }
        
        if (mascota.idMascota) {
          await MascotaService.actualizar(mascota.idMascota, mascotaPayload)
        } else {
          await MascotaService.crear(mascotaPayload)
        }
      } else if (mascota.idMascota) {
        await MascotaService.eliminar(mascota.idMascota)
      }
    }

    // Guardar adultos
    for (const adulto of adultos.value) {
      if (adulto.nombre.trim() && adulto.apellido.trim()) {
        const adultoPayload = {
          residenteId: residenteGuardado.idResidente,
          nombre: adulto.nombre.trim(),
          apellido: adulto.apellido.trim(),
        }

        if (adulto.idAdulto) {
          await AdultoService.actualizar(adulto.idAdulto, adultoPayload)
        } else {
          await AdultoService.crear(adultoPayload)
        }
      } else if (adulto.idAdulto) {
        await AdultoService.eliminar(adulto.idAdulto)
      }
    }

    // Guardar vehiculos
    for (const vehiculo of vehiculos.value) {
      if (vehiculo.tipoVehiculo) {
        const esBici = vehiculo.tipoVehiculo === 'BICICLETA'
        const placaValida = esBici || (vehiculo.placa && vehiculo.placa.trim())

        if (!esBici && !placaValida) continue

        const vehiculoPayload = {
          residenteId: residenteGuardado.idResidente,
          tipoVehiculo: vehiculo.tipoVehiculo,
          placa: esBici ? '' : vehiculo.placa.trim(),
        }

        if (vehiculo.idVehiculo) {
          await VehiculoService.actualizar(vehiculo.idVehiculo, vehiculoPayload)
        } else {
          await VehiculoService.crear(vehiculoPayload)
        }
      } else if (vehiculo.idVehiculo) {
        await VehiculoService.eliminar(vehiculo.idVehiculo)
      }
    }

    await cargarResidentes()
    closeModal()
    swalSuccess(modalMode.value === 'crear' ? 'Residente creado correctamente.' : 'Residente actualizado correctamente.')
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible guardar el residente.'
    await swalError(errorMessage.value)
  } finally {
    isSaving.value = false
  }
}

async function eliminar(idResidente) {
  const confirmResult = await swalConfirmDelete('este residente')
  if (!confirmResult.isConfirmed) {
    return
  }

  errorMessage.value = ''

  try {
    await ResidenteService.eliminar(idResidente)
    await cargarResidentes()
    await swalSuccess('Residente eliminado correctamente.')
  } catch (error) {
    errorMessage.value = error?.message || 'No fue posible eliminar el residente.'
    await swalError(errorMessage.value)
  }
}

function goPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

onMounted(async () => {
  await Promise.all([cargarResidentes(), cargarCatalogos()])
})
</script>

<template>
  <div class="res-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">Gestion de residentes</h2>
        <p class="page-sub">Formulario y tabla adaptados a la entidad Residente.</p>
      </div>
      <div class="page-actions">
        <button class="create-btn" @click="openCrear">
          <span class="icon">person_add</span>
          Nuevo residente
        </button>
        <button class="create-btn secondary" @click="openCargaMasiva">
          <span class="icon">upload_file</span>
          Carga masiva
        </button>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card" style="border-left-color:#00355f">
        <p class="metric-lbl">Total</p>
        <h3 class="metric-val">{{ metrics.total }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#0f4c81">
        <p class="metric-lbl">Propietarios</p>
        <h3 class="metric-val">{{ metrics.propietarios }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#48626e">
        <p class="metric-lbl">Arrendatarios</p>
        <h3 class="metric-val">{{ metrics.arrendatarios }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#7c3aed">
        <p class="metric-lbl">Con hijos</p>
        <h3 class="metric-val">{{ metrics.conHijos }}</h3>
      </div>
      <div class="metric-card" style="border-left-color:#27ae60">
        <p class="metric-lbl">Con mascota</p>
        <h3 class="metric-val">{{ metrics.conMascota }}</h3>
      </div>
    </div>

    <div class="table-card">
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-wrap">
            <span class="icon search-ic">search</span>
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="Buscar por usuario, apartamento, torre, tipo o mascota"
              @input="currentPage = 1"
            />
          </div>
          <div class="filter-group">
            <label class="filter-lbl">Tipo</label>
            <select v-model="filterTipo" class="filter-select" @change="currentPage = 1">
              <option value="todos">Todos</option>
              <option value="propietario">Propietario</option>
              <option value="arrendatario">Arrendatario</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-lbl">Mascota</label>
            <select v-model="filterMascota" class="filter-select" @change="currentPage = 1">
              <option value="todos">Todos</option>
              <option value="si">Con mascota</option>
              <option value="no">Sin mascota</option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Apartamento</th>
              <th>Torre</th>
              <th>Tipo Residente</th>
              <th>Tiene Mascota</th>
              <th>Tipo Mascota</th>
              <th>Tiene Hijos</th>
              <th>Adultos</th>
              <th>Vehículo</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="10" class="empty-state">Cargando residentes...</td>
            </tr>
            <tr v-else-if="paginated.length === 0">
              <td colspan="10" class="empty-state">No hay residentes para mostrar.</td>
            </tr>
            <tr v-for="item in paginated" v-else :key="item.idResidente" class="data-row">
              <td>{{ getUsuarioNombre(item) }}</td>
              <td>{{ getApartamentoNumero(item) }}</td>
              <td>{{ getTorreNombre(item) }}</td>
              <td>
                <span
                  class="tipo-badge"
                  :style="{ background: tipoConfig[item.tipoResidente]?.bg || '#f1f5f9', color: tipoConfig[item.tipoResidente]?.color || '#475569' }"
                >
                  {{ tipoConfig[item.tipoResidente]?.label || item.tipoResidente }}
                </span>
              </td>
              <td>{{ (item.mascotas && item.mascotas.length > 0) ? 'Si' : 'No' }}</td>
              <td>{{ (item.mascotas && item.mascotas.length > 0) ? item.mascotas[0].tipo || '-' : '-' }}</td>
              <td>{{ (item.hijos && item.hijos.length > 0) ? 'Si' : 'No' }}</td>
              <td>{{ (item.adultos && item.adultos.length > 0) ? item.adultos.length : 'No' }}</td>
              <td>{{ (item.vehiculos && item.vehiculos.length > 0) ? item.vehiculos[0].placa || 'Si' : 'No' }}</td>
              <td class="text-right">
                <div class="actions-row">
                  <button class="action-btn view" title="Ver" @click="openVer(item)">
                    <span class="icon">visibility</span>
                  </button>
                  <button class="action-btn edit" title="Editar" @click="openEditar(item)">
                    <span class="icon">edit</span>
                  </button>
                  <button class="action-btn delete" title="Eliminar" @click="eliminar(item.idResidente)">
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
          Mostrando {{ filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filtered.length) }} de {{ filtered.length }} residentes
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
          <div class="modal-box" :class="{ 'modal-box-wide': modalMode === 'masiva' }">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-title-icon">
                  <span class="icon">person</span>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ modalMode === 'crear' ? 'Nuevo residente' : modalMode === 'editar' ? 'Editar residente' : modalMode === 'masiva' ? 'Carga masiva de residentes' : 'Detalle residente' }}
                  </h3>
                  <p class="modal-sub">
                    {{ modalMode === 'ver' ? 'Detalle completo del residente.' : modalMode === 'masiva' ? 'Importe residentes mediante archivo Excel o CSV.' : 'Complete los campos de la entidad.' }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="closeModal"><span class="icon">close</span></button>
            </div>

            <div v-if="modalMode === 'ver' && selectedResidente" class="modal-body">
              <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Usuario</span><p class="detail-value">{{ getUsuarioNombre(selectedResidente) }}</p></div>
                <div class="detail-item"><span class="detail-label">Apartamento</span><p class="detail-value">{{ getApartamentoNumero(selectedResidente) }}</p></div>
                <div class="detail-item"><span class="detail-label">Torre</span><p class="detail-value">{{ getTorreNombre(selectedResidente) }}</p></div>
                <div class="detail-item"><span class="detail-label">Tipo Residente</span><p class="detail-value">{{ tipoConfig[selectedResidente.tipoResidente]?.label || selectedResidente.tipoResidente }}</p></div>
                <div class="detail-item"><span class="detail-label">Tiene Hijos</span><p class="detail-value">{{ selectedResidenteHijos.length > 0 ? 'Si' : 'No' }}</p></div>
                <div class="detail-item"><span class="detail-label">Tiene Mascota</span><p class="detail-value">{{ selectedResidenteMascotas.length > 0 ? 'Si' : 'No' }}</p></div>
                <div class="detail-item"><span class="detail-label">Tiene Adultos</span><p class="detail-value">{{ selectedResidenteAdultos.length > 0 ? 'Si' : 'No' }}</p></div>
                <div class="detail-item"><span class="detail-label">Tiene Vehículo</span><p class="detail-value">{{ selectedResidenteVehiculos.length > 0 ? 'Si' : 'No' }}</p></div>
                <div class="detail-item full">
                  <span class="detail-label">Hijos Registrados</span>
                  <p v-if="selectedResidenteHijos.length === 0" class="detail-value">No registra hijos.</p>
                  <div v-else class="detail-list">
                    <p v-for="(hijo, index) in selectedResidenteHijos" :key="hijo.idHijo || index" class="detail-value">
                      {{ index + 1 }}. {{ hijo.nombreCompleto }}{{ hijo.edad ? ` - ${hijo.edad} años` : '' }}
                    </p>
                  </div>
                </div>
                <div class="detail-item full">
                  <span class="detail-label">Mascotas Registradas</span>
                  <p v-if="selectedResidenteMascotas.length === 0" class="detail-value">No registra mascotas.</p>
                  <div v-else class="detail-list">
                    <p v-for="(mascota, index) in selectedResidenteMascotas" :key="mascota.idMascota || index" class="detail-value">
                      {{ index + 1 }}. {{ mascota.tipo || 'Mascota' }} - {{ mascota.nombre || 'Sin nombre' }}{{ mascota.descripcion ? ` (${mascota.descripcion})` : '' }}
                    </p>
                  </div>
                </div>
                <div class="detail-item full">
                  <span class="detail-label">Adultos Registrados</span>
                  <p v-if="selectedResidenteAdultos.length === 0" class="detail-value">No registra adultos adicionales.</p>
                  <div v-else class="detail-list">
                    <p v-for="(adulto, index) in selectedResidenteAdultos" :key="adulto.idAdulto || index" class="detail-value">
                      {{ index + 1 }}. {{ adulto.nombre }} {{ adulto.apellido }}
                    </p>
                  </div>
                </div>
                <div class="detail-item full">
                  <span class="detail-label">Vehículos Registrados</span>
                  <p v-if="selectedResidenteVehiculos.length === 0" class="detail-value">No registra vehículos.</p>
                  <div v-else class="detail-list">
                    <p v-for="(vehiculo, index) in selectedResidenteVehiculos" :key="vehiculo.idVehiculo || index" class="detail-value">
                      {{ index + 1 }}. {{ vehiculo.tipoVehiculo || 'Vehículo' }} - {{ vehiculo.placa || 'Sin placa' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cerrar</button>
                <button class="btn-primary" @click="openEditar(selectedResidente)">
                  <span class="icon">edit</span>
                  Editar
                </button>
              </div>
            </div>

            <div v-else-if="modalMode === 'masiva'" class="modal-body">
              <div class="bulk-panel">
                <div class="upload-instructions">
                  <div class="instruction-header">
                    <span class="icon">info</span>
                    <h4>Instrucciones para la carga masiva</h4>
                  </div>
                  <div class="instruction-content">
                    <p>Sigue estos pasos para procesar residentes sin errores:</p>
                    <ol>
                      <li><strong>Descarga la plantilla:</strong> usa el boton para obtener el formato correcto.</li>
                      <li><strong>Completa datos base:</strong> Torre, Apartamento y Tipo de Residente(Propietario o Arrendatario).</li>
                      <li><strong>Usuario automatico:</strong> completa Nombre del usuario, Apellido del usuario, Identificacion del usuario, Correo del usuario y Clave temporal.</li>
                      <li><strong>Campos opcionales:</strong> Telefono del usuario, Rol del usuario(Residente,Vigilante,Mantenimiento), Apartamento,Piso, Nombre de hijos, Edades de hijos, Tipos de mascotas, Nombres de mascotas, Descripciones de mascotas.</li>
                      <li><strong>Multiples valores:</strong> en hijos y mascotas usa separador -, ejemplo Ana Maria - Luis Mateo.</li>
                      <li><strong>Formato de archivo:</strong> .xlsx, .xls o .csv (maximo 10MB).</li>
                    </ol>
                  </div>
                </div>

                <div class="template-section">
                  <div class="template-card">
                    <div class="template-icon">
                      <span class="icon">description</span>
                    </div>
                    <div class="template-content">
                      <h4>Plantilla oficial de residentes y usuarios</h4>
                      <p>El archivo contiene los campos necesarios para registrar residentes y usuarios en el sistema.</p>
                      <div class="template-details">
                        <span class="detail-item">16 campos</span>
                        <span class="detail-item">Excel compatible</span>
                        <span class="detail-item">Con ejemplos (se deben eliminar)</span>
                      </div>
                    </div>
                    <button class="btn-primary" type="button" @click="descargarPlantillaCsv">
                      <span class="icon">download</span>
                      Descargar plantilla
                    </button>
                  </div>
                </div>

                <div class="upload-section">
                  <h4 class="upload-title">
                    <span class="icon">cloud_upload</span>
                    Cargar archivo de residentes
                  </h4>

                  <div
                    v-if="!bulkFile"
                    class="file-upload-area"
                    :class="{ active: isBulkDragActive }"
                    @click="triggerBulkFileInput"
                    @drop="handleBulkDrop"
                    @dragover="handleBulkDragOver"
                    @dragenter="handleBulkDragEnter"
                    @dragleave="handleBulkDragLeave"
                  >
                    <div class="upload-placeholder">
                      <span class="icon upload-icon">upload_file</span>
                      <h5>Arrastra tu archivo aqui</h5>
                      <p>o haz clic para seleccionarlo</p>
                      <div class="supported-formats">Formatos soportados: .xlsx, .xls, .csv (maximo 10MB)</div>
                    </div>
                    <input
                      ref="bulkFileInputRef"
                      class="bulk-file-hidden"
                      type="file"
                      accept=".xlsx,.xls,.csv,text/csv"
                      @change="onBulkFileChange"
                    />
                  </div>

                  <div v-if="bulkFile" class="file-info">
                    <div class="file-details">
                      <div class="file-icon"><span class="icon">article</span></div>
                      <div class="file-metadata">
                        <div class="file-name">{{ bulkFile.name }}</div>
                        <div class="file-size">{{ formatFileSize(bulkFile.size) }}</div>
                        <div class="file-status">Archivo valido para procesamiento</div>
                      </div>
                      <button class="remove-file-btn" type="button" @click="removeBulkFile">
                        <span class="icon">close</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="bulkPreviewRows.length" class="bulk-preview">
                  <p class="bulk-preview-title">Previsualizacion (primeras {{ bulkPreviewRows.length }} filas)</p>
                  <div class="bulk-table-wrap">
                    <table class="bulk-table">
                      <thead>
                        <tr>
                          <th>Fila</th>
                          <th>Nombre del Usuario</th>
                          <th>Correo del Usuario</th>
                          <th>Apartamento</th>
                          <th>Piso</th>
                          <th>Torre</th>
                          <th>Tipo de residente</th>
                          <th>Nombre de los Hijos / Edades</th>
                          <th>Tipo de mascota / Nombre</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in bulkPreviewRows" :key="row.fila">
                          <td>{{ row.fila }}</td>
                          <td>{{ row['Nombre del Usuario'] }}</td>
                          <td>{{ row['Correo del Usuario'] }}</td>
                          <td>{{ row.Apartamento }}</td>
                          <td>{{ row.Piso }}</td>
                          <td>{{ row.Torre }}</td>
                          <td>{{ row['Tipo de residente'] }}</td>
                          <td>{{ row['Nombre de los Hijos'] }} / {{ row['Edades de los Hijos'] }}</td>
                          <td>{{ row['Tipo de mascota'] }} / {{ row['Nombre de la Mascota'] }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div v-if="bulkResult" class="bulk-result">
                  <p class="bulk-summary">
                    Total: {{ bulkResult.totalRegistros || 0 }} | Creados: {{ bulkResult.creados || 0 }} | Fallidos: {{ bulkResult.fallidos || 0 }}
                  </p>
                  <div v-if="bulkResult.errores && bulkResult.errores.length" class="bulk-errors">
                    <p class="bulk-errors-title">Errores de validacion</p>
                    <ul>
                      <li v-for="(err, idx) in bulkResult.errores.slice(0, 10)" :key="idx">
                        {{ formatBulkError(err) }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="isBulkLoading" @click="ejecutarCargaMasiva">
                  <span class="icon">upload</span>
                  {{ isBulkLoading ? 'Procesando...' : 'Ejecutar carga masiva' }}
                </button>
              </div>
            </div>

            <div v-else class="modal-body">
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Nombre</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">person</span>
                    <input
                      v-model="form.nombre"
                      class="form-input"
                      type="text"
                      placeholder="Nombre del residente"
                    />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Apellido</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">badge</span>
                    <input
                      v-model="form.apellido"
                      class="form-input"
                      type="text"
                      placeholder="Apellido del residente"
                    />
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
                        @click="selectApartamento(apartamento)"
                      >
                        {{ getApartamentoLabel(apartamento) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-field" style="justify-content:flex-end">
                  <label class="form-label">Tipo Residente</label>
                  <div class="form-input-wrap">
                    <span class="form-icon icon">group</span>
                    <select v-model="form.tipoResidente" class="form-input">
                      <option value="propietario">Propietario</option>
                      <option value="arrendatario">Arrendatario</option>
                    </select>
                  </div>
                </div>

                <!-- HIJOS SECTION -->
                <div class="form-field full">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <label class="form-label">Hijos</label>
                    <button type="button" class="btn-add-small" @click="agregarHijo">
                      <span class="icon">add</span>
                    </button>
                  </div>
                </div>

                <div v-for="(hijo, index) in hijos" :key="index" class="form-field full hijo-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0">
                    <span class="form-label" style="margin: 0; font-weight: 600">Hijo {{ index + 1 }}</span>
                    <button type="button" class="btn-icon-delete" @click="eliminarHijo(index)" title="Eliminar">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem">
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Nombre Completo *</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">person</span>
                        <input v-model="hijo.nombreCompleto" class="form-input" placeholder="Ej: Juan Pérez" />
                      </div>
                    </div>
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Edad</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">cake</span>
                        <input v-model="hijo.edad" class="form-input" type="number" placeholder="Ej: 12" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- MASCOTAS SECTION -->
                <div class="form-field full" style="margin-top: 2rem">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <label class="form-label">Mascotas</label>
                    <button type="button" class="btn-add-small" @click="agregarMascota">
                      <span class="icon">add</span>
                    </button>
                  </div>
                </div>

                <div v-for="(mascota, index) in mascotas" :key="index" class="form-field full mascota-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0">
                    <span class="form-label" style="margin: 0; font-weight: 600">Mascota {{ index + 1 }}</span>
                    <button type="button" class="btn-icon-delete" @click="eliminarMascota(index)" title="Eliminar">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem">
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Tipo *</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">pets</span>
                        <select v-model="mascota.tipo" class="form-input">
                          <option value="">Seleccionar tipo...</option>
                          <option value="perro">Perro</option>
                          <option value="gato">Gato</option>
                          <option value="loro">Loro</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Nombre *</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">pets</span>
                        <input v-model="mascota.nombre" class="form-input" placeholder="Ej: Max" />
                      </div>
                    </div>
                  </div>
                  <div class="form-field">
                    <label class="form-label" style="font-size: 0.875rem">Descripción</label>
                    <div class="form-input-wrap">
                      <span class="form-icon icon">description</span>
                      <input v-model="mascota.descripcion" class="form-input" placeholder="Ej: Labrador color dorado" />
                    </div>
                  </div>
                </div>
              </div>

                <!-- ADULTOS SECTION -->
                <div class="form-field full" style="margin-top: 2rem">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <label class="form-label">Adultos Adicionales</label>
                    <button type="button" class="btn-add-small" @click="agregarAdulto">
                      <span class="icon">add</span>
                    </button>
                  </div>
                </div>

                <div v-for="(adulto, index) in adultos" :key="index" class="form-field full adulto-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0">
                    <span class="form-label" style="margin: 0; font-weight: 600">Adulto {{ index + 1 }}</span>
                    <button type="button" class="btn-icon-delete" @click="eliminarAdulto(index)" title="Eliminar">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem">
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Nombre *</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">person</span>
                        <input v-model="adulto.nombre" class="form-input" placeholder="Ej: Carlos" />
                      </div>
                    </div>
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Apellido *</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">person</span>
                        <input v-model="adulto.apellido" class="form-input" placeholder="Ej: López" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- VEHICULOS SECTION -->
                <div class="form-field full" style="margin-top: 2rem">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <label class="form-label">Vehículos</label>
                    <button type="button" class="btn-add-small" @click="agregarVehiculo">
                      <span class="icon">add</span>
                    </button>
                  </div>
                </div>

                <div v-for="(vehiculo, index) in vehiculos" :key="index" class="form-field full vehiculo-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0">
                    <span class="form-label" style="margin: 0; font-weight: 600">Vehículo {{ index + 1 }}</span>
                    <button type="button" class="btn-icon-delete" @click="eliminarVehiculo(index)" title="Eliminar">
                      <span class="icon">delete</span>
                    </button>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem">
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Tipo *</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">directions_car</span>
                        <select v-model="vehiculo.tipoVehiculo" class="form-input">
                          <option value="">Seleccionar tipo...</option>
                          <option value="CARRO">Carro</option>
                          <option value="MOTO">Moto</option>
                          <option value="BICICLETA">Bicicleta</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-field">
                      <label class="form-label" style="font-size: 0.875rem">Placa {{ vehiculo.tipoVehiculo === 'BICICLETA' ? '' : '*' }}</label>
                      <div class="form-input-wrap">
                        <span class="form-icon icon">badge</span>
                        <input v-model="vehiculo.placa" class="form-input" :placeholder="vehiculo.tipoVehiculo === 'BICICLETA' ? 'No aplica' : 'Ej: ABC-123'" maxlength="10" :disabled="vehiculo.tipoVehiculo === 'BICICLETA'" />
                      </div>
                    </div>
                  </div>
                </div>

              <div class="modal-footer">
                <button class="btn-secondary" @click="closeModal">Cancelar</button>
                <button class="btn-primary" :disabled="isSaving" @click="guardar">
                  <span class="icon">{{ modalMode === 'crear' ? 'add_circle' : 'save' }}</span>
                  {{ isSaving ? 'Guardando...' : (modalMode === 'crear' ? 'Crear residente' : 'Guardar cambios') }}
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
.page-actions { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
.page-title { font-size:1.875rem; font-weight:800; color:#00355f; letter-spacing:-0.04em; margin:0 0 .25rem; line-height:1.15; }
.page-sub { font-size:.875rem; color:#64748b; margin:0; font-weight:500; }

.create-btn {
  display:flex; align-items:center; gap:.5rem;
  background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700;
  border:none; border-radius:.75rem; padding:.75rem 1.25rem; cursor:pointer;
  box-shadow:0 4px 14px rgba(0,53,95,.28);
}

.create-btn.secondary {
  background:linear-gradient(135deg,#48626e,#304a55);
  box-shadow:0 4px 14px rgba(48,74,85,.26);
}

.metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1.125rem; }
.metric-card {
  background:#fff; border-radius:1rem; padding:1.25rem;
  border-left:4px solid #00355f;
  box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 12px rgba(0,53,95,.05);
}
.metric-lbl { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:0 0 .25rem; }
.metric-val { font-size:1.75rem; font-weight:800; color:#00355f; margin:0; }

.table-card { background:#fff; border-radius:1.25rem; box-shadow:0 1px 3px rgba(0,53,95,.05),0 4px 16px rgba(0,53,95,.06); overflow:hidden; }
.error-banner {
  margin:0;
  padding:.75rem 1.25rem;
  border-bottom:1px solid #fecaca;
  background:#fef2f2;
  color:#991b1b;
  font-size:.8125rem;
  font-weight:600;
}
.filter-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.875rem; padding:1.125rem 1.5rem; border-bottom:1px solid #f1f5f9; background:#fafbfc; }
.filter-left { display:flex; align-items:center; gap:.875rem; flex-wrap:wrap; }

.search-wrap { position:relative; }
.search-ic { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); font-size:16px; color:#94a3b8; pointer-events:none; }
.search-input {
  background:#f1f5f9; border:1.5px solid transparent; border-radius:.625rem;
  padding:.55rem .875rem .55rem 2.5rem; font-size:.8125rem;
  font-family:'Plus Jakarta Sans',sans-serif; color:#0d1b2a; width:280px;
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

.table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
.data-table { width:100%; min-width:920px; border-collapse:collapse; text-align:left; }
.data-table thead tr { background:#f8fafc; }
.data-table th { padding:.875rem 1.125rem; font-size:.625rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#94a3b8; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
.data-row td { padding:.875rem 1.125rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.data-row:last-child td { border-bottom:none; }
.data-row:hover td { background:#f8fafc; }
.text-right { text-align:right; }

.tipo-badge { display:inline-flex; padding:.25rem .75rem; border-radius:99px; font-size:.65rem; font-weight:800; }

.actions-row { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.action-btn { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:.5rem; cursor:pointer; color:#94a3b8; }
.action-btn.view:hover { background:rgba(15,76,129,.08); color:#0f4c81; }
.action-btn.edit:hover { background:rgba(39,174,96,.08); color:#27ae60; }
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

.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(4px); }
.modal-box { background:#fff; border-radius:1.5rem; width:100%; max-width:580px; box-shadow:0 24px 64px rgba(0,53,95,.2); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }
.modal-box-wide { max-width:980px; }

.modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.5rem 1.75rem 1.25rem; border-bottom:1px solid #f1f5f9; }
.modal-title-row { display:flex; align-items:center; gap:.875rem; }
.modal-title-icon { width:2.5rem; height:2.5rem; border-radius:.75rem; background:linear-gradient(135deg,#00355f,#0f4c81); display:flex; align-items:center; justify-content:center; }
.modal-title-icon .icon { font-size:20px; color:#fff; }
.modal-title { font-size:1.125rem; font-weight:800; color:#0d1b2a; margin:0 0 .2rem; }
.modal-sub { font-size:.775rem; color:#64748b; margin:0; font-weight:500; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border:none; border-radius:.5rem; cursor:pointer; color:#64748b; }
.modal-body { padding:1.5rem 1.75rem; overflow-y:auto; }

.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.125rem; margin-bottom:1.5rem; }
.detail-item.full { grid-column:1/-1; }
.detail-label { display:block; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:.375rem; }
.detail-value { font-size:.9rem; font-weight:700; color:#0d1b2a; margin:0; }
.detail-list { display:flex; flex-direction:column; gap:.35rem; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; }
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

.mascota-toggle-label { display:flex; align-items:center; gap:.625rem; cursor:pointer; padding:.25rem 0; }
.check-box { width:1.125rem; height:1.125rem; border-radius:.375rem; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center; }
.check-box.checked { background:#0f4c81; border-color:#0f4c81; }
.toggle-text { font-size:.8125rem; font-weight:600; color:#475569; }

.modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; padding-top:1.25rem; border-top:1px solid #f1f5f9; }
.btn-secondary { background:#f1f5f9; color:#475569; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; }
.btn-primary { display:flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#00355f,#0f4c81); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:.875rem; font-weight:700; border:none; border-radius:.75rem; padding:.7rem 1.25rem; cursor:pointer; }
.btn-primary:disabled { opacity:.65; cursor:not-allowed; }

.bulk-panel { display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem; }
.upload-instructions {
  border:1px solid #dbe7f3;
  background:#f8fbff;
  border-radius:1rem;
  padding:1rem;
}
.instruction-header { display:flex; align-items:center; gap:.5rem; margin-bottom:.625rem; }
.instruction-header .icon { font-size:18px; color:#0f4c81; }
.instruction-header h4 { margin:0; font-size:.95rem; color:#0f2e4f; font-weight:800; }
.instruction-content p { margin:.1rem 0 .65rem; font-size:.8125rem; color:#4b5f75; }
.instruction-content ol { margin:.2rem 0 0 1.15rem; padding:0; display:flex; flex-direction:column; gap:.4rem; }
.instruction-content li { font-size:.79rem; color:#3f5369; }

.template-section { margin-top:.25rem; }
.template-card {
  display:grid;
  grid-template-columns:auto 1fr auto;
  align-items:center;
  gap:1rem;
  border:1px solid #e3edf7;
  border-radius:1rem;
  padding:1rem;
  background:#fff;
}
.template-icon {
  width:2.65rem;
  height:2.65rem;
  border-radius:.75rem;
  background:#e9f3fd;
  display:flex;
  align-items:center;
  justify-content:center;
}
.template-icon .icon { font-size:20px; color:#0f4c81; }
.template-content h4 { margin:0 0 .25rem; font-size:.92rem; font-weight:800; color:#163a5a; }
.template-content p { margin:0 0 .45rem; font-size:.78rem; color:#5f7388; }
.template-details { display:flex; gap:.5rem; flex-wrap:wrap; }
.detail-item {
  background:#f1f6fb;
  color:#4e6378;
  border-radius:999px;
  padding:.25rem .6rem;
  font-size:.69rem;
  font-weight:700;
}

.upload-section {
  border:1px solid #e6edf4;
  border-radius:1rem;
  padding:1rem;
  background:#fff;
}
.upload-title { display:flex; align-items:center; gap:.45rem; margin:0 0 .75rem; font-size:.9rem; color:#173a5a; }
.upload-title .icon { font-size:19px; color:#0f4c81; }
.file-upload-area {
  border:2px dashed #c7d7e6;
  border-radius:.9rem;
  background:linear-gradient(180deg,#fbfdff,#f4f8fc);
  min-height:160px;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  cursor:pointer;
  transition:.2s ease;
  padding:1rem;
}
.file-upload-area.active {
  border-color:#0f4c81;
  background:linear-gradient(180deg,#f4f9ff,#eaf3fd);
}
.upload-placeholder h5 { margin:.3rem 0 .15rem; font-size:1rem; color:#153656; font-weight:800; }
.upload-placeholder p { margin:0 0 .4rem; color:#60758a; font-size:.8rem; }
.upload-icon { font-size:34px; color:#0f4c81; }
.supported-formats { font-size:.72rem; color:#73879d; }
.bulk-file-hidden { display:none; }

.file-info {
  margin-top:.8rem;
  border:1px solid #dbe7f4;
  border-radius:.75rem;
  background:#f8fbff;
  padding:.65rem .8rem;
}
.file-details { display:flex; align-items:center; gap:.7rem; }
.file-icon {
  width:2.2rem;
  height:2.2rem;
  border-radius:.6rem;
  background:#e1eefc;
  display:flex;
  align-items:center;
  justify-content:center;
}
.file-icon .icon { font-size:18px; color:#0f4c81; }
.file-metadata { flex:1; min-width:0; }
.file-name { font-size:.8rem; font-weight:800; color:#244866; word-break:break-all; }
.file-size { font-size:.72rem; color:#6a8095; }
.file-status { font-size:.72rem; color:#1c7c54; font-weight:700; }
.remove-file-btn {
  border:none;
  background:#fde8e8;
  color:#af2c2c;
  border-radius:.5rem;
  width:2rem;
  height:2rem;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}
.bulk-preview { border:1px solid #e2e8f0; border-radius:.875rem; overflow:hidden; }
.bulk-preview-title { margin:0; padding:.75rem 1rem; background:#f8fafc; font-size:.75rem; font-weight:700; color:#475569; }
.bulk-table-wrap { overflow-x:auto; }
.bulk-table { width:100%; border-collapse:collapse; min-width:460px; }
.bulk-table th, .bulk-table td { border-top:1px solid #f1f5f9; padding:.625rem .75rem; font-size:.75rem; color:#475569; text-align:left; }
.bulk-table th { color:#94a3b8; font-weight:800; text-transform:uppercase; letter-spacing:.06em; background:#fff; }
.bulk-result { border:1px solid #dbeafe; border-radius:.75rem; background:#f8fbff; padding:.75rem; }
.bulk-summary { margin:0; font-size:.8125rem; font-weight:700; color:#0f4c81; }
.bulk-errors { margin-top:.5rem; }
.bulk-errors-title { margin:0 0 .4rem; font-size:.75rem; font-weight:700; color:#334155; }
.bulk-errors ul { margin:0; padding-left:1rem; display:flex; flex-direction:column; gap:.25rem; }
.bulk-errors li { font-size:.75rem; color:#b91c1c; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-box,.modal-leave-to .modal-box { transform:scale(.96) translateY(8px); }

.autocomplete-field { position:relative; }
.autocomplete-wrap { position:relative; }
.form-input:disabled { background:#f1f5f9; cursor:not-allowed; color:#94a3b8; }

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

.autocomplete-item:first-child { 
  border-top-left-radius:.5rem;
  border-top-right-radius:.5rem;
}

.autocomplete-item:last-child { 
  border-bottom-left-radius:.5rem;
  border-bottom-right-radius:.5rem;
}

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

.btn-add-small {
  background: linear-gradient(135deg, #00355f, #0f4c81);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.btn-add-small:hover {
  opacity: 0.9;
}

.btn-icon-delete {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 0.4rem;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.btn-icon-delete:hover {
  background: #fca5a5;
  color: #991b1b;
}

.hijo-card, .mascota-card, .adulto-card, .vehiculo-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 1rem;
  margin-top: 0.75rem;
}

.hijo-card:hover, .mascota-card:hover, .adulto-card:hover, .vehiculo-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

@media (max-width: 900px) {
  .page-header { align-items:flex-start; }
  .page-actions { width:100%; }
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
  .data-row td:nth-child(1)::before { content:'Usuario'; }
  .data-row td:nth-child(2)::before { content:'Apartamento'; }
  .data-row td:nth-child(3)::before { content:'Torre'; }
  .data-row td:nth-child(4)::before { content:'Tipo residente'; }
  .data-row td:nth-child(5)::before { content:'Tiene mascota'; }
  .data-row td:nth-child(6)::before { content:'Tipo mascota'; }
  .data-row td:nth-child(7)::before { content:'Tiene hijos'; }
  .data-row td:nth-child(8)::before { content:'Acciones'; }
  .data-row td:last-child { border-bottom:none; }
  .data-row td.text-right { text-align:left; }
  .actions-row { justify-content:flex-start; flex-wrap:wrap; gap:.4rem; }
  .action-btn { width:2.15rem; height:2.15rem; border:1px solid #e2e8f0; background:#fff; }
  .data-table tbody tr:not(.data-row) td { display:block; }
  .pagination-bar { padding:.875rem 1rem; flex-direction:column; align-items:flex-start; }
  .pagination-controls { width:100%; overflow-x:auto; padding-bottom:.2rem; }
  .modal-overlay { padding:.75rem; }
  .modal-box-wide { max-width:100%; }
  .modal-header, .modal-body { padding:1rem; }
  .form-grid { grid-template-columns:1fr; }
  .detail-grid { grid-template-columns:1fr; }
  .template-card { grid-template-columns:1fr; text-align:left; }
}
</style>
