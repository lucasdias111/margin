<script lang="ts">
  import type { Snippet } from 'svelte'
  import { riseIn } from '$src/animations'

  // The card the standalone account pages share: setup, activation, password reset, invites.
  interface Props {
    title: string
    subtitle?: string
    children?: Snippet
  }

  let { title, subtitle, children }: Props = $props()
</script>

<div class="page">
  <div class="card" in:riseIn={{ distance: 32, duration: 500 }}>
    <div class="header">
      <h1 class="title">{title}</h1>
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
    </div>
    {@render children?.()}
  </div>
</div>

<style>
  .page {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f2eee8;
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    box-sizing: border-box;
  }

  .card {
    background: #ffffff;
    border: 1px solid #ece8e0;
    border-radius: 20px;
    padding: 40px 36px;
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
  }

  @media (max-width: 480px) {
    .card {
      padding: 28px 22px;
    }
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .subtitle {
    font-size: 13px;
    color: #888480;
    margin: 0;
    line-height: 1.5;
  }

  .card :global(.auth-form) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card :global(.auth-field) {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card :global(.auth-label) {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #888480;
  }

  .card :global(.auth-input) {
    height: 42px;
    width: 100%;
    border-radius: 10px;
    border: 1px solid #ece8e0;
    background: #f7f4ef;
    outline: none;
    padding: 0 14px;
    font-size: 14px;
    color: #1a1a1a;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
    font-family: inherit;
  }

  .card :global(.auth-input:focus) {
    border-color: #e8712a;
    background: #ffffff;
  }

  .card :global(.auth-text) {
    font-size: 13px;
    color: #4a4844;
    margin: 0;
    line-height: 1.5;
  }

  .card :global(.auth-error) {
    font-size: 13px;
    color: #d4621a;
    margin: 0;
    padding: 10px 14px;
    background: #fdf0e8;
    border-radius: 8px;
    border: 1px solid #f5d5be;
  }
</style>
