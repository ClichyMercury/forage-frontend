<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import UserAvatar from '$lib/components/ui/UserAvatar.svelte'

  let appelsOffres = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const res = await api.get('/admin/appels-offres')
      appelsOffres = res.data.data ?? []
    } catch {} finally { loading = false }
  })

  function statutAO(ao: any) {
    return ao.statut === 'ouvert' ? 'ouvert' : 'clos'
  }

  function isExpire(ao: any) {
    if (!ao.delaiReponse && !ao.delai_reponse) return false
    return new Date(ao.delaiReponse ?? ao.delai_reponse) < new Date()
  }
</script>

<svelte:head><title>Appels d'offres — Admin</title></svelte:head>

<div class="mb-5 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-display font-black text-2xl lg:text-3xl leading-tight" style="color: #0f1f5c; letter-spacing: -0.02em">
      Appels d'offres.
    </h2>
    <p class="text-sm text-slate-500 mt-1">Tous les appels d'offres lancés sur la plateforme.</p>
  </div>
  <a href="/admin/demandes"
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
    style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.3)">
    <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">assignment</span>
    Gérer les demandes
  </a>
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">
      {#each [1,2,3,4] as _}<div class="skeleton h-16 rounded-xl"></div>{/each}
    </div>

  {:else if appelsOffres.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-brand-400" style="font-size: 28px;">campaign</span>
      </div>
      <p class="text-slate-700 font-semibold text-sm">Aucun appel d'offre lancé</p>
      <p class="text-slate-400 text-xs mt-1 mb-4">
        Les appels d'offres se lancent depuis le détail d'une demande validée.
      </p>
      <a href="/admin/demandes"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
        style="background-color: #1e3fff">
        <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">assignment</span>
        Voir les demandes
      </a>
    </div>

  {:else}
    <!-- En-tête tableau desktop -->
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-2">Entreprises</div>
      <div class="col-span-3">Demande</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-2">Date limite</div>
      <div class="col-span-2">Statut</div>
    </div>

    <div class="divide-y divide-slate-50">
      {#each appelsOffres as ao}
        {@const expire = isExpire(ao)}
        {@const estClos = ao.statut === 'clos'}
        <button
          onclick={estClos ? undefined : () => goto(`/admin/appels-offres/${ao.id}/comparatif`)}
          disabled={estClos}
          class="w-full flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4 text-left transition-all
            {estClos ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'}">

          <!-- Nb entreprises avec avatars -->
          <div class="lg:col-span-2 pl-10 lg:pl-0">
            {#if ao.entreprises?.length > 0}
              <div class="flex items-center gap-1.5">
                <div class="flex -space-x-2">
                  {#each ao.entreprises.slice(0, 3) as e}
                    <div class="ring-2 ring-white rounded-full">
                      <UserAvatar user={e} size="sm" shape="rounded-full" />
                    </div>
                  {/each}
                </div>
                <span class="text-xs text-slate-500">
                  {ao.entreprises.length} invitée{ao.entreprises.length > 1 ? 's' : ''}
                </span>
              </div>
            {:else}
              <span class="text-sm text-slate-400">—</span>
            {/if}
          </div>  

          <!-- Demande -->
          <div class="flex items-center gap-2 min-w-0 lg:col-span-3">
            <div class="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-brand-600 icon-filled" style="font-size: 15px;">water_drop</span>
            </div>
            <span class="text-sm font-medium text-slate-800 truncate">
              {ao.demande?.localisationAdresse ?? ao.demande?.localisation_adresse ?? `Demande #${ao.demandeId ?? ao.demande_id}`}
            </span>
          </div>

          <!-- Type forage -->
          <div class="lg:col-span-2 pl-10 lg:pl-0">
            <span class="text-sm text-slate-600 capitalize">
              {ao.demande?.typeForage ?? ao.demande?.type_forage ?? '—'}
            </span>
          </div>

          <!-- Date limite -->
          <div class="lg:col-span-2 pl-10 lg:pl-0">
            <span class="text-sm {expire ? 'text-red-500 font-medium' : 'text-slate-500'}">
              {ao.delaiReponse ?? ao.delai_reponse
                ? new Date(ao.delaiReponse ?? ao.delai_reponse).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </span>
            {#if expire}
              <span class="block text-xs text-red-400">Expiré</span>
            {/if}
          </div>

          <!-- Statut -->
          <div class="lg:col-span-2 pl-10 lg:pl-0">
            <Badge status={statutAO(ao)} />
            {#if estClos}
              <span class="block text-xs text-slate-400 mt-1">Archivé</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
