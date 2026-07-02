import { apiDelete, apiGet, apiPost, apiPut } from './api'

function normalizeEstado(estado) {
	if (!estado) {
		return null
	}

	return String(estado).toLowerCase()
}

function toNumberOrNull(value) {
	if (value === '' || value == null || Number.isNaN(Number(value))) {
		return null
	}

	return Number(value)
}

function toFrontendReserva(dto) {
	if (!dto) {
		return null
	}

	return {
		id: dto.idReservaSalon,
		idReservaSalon: dto.idReservaSalon,
		salonComunalId: dto.salonComunalId ?? null,
		apartamentoId: dto.apartamentoId ?? null,
		torreId: dto.torreId ?? null,
		residenteId: dto.residenteId ?? null,
		fecha: dto.fecha || '',
		horaInicio: dto.horaInicio || '',
		horaFin: dto.horaFin || '',
		estado: normalizeEstado(dto.estado),
		motivoCancelacion: dto.motivoCancelacion || '',
	}
}

function toBackendPayload(form) {
	return {
		salonComunalId: toNumberOrNull(form?.salonComunalId),
		apartamentoId: toNumberOrNull(form?.apartamentoId),
		torreId: toNumberOrNull(form?.torreId),
		residenteId: toNumberOrNull(form?.residenteId),
		fecha: form?.fecha?.trim() || null,
		horaInicio: form?.horaInicio?.trim() || null,
		horaFin: form?.horaFin?.trim() || null,
		estado: form?.estado ? String(form.estado).toUpperCase() : null,
		motivoCancelacion: form?.motivoCancelacion?.trim() || '',
	}
}

export default {
	async listar() {
		const data = await apiGet('/reservas-salon', true)
		return Array.isArray(data) ? data.map(toFrontendReserva).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/reservas-salon/${id}`, true)
		return toFrontendReserva(data)
	},

	async crear(form) {
		const creado = await apiPost('/reservas-salon', toBackendPayload(form), true)
		const mapped = toFrontendReserva(creado)

		if (!mapped) {
			throw new Error('No fue posible crear la reserva en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/reservas-salon/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendReserva(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar la reserva en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/reservas-salon/${id}`, true)
	},

	async buscarPorFecha(fecha) {
		const query = encodeURIComponent((fecha || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/reservas-salon/buscar-por-fecha?fecha=${query}`, true)
		return toFrontendReserva(data)
	},

	async buscarPorUsuario(idUsuario) {
		const id = toNumberOrNull(idUsuario)
		if (id == null) {
			return null
		}

		const data = await apiGet(`/reservas-salon/buscar-por-usuario?idUsuario=${id}`, true)
		return toFrontendReserva(data)
	},

	async confirmar(id) {
		const data = await apiPut(`/reservas-salon/${id}/confirmar`, {}, true)
		return toFrontendReserva(data)
	},

	async rechazar(id, motivoRechazo) {
		const data = await apiPut(`/reservas-salon/${id}/rechazar`, { motivoRechazo }, true)
		return toFrontendReserva(data)
	},

	async buscarPorSalon(idSalon) {
		const id = toNumberOrNull(idSalon)
		if (id == null) {
			return null
		}

		const data = await apiGet(`/reservas-salon/buscar-por-salon?idSalon=${id}`, true)
		return toFrontendReserva(data)
	},
}
