import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('LoginComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders email and password inputs', () => {
    render(LoginComponent)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders sign in and create account buttons', () => {
    render(LoginComponent)

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument()
  })

  it('renders remember email and keep logged in checkboxes', () => {
    render(LoginComponent)

    expect(screen.getByLabelText('Remember email')).toBeInTheDocument()
    expect(screen.getByLabelText('Keep me logged in')).toBeInTheDocument()
  })

  it('updates input values when typing', async () => {
    render(LoginComponent)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } })
    await fireEvent.input(passwordInput, { target: { value: 'secret123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('secret123')
  })

  it('calls authenticationService.login with email, password, and keepLoggedIn on submit', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(authenticationService.login).toHaveBeenCalledWith('john@test.com', 'secret123', false)
  })

  it('passes keepLoggedIn as true when checkbox is checked', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await fireEvent.click(screen.getByLabelText('Keep me logged in'))
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(authenticationService.login).toHaveBeenCalledWith('john@test.com', 'secret123', true)
  })

  it('navigates to /home on successful login', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(svelteRouter.push).toHaveBeenCalledWith('/home')
    })
  })

  it('displays error message on failed login', async () => {
    vi.mocked(authenticationService.login).mockRejectedValue(new Error('Bad credentials'))
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    expect(svelteRouter.push).not.toHaveBeenCalled()
  })

  it('disables sign in button while loading', async () => {
    let resolveLogin: () => void
    vi.mocked(authenticationService.login).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve
        })
    )
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const submitButton = document.querySelector('button[type="submit"]')!
      expect(submitButton).toBeDisabled()
    })

    resolveLogin!()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
    })
  })

  it('saves email to localStorage when remember email is checked', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'save@test.com' } })
    await fireEvent.click(screen.getByLabelText('Remember email'))
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('margin_remembered_email')).toBe('save@test.com')
    })
  })

  it('removes saved email from localStorage when remember email is unchecked', async () => {
    localStorage.setItem('margin_remembered_email', 'old@test.com')
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.click(screen.getByLabelText('Remember email')) // uncheck (was auto-checked via onMount)
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('margin_remembered_email')).toBeNull()
    })
  })

  it('restores remembered email on mount', () => {
    localStorage.setItem('margin_remembered_email', 'remembered@test.com')
    render(LoginComponent)

    expect(screen.getByLabelText('Email')).toHaveValue('remembered@test.com')
    expect(screen.getByLabelText('Remember email')).toBeChecked()
  })

  it('navigates to /register when create account button is clicked', async () => {
    render(LoginComponent)

    await fireEvent.click(screen.getByRole('button', { name: /create an account/i }))

    expect(svelteRouter.push).toHaveBeenCalledWith('/register')
  })

  it('re-enables sign in button after failed login', async () => {
    vi.mocked(authenticationService.login).mockRejectedValue(new Error('fail'))
    render(LoginComponent)

    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
    })
  })
})
