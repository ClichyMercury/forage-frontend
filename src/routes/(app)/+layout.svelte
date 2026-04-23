<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Header from '$lib/components/layout/Header.svelte'
  import Toast from '$lib/components/ui/Toast.svelte'
  import '../../app.css'

  let { children } = $props()
  let collapsed = $state(false)

  const year = new Date().getFullYear()

  onMount(() => {
    auth.init()
    if (!auth.isAuthenticated()) goto('/login')
  })
</script>

<Toast />

<div class="flex h-screen overflow-hidden bg-slate-50">
  <Sidebar bind:collapsed />

  <!-- Contenu principal -->
  <div
    class="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300"
    style="margin-left: {collapsed ? '64px' : '240px'};"
  >
    <Header onToggleSidebar={() => collapsed = !collapsed} />

    <!-- Zone scrollable -->
    <main class="flex-1 overflow-y-auto p-6">
      <div class="animate-fade-in-up max-w-7xl mx-auto">
        {@render children()}
      </div>
    </main>

    <!-- Footer fixe en bas -->
    <footer class="shrink-0 px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
      © {year} ForageCI — Plateforme de mise en relation pour prestations de forage
    </footer>
  </div>
</div>
