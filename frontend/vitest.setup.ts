import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpia el DOM, el localStorage y los globales simulados entre pruebas.
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})
