<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
  import { t, intlLocale } from '$lib/stores/locale'

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

  function fmt(n: any) { return Number(n).toLocaleString($intlLocale) }
</script>

<svelte:head><title>{$t('admin.demandes.title')} — Forage</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">{$t('admin.demandes.title')}</h2>
  <p class="text-sm text-slate-500 mt-0.5">
    {$t('admin.demandes.subtitle', { count: demandes.length, s: demandes.length > 1 ? 's' : '' })}
  </p>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1.5" for="filtreStatut">{$t('common.status')}</label>
      <select id="filtreStatut" bind:value={filtreStatut}
        class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
        <option value="">{$t('admin.demandes.filter_all_statuts')}</option>
        <option value="en_attente">{$t('status.en_attente')}</option>
        <option value="validee">{$t('status.valide')}</option>
        <option value="appel_offre_lance">{$t('status.appel_offre_lance')}</option>
        <option value="offres_recues">{$t('status.offre_soumise')}</option>
        <option value="offre_envoyee">{$t('status.offre_envoyee')}</option>
        <option value="offre_acceptee">{$t('status.offre_acceptee')}</option>
        <option value="cloturee">{$t('status.termine')}</option>
      </select>
    </div>
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1.5" for="filtreType">{$t('demandes.type')}</label>
      <select id="filtreType" bind:value={filtreType}
        class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
        <option value="">{$t('admin.demandes.filter_all_types')}</option>
        <option value="eau">{$t('domain.eau')}</option>
        <option value="geotechnique">{$t('domain.geotechnique')}</option>
        <option value="petrolier">{$t('domain.petrolier')}</option>
        <option value="autre">{$t('domain.autre')}</option>
      </select>
    </div>
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1.5" for="filtreRegion">{$t('common.region')}</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 16px;">search</span>
        <input id="filtreRegion" type="text" bind:value={filtreRegion} placeholder={$t('admin.demandes.region_placeholder')}
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
      <p class="text-sm mt-2">{$t('admin.demandes.no_data')}</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-2">{$t('dashboard.admin.col_client')}</div>
      <div class="col-span-3">{$t('dashboard.admin.col_location')}</div>
      <div class="col-span-2">{$t('dashboard.admin.col_type')}</div>
      <div class="col-span-2">{$t('admin.demandes.col_budget')}</div>
      <div class="col-span-1">{$t('common.date')}</div>
      <div class="col-span-2">{$t('common.status')}</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each demandes as d}
        <a href="/admin/demandes/{d.id}"
          class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4 hover:bg-slate-50 transition-all">

          <div class="flex items-center gap-2 pl-12 lg:pl-0 lg:col-span-2 min-w-0">
            <span class="text-xs lg:hidden text-slate-400">{$t('dashboard.admin.col_client')} :</span>
            <UserAvatar user={d.client} size="sm" />
            <span class="text-sm text-slate-600 truncate">{d.client?.fullName ?? d.client?.email ?? '—'}</span>
          </div>

          <div class="flex items-center gap-2 min-w-0 lg:col-span-3">
            <div class="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 15px;">water_drop</span>
            </div>
            <span class="text-sm font-medium text-slate-800 truncate flex-1">{d.localisationAdresse}</span>
            <div class="lg:hidden shrink-0">
              <Badge status={d.statut} />
            </div>
          </div>

          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">{$t('dashboard.admin.col_type')} :</span>
            <span class="text-sm text-slate-600 capitalize">{d.typeForage}</span>
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">{$t('admin.demandes.col_budget')} :</span>
            {#if d.budgetMax}
              <span class="text-sm font-semibold text-brand-600">{fmt(d.budgetMax)} FCFA</span>
            {:else}
              <span class="text-slate-300">—</span>
            {/if}
          </div>

          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-1">
            <span class="text-xs lg:hidden text-slate-400">{$t('common.date')} :</span>
            <span class="text-xs text-slate-400">
              {new Date(d.createdAt).toLocaleDateString($intlLocale, { day: 'numeric', month: 'short' })}
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
