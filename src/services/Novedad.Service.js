import { apiDelete, apiGet, apiPost, apiPut } from './api'

function normalizeValue(val) {
	if (!val) {
		return ''
	}

	return String(val).toLowerCase()
}

function toFrontendNovedad(dto) {
	if (!dto) {
		return null
	}

	return {
		id: dto.id,
		idNovedad: dto.id,
		reportadoPorId: dto.reportadoPorId ?? null,
		apartamentoId: dto.apartamentoId ?? null,
		torreId: dto.torreId ?? null,
		titulo: dto.titulo || '',
		descripcion: dto.descripcion || '',
		tipo: normalizeValue(dto.tipo),
		estado: normalizeValue(dto.estado),
		fechaReporte: dto.fechaReporte || '',
		fechaCierre: dto.fechaCierre || '',
	}
}

function toBackendPayload(form) {
	return {
		reportadoPorId: form?.reportadoPorId ?? null,
		apartamentoId: form?.apartamentoId ?? null,
		torreId: form?.torreId ?? null,
		titulo: form?.titulo?.trim() || '',
		descripcion: form?.descripcion?.trim() || '',
		tipo: form?.tipo ? String(form.tipo).toUpperCase() : null,
		estado: form?.estado ? String(form.estado).toUpperCase() : null,
		fechaReporte: form?.fechaReporte || null,
		fechaCierre: form?.fechaCierre || null,
	}
}

export default {
	async listar() {
		const data = await apiGet('/novedades', true)
		return Array.isArray(data) ? data.map(toFrontendNovedad).filter(Boolean) : []
	},

	async obtenerPorId(id) {
		const data = await apiGet(`/novedades/${id}`, true)
		return toFrontendNovedad(data)
	},

	async crear(form) {
		const creado = await apiPost('/novedades', toBackendPayload(form), true)
		const mapped = toFrontendNovedad(creado)

		if (!mapped) {
			throw new Error('No fue posible crear la novedad en este momento.')
		}

		return mapped
	},

	async actualizar(id, form) {
		const actualizado = await apiPut(`/novedades/${id}`, toBackendPayload(form), true)
		const mapped = toFrontendNovedad(actualizado)

		if (!mapped) {
			throw new Error('No fue posible actualizar la novedad en este momento.')
		}

		return mapped
	},

	async eliminar(id) {
		return apiDelete(`/novedades/${id}`, true)
	},

	async buscarPorFecha(fecha) {
		const query = encodeURIComponent((fecha || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/novedades/buscar-por-fecha?fecha=${query}`, true)
		return toFrontendNovedad(data)
	},

	async buscarPorUsuario(idUsuario) {
		const id = Number(idUsuario)
		if (Number.isNaN(id)) {
			return null
		}

		const data = await apiGet(`/novedades/buscar-por-usuario?idUsuario=${id}`, true)
		return toFrontendNovedad(data)
	},

	async buscarPorTipo(tipo) {
		const query = encodeURIComponent((tipo || '').trim())
		if (!query) {
			return null
		}

		const data = await apiGet(`/novedades/buscar-por-tipo?tipo=${query}`, true)
		return toFrontendNovedad(data)
	},
}
