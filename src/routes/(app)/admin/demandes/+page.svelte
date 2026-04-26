<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'

  let demandes = $state<any[]>([])
  let loading = $state(true)
  let filtreStatut = $state('')
  let filtreType = $state('')
  let filtreRegion = $state('')

  async function load() {
    loading = true
    try {
      const params = new URLSearchParams()
      if (filtreStatut) params.set('statut', filtreStatut)
      if (filtreType) params.set('typeForage', filtreType)
      if (filtreRegion) params.set('region', filtreRegion)
      const res = await api.get(`/admin/demandes?${params}`)
      demandes = res.data.data ?? []
    } catch {} finally { loading = false }
  }

  onMount(load)
  $effect(() => { load() })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Gestion des demandes — Admin</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">Gestion des demandes</h2>
  <p class="text-sm text-slate-500 mt-0.5">Vue centralisée — {demandes.length} résultat{demandes.length > 1 ? 's' : ''}</p>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1.5" for="filtreStatut">Statut</label>
      <select id="filtreStatut" bind:value={filtreStatut}
        class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
        <option value="">Tous les statuts</option>
        <option value="en_attente">En attente</option>
        <option value="validee">Validée</option>
        <option value="appel_offre_lance">AO lancé</option>
        <option value="offres_recues">Offres reçues</option>
        <option value="offre_envoyee">Offre envoyée</option>
        <option value="acceptee">Acceptée</option>
        <option value="refusee">Refusée</option>
      </select>
    </div>
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1.5" for="filtreType">Type de forage</label>
      <select id="filtreType" bind:value={filtreType}
        class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
        <option value="">Tous les types</option>
        <option value="eau">Eau</option>
        <option value="geotechnique">Géotechnique</option>
        <option value="petrolier">Pétrolier</option>
        <option value="autre">Autre</option>
      </select>
    </div>
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1.5" for="filtreRegion">Région</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 16px;">search</span>
        <input id="filtreRegion" type="text" bind:value={filtreRegion} placeholder="Ex: Abidjan"
          class="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
      </div>
    </div>
  </div>
</div>

<!-- Tableau -->
<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3,4] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if demandes.length === 0}
    <div class="py-14 text-center text-slate-400">
      <span class="material-symbols-outlined" style="font-size: 32px;">assignment</span>
      <p class="text-sm mt-2">Aucune demande trouvée</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-3">Localisation</div>
      <div class="col-span-2">Client</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-2">Budget</div>
      <div class="col-span-1">Date</div>
      <div class="col-span-2">Statut</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each demandes as d}
        <a href="/admin/demandes/{d.id}"
          class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4 hover:bg-slate-50 transition-all">
          <!-- Ligne 1 mobile : Localisation + Statut -->
          <div class="flex items-center gap-2 min-w-0 lg:col-span-3">
            <div class="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 15px;">water_drop</span>
            </div>
            <span class="text-sm font-medium text-slate-800 truncate flex-1">{d.localisationAdresse}</span>
            <div class="lg:hidden shrink-0">
              <Badge status={d.statut} />
            </div>
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2 min-w-0">
            <span class="text-xs lg:hidden text-slate-400">Client :</span>
            <span class="text-sm text-slate-600 truncate">{d.client?.fullName ?? d.client?.email ?? '—'}</span>
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">Type :</span>
            <span class="text-sm text-slate-600 capitalize">{d.typeForage}</span>
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">Budget :</span>
            {#if d.budgetMax}
              <span class="text-sm font-semibold" style="color: #b35d2e">{fmt(d.budgetMax)} FCFA</span>
            {:else}
              <span class="text-slate-300">—</span>
            {/if}
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-1">
            <span class="text-xs lg:hidden text-slate-400">Date :</span>
            <span class="text-xs text-slate-400">
              {new Date(d.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div class="hidden lg:block lg:col-span-2">
            <Badge status={d.statut} />
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
