<script lang="ts">
  import type { SpaceVisibility } from '$src/interfaces/Space'

  interface Props {
    value: SpaceVisibility
    onchange?: (value: SpaceVisibility) => void
  }

  let { value = $bindable(), onchange }: Props = $props()

  function select(v: SpaceVisibility): void {
    value = v
    onchange?.(v)
  }
</script>

<div class="visibility-toggle">
  <span class="visibility-label">Visibility</span>
  <div class="toggle-options">
    <label class="toggle-option" class:selected={value === 'PUBLIC'}>
      <input
        type="radio"
        name="visibility"
        checked={value === 'PUBLIC'}
        onchange={() => select('PUBLIC')}
      />
      <span class="option-title">Public</span>
      <span class="option-desc">All margin members join automatically</span>
    </label>
    <label class="toggle-option" class:selected={value === 'PRIVATE'}>
      <input
        type="radio"
        name="visibility"
        checked={value === 'PRIVATE'}
        onchange={() => select('PRIVATE')}
      />
      <span class="option-title">Private</span>
      <span class="option-desc">Only explicitly invited members can see this space</span>
    </label>
  </div>
</div>

<style>
  .visibility-toggle {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .visibility-label {
    font-size: 0.8rem;
    color: #888;
  }

  .toggle-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .toggle-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid #e8e8e8;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .toggle-option.selected {
    border-color: #e8712a;
    background: #fff8f4;
  }

  .toggle-option input[type='radio'] {
    display: none;
  }

  .option-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: #2d2d2d;
  }

  .option-desc {
    font-size: 0.78rem;
    color: #888;
  }
</style>
