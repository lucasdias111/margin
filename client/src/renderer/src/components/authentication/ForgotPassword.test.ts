import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import ForgotPasswordComponent from './ForgotPassword.svelte'
import { authenticationService } from '$src/services/AuthenticationService'
import * as svelteRouter from 'svelte-spa-router'

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: {
    forgotPassword: vi.fn()
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

describe('ForgotPasswordComponent', () => {
  it('renders email input', () => {
    render(ForgotPasswordComponent)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('calls authenticationService.forgotPassword with entered email on submit', async () => {
    vi.mocked(authenticationService.forgotPassword).mockResolvedValue(undefined)
    render(ForgotPasswordComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'alice@margin.chat' } })
    await submitForm()

    expect(authenticationService.forgotPassword).toHaveBeenCalledWith('alice@margin.chat')
  })

  it('shows confirmation message after successful submit', async () => {
    vi.mocked(authenticationService.forgotPassword).mockResolvedValue(undefined)
    render(ForgotPasswordComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'alice@margin.chat' } })
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
    })
  })

  it('includes the submitted email in the confirmation message', async () => {
    vi.mocked(authenticationService.forgotPassword).mockResolvedValue(undefined)
    render(ForgotPasswordComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'alice@margin.chat' } })
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText(/alice@margin\.chat/)).toBeInTheDocument()
    })
  })

  it('hides the form after successful submit', async () => {
    vi.mocked(authenticationService.forgotPassword).mockResolvedValue(undefined)
    render(ForgotPasswordComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'alice@margin.chat' } })
    await submitForm()

    await waitFor(() => {
      expect(document.querySelector('form')).not.toBeInTheDocument()
    })
  })

  it('shows error message on failure', async () => {
    vi.mocked(authenticationService.forgotPassword).mockRejectedValue(new Error('Request failed'))
    render(ForgotPasswordComponent)

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'alice@margin.chat' } })
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  it('keeps the form visible on failure', async () => {
    vi.mocked(authenticationService.forgotPassword).mockRejectedValue(new Error('fail'))
    render(ForgotPasswordComponent)

    await submitForm()

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument()
    })
  })

  it('back to sign in button navigates to /', async () => {
    render(ForgotPasswordComponent)

    const backLink = screen.getByText('Back to sign in')
    await fireEvent.click(backLink)

    expect(svelteRouter.push).toHaveBeenCalledWith('/')
  })
})
