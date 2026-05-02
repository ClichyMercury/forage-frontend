<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import { notifStore } from '$lib/stores/notifications.svelte'

  let { onToggleSidebar } = $props<{ onToggleSidebar: () => void }>()
  let showNotifs = $state(false)

  onMount(() => notifStore.load())

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
</script>

<header class="sticky top-0 z-30 border-b border-slate-100 px-6 py-4 flex items-center justify-between" style="background-color: #fafbff">
  <div class="flex items-center gap-3">
    <button onclick={onToggleSidebar}
      class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">menu</span>
    </button>
    <h1 class="font-display font-bold text-lg tracking-tight" style="color: #0f1f5c; letter-spacing: -0.02em">{pageTitle()}</h1>
  </div>

  <div class="flex items-center gap-1">
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
                      <p class="text-xs text-slate-400 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('fr-CI')}
                      </p>
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
