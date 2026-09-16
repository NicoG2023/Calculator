import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

const themeStorageKey = 'calculator-theme'

describe('App theme', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('restores the saved theme and persists theme changes', async () => {
    window.localStorage.setItem(themeStorageKey, 'dark')
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })

    await user.click(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    )

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    })
    expect(window.localStorage.getItem(themeStorageKey)).toBe('light')
  })
})
