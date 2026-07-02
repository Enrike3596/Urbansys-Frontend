import { apiDelete, apiGet, apiPost, apiPut } from './api'

function toFrontendVehiculo(dto) {
	if (!dto) {
		return null
	}

	return {
		idVehiculo: dto.idVehiculo,
		residenteId: dto.residenteId,
		tipoVehiculo: dto.tipoVehiculo || '',
		placa: dto.placa || '',
	}
}

function toBackendPayload(form) {
	return {
		residenteId: form?.residenteId,
		tipoVehiculo: form?.tipoVehiculo?.trim() || '',
		placa: form?.placa?.trim() || '',
	}
}

export default {
	async listar() {
		const data = await apiGet('/vehiculos', true)
		return Array.isArray(data) ? data.map(toFrontendVehiculo).filter(Boolean) : []
	},

	async listarPorResidente(residenteId) {
		const data = await apiGet(`/vehiculos/residente/${residenteId}`, true)
		return Array.isArray(data) ? data.map(toFrontendVehiculo).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/vehiculos/${id}`, true)
		return toFrontendVehiculo(data)
	},

	async crear(form) {
		const creado = await apiPost('/vehiculos', toBackendPayload(form), true)
		const mapped = toFrontendVehiculo(creado)

		if (!mapped) {
			throw new Error('No fue posible crear el vehiculo en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/vehiculos/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendVehiculo(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar el vehiculo en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/vehiculos/${id}`, true)
	},
}
