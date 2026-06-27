import { apiDelete, apiGet, apiPost, apiPut } from './api'

function toFrontendMascota(dto) {
	if (!dto) {
		return null
	}

	return {
		idMascota: dto.idMascota,
		residenteId: dto.residenteId,
		tipo: dto.tipo || '',
		nombre: dto.nombre || '',
		descripcion: dto.descripcion || '',
	}
}

function toBackendPayload(form) {
	return {
		residenteId: form?.residenteId,
		tipo: form?.tipo?.trim() || '',
		nombre: form?.nombre?.trim() || '',
		descripcion: form?.descripcion?.trim() || '',
	}
}

export default {
	async listar() {
		const data = await apiGet('/mascotas', true)
		return Array.isArray(data) ? data.map(toFrontendMascota).filter(Boolean) : []
	},

	async listarPorResidente(residenteId) {
		const data = await apiGet(`/mascotas/residente/${residenteId}`, true)
		return Array.isArray(data) ? data.map(toFrontendMascota).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/mascotas/${id}`, true)
		return toFrontendMascota(data)
	},

	async crear(form) {
		const creado = await apiPost('/mascotas', toBackendPayload(form), true)
		const mapped = toFrontendMascota(creado)

		if (!mapped) {
			throw new Error('No fue posible crear la mascota en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/mascotas/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendMascota(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar la mascota en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/mascotas/${id}`, true)
	},
}
