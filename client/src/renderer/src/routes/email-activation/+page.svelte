<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import AuthCard from '$src/components/authentication/AuthCard.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'
  import { authenticationService } from '$src/services/AuthenticationService'

  const { params }: { params?: { token?: string } } = $props()

  let phase = $state<'activating' | 'done' | 'failed'>('activating')

  onMount(async () => {
    const token = params?.token ?? ''
    phase = token && (await authenticationService.activateAccount(token)) ? 'done' : 'failed'
  })
</script>

<PageTransition>
  {#if phase === 'activating'}
    <AuthCard title="Activating your account">
      <p class="auth-text">One moment…</p>
    </AuthCard>
  {:else if phase === 'done'}
    <AuthCard title="Account activated" subtitle="Your email is confirmed. You can sign in now.">
      <Button
        buttonType="primary"
        size="medium"
        text="Sign in"
        fullWidth
        onClick={() => push('/')}
      />
    </AuthCard>
  {:else}
    <AuthCard
      title="Activation link not valid"
      subtitle="This link has expired or was already used. If you can't sign in, ask an admin of this instance for help."
    >
      <Button
        buttonType="secondary"
        size="medium"
        text="Go to sign in"
        fullWidth
        onClick={() => push('/')}
      />
    </AuthCard>
  {/if}
</PageTransition>
