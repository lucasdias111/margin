<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import AuthCard from '$src/components/authentication/AuthCard.svelte'
  import OpenInDesktopButton from '$src/components/authentication/OpenInDesktopButton.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'
  import { authenticationService } from '$src/services/AuthenticationService'
  import { instanceService } from '$src/services/InstanceService'
  import { marginInviteService, type MarginInviteDetails } from '$src/services/MarginInviteService'
  import { instanceState } from '$src/states/InstanceState.svelte'
  import { rememberPostLoginRoute } from '$src/utils/postLoginRoute'

  const { params }: { params?: { code?: string } } = $props()
  const code = $derived(params?.code ?? '')

  type Phase = 'loading' | 'signed-out' | 'ready' | 'joining' | 'unavailable'

  let phase = $state<Phase>('loading')
  let invite = $state<MarginInviteDetails | null>(null)

  const canRegister = $derived(instanceState.info?.registrationMode !== 'CLOSED')

  onMount(async () => {
    instanceService.load()
    const signedIn =
      sessionStorage.getItem('authToken') !== null ||
      (await authenticationService.tryRestoreSession())
    if (!signedIn) {
      phase = 'signed-out'
      return
    }
    try {
      invite = await marginInviteService.getInviteDetails(code)
      phase = 'ready'
    } catch {
      phase = 'unavailable'
    }
  })

  function signIn(): void {
    rememberPostLoginRoute(`/invite/${code}`)
    push('/')
  }

  function register(): void {
    rememberPostLoginRoute(`/invite/${code}`)
    push(`/register?invite=${encodeURIComponent(code)}`)
  }

  async function join(): Promise<void> {
    phase = 'joining'
    try {
      await marginInviteService.acceptLinkInvite(code)
      await push('/home')
    } catch {
      phase = 'unavailable'
    }
  }
</script>

<PageTransition>
  {#if phase === 'loading' || phase === 'joining'}
    <AuthCard title="Margin invite">
      <p class="auth-text">{phase === 'joining' ? 'Joining…' : 'Loading invite…'}</p>
    </AuthCard>
  {:else if phase === 'signed-out'}
    <AuthCard
      title="You're invited"
      subtitle={`Someone invited you to a margin on ${instanceState.info?.name ?? 'this instance'}. Sign in or create an account to join.`}
    >
      <Button buttonType="primary" size="medium" text="Sign in" fullWidth onClick={signIn} />
      {#if canRegister}
        <Button
          buttonType="secondary"
          size="medium"
          text="Create an account"
          fullWidth
          onClick={register}
        />
      {/if}
      <OpenInDesktopButton path={`/invite/${code}`} />
    </AuthCard>
  {:else if phase === 'ready' && invite}
    <AuthCard
      title={`Join ${invite.marginName}`}
      subtitle={`${invite.invitedByUser} invited you to this margin.`}
    >
      <Button buttonType="primary" size="medium" text="Join margin" fullWidth onClick={join} />
      <OpenInDesktopButton path={`/invite/${code}`} />
      <Button
        buttonType="tertiary"
        size="medium"
        text="Not now"
        fullWidth
        onClick={() => push('/home')}
      />
    </AuthCard>
  {:else}
    <AuthCard
      title="Invite not valid"
      subtitle="This invite has expired, was used up, or you're already a member."
    >
      <Button
        buttonType="secondary"
        size="medium"
        text="Go to margin"
        fullWidth
        onClick={() => push('/home')}
      />
    </AuthCard>
  {/if}
</PageTransition>
