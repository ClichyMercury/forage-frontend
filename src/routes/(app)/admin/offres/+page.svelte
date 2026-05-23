<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
  import { t } from '$lib/stores/locale'

  let toutesOffres = $state<any[]>([])
  let loading = $state(true)
  let filtreStatut = $state('')

  const offres = $derived(
    filtreStatut
      ? toutesOffres.filter(o => o.statut === filtreStatut)
      : toutesOffres
  )

  async function load() {
    loading = true
    try {
      const res = await api.get('/admin/appels-offres')
      const appelsOffres = res.data.data ?? []

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

      toutesOffres = allOffres
    } catch {} finally { loading = false }
  }

  onMount(load)

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }
</script>

<svelte:head><title>{$t('admin.offres.title')} — Forage</title></svelte:head>

<div class="mb-5">
  <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
    {$t('admin.offres.title')}
  </h2>
  <p class="text-sm text-slate-500 mt-1">{$t('admin.offres.subtitle')}</p>
</div>

<!-- Filtres -->
<div class="flex gap-2 mb-5 flex-wrap">
  {#each [
    { value: '', label: $t('admin.offres.filter_all') },
    { value: 'soumise',     label: $t('admin.offres.filter_submitted') },
    { value: 'retenue',     label: $t('admin.offres.filter_retained') },
    { value: 'non_retenue', label: $t('admin.offres.filter_rejected') },
  ] as f}
    <button onclick={() => filtreStatut = f.value}
      class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border
        {filtreStatut === f.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
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
      <p class="text-slate-600 font-medium text-sm">{$t('admin.offres.no_data')}</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-3">{$t('admin.offres.col_company')}</div>
      <div class="col-span-3">{$t('admin.offres.col_demande')}</div>
      <div class="col-span-2 text-right">{$t('admin.offres.col_ttc')}</div>
      <div class="col-span-1 text-right">{$t('admin.offres.col_delay')}</div>
      <div class="col-span-1">{$t('admin.offres.col_budget')}</div>
      <div class="col-span-2">{$t('common.status')}</div>
    </div>

    <div class="divide-y divide-slate-50">
      {#each offres as o}
        <a href="/admin/appels-offres/{o.appel_offre_id}/comparatif"
          class="block px-5 py-4 hover:bg-slate-50 transition-all">

          <!-- Mobile -->
          <div class="lg:hidden space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <UserAvatar user={o.entreprise} size="sm" />
                <span class="text-sm font-semibold text-slate-800 truncate">
                  {o.entreprise?.fullName ?? o.entreprise?.email ?? '—'}
                </span>
              </div>
              <Badge status={o.statut} />
            </div>

            <div>
              <span class="text-xs text-slate-400">{$t('admin.offres.demande_mobile')}</span>
              <p class="text-xs text-slate-600 mt-0.5 whitespace-normal break-words">{o.demande_adresse}</p>
              <p class="text-xs text-slate-400 capitalize mt-0.5">{o.demande_type}</p>
            </div>

            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex flex-col items-center text-center min-w-[100px]">
                <span class="text-xs text-slate-400">{$t('admin.offres.col_ttc')}</span>
                <div class="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span class="text-sm font-bold text-slate-900">{fmt(o.prix_ttc)}</span>
                  <span class="text-xs text-slate-400">FCFA</span>
                </div>
              </div>
              <div class="flex flex-col items-center text-center min-w-[70px]">
                <span class="text-xs text-slate-400">{$t('admin.offres.col_delay')}</span>
                <div class="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span class="text-sm font-bold text-slate-900">{o.delai_execution_jours}</span>
                  <span class="text-xs text-slate-400">{$t('common.days_short')}</span>
                </div>
              </div>
              <div class="flex flex-col items-center text-center min-w-[80px]">
                <span class="text-xs text-slate-400">{$t('admin.offres.col_budget')}</span>
                <div class="mt-0.5">
                  <span class="text-sm font-semibold {o.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                    {o.dans_budget ? $t('admin.offres.in_budget') : $t('admin.offres.out_budget')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop -->
          <div class="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-start">
            <div class="col-span-3 flex items-center gap-2 min-w-0">
              <UserAvatar user={o.entreprise} size="sm" />
              <span class="text-sm font-semibold text-slate-800 truncate">
                {o.entreprise?.fullName ?? o.entreprise?.email ?? '—'}
              </span>
            </div>
            <div class="col-span-3">
              <p class="text-xs text-slate-600 whitespace-normal break-words leading-relaxed">{o.demande_adresse}</p>
              <p class="text-xs text-slate-400 capitalize mt-1">{o.demande_type}</p>
            </div>
            <div class="col-span-2 text-right">
              <span class="text-sm font-semibold text-slate-900">{fmt(o.prix_ttc)}</span>
              <span class="text-xs text-slate-400 ml-1">FCFA</span>
            </div>
            <div class="col-span-1 text-right">
              <span class="text-sm text-slate-600">{o.delai_execution_jours}{$t('common.days_short')}</span>
            </div>
            <div class="col-span-1">
              <span class="text-sm font-semibold {o.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                {o.dans_budget ? $t('admin.offres.in_budget') : $t('admin.offres.out_budget')}
              </span>
            </div>
            <div class="col-span-2">
              <Badge status={o.statut} />
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
