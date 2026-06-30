<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppSidebar from '@/components/Sidebar/AppSidebar.vue'
import AppTopbar  from '@/components/Topbar/AppTopbar.vue'

const isMobile = ref(false)
const sidebarOpen = ref(true)

const syncViewport = () => {
  const mobile = window.innerWidth <= 992
  isMobile.value = mobile
  sidebarOpen.value = !mobile
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<template>

  <div class="shell">

    <!-- Sidebar — flex child de 260px, permanece montado -->
    <AppSidebar
      :mobile="isMobile"
      :open="sidebarOpen"
      @close="closeSidebar"
      @navigate="closeSidebar"
    />

    <!-- Columna derecha -->
    <div class="main-col">

      <!-- Topbar — flex-shrink: 0, siempre visible -->
      <AppTopbar
        :mobile="isMobile"
        :sidebar-open="sidebarOpen"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Contenido — único elemento con scroll vertical -->
      <main class="page-content">
        <RouterView />
      </main>

    </div>
  </div>
</template>

<style scoped>
/* ── Shell ── */
.shell {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
}

/* ── Columna principal ── */
.main-col {
  flex: 1;
  min-width: 0;       /* evita overflow en flex */
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Área de contenido ── */
.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem 2.5rem;
  background: var(--bg-page);
}

@media (max-width: 992px) {
  .shell {
    width: 100%;
  }

  .page-content {
    padding: 1rem;
  }
}


</style>