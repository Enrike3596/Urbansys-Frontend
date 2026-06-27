import { apiDelete, apiGet, apiPost, apiPut } from './api'

function toFrontendHijo(dto) {
	if (!dto) {
		return null
	}

	return {
		idHijo: dto.idHijo,
		residenteId: dto.residenteId,
		nombreCompleto: dto.nombreCompleto || '',
		edad: dto.edad || null,
	}
}

function toBackendPayload(form) {
	return {
		residenteId: form?.residenteId,
		nombreCompleto: form?.nombreCompleto?.trim() || '',
		edad: form?.edad ? Number(form.edad) : null,
	}
}

export default {
	async listar() {
		const data = await apiGet('/hijos', true)
		return Array.isArray(data) ? data.map(toFrontendHijo).filter(Boolean) : []
	},

	async listarPorResidente(residenteId) {
		const data = await apiGet(`/hijos/residente/${residenteId}`, true)
		return Array.isArray(data) ? data.map(toFrontendHijo).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/hijos/${id}`, true)
		return toFrontendHijo(data)
	},

	async crear(form) {
		const creado = await apiPost('/hijos', toBackendPayload(form), true)
		const mapped = toFrontendHijo(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el hijo en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/hijos/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendHijo(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el hijo en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/hijos/${id}`, true)
	},
}
