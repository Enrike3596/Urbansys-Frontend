import { apiDelete, apiGet, apiPost, apiPut } from './api'

function toFrontendTorre(dto) {
	if (!dto) {
		return null
	}

	const numero = dto.numeroTorre != null ? String(dto.numeroTorre) : ''

	return {
		id: dto.idTorre,
		idTorre: dto.idTorre,
		nombre: dto.nombre || '',
		numero,
		numeroTorre: dto.numeroTorre,
	}
}

function toBackendPayload(form) {
	const numeroRaw = form?.numeroTorre ?? form?.numero
	const numeroTorre =
		numeroRaw === '' || numeroRaw == null || Number.isNaN(Number(numeroRaw))
			? null
			: Number(numeroRaw)

	return {
		nombre: form?.nombre?.trim() || '',
		numeroTorre,
	}
}

export default {
	async listar() {
		const data = await apiGet('/torres', true)
		return Array.isArray(data) ? data.map(toFrontendTorre).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/torres/${id}`, true)
		return toFrontendTorre(data)
	},

	async crear(form) {
		const creado = await apiPost('/torres', toBackendPayload(form), true)
		const mapped = toFrontendTorre(creado)

		if (!mapped) {
			throw new Error('No fue posible crear la torre en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/torres/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendTorre(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar la torre en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/torres/${id}`, true)
	},

	async buscarPorNombre(nombre) {
		const query = encodeURIComponent((nombre || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/torres/buscar-por-nombre?nombre=${query}`, true)
		return toFrontendTorre(data)
	},
}
