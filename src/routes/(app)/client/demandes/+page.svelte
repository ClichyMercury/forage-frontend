<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import { t, intlLocale } from '$lib/stores/locale'

  let demandes = $state<any[]>([])
  let loading = $state(true)
  let filtreStatut = $state('')

  const statuts = $derived([
    { value: '', label: $t('client.demandes.filter_all') },
    { value: 'en_attente',        label: $t('status.en_attente') },
    { value: 'validee',           label: $t('status.valide') },
    { value: 'appel_offre_lance', label: $t('status.appel_offre_lance') },
    { value: 'offre_envoyee',     label: $t('status.offre_envoyee') },
    { value: 'acceptee',          label: $t('status.offre_acceptee') },
    { value: 'cloturee',          label: $t('status.termine') },
  ])

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

  function fmt(n: any) { return Number(n).toLocaleString($intlLocale) }
</script>

<svelte:head><title>{$t('client.demandes.title')} — Forage</title></svelte:head>

<div class="flex items-start lg:items-center justify-between mb-5 flex-wrap gap-3">
  <div class="min-w-0 flex-1">
    <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
      {$t('client.demandes.title')}
    </h2>
    <p class="text-sm text-slate-500 mt-1">{$t('client.demandes.subtitle')}</p>
  </div>
  <button onclick={() => goto('/client/demandes/new')}
    class="flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-sm whitespace-nowrap">
    <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">add</span>
    <span class="hidden sm:inline">{$t('dashboard.client.new_demande')}</span>
    <span class="sm:hidden">{$t('dashboard.client.new')}</span>
  </button>
</div>

<!-- Filtres -->
<div class="flex gap-2 flex-wrap mb-4">
  {#each statuts as s}
    <button onclick={() => filtreStatut = s.value}
      class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border
        {filtreStatut === s.value
          ? 'bg-brand-600 text-white border-brand-600'
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
        {filtreStatut ? $t('client.demandes.no_data_status') : $t('dashboard.client.no_demandes')}
      </p>
      {#if !filtreStatut}
        <button onclick={() => goto('/client/demandes/new')}
          class="mt-4 px-5 py-2.5 rounded-xl gradient-blue text-white text-sm font-semibold shadow-md hover:scale-[1.02] transition-all">
          {$t('client.demandes.create')}
        </button>
      {/if}
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-4">{$t('dashboard.client.col_location')}</div>
      <div class="col-span-2">{$t('dashboard.client.col_type')}</div>
      <div class="col-span-2">{$t('client.demandes.col_budget')}</div>
      <div class="col-span-2">{$t('dashboard.client.col_date')}</div>
      <div class="col-span-2">{$t('dashboard.client.col_status')}</div>
    </div>

    <div class="divide-y divide-slate-50">
      {#each demandes as d}
        <a href="/client/demandes/{d.id}"
          class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4 hover:bg-slate-50 transition-all">
          <div class="flex items-center gap-3 min-w-0 lg:col-span-4">
            <div class="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 16px;">water_drop</span>
            </div>
            <span class="text-sm font-medium text-slate-800 truncate flex-1">{d.localisationAdresse}</span>
            <div class="lg:hidden flex items-center gap-1.5 shrink-0">
              <Badge status={d.statut} />
            </div>
          </div>
          <div class="flex items-center gap-3 flex-wrap pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:text-sm text-slate-600 capitalize">
              <span class="lg:hidden text-slate-400">{$t('client.demandes.type_mobile')}</span> {d.typeForage}
            </span>
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">{$t('client.demandes.budget_mobile')}</span>
            {#if d.budgetMax}
              <span class="text-sm font-medium text-slate-700">{fmt(d.budgetMax)}</span>
              <span class="text-xs text-slate-400 ml-1">FCFA</span>
            {:else}
              <span class="text-slate-300">—</span>
            {/if}
          </div>
          <div class="flex items-center gap-1 pl-12 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">{$t('client.demandes.date_mobile')}</span>
            <span class="text-sm text-slate-500">
              {new Date(d.createdAt).toLocaleDateString($intlLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div class="hidden lg:flex lg:col-span-2 items-center gap-2">
            <Badge status={d.statut} />
            {#if d.statut === 'offre_envoyee'}
              <span class="w-2 h-2 rounded-full animate-pulse" style="background-color: #1e3fff"></span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
