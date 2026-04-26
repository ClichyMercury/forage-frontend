<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import DemandMap from '$lib/components/ui/DemandMap.svelte'

  let stats = $state<any>(null)
  let demandes = $state<any[]>([])
  let pendingEntreprises = $state<any[]>([])
  let allDemandes = $state<any[]>([])
  let periode = $state('mois')
  let loading = $state(true)

  // Points carte — toutes les demandes avec coordonnées GPS
  const mapPoints = $derived(
    allDemandes
      .filter((d: any) => d.localisationLat && d.localisationLng)
      .map((d: any) => {
        console.log('Map point:', d.id, d.localisationLat, d.localisationLng, d.localisationAdresse)
        return {
          id: d.id,
          lat: Number(d.localisationLat),
          lng: Number(d.localisationLng),
          adresse: d.localisationAdresse ?? '',
          statut: d.statut ?? '',
          typeForage: d.typeForage ?? '',
        }
      })
  )

  function fmt(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' M'
    if (num >= 1_000) return (num / 1_000).toFixed(0) + ' K'
    return num.toLocaleString('fr-CI')
  }

  async function loadData() {
    loading = true
    try {
      const [analyticsRes, demandesRes, pendingRes, allDemandesRes] = await Promise.all([
        api.get(`/admin/analytics?periode=${periode}`),
        api.get('/admin/demandes?limit=6'),
        api.get('/admin/users/pending-entreprises'),
        api.get('/admin/demandes?limit=200'),
      ])
      stats = analyticsRes.data
      demandes = demandesRes.data.data ?? []
      pendingEntreprises = Array.isArray(pendingRes.data) ? pendingRes.data : []
      allDemandes = allDemandesRes.data.data ?? []
    } catch {} finally { loading = false }
  }

  onMount(loadData)
  $effect(() => { loadData() })
</script>

<svelte:head><title>Tableau de bord — Admin ForageCI</title></svelte:head>

<!-- Header -->
<div class="mb-6 flex items-start lg:items-center justify-between flex-wrap gap-3">
  <div class="min-w-0 flex-1">
    <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900 wrap-break-word">
      Bonjour, <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #b35d2e">{auth.user?.fullName?.split(' ')[0] ?? 'Admin'}</span>.
    </h2>
    <p class="text-sm text-slate-500 mt-1">Vue d'ensemble de la plateforme.</p>
  </div>
  <div class="flex items-center gap-2 flex-wrap">
    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
      {#each [['semaine','Sem.'], ['mois','Mois'], ['annee','An.']] as [val, label]}
        <button onclick={() => periode = val}
          class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all {periode === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
          {label}
        </button>
      {/each}
    </div>
    <a href="/admin/demandes"
      class="flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-sm whitespace-nowrap">
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">assignment</span>
      <span class="hidden sm:inline">Gérer les demandes</span>
      <span class="sm:hidden">Gérer</span>
    </a>
  </div>
</div>

<!-- Stats -->
{#if loading}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    {#each [1,2,3,4,5,6,7,8] as _}<div class="skeleton h-24 rounded-2xl"></div>{/each}
  </div>
{:else if stats}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <StatCard title="Demandes ({periode})" value={stats.demandes.total_periode} icon="assignment" color="blue" />
    <StatCard title="Taux de conversion" value={stats.demandes.taux_conversion} icon="trending_up" color="green" />
    <StatCard title="Chiffre d'affaires" value="{fmt(stats.finances.chiffre_affaires)} FCFA" icon="payments" color="purple" subtitle="Période en cours" />
    <StatCard title="Marges générées" value="{fmt(stats.finances.marges_cumulees)} FCFA" icon="account_balance" color="orange" />
  </div>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    <StatCard title="Total demandes" value={stats.demandes.total_global} icon="folder_open" color="blue" />
    <StatCard title="En attente" value={stats.demandes.en_attente} icon="hourglass_empty" color="orange" />
    <StatCard title="Acceptées" value={stats.demandes.acceptees} icon="check_circle" color="green" />
    <StatCard
      title="Sans réponse +7j"
      value={stats.alertes_sans_reponse.count}
      icon="warning"
      color="red"
      subtitle={stats.alertes_sans_reponse.count > 0 ? 'Action requise' : 'Tout est à jour'}
    />
  </div>
{/if}

<!-- Ligne 1 : Demandes récentes + Validation entreprises -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

  <!-- Demandes récentes — même style que la liste demandes -->
  <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-display font-bold text-slate-900">Demandes récentes</h3>
      <a href="/admin/demandes" class="text-sm text-brand-600 hover:text-brand-700 font-semibold">Voir tout</a>
    </div>
    {#if loading}
      <div class="p-5 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if demandes.length === 0}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">assignment</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">Aucune demande</p>
      </div>
    {:else}
      <!-- En-tête mini-tableau (desktop only) -->
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-4">Localisation</div>
        <div class="col-span-3">Client</div>
        <div class="col-span-2">Type</div>
        <div class="col-span-3">Statut</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each demandes as d}
          <a href="/admin/demandes/{d.id}"
            class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3 hover:bg-slate-50 transition-all">
            <div class="flex items-center gap-2 min-w-0 lg:col-span-4">
              <div class="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 15px;">water_drop</span>
              </div>
              <span class="text-sm font-medium text-slate-800 truncate flex-1">{d.localisationAdresse}</span>
              <div class="lg:hidden shrink-0"><Badge status={d.statut} /></div>
            </div>
            <div class="flex items-center gap-1 pl-10 lg:pl-0 lg:col-span-3 min-w-0">
              <span class="text-xs lg:hidden text-slate-400">Client :</span>
              <span class="text-sm text-slate-600 truncate">{d.client?.fullName ?? d.client?.email ?? '—'}</span>
            </div>
            <div class="flex items-center gap-1 pl-10 lg:pl-0 lg:col-span-2">
              <span class="text-xs lg:hidden text-slate-400">Type :</span>
              <span class="text-xs text-slate-500 capitalize">{d.typeForage}</span>
            </div>
            <div class="hidden lg:block lg:col-span-3">
              <Badge status={d.statut} />
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Validation entreprises -->
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-display font-bold text-slate-900">Validation entreprises</h3>
      {#if pendingEntreprises.length > 0}
        <span class="text-xs px-2.5 py-1 rounded-full font-semibold border" style="background-color: #fbf3ec; color: #743820; border-color: #e9c2a3">
          {pendingEntreprises.length} en attente
        </span>
      {/if}
    </div>
    {#if loading}
      <div class="p-5 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if pendingEntreprises.length === 0}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size: 20px;">check_circle</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">Tout est validé</p>
        <p class="text-slate-400 text-xs mt-1">Aucune entreprise en attente</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each pendingEntreprises.slice(0, 5) as e}
          <div class="flex items-center gap-3 px-5 py-3.5">
            <div class="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">
              {(e.entrepriseProfile?.raisonSociale ?? e.email).charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">
                {e.entrepriseProfile?.raisonSociale ?? e.email}
              </p>
              <p class="text-xs text-slate-400 truncate">{e.email}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                Inscrit le {new Date(e.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <a href="/admin/utilisateurs/{e.id}"
              class="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-700 transition-all shrink-0">
              Valider
            </a>
          </div>
        {/each}
      </div>
      {#if pendingEntreprises.length > 5}
        <div class="px-5 py-3 border-t border-slate-100">
          <a href="/admin/utilisateurs/pending" class="text-sm text-brand-600 font-semibold hover:text-brand-700">
            Voir les {pendingEntreprises.length - 5} autres →
          </a>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Ligne 2 : Carte géographique + Répartition type forage -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

  <!-- Carte géographique des demandes -->
  <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
      <div>
        <h3 class="font-display font-bold text-slate-900">Répartition géographique</h3>
        <p class="text-xs text-slate-400 mt-0.5">
          {mapPoints.length} chantier{mapPoints.length > 1 ? 's' : ''} localisé{mapPoints.length > 1 ? 's' : ''}
        </p>
      </div>
      <!-- Légende complète -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        {#each [
          { color: '#f59e0b', label: 'En attente' },
          { color: '#3b82f6', label: 'Validée' },
          { color: '#6366f1', label: 'AO lancé' },
          { color: '#06b6d4', label: 'Offre envoyée' },
          { color: '#10b981', label: 'Acceptée' },
          { color: '#ef4444', label: 'Refusée' },
        ] as leg}
          <div class="flex items-center gap-1">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:{leg.color}"></div>
            <span class="text-xs text-slate-500">{leg.label}</span>
          </div>
        {/each}
      </div>
    </div>
    <div style="height: 380px;" class="relative">
      {#if mapPoints.length > 0}
        <DemandMap points={mapPoints} />
      {:else}
        <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
          <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
            <span class="material-symbols-outlined text-slate-400" style="font-size: 28px;">map</span>
          </div>
          <p class="text-sm font-medium text-slate-500">Aucune demande géolocalisée</p>
          <p class="text-xs text-slate-400 mt-1 text-center max-w-xs">
            Les demandes avec coordonnées GPS (saisies via la carte) apparaîtront ici
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Répartition type forage -->
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100">
      <h3 class="font-display font-bold text-slate-900">Par type de forage</h3>
      <p class="text-xs text-slate-400 mt-0.5">Répartition des demandes</p>
    </div>
    {#if loading}
      <div class="p-5 space-y-3">{#each [1,2,3,4] as _}<div class="skeleton h-10 rounded-xl"></div>{/each}</div>
    {:else if stats?.repartition_type_forage?.length > 0}
      {@const total = stats.repartition_type_forage.reduce((s: number, i: any) => s + Number(i.count), 0)}
      <div class="p-5 space-y-4">
        {#each stats.repartition_type_forage as item}
          {@const pct = total > 0 ? Math.round(Number(item.count) / total * 100) : 0}
          {@const typeIcons: Record<string, string> = { eau: 'water_drop', geotechnique: 'terrain', petrolier: 'oil_barrel', autre: 'construction' }}
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size: 14px;">
                  {typeIcons[item.type_forage] ?? 'construction'}
                </span>
                <span class="text-sm font-medium text-slate-700 capitalize">{item.type_forage}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-slate-900">{item.count}</span>
                <span class="text-xs text-slate-400">{pct}%</span>
              </div>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all" style="width: {pct}%; background: linear-gradient(90deg, #1e3fff 0%, #b35d2e 100%)"></div>
            </div>
          </div>
        {/each}
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">Total</span>
          <span class="text-sm font-bold text-slate-900">{total} demande{total > 1 ? 's' : ''}</span>
        </div>
      </div>
    {:else}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">pie_chart</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">Aucune donnée</p>
      </div>
    {/if}
  </div>
</div>
