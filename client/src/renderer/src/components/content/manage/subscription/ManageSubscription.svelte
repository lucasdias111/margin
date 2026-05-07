<script lang="ts">
  import { onMount } from 'svelte'
  import { subscriptionService } from '$src/services/SubscriptionService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import type { Subscription } from '$src/interfaces/Subscription'
  import Button from '$src/components/common/buttons/Button.svelte'

  let subscription = $state<Subscription | null>(null)
  let isLoading = $state(true)

  onMount(async () => {
    try {
      subscription = await subscriptionService.fetchForMargin(
        navigationState.selectedMargin.marginId
      )
    } catch (e) {
      console.error('Failed to load subscription:', e)
    } finally {
      isLoading = false
    }
  })

  function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString()
  }

  function handleUpgrade(): void {
    // TODO: tier picker
  }
</script>

<div class="manage-subscription">
  {#if isLoading}
    <div class="loading">Loading subscription...</div>
  {:else if subscription}
    <section class="card">
      <header>
        <div>
          <h2>Current plan</h2>
          <p class="subtitle">Workspace billing and limits</p>
        </div>
        <span class="tier-badge tier-{subscription.tier.toLowerCase()}">{subscription.tier}</span>
      </header>

      <dl class="meta">
        <div>
          <dt>Status</dt>
          <dd>{subscription.status}</dd>
        </div>
        <div>
          <dt>Current period ends</dt>
          <dd>{formatDate(subscription.currentPeriodEnd)}</dd>
        </div>
      </dl>
    </section>

    <section class="card">
      <h2>Usage</h2>
      <ul class="limits">
        <li>
          <span class="limit-label">Members</span>
          <span class="limit-value">
            {subscription.currentMembers} / {subscription.limits.maxMembers}
          </span>
        </li>
        <li>
          <span class="limit-label">Storage</span>
          <span class="limit-value">{subscription.limits.maxStorageGb} GB</span>
        </li>
        <li>
          <span class="limit-label">Call participants</span>
          <span class="limit-value">{subscription.limits.maxCallParticipants} per call</span>
        </li>
      </ul>
    </section>

    <div class="actions">
      <Button buttonType="primary" size="medium" text="Upgrade plan" onClick={handleUpgrade} />
    </div>
  {:else}
    <div class="loading">Could not load subscription.</div>
  {/if}
</div>

<style>
  .manage-subscription {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .card {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    padding: 20px;
  }

  .card header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
    color: #2d2d2d;
  }

  .subtitle {
    margin: 4px 0 0;
    color: #888;
    font-size: 0.85rem;
  }

  .tier-badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: #f3f3f3;
    color: #2d2d2d;
  }
  .tier-badge.tier-free {
    background: #f3f3f3;
    color: #888;
  }
  .tier-badge.tier-small,
  .tier-badge.tier-medium,
  .tier-badge.tier-custom {
    background: rgba(244, 126, 58, 0.12);
    color: #f47e3a;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin: 0;
  }
  .meta div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  dt {
    color: #888;
    font-size: 0.8rem;
  }
  dd {
    margin: 0;
    color: #2d2d2d;
    font-size: 0.95rem;
  }

  .limits {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .limits li {
    display: flex;
    justify-content: space-between;
    color: #2d2d2d;
    font-size: 0.95rem;
  }
  .limit-label {
    color: #555;
  }
  .limit-value {
    font-weight: 500;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-size: 0.95rem;
  }
</style>
