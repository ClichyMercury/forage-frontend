<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'

  let appelsOffres = $state<any[]>([])
  let loading = $state(true)
  let now = $state(Date.now())
  let timer: ReturnType<typeof setInterval>

  onMount(async () => {
    try {
      const res = await api.get('/appels-offres')
      appelsOffres = res.data.data ?? []
    } catch {} finally { loading = false }

    // Mettre à jour le compte à rebours chaque seconde
    timer = setInterval(() => { now = Date.now() }, 1000)
  })

  onDestroy(() => clearInterval(timer))

  function getSecondesRestantes(ao: any): number {
    // Utiliser la date limite directement si disponible
    const delai = ao.delaiReponse ?? ao.delai_reponse ?? ao.compte_a_rebours?.delai_reponse
    if (delai) {
      const diff = new Date(delai).getTime() - now
      return Math.floor(diff / 1000)
    }
    return ao.compte_a_rebours?.secondes_restantes ?? 0
  }

  function countdown(secondes: number): string {
    if (secondes <= 0) return 'Expiré'
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

<svelte:head><title>Appels d'offres — ForageCI</title></svelte:head>

<div class="mb-5">
  <h2 class="text-xl font-bold text-slate-900">Appels d'offres reçus</h2>
  <p class="text-sm text-slate-500 mt-0.5">Invitations à soumettre une offre</p>
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if appelsOffres.length === 0}
    <div class="py-16 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">campaign</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">Aucun appel d'offre reçu</p>
      <p class="text-slate-400 text-xs mt-1">Vous serez notifié dès qu'une invitation vous sera adressée</p>
    </div>
  {:else}
    <div class="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-1"></div>
      <div class="col-span-3">Localisation</div>
      <div class="col-span-2">Type</div>
      <div class="col-span-3">Délai restant</div>
      <div class="col-span-1">Réponse</div>
      <div class="col-span-2 text-right">Action</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each appelsOffres as ao}
        {@const secondes = getSecondesRestantes(ao)}
        {@const expire = secondes <= 0}
        <div class="grid grid-cols-12 gap-4 px-5 py-4 items-center">
          <div class="col-span-1">
            <span class="text-sm text-slate-500">{ao.id}</span>
          </div>
          <div class="col-span-3 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">
              {ao.demande?.localisationAdresse ?? ao.demande?.localisation_adresse ?? '—'}
            </p>
          </div>
          <div class="col-span-2">
            <span class="text-sm text-slate-600 capitalize">
              {ao.demande?.typeForage ?? ao.demande?.type_forage ?? '—'}
            </span>
          </div>
          <div class="col-span-3">
            {#if expire}
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">timer_off</span>
                Délai expiré
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">timer</span>
                {countdown(secondes)}
              </span>
            {/if}
          </div>
          <div class="col-span-1">
            {#if ao.ma_reponse?.soumise}
              <Badge status={ao.ma_reponse.statut} />
            {:else}
              <span class="text-xs text-slate-400">—</span>
            {/if}
          </div>
          <div class="col-span-2 text-right">
            <a href="/entreprise/appels-offres/{ao.id}"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                {ao.ma_reponse?.soumise || expire
                  ? 'bg-slate-50 text-slate-500 border border-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'}">
              {ao.ma_reponse?.soumise ? 'Voir' : expire ? 'Expiré' : 'Répondre'}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
