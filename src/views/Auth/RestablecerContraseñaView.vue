<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logoUrbansys from '../../assets/Img/LogoUrbansys-Photoroom.png'
import AuthService from '../../services/Auth.Service'

const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.query.token || '').trim())
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isValidating = ref(true)
const tokenValido = ref(false)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const formError = ref('')

const passwordStrength = computed(() => {
	const p = password.value
	if (!p) return 0
	let score = 0
	if (p.length >= 8) score++
	if (/[A-Z]/.test(p)) score++
	if (/[0-9]/.test(p)) score++
	if (/[^A-Za-z0-9]/.test(p)) score++
	return score
})

const strengthLabel = computed(() => {
	const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
	return labels[passwordStrength.value] || ''
})

const strengthColor = computed(() => {
	const colors = ['', '#e74c3c', '#f39c12', '#3498db', '#27ae60']
	return colors[passwordStrength.value] || ''
})

const passwordsMatch = computed(() => {
	return confirmPassword.value.length > 0 && password.value === confirmPassword.value
})

const validarFormulario = () => {
	if (!password.value.trim()) return 'La nueva contraseña es obligatoria.'
	if (password.value.trim().length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
	if (!confirmPassword.value.trim()) return 'Debes confirmar la contraseña.'
	if (password.value !== confirmPassword.value) return 'Las contraseñas no coinciden.'
	return ''
}

const validarToken = async () => {
	if (!token.value) {
		tokenValido.value = false
		isValidating.value = false
		formError.value = 'Token inválido o ausente.'
		return
	}

	isValidating.value = true
	formError.value = ''
	try {
		const response = await AuthService.validarToken(token.value)
		tokenValido.value = !!response?.valid
		if (!tokenValido.value) {
			formError.value = response?.error || 'El enlace de recuperación no es válido o expiró.'
		}
	} catch (error) {
		tokenValido.value = false
		formError.value = error?.message || 'No fue posible validar el token.'
	} finally {
		isValidating.value = false
	}
}

const restablecer = async (e) => {
	e.preventDefault()
	formError.value = validarFormulario()
	if (formError.value) return

	isSubmitting.value = true
	try {
		const response = await AuthService.restablecerPassword(token.value, password.value.trim())
		if (!response?.success) {
			throw new Error(response?.error || 'No fue posible restablecer la contraseña.')
		}
		isSuccess.value = true
	} catch (error) {
		formError.value = error?.message || 'No fue posible restablecer la contraseña.'
	} finally {
		isSubmitting.value = false
	}
}

const goToLogin = () => router.push('/auth/login')
const goToRecovery = () => router.push('/auth/recuperar')

onMounted(validarToken)
</script>

<template>
	<main class="reset-canvas">
		<div class="bg-orb bg-orb-1"></div>
		<div class="bg-orb bg-orb-2"></div>

		<div class="reset-card">
			<div class="accent-bar"></div>
			<div class="card-inner">
				<header class="card-header">
					<div class="logo-wrapper">
						<img class="brand-logo" :src="logoUrbansys" alt="Logo Urbansys" />
					</div>
					<div class="header-text">
						<h1 class="card-title">Restablecer Contraseña</h1>
						<p class="card-subtitle">Define una nueva contraseña para tu cuenta.</p>
					</div>
				</header>

				<div v-if="isValidating" class="status-box">
					<p>Validando enlace de recuperación...</p>
				</div>

				<template v-else>
					<div v-if="isSuccess" class="success-state">
						<h2 class="success-title">Contraseña actualizada</h2>
						<p class="success-desc">Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión con la nueva clave.</p>
						<button class="submit-btn" type="button" @click="goToLogin">Ir a iniciar sesión</button>
					</div>

					<div v-else-if="!tokenValido" class="status-box error-box">
						<p>{{ formError || 'El enlace de recuperación no es válido.' }}</p>
						<button class="secondary-btn" type="button" @click="goToRecovery">Solicitar nuevo enlace</button>
					</div>

					<form v-else class="reset-form" @submit="restablecer">
						<div class="field">
							<label class="field-label" for="password">Nueva contraseña</label>
							<div class="input-wrapper">
								<span class="input-icon">
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
									</svg>
								</span>
								<input
									id="password"
									v-model="password"
									class="field-input has-toggle"
									:placeholder="showPassword ? 'Mín. 8 caracteres' : '••••••••'"
									:type="showPassword ? 'text' : 'password'"
									minlength="8"
									required
								/>
								<button class="toggle-btn" type="button" @click="showPassword = !showPassword">
									<svg v-if="!showPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
									<svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
								</button>
							</div>
							<div class="strength-bar-wrapper" v-if="password.length > 0">
								<div class="strength-segments">
									<div v-for="i in 4" :key="i" class="strength-seg" :style="{ background: i <= passwordStrength ? strengthColor : '#e2e8f0' }"></div>
								</div>
								<span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
							</div>
						</div>

						<div class="field">
							<label class="field-label" for="confirmPassword">Confirmar contraseña</label>
							<div class="input-wrapper">
								<span class="input-icon" :class="{ 'icon-match': passwordsMatch }">
									<svg v-if="!passwordsMatch || !confirmPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
									<svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
								</span>
								<input
									id="confirmPassword"
									v-model="confirmPassword"
									class="field-input has-toggle"
									:class="{ 'input-match': passwordsMatch }"
									:placeholder="showConfirmPassword ? 'Repite tu contraseña' : '••••••••'"
									:type="showConfirmPassword ? 'text' : 'password'"
									minlength="8"
									required
								/>
								<button class="toggle-btn" type="button" @click="showConfirmPassword = !showConfirmPassword">
									<svg v-if="!showConfirmPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
									<svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
								</button>
							</div>
						</div>

						<p v-if="formError" class="error-message">{{ formError }}</p>

						<button class="submit-btn" type="submit" :disabled="isSubmitting">
							{{ isSubmitting ? 'Guardando...' : 'Restablecer contraseña' }}
						</button>
					</form>
				</template>

				<footer class="card-footer">
					<button class="back-btn" type="button" @click="goToLogin">Volver al inicio de sesión</button>
				</footer>
			</div>
		</div>
	</main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.reset-canvas {
	flex: 1;
	width: 100vw;
	min-height: 100dvh;
	margin-inline: calc(50% - 50vw);
	background: #eef1f6;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem 1.25rem;
	font-family: 'Plus Jakarta Sans', sans-serif;
	position: relative;
	overflow: hidden;
}

.bg-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(90px);
	pointer-events: none;
}

.bg-orb-1 { width: 420px; height: 420px; background: rgba(0,53,95,0.09); top: -100px; right: -80px; }
.bg-orb-2 { width: 300px; height: 300px; background: rgba(77,168,218,0.1); bottom: -80px; left: -60px; }

.reset-card {
	background: #fff;
	width: 100%;
	max-width: 460px;
	border-radius: 1.5rem;
	box-shadow: 0 1px 3px rgba(0,53,95,0.06), 0 8px 24px rgba(0,53,95,0.1), 0 32px 64px rgba(0,53,95,0.08);
	overflow: hidden;
	border: 1px solid rgba(0,53,95,0.07);
}

.accent-bar { height: 4px; background: linear-gradient(90deg, #00355f 0%, #1a6fad 50%, #4DA8DA 100%); }
.card-inner { padding: 2rem 2.25rem; }

.card-header {
	display: flex;
	align-items: center;
	gap: 1.1rem;
	margin-bottom: 1.4rem;
	padding-bottom: 1.3rem;
	border-bottom: 1px solid #f1f5f9;
}

.brand-logo { width: 6.5rem; height: 5.5rem; object-fit: contain; }
.header-text { border-left: 2px solid #e2e8f0; padding-left: 1rem; }
.card-title { margin: 0 0 .25rem; font-size: 1.2rem; color: #0d1b2a; font-weight: 800; letter-spacing: -0.03em; }
.card-subtitle { margin: 0; color: #64748b; font-size: .8rem; }

.status-box {
	padding: 1rem;
	border-radius: .8rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	color: #334155;
	margin-bottom: 1rem;
	font-size: .9rem;
}

.error-box { border-color: rgba(186,26,26,.2); background: rgba(186,26,26,.06); color: #93000a; }

.reset-form { display: flex; flex-direction: column; gap: .95rem; }
.field { display: flex; flex-direction: column; gap: .35rem; }
.field-label { font-size: .72rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: .875rem; color: #94a3b8; display: flex; align-items: center; pointer-events: none; transition: color .2s; z-index: 1; }
.icon-match { color: #27ae60 !important; }

.field-input {
	width: 100%;
	background: #f8fafc;
	border: 1.5px solid #e2e8f0;
	border-radius: .75rem;
	padding: .72rem .88rem .72rem 2.625rem;
	font-size: .9rem;
	color: #0d1b2a;
	transition: border-color .2s, box-shadow .2s, background .2s;
}

.field-input.has-toggle { padding-right: 2.625rem; }
.field-input.input-match { border-color: #27ae60; }
.field-input:hover { background: #fff; border-color: #94a3b8; }
.input-wrapper:focus-within .input-icon { color: #0f4c81; }

.field-input:focus {
	outline: none;
	background: #fff;
	border-color: #0f4c81;
	box-shadow: 0 0 0 3px rgba(15,76,129,.12);
}

.toggle-btn { position: absolute; right: .875rem; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; padding: 0; transition: color .2s; z-index: 1; }
.toggle-btn:hover { color: #0f4c81; }

.strength-bar-wrapper { display: flex; align-items: center; gap: .5rem; margin-top: .25rem; }
.strength-segments { display: flex; gap: 3px; flex: 1; }
.strength-seg { height: 3px; flex: 1; border-radius: 99px; transition: background .3s; }
.strength-label { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; transition: color .3s; }

.submit-btn {
	display: inline-flex;
	justify-content: center;
	align-items: center;
	border: none;
	border-radius: .8rem;
	background: linear-gradient(135deg,#00355f,#0f4c81);
	color: #fff;
	font-weight: 700;
	padding: .8rem 1rem;
	cursor: pointer;
}

.submit-btn:disabled { opacity: .7; cursor: not-allowed; }

.secondary-btn {
	margin-top: .75rem;
	border: none;
	border-radius: .7rem;
	background: #e2e8f0;
	color: #334155;
	font-weight: 700;
	padding: .65rem .95rem;
	cursor: pointer;
}

.error-message { margin: 0; color: #ba1a1a; font-size: .82rem; font-weight: 600; }

.success-state { text-align: center; padding: .25rem 0 .5rem; }
.success-title { margin: 0 0 .45rem; color: #166534; }
.success-desc { margin: 0 0 1rem; color: #475569; line-height: 1.6; }

.card-footer { margin-top: 1.3rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
.back-btn {
	border: none;
	background: transparent;
	color: #0f4c81;
	font-weight: 700;
	cursor: pointer;
	padding: 0;
}
</style>