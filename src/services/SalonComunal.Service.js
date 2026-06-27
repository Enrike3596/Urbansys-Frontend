import { apiDelete, apiGet, apiPost, apiPut } from './api'

function toFrontendSalonComunal(dto) {
	if (!dto) {
		return null
	}

	return {
		id: dto.idSalonComunal,
		idSalonComunal: dto.idSalonComunal,
		nombre: dto.nombre || '',
		capacidad: dto.capacidad ?? null,
		descripcion: dto.descripcion || '',
	}
}

function toBackendPayload(form) {
	const capacidadRaw = form?.capacidad
	const capacidad =
		capacidadRaw === '' || capacidadRaw == null || Number.isNaN(Number(capacidadRaw))
			? null
			: Number(capacidadRaw)

	return {
		nombre: form?.nombre?.trim() || '',
		capacidad,
		descripcion: form?.descripcion?.trim() || '',
	}
}

export default {
	async listar() {
		const data = await apiGet('/salones-comunales', true)
		return Array.isArray(data) ? data.map(toFrontendSalonComunal).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/salones-comunales/${id}`, true)
		return toFrontendSalonComunal(data)
	},

	async crear(form) {
		const creado = await apiPost('/salones-comunales', toBackendPayload(form), true)
		const mapped = toFrontendSalonComunal(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el salon comunal en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/salones-comunales/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendSalonComunal(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el salon comunal en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/salones-comunales/${id}`, true)
	},

	async buscarPorNombre(nombre) {
		const query = encodeURIComponent((nombre || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/salones-comunales/buscar-por-nombre?nombre=${query}`, true)
		return toFrontendSalonComunal(data)
	},
}
