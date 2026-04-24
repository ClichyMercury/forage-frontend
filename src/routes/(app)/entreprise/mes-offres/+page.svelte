<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'

  let offres = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const res = await api.get('/mes-offres')
      offres = res.data ?? []
    } catch {} finally { loading = false }
  })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Mes offres — ForageCI</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">Mes offres soumises</h2>
  <p class="text-sm text-slate-500 mt-0.5">{offres.length} offre{offres.length > 1 ? 's' : ''}</p>
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
  {:else if offres.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">description</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">Aucune offre soumise</p>
      <p class="text-slate-400 text-xs mt-1">Répondez à un appel d'offre pour voir vos soumissions ici</p>
    </div>
  {:else}
    <div class="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-1"></div>
      <div class="col-span-3">Demande</div>
      <div class="col-span-2 text-right">Prix HT</div>
      <div class="col-span-2 text-right">Prix TTC</div>
      <div class="col-span-2 text-right">Délai</div>
      <div class="col-span-1">Date</div>
      <div class="col-span-1">Statut</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each offres as o}
        <div class="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
          <div class="col-span-1">
            <span class="text-sm text-slate-500">#{o.id}</span>
          </div>
          <div class="col-span-3 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">
              {o.appelOffre?.demande?.localisation_adresse ?? o.appelOffre?.demande?.localisationAdresse ?? `AO ${o.appelOffreId}`}
            </p>
          </div>
          <div class="col-span-2 text-right">
            <span class="text-sm text-slate-600">{fmt(o.prixHt)}</span>
            <span class="text-xs text-slate-400 ml-1">FCFA</span>
          </div>
          <div class="col-span-2 text-right">
            <span class="text-sm font-semibold text-slate-800">{fmt(o.prixTtc)}</span>
            <span class="text-xs text-slate-400 ml-1">FCFA</span>
          </div>
          <div class="col-span-2 text-right">
            <span class="text-sm text-slate-600">{o.delaiExecution}</span>
            <span class="text-xs text-slate-400 ml-1">jours</span>
          </div>
          <div class="col-span-1">
            <span class="text-xs text-slate-400">
              {new Date(o.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div class="col-span-1">
            <Badge status={o.statut} />
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
