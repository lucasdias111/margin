<script lang="ts">
  interface Props {
    src: string
    alt?: string
    class?: string
    block?: boolean
  }

  let { src, alt = '', class: className = '', block = false }: Props = $props()
  let loaded = $state(false)

  $effect(() => {
    void src
    loaded = false
  })
</script>

<span class="loading-image {className}" class:block class:is-loaded={loaded}>
  {#if !loaded}
    <span class="skeleton" aria-hidden="true"></span>
  {/if}
  <img
    {src}
    {alt}
    class:is-loaded={loaded}
    onload={() => (loaded = true)}
    onerror={() => (loaded = true)}
  />
</span>

<style>
  .loading-image {
    position: relative;
    display: inline-block;
  }

  .loading-image.block {
    display: block;
  }

  .skeleton {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      100deg,
      rgba(0, 0, 0, 0.06) 30%,
      rgba(0, 0, 0, 0.12) 50%,
      rgba(0, 0, 0, 0.06) 70%
    );
    background-size: 200% 100%;
    animation: loading-image-shimmer 1.4s ease-in-out infinite;
  }

  .loading-image img {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .loading-image img.is-loaded {
    opacity: 1;
  }

  @keyframes loading-image-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
