<script lang="ts">
  import { onMount } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import '../app.css'

  let { children } = $props()

  onMount(() => {
    auth.init()
  })
</script>

{@render children()}
