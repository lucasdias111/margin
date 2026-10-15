<script lang="ts">
  import { onMount } from 'svelte'
  import { subscriptionService } from '$src/services/SubscriptionService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import type { SubscriptionTier, TierPrice } from '$src/interfaces/Subscription'
  import Button from '$src/components/common/buttons/Button.svelte'
  import LegalDocumentModal from '$src/components/common/modals/LegalDocumentModal.svelte'
  import { subscriptionState } from '$src/states/SubscriptionState.svelte'
  import { termsOfServiceHtml } from '$src/assets/legal/terms-of-service'
  import { privacyPolicyHtml } from '$src/assets/legal/privacy-policy'

  const CANCEL_DELAY_MS = 30_000

  let tiers = $state<TierPrice[]>([])
  let isLoading = $state(true)
  let checkoutPending = $state<SubscriptionTier | null>(null)
  let cancelPending = $state(false)
  let confirmCancel = $state(false)
  let reconciling = $state(false)
  let cancelPendingLoading = $state(false)
  let showCancelPending = $state(false)
  let hasConsented = $state(false)
  let legalModal = $state<'tos' | 'privacy' | null>(null)

  const subscription = $derived(subscriptionState.subscription)

  $effect(() => {
    if (!subscription?.hasPendingPayment) {
      showCancelPending = false
      return
    }
    const timer = setTimeout(() => {
      showCancelPending = true
    }, CANCEL_DELAY_MS)
    return () => clearTimeout(timer)
  })

  onMount(async () => {
    try {
      const marginId = navigationState.selectedMargin.marginId
      const [sub, tierList] = await Promise.all([
        subscriptionService.fetchForMargin(marginId),
        subscriptionService.fetchTiers()
      ])
      subscriptionState.set(sub)
      tiers = tierList
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

  function formatPrice(price: number | null, currency: string): string {
    if (price === null) return 'Free'
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency
    }).format(price)
  }

  async function handleCheckStatus(): Promise<void> {
    reconciling = true
    try {
      const marginId = navigationState.selectedMargin.marginId
      subscriptionState.set(await subscriptionService.reconcilePending(marginId))
    } catch (e) {
      console.error('Failed to check status:', e)
    } finally {
      reconciling = false
    }
  }

  async function handleCancelPending(): Promise<void> {
    cancelPendingLoading = true
    try {
      const marginId = navigationState.selectedMargin.marginId
      subscriptionState.set(await subscriptionService.cancelPending(marginId))
    } catch (e) {
      console.error('Failed to cancel pending payment:', e)
    } finally {
      cancelPendingLoading = false
    }
  }

  async function handleCancel(): Promise<void> {
    cancelPending = true
    try {
      const marginId = navigationState.selectedMargin.marginId
      await subscriptionService.cancelSubscription(marginId)
      subscriptionState.set(await subscriptionService.fetchForMargin(marginId))
      confirmCancel = false
    } catch (e) {
      console.error('Failed to cancel subscription:', e)
    } finally {
      cancelPending = false
    }
  }

  async function handleSelectTier(tier: SubscriptionTier): Promise<void> {
    if (!subscription || tier === subscription.tier) return
    if (!hasConsented) return
    if (tier === 'FREE') {
      if (subscription.status === 'ACTIVE') confirmCancel = true
      return
    }
    checkoutPending = tier
    const marginId = navigationState.selectedMargin.marginId
    try {
      const isDowngrade =
        subscription.tier !== 'FREE' &&
        subscription.status === 'ACTIVE' &&
        (tiers.find((t) => t.tier === tier)?.price ?? Infinity) <
          (tiers.find((t) => t.tier === subscription!.tier)?.price ?? 0)

      if (isDowngrade) {
        subscriptionState.set(await subscriptionService.changeTier(marginId, tier))
      } else {
        const { checkoutUrl } = await subscriptionService.startCheckout(marginId, tier)
        if (subscriptionState.subscription) {
          subscriptionState.subscription.hasPendingPayment = true
          subscriptionState.subscription.pendingTier = tier
        }
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      console.error('Failed to change tier:', e)
    } finally {
      checkoutPending = null
    }
  }
</script>

<div class="manage-subscription" data-tour="manage-tab-content-subscription">
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

      {#if subscription.tier !== 'FREE' && subscription.status === 'ACTIVE'}
        {#if confirmCancel}
          <div class="cancel-confirm">
            <p>
              Your plan stays active until {formatDate(subscription.currentPeriodEnd)}, then reverts
              to FREE. Continue?
            </p>
            <div class="cancel-actions">
              <Button
                buttonType="secondary"
                size="medium"
                text="Keep plan"
                onClick={() => (confirmCancel = false)}
              />
              <Button
                buttonType="danger"
                size="medium"
                text={cancelPending ? 'Cancelling…' : 'Yes, cancel'}
                disabled={cancelPending}
                onClick={handleCancel}
              />
            </div>
          </div>
        {:else}
          <button class="cancel-link" onclick={() => (confirmCancel = true)}>Cancel plan</button>
        {/if}
      {/if}

      {#if subscription.status === 'CANCELLED'}
        <p class="cancelled-notice">
          Plan cancelled — access continues until {formatDate(subscription.currentPeriodEnd)}.
        </p>
      {/if}
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

    <section class="card">
      <h2>Available plans</h2>
      <div class="tiers">
        {#each tiers as tier (tier.tier)}
          {@const isCurrent = subscription.tier === tier.tier}
          <article class="tier-card" class:current={isCurrent}>
            <header class="tier-header">
              <h3>{tier.tier}</h3>
              <p class="tier-price">
                {formatPrice(tier.price, tier.currency)}
                {#if tier.price !== null}<span>/ month</span>{/if}
              </p>
            </header>
            <ul class="tier-features">
              <li>{tier.maxMembers} members</li>
              <li>{tier.maxStorageGb} GB storage</li>
              <li>{tier.maxCallParticipants} in calls</li>
            </ul>
            {#if isCurrent}
              <p class="current-label">Current plan</p>
            {:else if subscription.pendingTier === tier.tier}
              <p class="pending-label">Payment processing…</p>
            {:else if tier.price === null}
              <p class="current-label" style="color: #888">Cancel to return to Free</p>
            {:else}
              <Button
                buttonType="primary"
                size="medium"
                text={checkoutPending === tier.tier ? 'Redirecting...' : 'Choose'}
                disabled={checkoutPending !== null ||
                  subscription.hasPendingPayment ||
                  !hasConsented}
                onClick={() => handleSelectTier(tier.tier)}
              />
            {/if}
          </article>
        {/each}
      </div>

      {#if !subscription.hasPendingPayment}
        <label class="consent-label">
          <input type="checkbox" bind:checked={hasConsented} />
          <span>
            I've read and agree to the
            <button class="consent-link" onclick={() => (legalModal = 'tos')}
              >Terms of Service</button
            >
            and
            <button class="consent-link" onclick={() => (legalModal = 'privacy')}
              >Privacy Policy</button
            >, and I confirm that my subscription starts immediately, waiving my 14-day right of
            withdrawal.
          </span>
        </label>
      {/if}

      {#if subscription.hasPendingPayment}
        <div class="pending-actions">
          <p class="pending-hint">
            Waiting for payment confirmation from Mollie. This usually takes a few seconds.
          </p>
          <div class="pending-action-row">
            <button
              class="pending-action-link"
              onclick={handleCheckStatus}
              disabled={reconciling || cancelPendingLoading}
            >
              {reconciling ? 'Checking…' : 'Check status'}
            </button>
            {#if showCancelPending}
              <button
                class="pending-action-link danger"
                onclick={handleCancelPending}
                disabled={reconciling || cancelPendingLoading}
              >
                {cancelPendingLoading ? 'Cancelling…' : 'Cancel and start over'}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </section>
  {:else}
    <div class="loading">Could not load subscription.</div>
  {/if}
</div>

<LegalDocumentModal
  open={legalModal === 'tos'}
  title="Terms of Service"
  html={termsOfServiceHtml}
  onClose={() => (legalModal = null)}
/>
<LegalDocumentModal
  open={legalModal === 'privacy'}
  title="Privacy Policy"
  html={privacyPolicyHtml}
  onClose={() => (legalModal = null)}
/>

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

  .dev-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(244, 126, 58, 0.08);
    border: 1px dashed rgba(244, 126, 58, 0.4);
    color: #2d2d2d;
    font-size: 0.85rem;
  }

  .tiers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 12px;
  }

  .tier-card {
    border: 1px solid #ebebeb;
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #fafafa;
  }

  .tier-card.current {
    border-color: #f47e3a;
    background: rgba(244, 126, 58, 0.04);
  }

  .tier-header h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #2d2d2d;
    font-weight: 600;
  }

  .tier-price {
    margin: 4px 0 0;
    color: #2d2d2d;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .tier-price span {
    color: #888;
    font-size: 0.8rem;
    font-weight: 400;
  }

  .tier-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #555;
    font-size: 0.85rem;
  }

  .current-label {
    margin: 0;
    color: #f47e3a;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .pending-label {
    margin: 0;
    color: #888;
    font-size: 0.85rem;
    font-style: italic;
  }

  .consent-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 16px;
    cursor: pointer;
  }

  .consent-label input[type='checkbox'] {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: #f47e3a;
    cursor: pointer;
  }

  .consent-label span {
    font-size: 0.78rem;
    color: #666;
    line-height: 1.55;
  }

  .consent-link {
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
    color: #f47e3a;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .consent-link:hover {
    color: #d4682e;
  }

  .pending-actions {
    margin-top: 20px;
    padding: 14px 16px;
    background: rgba(244, 126, 58, 0.04);
    border: 1px solid rgba(244, 126, 58, 0.18);
    border-radius: 8px;
  }

  .pending-hint {
    margin: 0 0 10px;
    font-size: 0.85rem;
    color: #555;
  }

  .pending-action-row {
    display: flex;
    gap: 18px;
  }

  .pending-action-link {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.85rem;
    color: #555;
    cursor: pointer;
    text-decoration: underline;
  }

  .pending-action-link:hover:not(:disabled) {
    color: #2d2d2d;
  }

  .pending-action-link.danger {
    color: #888;
  }

  .pending-action-link.danger:hover:not(:disabled) {
    color: #c0392b;
  }

  .pending-action-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cancel-link {
    margin-top: 16px;
    background: none;
    border: none;
    padding: 0;
    color: #888;
    font-size: 0.8rem;
    cursor: pointer;
    text-decoration: underline;
  }

  .cancel-link:hover {
    color: #e05c3a;
  }

  .cancel-confirm {
    margin-top: 16px;
    padding: 12px 14px;
    background: rgba(224, 92, 58, 0.06);
    border: 1px solid rgba(224, 92, 58, 0.2);
    border-radius: 8px;
  }

  .cancel-confirm p {
    margin: 0 0 12px;
    font-size: 0.875rem;
    color: #2d2d2d;
  }

  .cancel-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .cancelled-notice {
    margin: 16px 0 0;
    font-size: 0.85rem;
    color: #888;
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
