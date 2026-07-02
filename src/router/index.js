import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    /* ── Autenticación ── */
    {
      path: '/',
      redirect: '/auth/login',
    },
    {
      path: '/auth/login',
      name: 'auth-login',
      meta: { guestOnly: true },
      component: () => import('@/views/Auth/LoginView.vue'),
    },
    {
      path: '/auth/registrar',
      name: 'registrar',
      meta: { guestOnly: true },
      component: () => import('@/views/Auth/RegistrarView.vue'),
    },
    {
      path: '/auth/recuperar',
      name: 'recovery',
      meta: { guestOnly: true },
      component: () => import('@/views/Auth/RecuperarView.vue'),
    },
    {
      path: '/auth/restablecer-password',
      name: 'reset-password',
      meta: { guestOnly: true },
      component: () => import('@/views/Auth/RestablecerContraseñaView.vue'),
    },
    /* ── Páginas de Error ── */
    {
      path: '/error/401',
      name: 'error-401',
      component: () => import('@/views/Paginas/Error401View.vue'),
    },
    {
      path: '/error/403',
      name: 'error-403',
      component: () => import('@/views/Paginas/Error403View.vue'),
    },
    {
      path: '/error/404',
      name: 'error-404',
      component: () => import('@/views/Paginas/Error404View.vue'),
    },
    {
      path: '/error/500',
      name: 'error-500',
      component: () => import('@/views/Paginas/Error500View.vue'),
    },
    {
      path: '/error/503',
      name: 'error-503',
      component: () => import('@/views/Paginas/Error503View.vue'),
    },
    /* ── Dashboard (layout persistente) ── */
    {
      path: '/dashboard',
      meta: { requiresAuth: true },
      component: () => import('@/layouts/DashboardLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/Dashboard/DashboardView.vue'),
        },
        {
          path: 'apartamentos',
          name: 'dashboard-apartamentos',
          component: () => import('@/views/Admin/ApartamentosView.vue'),
        },
        {
          path: 'parqueaderos',
          name: 'dashboard-parqueaderos',
          component: () => import('@/views/Admin/ParqueaderosView.vue'),
        },
        {
          path: 'reservas',
          name: 'dashboard-reservas',
          component: () => import('@/views/Admin/ReservasView.vue'),
        },
        {
          path: 'salon',
          name: 'dashboard-salon',
          component: () => import('@/views/Admin/SalonComunalView.vue'),
        },
        {
          path: 'torres',
          name: 'dashboard-torres',
          component: () => import('@/views/Admin/TorresView.vue'),
        },
        {
          path: 'residentes',
          name: 'dashboard-residentes',
          component: () => import('@/views/Admin/ResidentesView.vue'),
        },
        {
          path: 'novedades',
          name: 'dashboard-novedades',
          component: () => import('@/views/Admin/NovedadesView.vue'),
        },
        {
          path: 'usuarios',
          name: 'dashboard-usuarios',
          component: () => import('@/views/Admin/UsuariosView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/error/404',
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated =
    authStore.isAuthenticated || sessionStorage.getItem('authenticated') === 'true'

  const ensureAuthState = async () => {
    if (!authStore.authChecked) {
      return authStore.checkAuth()
    }

    return isAuthenticated
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return ensureAuthState().then((isAuthed) => {
      if (!isAuthed) {
        return { name: 'auth-login', replace: true }
      }

      return true
    })
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return ensureAuthState().then((isAuthed) => {
      if (isAuthed) {
        return { name: 'dashboard', replace: true }
      }

      return true
    })
  }

  return true
})

export default router