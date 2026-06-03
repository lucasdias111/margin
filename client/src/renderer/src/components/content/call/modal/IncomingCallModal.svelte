<script lang="ts">
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { CallOfferPayload } from '$src/interfaces/WebSocketMessages'

  interface Props {
    payload: CallOfferPayload | null
    onAccept: () => void
    onDecline: () => void
  }

  let { payload, onAccept, onDecline }: Props = $props()
</script>

{#if payload}
  <div class="backdrop">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="avatar-wrapper">
        <div class="pulse-ring"></div>
        <UserAvatar profilePictureUrl={payload.caller.profilePictureUrl} width={56} height={56} />
      </div>
      <div class="info">
        <p class="name">{payload.caller.displayName}</p>
        <p class="subtitle">Incoming call</p>
      </div>
      <div class="actions">
        <button class="decline" onclick={onDecline}>Decline</button>
        <button class="accept" onclick={onAccept}>Accept</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    animation: fade-in 0.2s ease;
  }

  .modal {
    background: #fff;
    border-radius: 16px;
    padding: 28px 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    min-width: 260px;
    animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .avatar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-ring {
    position: absolute;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid rgba(180, 112, 36, 0.35);
    animation: pulse 1.8s ease-out infinite;
    pointer-events: none;
  }

  .info {
    text-align: center;
  }

  .name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .subtitle {
    margin: 3px 0 0;
    font-size: 0.78rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .actions {
    display: flex;
    gap: 10px;
    width: 100%;
    margin-top: 4px;
  }

  .decline,
  .accept {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      transform 0.12s ease,
      opacity 0.12s ease;
  }

  .decline:hover,
  .accept:hover {
    opacity: 0.85;
  }
  .decline:active,
  .accept:active {
    transform: scale(0.96);
  }

  .decline {
    background: #f1f1f1;
    color: #444;
  }

  .accept {
    background: #b47024;
    color: white;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    70% {
      transform: scale(1.5);
      opacity: 0;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
</style>
