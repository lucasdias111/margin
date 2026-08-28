<script lang="ts">
  import { onMount } from 'svelte'
  import { flip } from 'svelte/animate'
  import { slide as slideCollapse } from 'svelte/transition'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import MeetingEntry from '$src/components/content/sidebar/sidebar_list/MeetingEntry.svelte'
  import { meetingsState } from '$src/states/MeetingsState.svelte'
  import { DURATION, EASING, listItemIn, listItemOut } from '$src/animations'

  let upcomingOpen = $state(true)
  let pastOpen = $state(false)

  const sectionSlide = { duration: DURATION.base, easing: EASING.standard }

  onMount(() => meetingsState.load())
</script>

<div class="meetings-list">
  <button class="section-header" onclick={() => (upcomingOpen = !upcomingOpen)}>
    <span class="section-label">Upcoming</span>
    <span class="chevron" class:open={upcomingOpen}>
      <Icon name="chevronDown" size={12} />
    </span>
  </button>

  {#if meetingsState.loading}
    <p class="muted">Loading…</p>
  {:else if meetingsState.upcoming.length === 0}
    <p class="muted">Nothing planned yet.</p>
  {:else if upcomingOpen}
    <div class="section-items" transition:slideCollapse={sectionSlide}>
      {#each meetingsState.upcoming as meeting (meeting.code)}
        <div
          animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
          in:listItemIn
          out:listItemOut
        >
          <MeetingEntry {meeting} active={meetingsState.selectedCode === meeting.code} />
        </div>
      {/each}
    </div>
  {/if}

  {#if meetingsState.past.length > 0}
    <button class="section-header" onclick={() => (pastOpen = !pastOpen)}>
      <span class="section-label">Past</span>
      <span class="chevron" class:open={pastOpen}>
        <Icon name="chevronDown" size={12} />
      </span>
    </button>
    {#if pastOpen}
      <div class="section-items" transition:slideCollapse={sectionSlide}>
        {#each meetingsState.past as meeting (meeting.code)}
          <div
            animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
            in:listItemIn
            out:listItemOut
          >
            <MeetingEntry {meeting} active={meetingsState.selectedCode === meeting.code} />
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .meetings-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 14px;
    overflow-y: auto;
    color: #2d2d2d;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    padding: 8px 18px 4px;
    cursor: pointer;
    font-family: inherit;
  }

  .section-header:hover .section-label {
    color: #888;
  }

  .section-header:hover .chevron {
    color: #999;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .chevron {
    color: #ccc;
    display: flex;
    align-items: center;
    transition: transform var(--motion-base) var(--ease-spring);
    transform: rotate(-90deg);
  }

  .chevron.open {
    transform: rotate(0deg);
  }

  .section-items {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 8px;
  }

  .muted {
    margin: 0;
    padding: 4px 18px;
    font-size: 13px;
    opacity: 0.7;
  }
</style>
