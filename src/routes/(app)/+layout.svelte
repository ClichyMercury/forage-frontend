<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Header from '$lib/components/layout/Header.svelte'
  import Toast from '$lib/components/ui/Toast.svelte'
  import '../../app.css'

  let { children } = $props()
  let collapsed = $state(false)
  let isMobile = $state(false)

  const year = new Date().getFullYear()

  function checkViewport() {
    const mobile = window.innerWidth < 1024
    isMobile = mobile
    // Sur mobile, on force la sidebar collapsed par défaut
    if (mobile) collapsed = true
  }

  onMount(() => {
    auth.init()
    if (!auth.isAuthenticated()) goto('/login')
    checkViewport()
    window.addEventListener('resize', checkViewport)

    // Rafraîchir le profil pour avoir avatarUrl à jour (ex: après reconnexion)
    import('$lib/api').then(({ default: api }) => {
      api.get('/account/profile').then((res) => {
        const u = res.data?.data ?? res.data
        if (auth.user && u?.avatarUrl !== undefined) {
          auth.user = { ...auth.user, avatarUrl: u.avatarUrl ?? u.avatar_url ?? null }
          if (typeof localStorage !== 'undefined' && auth.token) {
            localStorage.setItem('auth', JSON.stringify({ user: auth.user, token: auth.token }))
          }
        }
      }).catch(() => {})
    })
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', checkViewport)
    }
  })

  // Largeur de la sidebar selon état + viewport
  const sidebarWidth = $derived(collapsed ? 64 : 240)
</script>

<Toast />

<div class="flex h-screen overflow-hidden bg-slate-50">
  <Sidebar bind:collapsed />

  <!-- Backdrop mobile quand sidebar ouverte -->
  {#if isMobile && !collapsed}
    <button
      class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
      onclick={() => collapsed = true}
      aria-label="Fermer le menu"
    ></button>
  {/if}

  <!-- Contenu principal -->
  <div
    class="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 min-w-0"
    style="margin-left: {isMobile ? 0 : sidebarWidth}px;"
  >
    <Header onToggleSidebar={() => collapsed = !collapsed} />

    <!-- Zone scrollable -->
    <main class="flex-1 overflow-y-auto p-4 lg:p-6">
      <div class="animate-fade-in-up max-w-7xl mx-auto min-w-0">
        {@render children()}
      </div>
    </main>

    <!-- Footer fixe en bas -->
    <footer class="shrink-0 px-4 lg:px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
      © {year} ForageCI — Plateforme de mise en relation pour prestations de forage
    </footer>
  </div>
</div>
