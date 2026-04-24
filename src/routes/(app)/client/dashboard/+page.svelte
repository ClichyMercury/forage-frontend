<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  let demandes = $state<any[]>([])
  let loading = $state(true)

  const stats = $derived(() => ({
    total: demandes.length,
    enAttente: demandes.filter(d => d.statut === 'en_attente').length,
    enCours: demandes.filter(d => ['validee','appel_offre_lance','offres_recues','offre_envoyee'].includes(d.statut)).length,
    // Offres reçues = toutes les demandes qui ont eu une offre (envoyée + acceptée + refusée)
    offresRecues: demandes.filter(d => ['offre_envoyee','acceptee','refusee'].includes(d.statut)).length,
    // En attente de décision = seulement offre_envoyee
    aTraiter: demandes.filter(d => d.statut === 'offre_envoyee').length,
    acceptees: demandes.filter(d => d.statut === 'acceptee').length,
    refusees: demandes.filter(d => d.statut === 'refusee').length,
    cloturees: demandes.filter(d => d.statut === 'cloturee').length,
  }))

  // CDC §3.1 — Demandes nécessitant une action immédiate
  const demandesUrgentes = $derived(
    demandes.filter(d => d.statut === 'offre_envoyee')
  )
  function fmt(n: number) { return n.toLocaleString('fr-CI') }

  onMount(async () => {
    try {
      const res = await api.get('/demandes')
      demandes = res.data ?? []
    } catch {} finally { loading = false }
  })
</script>

<svelte:head><title>Tableau de bord — ForageCI</title></svelte:head>

<!-- Bienvenue -->
<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="text-xl font-bold text-slate-900">
      Bonjour, {auth.user?.fullName?.split(' ')[0] ?? 'bienvenue'}
    </h2>
    <p class="text-sm text-slate-500 mt-0.5">Voici l'état de vos demandes de forage</p>
  </div>
  <button onclick={() => goto('/client/demandes/new')}
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm">
    <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">add</span>
    Nouvelle demande
  </button>
</div>

<!-- CDC §3.1 — Alerte actions requises (offres en attente de décision) -->
{#if demandesUrgentes.length > 0}
  <div class="mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-200">
    <div class="flex items-start gap-3">
      <span class="material-symbols-outlined text-blue-600 icon-filled shrink-0 mt-0.5" style="font-size: 22px;">mark_email_read</span>
      <div class="flex-1">
        <p class="font-semibold text-blue-800 text-sm">
          {demandesUrgentes.length === 1 ? 'Une offre attend votre décision' : `${demandesUrgentes.length} offres attendent votre décision`}
        </p>
        <p class="text-xs text-blue-600 mt-0.5">Vous avez reçu une offre finale. Acceptez ou refusez depuis la page de la demande.</p>
        <div class="flex flex-wrap gap-2 mt-3">
          {#each demandesUrgentes as d}
            <a href="/client/demandes/{d.id}"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all">
              <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">water_drop</span>
              {d.localisationAdresse?.split(',')[0] ?? `Demande #${d.id}`}
              <span class="material-symbols-outlined" style="font-size: 14px;">chevron_right</span>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Stats CDC §3.1 — Suivi statuts en temps réel -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
  <StatCard title="Total" value={stats().total} icon="folder_open" color="blue" />
  <StatCard title="En attente" value={stats().enAttente} icon="hourglass_empty" color="orange" />
  <StatCard title="En cours" value={stats().enCours} icon="autorenew" color="purple" />
  <StatCard
    title="Offres reçues"
    value={stats().offresRecues}
    icon="mark_email_read"
    color="cyan"
    subtitle={stats().aTraiter > 0 ? `${stats().aTraiter} à traiter` : 'Toutes traitées'}
  />
</div>
<div class="grid grid-cols-3 gap-3 mb-6">
  <StatCard title="Acceptées" value={stats().acceptees} icon="check_circle" color="green" />
  <StatCard title="Refusées" value={stats().refusees} icon="cancel" color="red" />
  <StatCard title="Clôturées" value={stats().cloturees} icon="lock" color="blue" />
</div>

<!-- Historique des demandes -->
<div class="bg-white rounded-2xl border border-slate-100">
  <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
    <h3 class="font-semibold text-slate-800">Historique des demandes</h3>
    <a href="/client/demandes" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout</a>
  </div>

  {#if loading}
    <div class="p-5 space-y-3">
      {#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}
    </div>
  {:else if demandes.length === 0}
    <div class="py-14 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-blue-400" style="font-size: 24px;">assignment</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">Aucune demande pour le moment</p>
      <p class="text-slate-400 text-xs mt-1 mb-4">Soumettez votre première demande de forage</p>
      <button onclick={() => goto('/client/demandes/new')}
        class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
        Créer une demande
      </button>
    </div>
  {:else}
    <!-- En-tête tableau -->
    <div class="grid grid-cols-12 gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <div class="col-span-5">Localisation</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-2">Date</div>
      <div class="col-span-3">Statut</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each demandes.slice(0, 6) as d}
        <a href="/client/demandes/{d.id}"
          class="grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-slate-50 transition-all items-center group
            {d.statut === 'offre_envoyee' ? 'bg-blue-50/30' : ''}">
          <div class="col-span-5 flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 14px;">water_drop</span>
            </div>
            <span class="text-sm font-medium text-slate-800 truncate">{d.localisationAdresse}</span>
          </div>
          <div class="col-span-2">
            <span class="text-xs text-slate-500 capitalize">{d.typeForage}</span>
          </div>
          <div class="col-span-2">
            <span class="text-xs text-slate-400">
              {new Date(d.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div class="col-span-3 flex items-center gap-1.5">
            <Badge status={d.statut} />
            {#if d.statut === 'offre_envoyee'}
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
