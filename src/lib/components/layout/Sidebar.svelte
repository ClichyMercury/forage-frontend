<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import { msgStore } from '$lib/stores/messages.svelte'
  import { notifStore } from '$lib/stores/notifications.svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let { collapsed = $bindable(false) } = $props()
  const role = $derived(auth.user?.role)

  onMount(() => {
    msgStore.loadUnread()
    notifStore.load()
    const interval = setInterval(() => {
      msgStore.loadUnread()
      notifStore.load()
    }, 30000)
    return () => clearInterval(interval)
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
  class="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 bg-slate-900"
  style="width: {collapsed ? '64px' : '240px'};"
>
  <!-- Logo -->
  <div class="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
    <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
      <span class="material-symbols-outlined text-white icon-filled" style="font-size: 17px;">water_drop</span>
    </div>
    {#if !collapsed}
      <div class="overflow-hidden">
        <span class="text-white font-bold text-base whitespace-nowrap">ForageCI</span>
      </div>
    {/if}
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
    {#each navItems() as item}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative
          {isActive(item.href)
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
        title={collapsed ? item.label : ''}
      >
        <div class="relative shrink-0">
          <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">{item.icon}</span>
          {#if item.badge > 0}
            <span class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          {/if}
        </div>
        {#if !collapsed}
          <span class="text-sm font-medium whitespace-nowrap flex-1">{item.label}</span>
          {#if item.badge > 0}
            <span class="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          {/if}
        {/if}
      </a>
    {/each}
  </nav>

  <!-- Profil -->
  <div class="border-t border-slate-800 p-2 space-y-0.5">
    <a href="/{role}/profile"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
      title={collapsed ? 'Profil' : ''}>
      <div class="w-7 h-7 rounded-full bg-blue-600 shrink-0 flex items-center justify-center text-white text-xs font-bold">
        {auth.user?.initials ?? '?'}
      </div>
      {#if !collapsed}
        <div class="overflow-hidden flex-1 min-w-0">
          <p class="text-slate-200 text-sm font-medium truncate leading-none">
            {auth.user?.fullName ?? auth.user?.email ?? 'Utilisateur'}
          </p>
          <p class="text-slate-500 text-xs capitalize mt-0.5">{auth.user?.role}</p>
        </div>
      {/if}
    </a>

    <button onclick={handleLogout}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
      title={collapsed ? 'Déconnexion' : ''}>
      <span class="material-symbols-outlined shrink-0" style="font-size: 20px;">logout</span>
      {#if !collapsed}
        <span class="text-sm font-medium">Déconnexion</span>
      {/if}
    </button>
  </div>
</aside>
