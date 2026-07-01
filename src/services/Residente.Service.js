import { apiDelete, apiGet, apiPost, apiPut } from './api'

function normalizeTipoResidente(tipoResidente) {
	if (!tipoResidente) {
		return ''
	}

	return String(tipoResidente).toLowerCase()
}

function toNumberOrNull(value) {
	if (value === '' || value == null || Number.isNaN(Number(value))) {
		return null
	}

	return Number(value)
}

function toFrontendResidente(dto) {
	if (!dto) {
		return null
	}

	return {
		id: dto.idResidente,
		idResidente: dto.idResidente,
		usuarioId: dto.usuarioId ?? null,
		usuarioNombre: dto.usuarioNombre ?? '',
		usuarioApellido: dto.usuarioApellido ?? '',
		nombre: dto.nombre ?? '',
		apellido: dto.apellido ?? '',
		apartamentoId: dto.apartamentoId ?? null,
		torreId: dto.torreId ?? null,
		tieneHijos: Boolean(dto.tieneHijos),
		numeroHijos: dto.numeroHijos ?? null,
		edadHijos: dto.edadHijos || '',
		nombreHijos: dto.nombreHijos || '',
		tipoResidente: normalizeTipoResidente(dto.tipoResidente),
		tieneMascota: Boolean(dto.tieneMascota),
		tipoMascota: dto.tipoMascota || '',
		nombreMascota: dto.nombreMascota || '',
		descripcionMascota: dto.descripcionMascota || '',
	}
}

function toBackendPayload(form) {
	const tieneHijos = Boolean(form?.tieneHijos)
	const tieneMascota = Boolean(form?.tieneMascota)

	return {
		nombre: form?.nombre?.trim() || '',
		apellido: form?.apellido?.trim() || '',
		usuarioId: toNumberOrNull(form?.usuarioId),
		apartamentoId: toNumberOrNull(form?.apartamentoId),
		torreId: toNumberOrNull(form?.torreId),
		tieneHijos,
		numeroHijos: tieneHijos ? toNumberOrNull(form?.numeroHijos) : null,
		edadHijos: tieneHijos ? form?.edadHijos?.trim() || '' : '',
		nombreHijos: tieneHijos ? form?.nombreHijos?.trim() || '' : '',
		tipoResidente: form?.tipoResidente ? String(form.tipoResidente).toUpperCase() : null,
		tieneMascota,
		tipoMascota: tieneMascota ? form?.tipoMascota?.trim() || '' : '',
		nombreMascota: tieneMascota ? form?.nombreMascota?.trim() || '' : '',
		descripcionMascota: tieneMascota ? form?.descripcionMascota?.trim() || '' : '',
	}
}

export default {
	async listar() {
		const data = await apiGet('/residentes', true)
		return Array.isArray(data) ? data.map(toFrontendResidente).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/residentes/${id}`, true)
		return toFrontendResidente(data)
	},

	async crear(form) {
		const creado = await apiPost('/residentes', toBackendPayload(form), true)
		const mapped = toFrontendResidente(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el residente en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/residentes/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendResidente(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el residente en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/residentes/${id}`, true)
	},

	async cargaMasiva(lista = []) {
		const payload = Array.isArray(lista) ? lista.map(toBackendPayload) : []
		return apiPost('/carga-masiva/residentes/json', payload, true)
	},

	async cargaMasivaArchivo(archivo) {
		if (!archivo) {
			throw new Error('Debes seleccionar un archivo CSV.')
		}

		const formData = new FormData()
		formData.append('archivo', archivo)

		const response = await fetch('/api/carga-masiva/residentes/archivo', {
			method: 'POST',
			credentials: 'include',
			body: formData,
		})

		const contentType = response.headers.get('content-type') || ''
		const body = contentType.includes('application/json') ? await response.json() : null

		if (!response.ok) {
			throw new Error(body?.message || `HTTP ${response.status}`)
		}

		return body
	},
}
