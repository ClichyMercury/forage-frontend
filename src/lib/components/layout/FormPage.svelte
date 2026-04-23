<script lang="ts">
  let { maxWidth = 'max-w-2xl', children } = $props<{
    maxWidth?: string
    children: any
  }>()
</script>

<div class="min-h-[calc(100vh-140px)] flex items-start justify-center py-6">
  <div class="w-full {maxWidth} animate-fade-in-up">
    {@render children()}
  </div>
</div>
