<script lang="ts">
  import { onMount } from 'svelte'
  import { notifStore } from '$lib/stores/notifications.svelte'
  import { auth } from '$lib/stores/auth.svelte'

  onMount(() => notifStore.load())

  const isAdmin = $derived(auth.user?.role === 'admin')

  const typeIcons: Record<string, string> = {
    nouvelle_demande: 'assignment',
    demande_validee: 'verified',
    demande_rejetee: 'cancel',
    appel_offre_lance: 'campaign',
    offre_soumise: 'send',
    offre_finale_envoyee: 'mark_email_read',
    offre_acceptee: 'check_circle',
    offre_refusee: 'close',
    compte_valide: 'how_to_reg',
    nouveau_message: 'chat',
  }

  const typeColors: Record<string, string> = {
    nouvelle_demande: 'gradient-card',
    demande_validee: 'gradient-success',
    demande_rejetee: 'gradient-danger',
    appel_offre_lance: 'gradient-blue',
    offre_soumise: 'gradient-blue',
    offre_finale_envoyee: 'gradient-success',
    offre_acceptee: 'gradient-success',
    offre_refusee: 'gradient-danger',
    compte_valide: 'gradient-success',
    nouveau_message: 'gradient-card',
  }
</script>

<div class="max-w-2xl mx-auto">
  <div class="flex items-start justify-between mb-6 flex-wrap gap-3">
    <div class="min-w-0 flex-1">
      <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
        <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #1e3fff">Notifications</span>.
      </h2>
      <p class="text-slate-500 mt-1 text-sm">
        {#if notifStore.count > 0}
          <span class="text-brand-600 font-semibold">{notifStore.count}</span> non lue{notifStore.count > 1 ? 's' : ''}
        {:else}
          Toutes lues
        {/if}
      </p>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      {#if isAdmin}
        <a href="/admin/notifications/parametres"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">
          <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">tune</span>
          Paramètres
        </a>
      {/if}
      {#if notifStore.count > 0}
        <button onclick={() => notifStore.markAllRead()}
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm hover:bg-brand-100 transition-all">
          <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">done_all</span>
          Tout lire
        </button>
      {/if}
    </div>
  </div>

  <div class="bg-white rounded-2xl card-shadow overflow-hidden">
    {#if notifStore.items.length === 0}
      <div class="py-20 text-center">
        <div class="w-16 h-16 rounded-2xl gradient-blue-soft flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-blue-400" style="font-size: 32px;">notifications_none</span>
        </div>
        <p class="text-slate-500 font-medium">Aucune notification</p>
        <p class="text-slate-400 text-sm mt-1">Vous serez notifié à chaque étape importante</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each notifStore.items as notif}
          <button
            onclick={() => notifStore.markRead(notif.id)}
            class="w-full text-left flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-all {!notif.lu ? 'bg-blue-50/30' : ''}">
            <!-- Icône -->
            <div class="w-10 h-10 rounded-xl {typeColors[notif.type] ?? 'gradient-card'} flex items-center justify-center flex-shrink-0 shadow-md">
              <span class="material-symbols-outlined text-white icon-filled" style="font-size: 18px;">
                {typeIcons[notif.type] ?? 'notifications'}
              </span>
            </div>

            <!-- Contenu -->
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-800 leading-snug {!notif.lu ? 'font-semibold' : ''}">{notif.contenu}</p>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-xs text-slate-400">
                  {new Date(notif.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full {notif.canal === 'email' ? 'bg-blue-100 text-blue-600' : notif.canal === 'sms' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
                  {notif.canal}
                </span>
              </div>
            </div>

            <!-- Indicateur non lu -->
            {#if !notif.lu}
              <div class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2 animate-pulse"></div>
            {:else}
              <span class="material-symbols-outlined text-slate-300 flex-shrink-0" style="font-size: 16px;">check</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
