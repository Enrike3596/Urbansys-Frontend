import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const stored = localStorage.getItem('urbansys-theme')
  if (stored === 'dark') {
    isDark.value = true
  }

  function apply(dark) {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('urbansys-theme', dark ? 'dark' : 'light')
  }

  apply(isDark.value)
  watch(isDark, apply)

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
})
