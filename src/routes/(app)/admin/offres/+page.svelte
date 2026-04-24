<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'

  let offres = $state<any[]>([])
  let loading = $state(true)
  let filtreStatut = $state('')

  async function load() {
    loading = true
    try {
      // Charger tous les appels d'offres avec leurs offres
      const res = await api.get('/admin/appels-offres')
      const appelsOffres = res.data.data ?? []

      // Pour chaque AO, charger le comparatif
      const allOffres: any[] = []
      await Promise.all(
        appelsOffres.map(async (ao: any) => {
          try {
            const comp = await api.get(`/admin/appels-offres/${ao.id}/comparatif`)
            const comparatif = comp.data.comparatif ?? []
            comparatif.forEach((offre: any) => {
              allOffres.push({
                ...offre,
                appel_offre_id: ao.id,
                demande_id: comp.data.demande_id,
                demande_adresse: ao.demande?.localisation_adresse ?? ao.demande?.localisationAdresse ?? '—',
                demande_type: ao.demande?.type_forage ?? ao.demande?.typeForage ?? '—',
              })
            })
          } catch {}
        })
      )

      offres = filtreStatut
        ? allOffres.filter(o => o.statut === filtreStatut)
        : allOffres
    } catch {} finally { loading = false }
  }

  onMount(load)
  $effect(() => { load() })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Gestion des offres — Admin</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">Offres des entreprises</h2>
  <p class="text-sm text-slate-500 mt-0.5">Toutes les offres soumises sur les appels d'offres</p>
</div>

<!-- Filtres -->
<div class="flex gap-2 mb-5">
  {#each [
    { value: '', label: 'Toutes' },
    { value: 'soumise', label: 'Soumises' },
    { value: 'retenue', label: 'Retenues' },
    { value: 'non_retenue', label: 'Non retenues' },
  ] as f}
    <button onclick={() => filtreStatut = f.value}
      class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border
        {filtreStatut === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
      {f.label}
    </button>
  {/each}
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3,4] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if offres.length === 0}
    <div class="py-14 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">description</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">Aucune offre trouvée</p>
    </div>
  {:else}
    <div class="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-1">#</div>
      <div class="col-span-3">Entreprise</div>
      <div class="col-span-2">Demande</div>
      <div class="col-span-2 text-right">Prix TTC</div>
      <div class="col-span-1 text-right">Délai</div>
      <div class="col-span-1">Budget</div>
      <div class="col-span-2">Statut</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each offres as o}
        <a href="/admin/appels-offres/{o.appel_offre_id}/comparatif"
          class="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all items-center group">
          <div class="col-span-1">
            <span class="text-sm text-slate-400">#{o.offre_id}</span>
          </div>
          <div class="col-span-3 flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
              {(o.entreprise?.fullName ?? o.entreprise?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <span class="text-sm font-medium text-slate-800 truncate">
              {o.entreprise?.fullName ?? o.entreprise?.email ?? '—'}
            </span>
          </div>
          <div class="col-span-2 min-w-0">
            <p class="text-xs text-slate-600 truncate">{o.demande_adresse}</p>
            <p class="text-xs text-slate-400 capitalize">{o.demande_type}</p>
          </div>
          <div class="col-span-2 text-right">
            <span class="text-sm font-semibold text-slate-900">{fmt(o.prix_ttc)}</span>
            <span class="text-xs text-slate-400 ml-1">FCFA</span>
          </div>
          <div class="col-span-1 text-right">
            <span class="text-sm text-slate-600">{o.delai_execution_jours}j</span>
          </div>
          <div class="col-span-1">
            <span class="text-xs font-semibold {o.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
              {o.dans_budget ? '✓' : '✗'}
            </span>
          </div>
          <div class="col-span-2">
            <Badge status={o.statut} />
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
