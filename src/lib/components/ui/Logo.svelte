<script lang="ts">
  let { height = 'h-15', class: cls = '' } = $props<{
    height?: string
    class?: string
  }>()
</script>

<img
  src="/images/logo.jpeg"
  alt="Forage"
  class="{height} w-auto object-contain {cls}"
/>
