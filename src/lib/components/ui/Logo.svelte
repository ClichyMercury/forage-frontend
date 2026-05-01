<script lang="ts">
  let { size = 'md', class: cls = '' } = $props<{
    size?: 'sm' | 'md' | 'lg'
    class?: string
  }>()

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }
</script>

<img
  src="/images/logo.jpeg"
  alt="Forage"
  class="{sizes[size]} object-contain {cls}"
/>
