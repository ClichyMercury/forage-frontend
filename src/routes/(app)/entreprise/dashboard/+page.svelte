<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { t } from '$lib/stores/locale'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  let appelsOffres = $state<any[]>([])
  let mesOffres = $state<any[]>([])
  let loading = $state(true)

  const stats = $derived(() => ({
    total: appelsOffres.length,
    ouverts: appelsOffres.filter((a: any) => !a.compte_a_rebours?.expire && !a.ma_reponse?.soumise).length,
    soumises: mesOffres.length,
    retenues: mesOffres.filter((o: any) => o.statut === 'retenue').length,
    nonRetenues: mesOffres.filter((o: any) => o.statut === 'non_retenue').length,
  }))

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }

  onMount(async () => {
    try {
      const [aoRes, offresRes] = await Promise.all([
        api.get('/appels-offres'),
        api.get('/mes-offres'),
      ])
      appelsOffres = aoRes.data.data ?? []
      mesOffres = offresRes.data ?? []
    } catch {} finally { loading = false }
  })
</script>

<svelte:head><title>{$t('dashboard.entreprise.title')}</title></svelte:head>

<div class="mb-6 flex items-start lg:items-center justify-between flex-wrap gap-3">
  <div class="min-w-0 flex-1">
    <h2 class="font-display font-black text-2xl lg:text-3xl leading-tight wrap-break-word" style="color: #0f1f5c; letter-spacing: -0.02em">
      {$t('dashboard.entreprise.hello', { name: auth.user?.fullName?.split(' ')[0] ?? '' })}
    </h2>
    <p class="text-sm text-slate-500 mt-1">{$t('dashboard.entreprise.subtitle')}</p>
  </div>
  <a href="/entreprise/appels-offres"
    class="flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-white font-semibold text-sm transition-all whitespace-nowrap"
    style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.3)">
    <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">campaign</span>
    <span class="hidden sm:inline">{$t('dashboard.entreprise.see_ao')}</span>
    <span class="sm:hidden">{$t('dashboard.entreprise.ao_btn_short')}</span>
  </a>
</div>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
  <StatCard title={$t('dashboard.entreprise.stat_ao')}        value={stats().total}       icon="campaign"     color="blue" />
  <StatCard title={$t('dashboard.entreprise.stat_open')}      value={stats().ouverts}     icon="lock_open"    color="purple" />
  <StatCard title={$t('dashboard.entreprise.stat_submitted')} value={stats().soumises}    icon="send"         color="orange" />
  <StatCard title={$t('dashboard.entreprise.stat_retained')}  value={stats().retenues}    icon="star"         color="green" />
  <StatCard title={$t('dashboard.entreprise.stat_rejected')}  value={stats().nonRetenues} icon="cancel"       color="red" />
</div>

<div class="grid grid-cols-1 gap-5">
  <!-- Appels d'offres reçus -->
  <div class="bg-white rounded-2xl border border-slate-100">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-display font-bold text-slate-900">{$t('dashboard.entreprise.ao_recus')}</h3>
      <a href="/entreprise/appels-offres" class="text-sm font-semibold transition-colors hover:opacity-80 text-brand-600">{$t('common.see_all')}</a>
    </div>
    {#if loading}
      <div class="p-5 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if appelsOffres.length === 0}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">campaign</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">{$t('dashboard.entreprise.no_ao')}</p>
        <p class="text-slate-400 text-xs mt-1">{$t('dashboard.entreprise.no_ao_sub')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each appelsOffres.slice(0, 5) as ao}
          <a href="/entreprise/appels-offres/{ao.id}"
            class="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-all group">
            <div class="w-9 h-9 rounded-xl {ao.compte_a_rebours?.expire ? 'bg-red-50' : 'bg-brand-50'} flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined icon-filled {ao.compte_a_rebours?.expire ? 'text-red-400' : 'text-brand-600'}" style="font-size: 16px;">campaign</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">
                {ao.demande?.typeForage ?? ao.demande?.type_forage ?? 'Forage'} — {ao.demande?.localisationAdresse ?? ao.demande?.localisation_adresse ?? ''}
              </p>
              <p class="text-xs {ao.compte_a_rebours?.expire ? 'text-red-400' : 'text-slate-400'} mt-0.5">
                {ao.compte_a_rebours?.expire ? $t('dashboard.entreprise.expired') : $t('dashboard.entreprise.open')}
              </p>
            </div>
            {#if ao.ma_reponse?.soumise}
              <Badge status={ao.ma_reponse.statut} />
            {:else if !ao.compte_a_rebours?.expire}
              <span class="text-xs text-white px-2.5 py-1 rounded-full font-semibold shrink-0" style="background-color: #1e3fff">{$t('dashboard.entreprise.reply')}</span>
            {/if}
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Mes offres soumises -->
  <div class="bg-white rounded-2xl border border-slate-100">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-display font-bold text-slate-900">{$t('dashboard.entreprise.offres_soumises')}</h3>
      <a href="/entreprise/mes-offres" class="text-sm text-brand-600 hover:text-brand-700 font-semibold">{$t('common.see_all')}</a>
    </div>
    {#if loading}
      <div class="p-5 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if mesOffres.length === 0}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">description</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">{$t('dashboard.entreprise.no_offres')}</p>
        <p class="text-slate-400 text-xs mt-1">{$t('dashboard.entreprise.no_offres_sub')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each mesOffres.slice(0, 5) as offre}
          <div class="flex items-center gap-3 px-5 py-3.5">
            <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size: 16px;">description</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">
                {offre.appelOffre?.demande?.typeForage ?? offre.appel_offre?.demande?.type_forage ?? 'Forage'} — {offre.appelOffre?.demande?.localisationAdresse ?? offre.appel_offre?.demande?.localisation_adresse ?? `Offre #${offre.id}`}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">
                {fmt(offre.prixTtc ?? offre.prix_ttc)} {$t('common.currency')} TTC · {offre.delaiExecution ?? offre.delai_execution} {$t('common.days')}
              </p>
            </div>
            <Badge status={offre.statut} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
