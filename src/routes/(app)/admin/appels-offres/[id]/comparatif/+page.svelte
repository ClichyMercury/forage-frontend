<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import FormPage from '$lib/components/layout/FormPage.svelte'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'

  const id = $derived($page.params.id)
  let data = $state<any>(null)
  let loading = $state(true)
  let selecting = $state(false)
  let margeAdmin = $state('')
  let resumePrestation = $state('')
  let selectedOffreId = $state<number | null>(null)
  let panneauEl = $state<HTMLDivElement | null>(null)

  onMount(async () => {
    try {
      const res = await api.get(`/admin/appels-offres/${id}/comparatif`)
      data = res.data
    } catch {} finally { loading = false }
  })

  const selectedOffre = $derived(
    data?.comparatif?.find((o: any) => o.offre_id === selectedOffreId) ?? null
  )

  const prixFinalPrevu = $derived(
    selectedOffre && margeAdmin
      ? selectedOffre.prix_ttc + Number(margeAdmin)
      : null
  )

  const depasse = $derived(
    prixFinalPrevu !== null && data
      ? prixFinalPrevu > Number(data.budget_client)
      : false
  )

  async function selectionner() {    if (!selectedOffreId || !margeAdmin || !resumePrestation) {
      toast.error('Champs requis', 'Remplissez tous les champs avant de continuer.')
      return
    }
    selecting = true
    try {
      await api.patch(`/admin/offres/${selectedOffreId}/selectionner`, {
        margeAdmin: Number(margeAdmin),
        resumePrestation,
      })
      toast.success('Offre retenue !', 'Passez à la génération de l\'offre finale.')
      goto(`/admin/demandes/${data.demande_id}`)
    } catch (err: any) {
      const d = err.response?.data
      if (d?.calcul) {
        toast.error('Budget dépassé', `Marge max autorisée : ${Number(d.calcul.marge_maximum_autorisee).toLocaleString('fr-CI')} FCFA`)
      } else {
        toast.error('Erreur', d?.message)
      }
    } finally { selecting = false }
  }

  // Scroll vers le panneau de marge quand une offre est sélectionnée
  $effect(() => {
    if (selectedOffreId && panneauEl) {
      setTimeout(() => {
        const y = panneauEl!.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top: y, behavior: 'smooth' })
      }, 150)
    }
  })

  // Toast quand la marge change
  let lastDepasse = $state<boolean | null>(null)
  $effect(() => {
    if (!margeAdmin || !selectedOffre) { lastDepasse = null; return }
    if (depasse && lastDepasse !== true) {
      toast.error(
        'Marge trop élevée',
        `Maximum autorisé : ${fmt(Number(data?.budget_client) - selectedOffre.prix_ttc)} FCFA`
      )
      lastDepasse = true
    } else if (!depasse && lastDepasse !== false && margeAdmin) {
      toast.success('Marge acceptée', 'Le prix final est dans le budget du client.')
      lastDepasse = false
    }
  })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Comparatif des offres — Admin</title></svelte:head>

<div class="max-w-5xl mx-auto">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => history.back()}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">Comparatif des offres</h2>
      <p class="text-sm text-slate-500">
        {data ? `Forage ${data.comparatif?.[0]?.demande_type ?? ''} — ${data.comparatif?.[0]?.demande_adresse?.split(',')[0] ?? ''}` : `Appel d'offre #${id}`}
      </p>
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if data}

    <!-- Résumé budget -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Budget client</p>
        <p class="text-2xl font-bold text-amber-700">{fmt(data.budget_client)}</p>
        <p class="text-xs text-slate-400 mt-1">FCFA — confidentiel</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Offres reçues</p>
        <p class="text-2xl font-bold text-slate-900">{data.resume.total_offres}</p>
        <p class="text-xs text-slate-400 mt-1">{data.resume.offres_dans_budget} dans le budget</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Meilleur prix</p>
        <p class="text-2xl font-bold {data.resume.offres_dans_budget > 0 ? 'text-emerald-700' : 'text-red-600'}">
          {data.resume.meilleur_prix_ttc ? fmt(data.resume.meilleur_prix_ttc) : '—'}
        </p>
        <p class="text-xs text-slate-400 mt-1">FCFA TTC</p>
      </div>
    </div>

    {#if data.comparatif.length === 0}
      <div class="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
        <span class="material-symbols-outlined" style="font-size: 36px;">inbox</span>
        <p class="text-sm mt-2">Aucune offre reçue pour cet appel d'offre</p>
      </div>
    {:else}
      <!-- Tableau comparatif -->
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">Tableau comparatif</h3>
          <p class="text-xs text-slate-400">Cliquez sur une ligne pour la sélectionner</p>
        </div>

        <!-- En-tête -->
        <div class="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div class="col-span-1">#</div>
          <div class="col-span-3">Entreprise</div>
          <div class="col-span-2 text-right">Prix HT</div>
          <div class="col-span-2 text-right">Prix TTC</div>
          <div class="col-span-2 text-right">Délai</div>
          <div class="col-span-2 text-right">Marge dispo.</div>
        </div>

        <div class="divide-y divide-slate-50">
          {#each data.comparatif as offre}
            <button
              onclick={() => selectedOffreId = offre.offre_id}
              class="w-full grid grid-cols-12 gap-4 px-5 py-4 text-left transition-all items-center
                {selectedOffreId === offre.offre_id
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : 'hover:bg-slate-50'}
                {offre.meilleure_offre ? 'relative' : ''}">

              <!-- Rang -->
              <div class="col-span-1">
                <span class="w-7 h-7 rounded-full {offre.meilleure_offre ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} text-xs font-bold flex items-center justify-center">
                  {offre.rang}
                </span>
              </div>

              <!-- Entreprise -->
              <div class="col-span-3 flex items-center gap-2 min-w-0">
                <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                  {(offre.entreprise?.fullName ?? offre.entreprise?.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 truncate">
                    {offre.entreprise?.fullName ?? offre.entreprise?.email ?? '—'}
                  </p>
                  {#if offre.meilleure_offre}
                    <span class="text-xs text-emerald-600 font-medium">Meilleure offre</span>
                  {/if}
                </div>
              </div>

              <!-- Prix HT -->
              <div class="col-span-2 text-right">
                <span class="text-sm text-slate-600">{fmt(offre.prix_ht)}</span>
                <span class="text-xs text-slate-400 ml-1">FCFA</span>
              </div>

              <!-- Prix TTC -->
              <div class="col-span-2 text-right">
                <span class="text-sm font-semibold text-slate-900">{fmt(offre.prix_ttc)}</span>
                <span class="text-xs text-slate-400 ml-1">FCFA</span>
              </div>

              <!-- Délai -->
              <div class="col-span-2 text-right">
                <span class="text-sm text-slate-700">{offre.delai_execution_jours}</span>
                <span class="text-xs text-slate-400 ml-1">jours</span>
              </div>

              <!-- Marge disponible -->
              <div class="col-span-2 text-right">
                <span class="text-sm font-semibold {offre.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                  {offre.dans_budget ? '+' : ''}{fmt(offre.marge_disponible)}
                </span>
                <span class="text-xs text-slate-400 ml-1">FCFA</span>
              </div>
            </button>

            <!-- Description technique si sélectionnée -->
            {#if selectedOffreId === offre.offre_id && offre.description_technique}
              <div class="col-span-12 px-5 py-3 bg-blue-50 border-t border-blue-100">
                <p class="text-xs text-slate-500 mb-1 font-medium">Description technique</p>
                <p class="text-sm text-slate-700">{offre.description_technique}</p>
              </div>
            {/if}

            <!-- Documents de l'offre si sélectionnée -->
            {#if selectedOffreId === offre.offre_id && offre.documents?.length > 0}
              <div class="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <p class="text-xs text-slate-500 mb-2 font-medium">Documents joints ({offre.documents.length})</p>
                <div class="flex flex-wrap gap-2">
                  {#each offre.documents as doc}
                    <DownloadButton docId={doc.id} nomFichier={doc.nomFichier} variant="button" />
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Panneau de sélection -->
      {#if selectedOffreId}
      <div bind:this={panneauEl} class="bg-white rounded-2xl border border-blue-200 p-6 animate-fade-in-up">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 20px;">check_circle</span>
            Retenir l'offre #{selectedOffreId} — Appliquer votre marge
          </h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5" for="marge">
                Marge commerciale (FCFA) *
              </label>
              <input id="marge" type="number" bind:value={margeAdmin} placeholder="Ex: 150 000" min="0"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm transition-all"
                class:border-red-400={depasse} />

              <!-- Visualisation marge disponible — bas gauche -->
              <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Marge disponible</p>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-slate-500">Budget client</span>
                  <span class="font-semibold text-amber-700">{fmt(data.budget_client)} FCFA</span>
                </div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-slate-500">Prix prestataire TTC</span>
                  <span class="font-semibold text-slate-700">− {selectedOffre ? fmt(selectedOffre.prix_ttc) : '—'} FCFA</span>
                </div>
                <div class="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-800">Marge max disponible</span>
                  <span class="text-base font-bold {selectedOffre && (data.budget_client - selectedOffre.prix_ttc) > 0 ? 'text-emerald-600' : 'text-red-500'}">
                    {selectedOffre ? fmt(data.budget_client - selectedOffre.prix_ttc) : '—'} FCFA
                  </span>
                </div>
              </div>

              {#if margeAdmin && selectedOffre}
                {#if depasse}
                  <!-- Message inline discret quand dépasse -->
                  <p class="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">warning</span>
                    Max autorisé : {fmt(Number(data.budget_client) - selectedOffre.prix_ttc)} FCFA
                  </p>
                {/if}
              {/if}
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5" for="resume">
                Résumé de la prestation *
              </label>
              <textarea id="resume" bind:value={resumePrestation} rows="5"
                placeholder="Décrivez la prestation pour le client : type de forage, profondeur, équipements, garanties..."
                class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
            </div>
          </div>

          <div class="flex gap-3">
            <button onclick={() => selectedOffreId = null}
              class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onclick={selectionner} disabled={selecting || depasse || !margeAdmin || !resumePrestation}
              class="flex-1 py-2.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {#if selecting}
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}
                <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">check_circle</span>
              {/if}
              Retenir cette offre
            </button>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>
