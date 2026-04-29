<script lang="ts">
  import { page } from '$app/stores'
  import { onMount, onDestroy } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import { msgStore } from '$lib/stores/messages.svelte'
  import { notifStore } from '$lib/stores/notifications.svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let { collapsed = $bindable(false) } = $props()
  const role = $derived(auth.user?.role)

  // Détection mobile pour cacher la sidebar quand collapsed
  let isMobile = $state(false)
  function checkViewport() {
    if (typeof window !== 'undefined') isMobile = window.innerWidth < 1024
  }

  // Fermeture automatique de la sidebar sur mobile lors d'un changement de route
  let lastPath = $state<string | null>(null)
  $effect(() => {
    const currentPath = $page.url.pathname
    if (lastPath !== null && currentPath !== lastPath && isMobile && !collapsed) {
      collapsed = true
    }
    lastPath = currentPath
  })

  onMount(() => {
    msgStore.loadUnread()
    notifStore.load()
    checkViewport()
    window.addEventListener('resize', checkViewport)
    const interval = setInterval(() => {
      msgStore.loadUnread()
      notifStore.load()
    }, 30000)
    return () => clearInterval(interval)
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', checkViewport)
    }
  })

  const navItems = $derived(() => {
    if (role === 'admin') return [
      { href: '/admin/dashboard',     icon: 'grid_view',     label: 'Tableau de bord', badge: 0 },
      { href: '/admin/demandes',       icon: 'assignment',    label: 'Demandes',         badge: 0 },
      { href: '/admin/appels-offres',  icon: 'campaign',      label: "Appels d'offres",  badge: 0 },
      { href: '/admin/offres',         icon: 'description',   label: 'Offres',           badge: 0 },
      { href: '/admin/utilisateurs',   icon: 'group',         label: 'Utilisateurs',     badge: 0 },
      { href: '/admin/messages',       icon: 'chat_bubble',   label: 'Messages',         badge: msgStore.unreadCount },
      { href: '/admin/notifications',  icon: 'notifications', label: 'Notifications',    badge: notifStore.count },
    ]
    if (role === 'entreprise') return [
      { href: '/entreprise/dashboard',     icon: 'grid_view',   label: 'Tableau de bord',  badge: 0 },
      { href: '/entreprise/appels-offres', icon: 'campaign',    label: "Appels d'offres",  badge: 0 },
      { href: '/entreprise/mes-offres',    icon: 'description', label: 'Mes offres',        badge: 0 },
      { href: '/entreprise/messages',      icon: 'chat_bubble', label: 'Messages',          badge: msgStore.unreadCount },
      { href: '/entreprise/notifications', icon: 'notifications',label: 'Notifications',   badge: notifStore.count },
    ]
    return [
      { href: '/client/dashboard',     icon: 'grid_view',     label: 'Tableau de bord',  badge: 0 },
      { href: '/client/demandes',       icon: 'assignment',    label: 'Mes demandes',      badge: 0 },
      { href: '/client/offres',         icon: 'description',   label: 'Mes offres',        badge: 0 },
      { href: '/client/demandes/new',   icon: 'add_circle',    label: 'Nouvelle demande',  badge: 0 },
      { href: '/client/messages',       icon: 'chat_bubble',   label: 'Messages',          badge: msgStore.unreadCount },
      { href: '/client/notifications',  icon: 'notifications', label: 'Notifications',     badge: notifStore.count },
    ]
  })

  async function handleLogout() {
    try { await api.post('/account/logout') } catch {}
    auth.logout()
    toast.info('Déconnexion', 'À bientôt !')
    goto('/login')
  }

  function isActive(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }
</script>

<aside
  class="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 bg-white border-r border-slate-200"
  style="
    width: {collapsed && !isMobile ? '64px' : '240px'};
    transform: translateX({isMobile && collapsed ? '-100%' : '0'});
  "
>
  <!-- Logo + bouton fermer (mobile) -->
  <div class="flex items-center gap-2.5 px-4 py-5 border-b border-slate-100">
    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background-color: #1e3fff">
      <span class="material-symbols-outlined text-white icon-filled" style="font-size: 18px;">water_drop</span>
    </div>
    {#if !collapsed}
      <div class="overflow-hidden flex-1">
        <span class="font-display font-black text-lg tracking-tight text-slate-900 whitespace-nowrap">ForageCI</span>
      </div>
      {#if isMobile}
        <button
          type="button"
          onclick={() => collapsed = true}
          class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500 shrink-0"
          aria-label="Fermer le menu"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
        </button>
      {/if}
    {/if}
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
    {#each navItems() as item}
      <a
        href={item.href}
        class="sidebar-link group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative font-medium"
        class:is-active={isActive(item.href)}
        title={collapsed ? item.label : ''}
      >
        <div class="relative shrink-0">
          <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">{item.icon}</span>
          {#if item.badge > 0}
            <span class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1" style="background-color: #b35d2e">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          {/if}
        </div>
        {#if !collapsed}
          <span class="text-sm whitespace-nowrap flex-1">{item.label}</span>
          {#if item.badge > 0}
            <span class="text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center" style="background-color: #b35d2e">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          {/if}
        {/if}
      </a>
    {/each}
  </nav>

  <!-- Profil -->
  <div class="border-t border-slate-100 p-2 space-y-1">
    <a href="/{role}/profile"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
      title={collapsed ? 'Profil' : ''}>
      <div class="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold" style="background-color: #1e3fff">
        {#if auth.user?.avatarUrl}
          <img src={auth.user.avatarUrl} alt={auth.user.fullName ?? 'Profil'} class="w-8 h-8 object-cover" />
        {:else}
          {auth.user?.initials ?? '?'}
        {/if}
      </div>
      {#if !collapsed}
        <div class="overflow-hidden flex-1 min-w-0">
          <p class="text-slate-800 text-sm font-semibold truncate leading-none">
            {auth.user?.fullName ?? auth.user?.email ?? 'Utilisateur'}
          </p>
          <p class="text-slate-400 text-xs capitalize mt-1">{auth.user?.role}</p>
        </div>
      {/if}
    </a>

    <button onclick={handleLogout}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
      title={collapsed ? 'Déconnexion' : ''}>
      <span class="material-symbols-outlined shrink-0" style="font-size: 20px;">logout</span>
      {#if !collapsed}
        <span class="text-sm font-medium">Déconnexion</span>
      {/if}
    </button>
  </div>
</aside>

<style>
  .sidebar-link {
    color: #64748b;
  }
  .sidebar-link:hover {
    background-color: #f8fafc;
    color: #1e3fff;
  }
  .sidebar-link.is-active {
    background-color: #1e3fff;
    color: #ffffff;
  }
  .sidebar-link.is-active:hover {
    background-color: #1730d6;
    color: #ffffff;
  }
</style>
