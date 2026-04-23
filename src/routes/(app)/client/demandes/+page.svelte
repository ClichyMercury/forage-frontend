<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'

  let demandes = $state<any[]>([])
  let loading = $state(true)
  let filtreStatut = $state('')

  const statuts = [
    { value: '', label: 'Toutes' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'validee', label: 'Validée' },
    { value: 'appel_offre_lance', label: 'AO lancé' },
    { value: 'offre_envoyee', label: 'Offre reçue' },
    { value: 'acceptee', label: 'Acceptée' },
    { value: 'refusee', label: 'Refusée' },
  ]

  async function load() {
    loading = true
    try {
      const url = filtreStatut ? `/demandes?statut=${filtreStatut}` : '/demandes'
      const res = await api.get(url)
      demandes = res.data ?? []
    } catch {} finally { loading = false }
  }

  onMount(load)
  $effect(() => { load() })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Mes demandes — ForageCI</title></svelte:head>

<!-- Header -->
<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <div>
    <h2 class="text-xl font-bold text-slate-900">Mes demandes</h2>
    <p class="text-sm text-slate-500 mt-0.5">Historique de toutes vos demandes de forage</p>
  </div>
  <button onclick={() => goto('/client/demandes/new')}
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-md hover:scale-[1.02] transition-all">
    <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">add</span>
    Nouvelle demande
  </button>
</div>

<!-- Filtres -->
<div class="flex gap-2 flex-wrap mb-4">
  {#each statuts as s}
    <button onclick={() => filtreStatut = s.value}
      class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border
        {filtreStatut === s.value
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
      {s.label}
    </button>
  {/each}
</div>

<!-- Tableau -->
<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">
      {#each [1,2,3,4] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}
    </div>
  {:else if demandes.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-blue-400" style="font-size: 24px;">assignment</span>
      </div>
      <p class="text-slate-700 font-medium text-sm">
        {filtreStatut ? 'Aucune demande avec ce statut' : 'Aucune demande pour le moment'}
      </p>
      {#if !filtreStatut}
        <button onclick={() => goto('/client/demandes/new')}
          class="mt-4 px-5 py-2.5 rounded-xl gradient-blue text-white text-sm font-semibold shadow-md hover:scale-[1.02] transition-all">
          Créer une demande
        </button>
      {/if}
    </div>
  {:else}
    <!-- En-tête tableau -->
    <div class="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-4">Localisation</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-2">Budget</div>
      <div class="col-span-2">Date</div>
      <div class="col-span-2">Statut</div>
    </div>

    <div class="divide-y divide-slate-50">
      {#each demandes as d}
        <a href="/client/demandes/{d.id}"
          class="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-50 transition-all items-center group">
          <div class="col-span-4 flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 16px;">water_drop</span>
            </div>
            <span class="text-sm font-medium text-slate-800 truncate">{d.localisationAdresse}</span>
          </div>
          <div class="col-span-2">
            <span class="text-sm text-slate-600 capitalize">{d.typeForage}</span>
          </div>
          <div class="col-span-2">
            {#if d.budgetMax}
              <span class="text-sm font-medium text-slate-700">{fmt(d.budgetMax)}</span>
              <span class="text-xs text-slate-400 ml-1">FCFA</span>
            {:else}
              <span class="text-slate-300">—</span>
            {/if}
          </div>
          <div class="col-span-2">
            <span class="text-sm text-slate-500">
              {new Date(d.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <Badge status={d.statut} />
            {#if d.statut === 'offre_envoyee'}
              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
