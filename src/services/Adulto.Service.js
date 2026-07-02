import { apiDelete, apiGet, apiPost, apiPut } from './api'

function toFrontendAdulto(dto) {
	if (!dto) {
		return null
	}

	return {
		idAdulto: dto.idAdulto,
		residenteId: dto.residenteId,
		nombre: dto.nombre || '',
		apellido: dto.apellido || '',
	}
}

function toBackendPayload(form) {
	return {
		residenteId: form?.residenteId,
		nombre: form?.nombre?.trim() || '',
		apellido: form?.apellido?.trim() || '',
	}
}

export default {
	async listar() {
		const data = await apiGet('/adultos', true)
		return Array.isArray(data) ? data.map(toFrontendAdulto).filter(Boolean) : []
	},

	async listarPorResidente(residenteId) {
		const data = await apiGet(`/adultos/residente/${residenteId}`, true)
		return Array.isArray(data) ? data.map(toFrontendAdulto).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/adultos/${id}`, true)
		return toFrontendAdulto(data)
	},

	async crear(form) {
		const creado = await apiPost('/adultos', toBackendPayload(form), true)
		const mapped = toFrontendAdulto(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el adulto en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/adultos/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendAdulto(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el adulto en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/adultos/${id}`, true)
	},
}
