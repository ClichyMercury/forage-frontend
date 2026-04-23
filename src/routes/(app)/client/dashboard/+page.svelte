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
    enCours: demandes.filter(d => ['validee','appel_offre_lance','offres_recues'].includes(d.statut)).length,
    offresRecues: demandes.filter(d => d.statut === 'offre_envoyee').length,
    acceptees: demandes.filter(d => d.statut === 'acceptee').length,
  }))

  function fmt(n: number) {
    return n.toLocaleString('fr-CI')
  }

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

<!-- Stats -->
<div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
  <StatCard title="Total" value={stats().total} icon="folder_open" color="blue" />
  <StatCard title="En attente" value={stats().enAttente} icon="hourglass_empty" color="orange" />
  <StatCard title="En cours" value={stats().enCours} icon="autorenew" color="purple" />
  <StatCard title="Offre reçue" value={stats().offresRecues} icon="inbox" color="cyan" />
  <StatCard title="Acceptées" value={stats().acceptees} icon="check_circle" color="green" />
</div>

<!-- Demandes récentes -->
<div class="bg-white rounded-2xl border border-slate-100">
  <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
    <h3 class="font-semibold text-slate-800">Mes demandes récentes</h3>
    <a href="/client/demandes" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout</a>
  </div>

  {#if loading}
    <div class="p-5 space-y-3">
      {#each [1,2,3] as _}
        <div class="skeleton h-14 rounded-xl"></div>
      {/each}
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
    <div class="divide-y divide-slate-50">
      {#each demandes.slice(0, 6) as d}
        <a href="/client/demandes/{d.id}"
          class="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all group">
          <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">water_drop</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">{d.localisationAdresse}</p>
            <p class="text-xs text-slate-400 mt-0.5">
              {new Date(d.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short', year: 'numeric' })}
              {#if d.budgetMax}
                · {fmt(Number(d.budgetMax))} FCFA
              {/if}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Badge status={d.statut} />
            {#if d.statut === 'offre_envoyee'}
              <span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                À traiter
              </span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
