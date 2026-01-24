import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginComponent from './Login.svelte'
import { authenticationService } from '$src/services/AuthenticationService'
import * as svelteRouter from 'svelte-spa-router'

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: {
    login: vi.fn()
  }
}))

vi.mock('svelte-spa-router', () => ({
  push: vi.fn()
}))

function setupAuthenticationServiceMock(): void {
  vi.mocked(authenticationService.login).mockResolvedValue(undefined)
}

describe('LoginComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders username and password inputs', () => {
    render(LoginComponent)

    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument()
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument()
  })

  it('renders login and register buttons', () => {
    render(LoginComponent)

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('updates input values when typing', async () => {
    render(LoginComponent)

    const usernameInput = screen.getByRole('textbox', { name: /username/i })
    const passwordInput = document.querySelector('input[name="password"]')!

    await fireEvent.input(usernameInput, { target: { value: 'testuser' } })
    await fireEvent.input(passwordInput, { target: { value: 'testpass123' } })

    expect(usernameInput).toHaveValue('testuser')
    expect(passwordInput).toHaveValue('testpass123')
  })

  it('calls authenticationService.login with correct credentials on submit', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)

    render(LoginComponent)

    const usernameInput = screen.getByRole('textbox', { name: /username/i })
    const passwordInput = document.querySelector('input[name="password"]')!
    const loginButton = screen.getByRole('button', { name: /login/i })

    await fireEvent.input(usernameInput, { target: { value: 'john' } })
    await fireEvent.input(passwordInput, { target: { value: 'secret123' } })
    await fireEvent.click(loginButton)

    expect(authenticationService.login).toHaveBeenCalledWith('john', 'secret123')
  })

  it('displays success message and navigates to home on successful login', async () => {
    setupAuthenticationServiceMock()

    render(LoginComponent)

    const usernameInput = screen.getByRole('textbox', { name: /username/i })
    const passwordInput = document.querySelector('input[name="password"]')!
    const loginButton = screen.getByRole('button', { name: /login/i })

    await fireEvent.input(usernameInput, { target: { value: 'john' } })
    await fireEvent.input(passwordInput, { target: { value: 'secret123' } })
    await fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Login successful')).toBeInTheDocument()
    })

    expect(svelteRouter.push).toHaveBeenCalledWith('/home')
  })

  it('displays error message on failed login', async () => {
    const errorMessage = 'Invalid credentials'
    vi.mocked(authenticationService.login).mockRejectedValue(new Error(errorMessage))

    render(LoginComponent)

    const usernameInput = screen.getByRole('textbox', { name: /username/i })
    const passwordInput = document.querySelector('input[name="password"]')!
    const loginButton = screen.getByRole('button', { name: /login/i })

    await fireEvent.input(usernameInput, { target: { value: 'john' } })
    await fireEvent.input(passwordInput, { target: { value: 'wrongpass' } })
    await fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(svelteRouter.push).not.toHaveBeenCalled()
  })

  it('handles non-Error exceptions', async () => {
    vi.mocked(authenticationService.login).mockRejectedValue('Network failure')

    render(LoginComponent)

    const loginButton = screen.getByRole('button', { name: /login/i })
    await fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument()
    })
  })

  it('navigates to register page when register button is clicked', async () => {
    render(LoginComponent)

    const registerButton = screen.getByRole('button', { name: /register/i })
    await fireEvent.click(registerButton)

    expect(svelteRouter.push).toHaveBeenCalledWith('/register')
  })

  it('prevents default form submission', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)

    render(LoginComponent)

    const form = document.querySelector('form')!
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

    form.dispatchEvent(submitEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
