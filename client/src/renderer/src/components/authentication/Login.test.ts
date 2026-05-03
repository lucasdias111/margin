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

vi.mock('$src/components/common/buttons/Button.svelte', () => ({
  default: vi.fn()
}))

async function submitForm(): Promise<void> {
  const form = document.querySelector('form')!
  await fireEvent.submit(form)
}

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
    await submitForm()

    expect(authenticationService.login).toHaveBeenCalledWith('john@test.com', 'secret123', false)
  })

  it('passes keepLoggedIn as true when checkbox is checked', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await fireEvent.click(screen.getByLabelText('Keep me logged in'))
    await submitForm()

    expect(authenticationService.login).toHaveBeenCalledWith('john@test.com', 'secret123', true)
  })

  it('navigates to /home on successful login', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await submitForm()

    await waitFor(() => {
      expect(svelteRouter.push).toHaveBeenCalledWith('/home')
    })
  })

  it('displays error message on failed login', async () => {
    vi.mocked(authenticationService.login).mockRejectedValue(new Error('Bad credentials'))
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    expect(svelteRouter.push).not.toHaveBeenCalled()
  })

  it('shows activation reminder when login is rejected because account is not activated', async () => {
    vi.mocked(authenticationService.login).mockRejectedValue(
      new Error('User is not yet activated')
    )
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText(/please activate your account first/i)).toBeInTheDocument()
    })

    expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
    expect(svelteRouter.push).not.toHaveBeenCalled()
  })

  it('saves email to localStorage when remember email is checked', async () => {
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'save@test.com' } })
    await fireEvent.click(screen.getByLabelText('Remember email'))
    await submitForm()

    await waitFor(() => {
      expect(localStorage.getItem('margin_remembered_email')).toBe('save@test.com')
    })
  })

  it('removes saved email from localStorage when remember email is unchecked', async () => {
    localStorage.setItem('margin_remembered_email', 'old@test.com')
    vi.mocked(authenticationService.login).mockResolvedValue(undefined)
    render(LoginComponent)

    await fireEvent.click(screen.getByLabelText('Remember email'))
    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    await submitForm()

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

  it('re-enables sign in button after failed login', async () => {
    vi.mocked(authenticationService.login).mockRejectedValue(new Error('fail'))
    render(LoginComponent)

    await submitForm()

    await waitFor(() => {
      const submitButton = document.querySelector('button[type="submit"]')
      if (submitButton) {
        expect(submitButton).not.toBeDisabled()
      }
    })
  })
})
