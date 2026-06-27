import { apiDelete, apiGet, apiPost, apiPut } from './api'

function normalizeEstado(estado) {
	if (!estado) {
		return null
	}

	return String(estado).toLowerCase()
}

function toFrontendApartamento(dto) {
	if (!dto) {
		return null
	}

	return {
		id: dto.idApartamento,
		idApartamento: dto.idApartamento,
		numero: dto.numeroApartamento || '',
		numeroApartamento: dto.numeroApartamento || '',
		piso: dto.piso ?? null,
		torreId: dto.torreId ?? null,
		estado: normalizeEstado(dto.estado),
	}
}

function toBackendPayload(form) {
	const pisoRaw = form?.piso
	const piso =
		pisoRaw === '' || pisoRaw == null || Number.isNaN(Number(pisoRaw))
			? null
			: Number(pisoRaw)

	const torreRaw = form?.torreId
	const torreId =
		torreRaw === '' || torreRaw == null || Number.isNaN(Number(torreRaw))
			? null
			: Number(torreRaw)

	return {
		numeroApartamento: form?.numeroApartamento?.trim() || form?.numero?.trim() || '',
		piso,
		torreId,
		estado: form?.estado ? String(form.estado).toUpperCase() : null,
	}
}

export default {
	async listar() {
		const data = await apiGet('/apartamentos', true)
		return Array.isArray(data) ? data.map(toFrontendApartamento).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/apartamentos/${id}`, true)
		return toFrontendApartamento(data)
	},

	async crear(form) {
		const creado = await apiPost('/apartamentos', toBackendPayload(form), true)
		const mapped = toFrontendApartamento(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el apartamento en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/apartamentos/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendApartamento(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el apartamento en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/apartamentos/${id}`, true)
	},

	async buscarPorNumero(numero) {
		const query = encodeURIComponent((numero || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/apartamentos/buscar-por-numero?numero=${query}`, true)
		return toFrontendApartamento(data)
	},

	async buscarPorPiso(piso) {
		const pisoNumber = Number(piso)
		if (Number.isNaN(pisoNumber)) {
			return null
		}

		const data = await apiGet(`/apartamentos/buscar-por-piso?piso=${pisoNumber}`, true)
		return toFrontendApartamento(data)
	},
}
