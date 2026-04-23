<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'

  let appelsOffres = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const res = await api.get('/admin/appels-offres')
      appelsOffres = res.data.data ?? []
    } catch {} finally { loading = false }
  })

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short', year: 'numeric' })
  }
</script>

<svelte:head><title>Appels d'offres — Admin</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">Appels d'offres</h2>
  <p class="text-sm text-slate-500 mt-0.5">{appelsOffres.length} appel{appelsOffres.length > 1 ? 's' : ''} d'offre</p>
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if appelsOffres.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">campaign</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">Aucun appel d'offre lancé</p>
      <p class="text-slate-400 text-xs mt-1 mb-4">Validez une demande pour lancer un appel d'offre</p>
      <a href="/admin/demandes"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
        Voir les demandes
      </a>
    </div>
  {:else}
    <!-- En-tête tableau -->
    <div class="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-1">#</div>
      <div class="col-span-3">Demande</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-2">Entreprises</div>
      <div class="col-span-2">Date limite</div>
      <div class="col-span-2 text-right">Actions</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each appelsOffres as ao}
        <div class="grid grid-cols-12 gap-4 px-5 py-4 items-center">
          <div class="col-span-1">
            <span class="text-sm font-medium text-slate-500">#{ao.id}</span>
          </div>
          <div class="col-span-3 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">
              {ao.demande?.localisation_adresse ?? ao.demande?.localisationAdresse ?? '—'}
            </p>
          </div>
          <div class="col-span-2">
            <span class="text-sm text-slate-600 capitalize">
              {ao.demande?.type_forage ?? ao.demande?.typeForage ?? '—'}
            </span>
          </div>
          <div class="col-span-2">
            <span class="text-sm text-slate-600">{ao.entreprises?.length ?? 0} invitée{(ao.entreprises?.length ?? 0) > 1 ? 's' : ''}</span>
          </div>
          <div class="col-span-2">
            <span class="text-xs text-slate-500">
              {ao.delaiReponse ?? ao.delai_reponse ? fmt(ao.delaiReponse ?? ao.delai_reponse) : '—'}
            </span>
          </div>
          <div class="col-span-2 flex items-center justify-end gap-2">
            <a href="/admin/appels-offres/{ao.id}/comparatif"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-all border border-blue-200">
              <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">compare_arrows</span>
              Comparatif
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
