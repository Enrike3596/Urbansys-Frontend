import { apiDelete, apiGet, apiPost, apiPut } from './api'

function normalizeTipoVehiculo(tipoVehiculo) {
	if (!tipoVehiculo) {
		return ''
	}

	return String(tipoVehiculo).toLowerCase()
}

function toNumberOrNull(value) {
	if (value === '' || value == null || Number.isNaN(Number(value))) {
		return null
	}

	return Number(value)
}

function toFrontendParqueadero(dto) {
	if (!dto) {
		return null
	}

	return {
		id: dto.idParqueadero,
		idParqueadero: dto.idParqueadero,
		apartamentoId: dto.apartamentoId ?? null,
		torreId: dto.torreId ?? null,
		numeroEspacio: dto.numeroEspacio || '',
		tipoVehiculo: normalizeTipoVehiculo(dto.tipoVehiculo),
		placa: dto.placa || '',
		residenteId: dto.residenteId ?? null,
	}
}

function toBackendPayload(form) {
	return {
		apartamentoId: toNumberOrNull(form?.apartamentoId),
		torreId: toNumberOrNull(form?.torreId),
		numeroEspacio: form?.numeroEspacio?.trim() || '',
		tipoVehiculo: form?.tipoVehiculo ? String(form.tipoVehiculo).toUpperCase() : null,
		placa: form?.placa?.trim() || '',
		residenteId: toNumberOrNull(form?.residenteId),
	}
}

export default {
	async listar() {
		const data = await apiGet('/parqueaderos', true)
		return Array.isArray(data) ? data.map(toFrontendParqueadero).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/parqueaderos/${id}`, true)
		return toFrontendParqueadero(data)
	},

	async crear(form) {
		const creado = await apiPost('/parqueaderos', toBackendPayload(form), true)
		const mapped = toFrontendParqueadero(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el parqueadero en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/parqueaderos/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendParqueadero(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el parqueadero en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/parqueaderos/${id}`, true)
	},

	async buscarPorNumero(numeroEspacio) {
		const query = encodeURIComponent((numeroEspacio || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/parqueaderos/buscar-por-numero?numero=${query}`, true)
		return toFrontendParqueadero(data)
	},

	async buscarPorResidente(residenteId) {
		const id = toNumberOrNull(residenteId)
		if (id == null) {
			return null
		}

		const data = await apiGet(`/parqueaderos/buscar-por-residente?idResidente=${id}`, true)
		return toFrontendParqueadero(data)
	},

	async buscarPorTipo(tipoVehiculo) {
		const query = encodeURIComponent((tipoVehiculo || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/parqueaderos/buscar-por-tipo?tipo=${query}`, true)
		return toFrontendParqueadero(data)
	},
}
