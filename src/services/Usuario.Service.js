import { apiDelete, apiGet, apiPut, apiFetch } from './api'

async function parseErrorMessage(response) {
  if (!response) return null

  try {
    const contentType = response.headers?.get?.('content-type') || ''
    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null)
      return payload?.message || payload?.error || null
    }
    const text = await response.text().catch(() => '')
    return text || null
  } catch {
    return null
  }
}

const FRONT_TO_BACK_ROLE = {
  administrador: 'ADMINISTRADOR',
  vigilante: 'VIGILANTE',
  mantenimiento: 'MANTENIMIENTO',
  residente: 'RESIDENTE',
}

const BACK_TO_FRONT_ROLE = {
  ADMINISTRADOR: 'administrador',
  VIGILANTE: 'vigilante',
  MANTENIMIENTO: 'mantenimiento',
  RESIDENTE: 'residente',
}

function toFrontendUser(dto) {
  if (!dto) {
    return null
  }

  return {
    id: dto.idUsuario,
    nombre: dto.nombre || '',
    apellido: dto.apellido || '',
    email: dto.email || '',
    identificacion: dto.identificacion || '',
    telefono: dto.telefono || '',
    rol: BACK_TO_FRONT_ROLE[dto.rol] || 'residente',
    estado: 'activo',
    ultimoAcceso: 'Sin registro',
    residenteId: dto.residenteId ?? null,
    residenteTipoResidente: dto.residenteTipoResidente ?? null,
  }
}

function toBackendPayload(form, includePassword = true) {
  const payload = {
    nombre: form.nombre?.trim() || '',
    apellido: form.apellido?.trim() || '',
    identificacion: form.identificacion?.trim() || '',
    email: form.email?.trim() || '',
    telefono: form.telefono?.trim() || '',
    rol: FRONT_TO_BACK_ROLE[form.rol] || 'RESIDENTE',
  }

  if (includePassword && form.claveHash?.trim()) {
    payload.claveHash = form.claveHash
  }

  if (form.residenteId) {
    payload.residenteId = form.residenteId
  }

  return payload
}

export default {
  async listar() {
    const data = await apiGet('/usuarios')
    return Array.isArray(data) ? data.map(toFrontendUser).filter(Boolean) : []
  },

  async crear(form) {
    const payload = toBackendPayload(form, true)
    const response = await apiFetch(
      '/usuarios',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      true
    )

    if (!response || !response.ok) {
      const msg = await parseErrorMessage(response)
      throw new Error(msg || 'No fue posible crear el usuario. Verifica los datos e inténtalo de nuevo.')
    }

    const creado = await response.json().catch(() => null)
    const mapped = toFrontendUser(creado)
    if (!mapped) throw new Error('No fue posible crear el usuario. Inténtalo de nuevo.')
    return mapped
  },

  async actualizar(id, form) {
    // Mantener apiPut para updates (normalmente 200/400). Si falla, apiPut retorna null con skipErrorRedirect.
    // Reintentamos con apiFetch para poder leer el mensaje de error del backend.
    const payload = toBackendPayload(form, false)
    const response = await apiFetch(
      `/usuarios/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      true
    )

    if (!response || !response.ok) {
      const msg = await parseErrorMessage(response)
      throw new Error(msg || 'No fue posible actualizar el usuario en este momento.')
    }

    const actualizado = await response.json().catch(() => null)
    const mapped = toFrontendUser(actualizado)
    if (!mapped) throw new Error('No fue posible actualizar el usuario en este momento.')
    return mapped
  },

  async eliminar(id) {
    return apiDelete(`/usuarios/${id}`, true)
  },
}
