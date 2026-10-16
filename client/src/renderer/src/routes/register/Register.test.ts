import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writable } from 'svelte/store'
import { instanceState } from '$src/states/InstanceState.svelte'
import type { RegistrationMode } from '$src/interfaces/Instance'
import RegisterPage from './+page.svelte'
import { authenticationService } from '$src/services/AuthenticationService'
import { errorService } from '$src/services/ErrorService'
import * as svelteRouter from 'svelte-spa-router'

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: {
    register: vi.fn()
  }
}))

vi.mock('$src/services/ErrorService', () => ({
  errorService: {
    reportError: vi.fn()
  }
}))

const { querystring } = vi.hoisted(() => ({ querystring: { value: '' } }))

vi.mock('svelte-spa-router', () => ({
  push: vi.fn(),
  querystring: {
    subscribe: (run: (value: string) => void) => writable(querystring.value).subscribe(run)
  }
}))

function instance(registrationMode: RegistrationMode, mailEnabled = true): void {
  instanceState.info = {
    name: 'chat.example.com',
    version: '1.0.0',
    publicUrl: 'https://chat.example.com',
    registrationMode,
    mailEnabled,
    features: { gifs: false, webPush: true }
  }
}

vi.mock('$src/assets/pics/margin.png', () => ({ default: 'margin-logo.png' }))
vi.mock('$src/assets/pics/anonym-avatar.png', () => ({ default: 'anonym-avatar.png' }))

vi.mock('$src/components/common/buttons/UploadImageButton.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/user/UserAvatar.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/buttons/Button.svelte', () => ({
  default: vi.fn()
}))

function fillForm(
  overrides: Partial<{
    displayName: string
    email: string
    password: string
    repeatPassword: string
  }> = {}
): {
  fill: () => Promise<void>
  values: {
    displayName: string
    email: string
    password: string
    repeatPassword: string
  }
} {
  const defaults = {
    displayName: 'John Doe',
    email: 'john@test.com',
    password: 'secret123',
    repeatPassword: 'secret123',
    ...overrides
  }

  return {
    fill: async () => {
      await fireEvent.input(screen.getByLabelText('Display name'), {
        target: { value: defaults.displayName }
      })
      await fireEvent.input(screen.getByLabelText('Email'), { target: { value: defaults.email } })
      await fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: defaults.password }
      })
      await fireEvent.input(screen.getByLabelText('Confirm password'), {
        target: { value: defaults.repeatPassword }
      })
    },
    values: defaults
  }
}

async function submitForm(): Promise<void> {
  const form = document.querySelector('form')!
  await fireEvent.submit(form)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    querystring.value = ''
    instance('OPEN')
  })

  it('renders all form fields', () => {
    render(RegisterPage)

    expect(screen.getByLabelText('Display name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
  })

  it('calls authenticationService.register with correct args on valid submit', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    expect(authenticationService.register).toHaveBeenCalledWith(
      'John Doe',
      'secret123',
      'john@test.com',
      undefined,
      undefined
    )
  })

  it('shows email confirmation card on successful registration', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    const { values } = fillForm()
    await fillForm().fill()
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
    })
    expect(screen.getByText(values.email)).toBeInTheDocument()
    expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument()
    expect(svelteRouter.push).not.toHaveBeenCalled()
  })

  it('reports error when server returns non-ok response', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Email already taken' })
    } as unknown as Response)
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    await waitFor(() => {
      expect(errorService.reportError).toHaveBeenCalledWith('Email already taken')
    })

    expect(svelteRouter.push).not.toHaveBeenCalled()
  })

  it('reports fallback error when server response has no message', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({
      ok: false,
      json: async () => ({})
    } as unknown as Response)
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    await waitFor(() => {
      expect(errorService.reportError).toHaveBeenCalledWith('Registration failed.')
    })
  })

  it('reports connection error when request throws', async () => {
    vi.mocked(authenticationService.register).mockRejectedValue(new Error('Network error'))
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    await waitFor(() => {
      expect(errorService.reportError).toHaveBeenCalledWith('Failed to connect to server.')
    })
  })

  it('does not submit when required fields are empty', async () => {
    render(RegisterPage)

    await submitForm()

    expect(authenticationService.register).not.toHaveBeenCalled()
  })

  // Password validation

  it('shows error when password is fewer than 8 characters after blur', async () => {
    render(RegisterPage)

    const input = screen.getByLabelText('Password')
    await fireEvent.input(input, { target: { value: 'short' } })
    await fireEvent.blur(input)

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('shows error when passwords do not match after blur', async () => {
    render(RegisterPage)

    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    const repeatInput = screen.getByLabelText('Confirm password')
    await fireEvent.input(repeatInput, { target: { value: 'different' } })
    await fireEvent.blur(repeatInput)

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
  })

  it('does not show validation errors before blur', async () => {
    render(RegisterPage)

    await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'short' } })

    expect(screen.queryByText('Must be at least 8 characters')).not.toBeInTheDocument()
  })

  it('does not submit when there are validation errors', async () => {
    render(RegisterPage)

    await fillForm({ password: 'short', repeatPassword: 'short' }).fill()
    await submitForm()

    expect(authenticationService.register).not.toHaveBeenCalled()
  })

  it('submits when the form is valid', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    expect(authenticationService.register).toHaveBeenCalled()
  })

  it('asks for an invite code on an invite-only instance and sends it', async () => {
    instance('INVITE')
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    await fireEvent.input(screen.getByLabelText('Invite code'), {
      target: { value: 'https://chat.example.com/invite/abc123' }
    })
    await fillForm().fill()
    await submitForm()

    expect(authenticationService.register).toHaveBeenCalledWith(
      'John Doe',
      'secret123',
      'john@test.com',
      undefined,
      'abc123'
    )
  })

  it('carries the margin invite from an invite link without asking again', async () => {
    instance('INVITE')
    querystring.value = 'invite=xyz789'
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    expect(screen.queryByLabelText('Invite code')).not.toBeInTheDocument()
    await fillForm().fill()
    await submitForm()

    expect(authenticationService.register).toHaveBeenCalledWith(
      'John Doe',
      'secret123',
      'john@test.com',
      undefined,
      'xyz789'
    )
  })

  it('explains that sign-up is closed', () => {
    instance('CLOSED')
    render(RegisterPage)

    expect(screen.getByText('Sign-up is closed')).toBeInTheDocument()
    expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument()
  })

  it('tells people without mail that they can sign in', async () => {
    instance('OPEN', false)
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    await waitFor(() => expect(screen.getByText('Account created')).toBeInTheDocument())
  })
})
