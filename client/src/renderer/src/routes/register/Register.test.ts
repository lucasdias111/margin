import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
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

vi.mock('svelte-spa-router', () => ({
  push: vi.fn()
}))

vi.mock('$src/assets/pics/margin.png', () => ({ default: 'margin-logo.png' }))
vi.mock('$src/assets/pics/anonym-avatar.png', () => ({ default: 'anonym-avatar.png' }))

vi.mock('$src/components/common/buttons/UploadImageButton.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/user/UserAvatar.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/modals/PolicyModal.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/buttons/Button.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/assets/legal/privacy-policy', () => ({
  privacyPolicyHtml: '<p>Privacy policy content</p>'
}))

vi.mock('$src/assets/legal/terms-of-service', () => ({
  termsOfServiceHtml: '<p>Terms of service content</p>'
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

async function acceptPolicies(): Promise<void> {
  const checkboxes = screen.getAllByRole('checkbox')
  for (const checkbox of checkboxes) {
    await fireEvent.click(checkbox)
  }
}

async function submitForm(): Promise<void> {
  const form = document.querySelector('form')!
  await fireEvent.submit(form)
}

describe('RegisterPage', () => {
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
    await acceptPolicies()
    await submitForm()

    expect(authenticationService.register).toHaveBeenCalledWith(
      'John Doe',
      'secret123',
      'john@test.com',
      undefined
    )
  })

  it('shows email confirmation card on successful registration', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    const { values } = fillForm()
    await fillForm().fill()
    await acceptPolicies()
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
    await acceptPolicies()
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
    await acceptPolicies()
    await submitForm()

    await waitFor(() => {
      expect(errorService.reportError).toHaveBeenCalledWith('Registration failed.')
    })
  })

  it('reports connection error when request throws', async () => {
    vi.mocked(authenticationService.register).mockRejectedValue(new Error('Network error'))
    render(RegisterPage)

    await fillForm().fill()
    await acceptPolicies()
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
    await acceptPolicies()
    await submitForm()

    expect(authenticationService.register).not.toHaveBeenCalled()
  })

  // Policy checkboxes

  it('renders terms of service and privacy policy checkboxes', () => {
    render(RegisterPage)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(screen.getByRole('button', { name: /terms of service/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /privacy policy/i })).toBeInTheDocument()
  })

  it('does not show policy errors before submit', () => {
    render(RegisterPage)

    expect(screen.queryByText('You must accept the Terms of Service')).not.toBeInTheDocument()
    expect(screen.queryByText('You must accept the Privacy Policy')).not.toBeInTheDocument()
  })

  it('shows both policy errors on submit when neither checkbox is checked', async () => {
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('You must accept the Terms of Service')).toBeInTheDocument()
      expect(screen.getByText('You must accept the Privacy Policy')).toBeInTheDocument()
    })

    expect(authenticationService.register).not.toHaveBeenCalled()
  })

  it('shows only privacy error when only terms is checked', async () => {
    render(RegisterPage)

    await fillForm().fill()
    const checkboxes = screen.getAllByRole('checkbox')
    await fireEvent.click(checkboxes[0]) // terms only
    await submitForm()

    await waitFor(() => {
      expect(screen.queryByText('You must accept the Terms of Service')).not.toBeInTheDocument()
      expect(screen.getByText('You must accept the Privacy Policy')).toBeInTheDocument()
    })

    expect(authenticationService.register).not.toHaveBeenCalled()
  })

  it('shows only terms error when only privacy is checked', async () => {
    render(RegisterPage)

    await fillForm().fill()
    const checkboxes = screen.getAllByRole('checkbox')
    await fireEvent.click(checkboxes[1]) // privacy only
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('You must accept the Terms of Service')).toBeInTheDocument()
      expect(screen.queryByText('You must accept the Privacy Policy')).not.toBeInTheDocument()
    })

    expect(authenticationService.register).not.toHaveBeenCalled()
  })

  it('clears policy errors when checkboxes are checked after submit', async () => {
    render(RegisterPage)

    await fillForm().fill()
    await submitForm()

    await waitFor(() => {
      expect(screen.getByText('You must accept the Terms of Service')).toBeInTheDocument()
      expect(screen.getByText('You must accept the Privacy Policy')).toBeInTheDocument()
    })

    await acceptPolicies()

    expect(screen.queryByText('You must accept the Terms of Service')).not.toBeInTheDocument()
    expect(screen.queryByText('You must accept the Privacy Policy')).not.toBeInTheDocument()
  })

  it('submits when both checkboxes are checked and form is valid', async () => {
    vi.mocked(authenticationService.register).mockResolvedValue({ ok: true } as Response)
    render(RegisterPage)

    await fillForm().fill()
    await acceptPolicies()
    await submitForm()

    expect(authenticationService.register).toHaveBeenCalled()
  })
})
