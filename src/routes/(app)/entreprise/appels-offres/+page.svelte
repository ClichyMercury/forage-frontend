<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import { t } from '$lib/stores/locale'

  let appelsOffres = $state<any[]>([])
  let loading = $state(true)
  let now = $state(Date.now())
  let timer: ReturnType<typeof setInterval>

  onMount(async () => {
    try {
      const res = await api.get('/appels-offres')
      appelsOffres = res.data.data ?? []
    } catch {} finally { loading = false }

    timer = setInterval(() => { now = Date.now() }, 1000)
  })

  onDestroy(() => clearInterval(timer))

  function getSecondesRestantes(ao: any): number {
    if (ao.ma_reponse?.soumise) return -1

    const delai = ao.delaiReponse ?? ao.delai_reponse ?? ao.compte_a_rebours?.delai_reponse
    if (delai) {
      const diff = new Date(delai).getTime() - now
      return Math.floor(diff / 1000)
    }
    return ao.compte_a_rebours?.secondes_restantes ?? 0
  }

  function countdown(secondes: number): string {
    if (secondes === -1) return $t('entreprise.ao.submitted')
    if (secondes <= 0) return $t('entreprise.ao.expired')
    const j = Math.floor(secondes / 86400)
    const h = Math.floor((secondes % 86400) / 3600)
    const m = Math.floor((secondes % 3600) / 60)
    const s = secondes % 60
    if (j > 0) return `${j}j ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }
</script>

<svelte:head><title>{$t('entreprise.ao.title')} — Forage</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">{$t('entreprise.ao.title')}</h2>
  <p class="text-sm text-slate-500 mt-0.5">{$t('entreprise.ao.subtitle')}</p>
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if appelsOffres.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">campaign</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">{$t('entreprise.ao.no_data')}</p>
      <p class="text-slate-400 text-xs mt-1">{$t('entreprise.ao.no_data_sub')}</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-1">#</div>
      <div class="col-span-3">{$t('common.location')}</div>
      <div class="col-span-2">{$t('dashboard.admin.col_type')}</div>
      <div class="col-span-3">{$t('entreprise.ao.col_delay')}</div>
      <div class="col-span-1">{$t('entreprise.ao.col_response')}</div>
      <div class="col-span-2 text-right">{$t('common.actions')}</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each appelsOffres as ao}
        {@const secondes = getSecondesRestantes(ao)}
        {@const expire = secondes <= 0}
        <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4">
          <div class="flex items-center gap-2 lg:col-span-1">
            <span class="text-xs text-slate-400 lg:hidden">{$t('entreprise.ao.label')}</span>
            <span class="text-sm text-slate-500">#{ao.id}</span>
          </div>
          <div class="flex items-center gap-2 min-w-0 lg:col-span-3">
            <span class="text-sm font-medium text-slate-800 truncate flex-1">
              {ao.demande?.localisationAdresse ?? ao.demande?.localisation_adresse ?? '—'}
            </span>
          </div>
          <div class="flex items-center gap-1 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">{$t('dashboard.admin.col_type')} :</span>
            <span class="text-sm text-slate-600 capitalize">
              {ao.demande?.typeForage ?? ao.demande?.type_forage ?? '—'}
            </span>
          </div>
          <div class="flex items-center gap-1 lg:col-span-3">
            {#if secondes === -1}
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">check_circle</span>
                {$t('entreprise.ao.submitted')}
              </span>
            {:else if expire}
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">timer_off</span>
                {$t('entreprise.ao.expired')}
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">timer</span>
                {countdown(secondes)}
              </span>
            {/if}
          </div>
          <div class="flex items-center gap-1 lg:col-span-1">
            <span class="text-xs lg:hidden text-slate-400">{$t('entreprise.ao.col_response')} :</span>
            {#if ao.ma_reponse?.soumise}
              <Badge status={ao.ma_reponse.statut} />
            {:else}
              <span class="text-xs text-slate-400">—</span>
            {/if}
          </div>
          <div class="flex justify-stretch lg:justify-end lg:col-span-2">
            <a href="/entreprise/appels-offres/{ao.id}"
              class="w-full lg:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                {ao.ma_reponse?.soumise || expire
                  ? 'bg-slate-50 text-slate-500 border border-slate-200'
                  : 'bg-brand-600 text-white hover:bg-brand-700'}">
              {ao.ma_reponse?.soumise ? $t('entreprise.ao.see') : expire ? $t('entreprise.ao.expired') : $t('entreprise.ao.reply')}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
