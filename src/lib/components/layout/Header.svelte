<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
  import { notifStore } from '$lib/stores/notifications.svelte'
  import api from '$lib/api'

  let { onToggleSidebar } = $props<{ onToggleSidebar: () => void }>()
  let showNotifs = $state(false)
  let darkMode = $state(false)

  // Recherche
  let searchQuery = $state('')
  let searchResults = $state<any[]>([])
  let searchLoading = $state(false)
  let showSearch = $state(false)
  let searchTimeout: ReturnType<typeof setTimeout>

  const pageTitle = $derived(() => {
    const path = $page.url.pathname
    if (path.includes('dashboard')) return 'Tableau de bord'
    if (path.includes('demandes/new')) return 'Nouvelle demande'
    if (path.includes('demandes')) return 'Demandes'
    if (path.includes('appels-offres')) return "Appels d'offres"
    if (path.includes('mes-offres')) return 'Mes offres'
    if (path.includes('utilisateurs')) return 'Utilisateurs'
    if (path.includes('messages')) return 'Messages'
    if (path.includes('notifications')) return 'Notifications'
    if (path.includes('comparatif')) return 'Comparatif des offres'
    if (path.includes('offre-finale')) return 'Offre finale'
    return 'Forage'
  })

  onMount(() => {
    notifStore.load()
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      darkMode = true
      document.documentElement.classList.add('dark')
    }
  })

  function toggleDark() {
    darkMode = !darkMode
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }

  async function handleSearch(q: string) {
    if (q.trim().length < 2) {
      searchResults = []
      showSearch = false
      return
    }
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
      searchLoading = true
      showSearch = true
      try {
        const results: any[] = []
        const role = auth.user?.role

        if (role === 'admin') {
          const [demandesRes, usersRes] = await Promise.all([
            api.get(`/admin/demandes?region=${encodeURIComponent(q)}&limit=5`),
            api.get(`/admin/users?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: { data: [] } })),
          ])
          const demandes = demandesRes.data.data ?? []
          const users = usersRes.data.data ?? []
          demandes.forEach((d: any) => results.push({
            label: d.localisationAdresse ?? `Demande #${d.id}`,
            sub: `Forage ${d.typeForage} · ${d.statut}`,
            href: `/admin/demandes/${d.id}`,
            icon: 'water_drop',
          }))
          users.forEach((u: any) => results.push({
            label: u.fullName ?? u.email,
            sub: `${u.role} · ${u.email}`,
            href: `/admin/utilisateurs/${u.id}`,
            icon: 'person',
          }))
        } else if (role === 'client') {
          const res = await api.get('/demandes')
          const demandes = (res.data ?? []).filter((d: any) =>
            d.localisationAdresse?.toLowerCase().includes(q.toLowerCase()) ||
            d.typeForage?.toLowerCase().includes(q.toLowerCase())
          ).slice(0, 5)
          demandes.forEach((d: any) => results.push({
            label: d.localisationAdresse ?? `Demande #${d.id}`,
            sub: `Forage ${d.typeForage} · ${d.statut}`,
            href: `/client/demandes/${d.id}`,
            icon: 'water_drop',
          }))
        } else if (role === 'entreprise') {
          const res = await api.get('/appels-offres')
          const aos = (res.data.data ?? []).filter((a: any) =>
            (a.demande?.localisationAdresse ?? a.demande?.localisation_adresse ?? '')
              .toLowerCase().includes(q.toLowerCase())
          ).slice(0, 5)
          aos.forEach((a: any) => results.push({
            label: a.demande?.localisationAdresse ?? a.demande?.localisation_adresse ?? `Appel d'offre #${a.id}`,
            sub: `Forage ${a.demande?.typeForage ?? a.demande?.type_forage ?? ''}`,
            href: `/entreprise/appels-offres/${a.id}`,
            icon: 'campaign',
          }))
        }

        searchResults = results
      } catch {
        searchResults = []
      } finally {
        searchLoading = false
      }
    }, 300)
  }

  function selectResult(href: string) {
    searchQuery = ''
    searchResults = []
    showSearch = false
    goto(href)
  }

  function closeSearch() {
    showSearch = false
    searchResults = []
  }
</script>

<header class="sticky top-0 z-30 border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center gap-3" style="background-color: #fafbff">

  <!-- Gauche : toggle + titre -->
  <div class="flex items-center gap-3 w-1/3 min-w-0">
    <button onclick={onToggleSidebar}
      class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-all text-slate-600 shrink-0">
      <span class="material-symbols-outlined" style="font-size: 20px;">menu</span>
    </button>
    <h1 class="font-display font-bold text-lg tracking-tight shrink-0 hidden sm:block" style="color: #0f1f5c; letter-spacing: -0.02em">
      {pageTitle()}
    </h1>
  </div>

  <!-- Centre : recherche -->
  <div class="w-1/3 relative hidden md:flex justify-center">
    <div class="relative w-full max-w-md">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 18px;">search</span>
      <input
        type="text"
        bind:value={searchQuery}
        oninput={() => handleSearch(searchQuery)}
        onfocus={() => searchQuery.length >= 2 && (showSearch = true)}
        placeholder="Rechercher…"
        class="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 transition-all"
        style="background-color: #f0f2f5"
      />
      {#if searchLoading}
        <span class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></span>
      {:else if searchQuery}
        <button onclick={() => { searchQuery = ''; closeSearch() }}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
        </button>
      {/if}

      {#if showSearch}
        <button class="fixed inset-0 z-40" onclick={closeSearch} aria-label="Fermer la recherche"></button>
        <div class="absolute left-0 right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-down">
          {#if searchResults.length === 0 && !searchLoading}
            <div class="px-4 py-6 text-center text-slate-400">
              <span class="material-symbols-outlined" style="font-size: 24px;">search_off</span>
              <p class="text-xs mt-1">Aucun résultat pour "{searchQuery}"</p>
            </div>
          {:else}
            {#each searchResults as result}
              <button onclick={() => selectResult(result.href)}
                class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left border-b border-slate-50 last:border-0">
                <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 15px;">{result.icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 truncate">{result.label}</p>
                  <p class="text-xs text-slate-400 truncate capitalize">{result.sub}</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 shrink-0" style="font-size: 16px;">chevron_right</span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Droite : dark mode + notifs + avatar -->
  <div class="flex items-center gap-1 w-1/3 justify-end">

    <!-- Bouton dark mode — gris -->
    <button
      onclick={toggleDark}
      title={darkMode ? 'Mode clair' : 'Mode sombre'}
      class="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
      style="background-color: {darkMode ? '#363c4a' : '#e2e8f0'}; color: {darkMode ? '#94a3b8' : '#475569'}">
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">
        {darkMode ? 'light_mode' : 'dark_mode'}
      </span>
    </button>

    <!-- Notifications -->
    <div class="relative">
      <button
        onclick={() => { showNotifs = !showNotifs; if (showNotifs) notifStore.load() }}
        class="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-all text-slate-600">
        <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">notifications</span>
        {#if notifStore.count > 0}
          <span class="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style="background-color: #1e3fff">
            {notifStore.count > 9 ? '9+' : notifStore.count}
          </span>
        {/if}
      </button>

      {#if showNotifs}
        <button class="fixed inset-0 z-40" onclick={() => showNotifs = false} aria-label="Fermer"></button>
        <div class="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden animate-fade-in-down">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span class="font-display font-bold text-slate-900 text-sm">Notifications</span>
            <div class="flex items-center gap-2">
              {#if notifStore.count > 0}
                <span class="text-xs px-2 py-0.5 rounded-full font-medium text-white" style="background-color: #1e3fff">{notifStore.count} non lues</span>
                <button onclick={() => notifStore.markAllRead()}
                  class="text-xs text-slate-400 hover:text-brand-600 transition-colors">
                  Tout lire
                </button>
              {/if}
            </div>
          </div>
          <div class="max-h-64 overflow-y-auto">
            {#if notifStore.items.length === 0}
              <div class="py-8 text-center text-slate-400">
                <span class="material-symbols-outlined" style="font-size: 28px;">notifications_none</span>
                <p class="text-xs mt-1">Aucune notification</p>
              </div>
            {:else}
              {#each notifStore.items.slice(0, 8) as notif}
                <button onclick={() => notifStore.markRead(notif.id)}
                  class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 {!notif.lu ? 'bg-brand-50/60' : ''}">
                  <div class="flex items-start gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 13px;">notifications</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-slate-700 leading-snug line-clamp-2">{notif.contenu}</p>
                      <p class="text-xs text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleDateString('fr-CM')}</p>
                    </div>
                    {#if !notif.lu}
                      <div class="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1.5"></div>
                    {/if}
                  </div>
                </button>
              {/each}
            {/if}
          </div>
          <div class="px-4 py-2.5 border-t border-slate-100">
            <a href="/{auth.user?.role}/notifications" onclick={() => showNotifs = false}
              class="text-xs text-brand-600 font-semibold hover:text-brand-700">
              Voir toutes les notifications →
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Avatar -->
    <a href="/{auth.user?.role}/profile"
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all ml-1">
      <div class="w-8 h-8 rounded-full overflow-hidden bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {#if auth.user?.avatarUrl}
          <img src={auth.user.avatarUrl} alt={auth.user.fullName ?? 'Profil'} class="w-8 h-8 object-cover" />
        {:else}
          {auth.user?.initials ?? '?'}
        {/if}
      </div>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold text-slate-800 leading-none">{auth.user?.fullName?.split(' ')[0] ?? 'Profil'}</p>
      </div>
    </a>
  </div>
</header>
