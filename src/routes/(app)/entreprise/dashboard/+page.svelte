<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  let appelsOffres = $state<any[]>([])
  let mesOffres = $state<any[]>([])
  let loading = $state(true)

  const stats = $derived(() => ({
    total: appelsOffres.length,
    ouverts: appelsOffres.filter((a: any) => !a.compte_a_rebours?.expire).length,
    soumises: mesOffres.filter((o: any) => o.statut === 'soumise').length,
    retenues: mesOffres.filter((o: any) => o.statut === 'retenue').length,
  }))

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }

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

<svelte:head><title>Tableau de bord — ForageCI</title></svelte:head>

<!-- Bienvenue -->
<div class="mb-6 flex items-start lg:items-center justify-between flex-wrap gap-3">
  <div class="min-w-0 flex-1">
    <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900 wrap-break-word">
      Bonjour, <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #b35d2e">{auth.user?.fullName?.split(' ')[0] ?? 'bienvenue'}</span>.
    </h2>
    <p class="text-sm text-slate-500 mt-1">Gérez vos appels d'offres et suivez vos soumissions.</p>
  </div>
  <a href="/entreprise/appels-offres"
    class="flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-sm hover:opacity-90 whitespace-nowrap"
    style="background-color: #b35d2e">
    <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">campaign</span>
    <span class="hidden sm:inline">Voir les appels d'offres</span>
    <span class="sm:hidden">Appels d'offres</span>
  </a>
</div>

<!-- Stats sur une seule ligne -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
  <StatCard title="Appels d'offres" value={stats().total} icon="campaign" color="blue" />
  <StatCard title="En cours" value={stats().ouverts} icon="lock_open" color="purple" />
  <StatCard title="Offres soumises" value={stats().soumises} icon="send" color="orange" />
  <StatCard title="Offres retenues" value={stats().retenues} icon="star" color="green" />
</div>

<!-- Deux blocs côte à côte en dessous -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
  <!-- Appels d'offres récents -->
  <div class="bg-white rounded-2xl border border-slate-100">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-display font-bold text-slate-900">Appels d'offres reçus</h3>
      <a href="/entreprise/appels-offres" class="text-sm font-semibold transition-colors hover:opacity-80" style="color: #b35d2e">Voir tout</a>
    </div>
    {#if loading}
      <div class="p-5 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if appelsOffres.length === 0}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">campaign</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">Aucun appel d'offre reçu</p>
        <p class="text-slate-400 text-xs mt-1">Vous serez notifié dès qu'une invitation vous sera adressée</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each appelsOffres.slice(0, 5) as ao}
          <a href="/entreprise/appels-offres/{ao.id}"
            class="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-all group">
            <div class="w-9 h-9 rounded-xl {ao.compte_a_rebours?.expire ? 'bg-red-50' : 'bg-terre-50'} flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined icon-filled {ao.compte_a_rebours?.expire ? 'text-red-400' : 'text-terre-600'}" style="font-size: 16px;">campaign</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">
                {ao.demande?.typeForage ?? ao.demande?.type_forage ?? 'Forage'} — {ao.demande?.localisationAdresse ?? ao.demande?.localisation_adresse ?? ''}
              </p>
              <p class="text-xs {ao.compte_a_rebours?.expire ? 'text-red-400' : 'text-slate-400'} mt-0.5">
                {ao.compte_a_rebours?.expire ? 'Délai expiré' : 'Ouvert'}
              </p>
            </div>
            {#if ao.ma_reponse?.soumise}
              <Badge status={ao.ma_reponse.statut} />
            {:else if !ao.compte_a_rebours?.expire}
              <span class="text-xs text-white px-2.5 py-1 rounded-full font-semibold shrink-0" style="background-color: #b35d2e">Répondre</span>
            {/if}
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Mes offres récentes -->
  <div class="bg-white rounded-2xl border border-slate-100">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-display font-bold text-slate-900">Mes offres soumises</h3>
      <a href="/entreprise/mes-offres" class="text-sm text-brand-600 hover:text-brand-700 font-semibold">Voir tout</a>
    </div>
    {#if loading}
      <div class="p-5 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if mesOffres.length === 0}
      <div class="py-12 text-center px-6">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">description</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">Aucune offre soumise</p>
        <p class="text-slate-400 text-xs mt-1">Répondez à un appel d'offre pour voir vos soumissions ici</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each mesOffres.slice(0, 5) as offre}
          <div class="flex items-center gap-3 px-5 py-3.5">
            <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size: 16px;">description</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800">Offre #{offre.id}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {fmt(offre.prixTtc)} FCFA TTC · {offre.delaiExecution} jours
              </p>
            </div>
            <Badge status={offre.statut} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
