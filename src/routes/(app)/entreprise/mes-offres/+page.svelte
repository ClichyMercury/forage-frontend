<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import { t } from '$lib/stores/locale'

  let offres = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const res = await api.get('/mes-offres')
      offres = res.data ?? []
    } catch {} finally { loading = false }
  })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }
</script>

<svelte:head><title>{$t('entreprise.offres.title')} — Forage</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">{$t('entreprise.offres.title')}</h2>
  <p class="text-sm text-slate-500 mt-0.5">
    {$t('entreprise.offres.count', { count: offres.length, s: offres.length > 1 ? 's' : '' })}
  </p>
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
  {:else if offres.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">description</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">{$t('entreprise.offres.no_data')}</p>
      <p class="text-slate-400 text-xs mt-1">{$t('entreprise.offres.no_data_sub')}</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-1">#</div>
      <div class="col-span-3">{$t('entreprise.offres.col_demande')}</div>
      <div class="col-span-2 text-right">{$t('entreprise.offres.col_ht')}</div>
      <div class="col-span-2 text-right">{$t('entreprise.offres.col_ttc')}</div>
      <div class="col-span-1 text-right">{$t('entreprise.offres.col_delay')}</div>
      <div class="col-span-1">{$t('common.date')}</div>
      <div class="col-span-2">{$t('common.status')}</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each offres as o}
        <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4">
          <div class="flex items-center gap-3 min-w-0 lg:col-span-1">
            <span class="text-sm font-semibold text-slate-500">#{o.id}</span>
          </div>
          <div class="flex items-center gap-2 min-w-0 lg:col-span-3">
            <span class="text-sm font-medium text-slate-800 truncate flex-1">
              {o.appelOffre?.demande?.localisation_adresse ?? o.appelOffre?.demande?.localisationAdresse ?? `Appel d'offre ${o.appelOffreId}`}
            </span>
            <div class="lg:hidden shrink-0"><Badge status={o.statut} /></div>
          </div>
          <div class="flex items-center justify-between lg:justify-end lg:col-span-2 pl-0">
            <span class="text-xs lg:hidden text-slate-400">{$t('entreprise.offres.ht_mobile')}</span>
            <div>
              <span class="text-sm text-slate-600">{fmt(o.prixHt)}</span>
              <span class="text-xs text-slate-400 ml-1">FCFA</span>
            </div>
          </div>
          <div class="flex items-center justify-between lg:justify-end lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">{$t('entreprise.offres.ttc_mobile')}</span>
            <div>
              <span class="text-sm font-semibold text-slate-800">{fmt(o.prixTtc)}</span>
              <span class="text-xs text-slate-400 ml-1">FCFA</span>
            </div>
          </div>
          <div class="flex items-center justify-between lg:justify-end lg:col-span-1">
            <span class="text-xs lg:hidden text-slate-400">{$t('entreprise.offres.delay_mobile')}</span>
            <div>
              <span class="text-sm text-slate-600">{o.delaiExecution}</span>
              <span class="text-xs text-slate-400 ml-1">{$t('common.days_short')}</span>
            </div>
          </div>
          <div class="flex items-center justify-between lg:block lg:col-span-1">
            <span class="text-xs lg:hidden text-slate-400">{$t('entreprise.offres.date_mobile')}</span>
            <span class="text-xs text-slate-400">
              {new Date(o.createdAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div class="hidden lg:block lg:col-span-2">
            <Badge status={o.statut} />
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
