import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const stored = localStorage.getItem('urbansys-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = ref(stored ? stored === 'dark' : prefersDark)

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
