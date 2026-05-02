<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'

  const id = $derived($page.params.id)
  let data = $state<any>(null)
  let loading = $state(true)
  let selecting = $state(false)
  let margeAdmin = $state('')
  let resumePrestation = $state('')
  let selectedOffreId = $state<number | null>(null)

  let loadError = $state<string | null>(null)

  onMount(async () => {
    const aoId = $page.params.id
    if (!aoId) {
      loadError = 'Identifiant de l\'appel d\'offre manquant'
      loading = false
      return
    }
    try {
      const res = await api.get(`/admin/appels-offres/${aoId}/comparatif`)
      data = res.data
    } catch (err: any) {
      console.error('[Comparatif] Erreur chargement:', err)
      loadError = err.response?.data?.message ?? err.message ?? 'Erreur de chargement'
    } finally { loading = false }
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

  async function selectionner() {
    if (!selectedOffreId || !margeAdmin || !resumePrestation) {
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

  let rejecting = $state<number | null>(null)
  async function rejeterOffre(offreId: number, nomEntreprise: string) {
    if (!confirm(`Rejeter l'offre de "${nomEntreprise}" ?\n\nL'entreprise sera notifiée et l'offre passera en "non retenue".`)) return
    rejecting = offreId
    try {
      await api.patch(`/admin/offres/${offreId}/rejeter`)
      toast.success('Offre rejetée', 'L\'entreprise a été notifiée.')
      // Recharger le comparatif pour refléter le nouveau statut
      const res = await api.get(`/admin/appels-offres/${id}/comparatif`)
      data = res.data
      if (selectedOffreId === offreId) selectedOffreId = null
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message ?? 'Impossible de rejeter cette offre')
    } finally { rejecting = null }
  }

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
  {:else if loadError}
    <div class="bg-white rounded-2xl border border-red-200 p-8 text-center">
      <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size: 24px;">error</span>
      </div>
      <p class="text-slate-700 font-semibold text-sm">Impossible de charger le comparatif</p>
      <p class="text-slate-500 text-xs mt-1">{loadError}</p>
      <button onclick={() => location.reload()}
        class="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all">
        Réessayer
      </button>
    </div>
  {:else if data}
    {@const comparatif = data.comparatif ?? []}
    {@const resume = data.resume ?? { total_offres: 0, offres_dans_budget: 0, meilleur_prix_ttc: null }}

    <!-- Résumé budget -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Budget client</p>
        <p class="font-display font-black text-2xl lg:text-3xl tracking-tight text-brand-600">{fmt(data.budget_client ?? 0)}</p>
        <p class="text-xs text-slate-400 mt-1">FCFA — confidentiel</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Offres reçues</p>
        <p class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">{resume.total_offres ?? 0}</p>
        <p class="text-xs text-slate-400 mt-1">{resume.offres_dans_budget ?? 0} dans le budget</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Meilleur prix</p>
        <p class="font-display font-black text-2xl lg:text-3xl tracking-tight {(resume.offres_dans_budget ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-400'}">
          {resume.meilleur_prix_ttc ? fmt(resume.meilleur_prix_ttc) : '—'}
        </p>
        <p class="text-xs text-slate-400 mt-1">FCFA TTC</p>
      </div>
    </div>

    {#if comparatif.length === 0}
      <div class="bg-white rounded-2xl border border-slate-100 py-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 28px;">inbox</span>
        </div>
        <p class="text-slate-700 font-semibold text-sm">Aucune offre reçue pour cet appel d'offre</p>
        <p class="text-slate-400 text-xs mt-1">Les offres apparaîtront ici dès leur soumission par les entreprises invitées.</p>
      </div>
    {:else}
      <!-- Tableau comparatif -->
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">Tableau comparatif</h3>
          <p class="text-xs text-slate-400">Cliquez sur une ligne pour la sélectionner</p>
        </div>

        <!-- En-tête (desktop only) -->
        <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div class="col-span-1">#</div>
          <div class="col-span-3">Entreprise</div>
          <div class="col-span-2 text-right">Prix HT</div>
          <div class="col-span-2 text-right">Prix TTC</div>
          <div class="col-span-1 text-right">Délai</div>
          <div class="col-span-2 text-right">Marge dispo.</div>
          <div class="col-span-1 text-right">Action</div>
        </div>

        <div class="divide-y divide-slate-50">
          {#each comparatif as offre}
            <div class="relative flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4 transition-all
              {selectedOffreId === offre.offre_id ? 'bg-brand-50 lg:border-l-2 lg:border-l-brand-600' : 'hover:bg-slate-50'}">

              <!-- Zone cliquable principale — desktop uniquement (mobile : on rendra l'entreprise cliquable) -->
              <button
                type="button"
                onclick={() => selectedOffreId = offre.offre_id}
                class="hidden lg:block absolute inset-0 right-[8.33%] cursor-pointer"
                aria-label="Sélectionner l'offre #{offre.offre_id}"
              ></button>

              <!-- Ligne 1 mobile : Rang + Entreprise + Action -->
              <div class="flex items-center gap-3 min-w-0 lg:col-span-1 relative lg:pointer-events-none">
                <span class="w-8 h-8 rounded-full {offre.meilleure_offre ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} text-xs font-bold flex items-center justify-center shrink-0">
                  {offre.rang}
                </span>
              </div>

              <button
                type="button"
                onclick={() => selectedOffreId = offre.offre_id}
                class="flex items-center gap-2 min-w-0 lg:col-span-3 relative text-left lg:pointer-events-none"
              >
                <div class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                  {(offre.entreprise?.fullName ?? offre.entreprise?.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-slate-800 truncate">
                    {offre.entreprise?.fullName ?? offre.entreprise?.email ?? '—'}
                  </p>
                  {#if offre.meilleure_offre}
                    <span class="text-xs text-emerald-600 font-medium">Meilleure offre</span>
                  {/if}
                </div>
              </button>

              <!-- Prix HT -->
              <div class="flex items-center justify-between lg:justify-end lg:col-span-2 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">Prix HT :</span>
                <div>
                  <span class="text-sm text-slate-600">{fmt(offre.prix_ht)}</span>
                  <span class="text-xs text-slate-400 ml-1">FCFA</span>
                </div>
              </div>

              <!-- Prix TTC -->
              <div class="flex items-center justify-between lg:justify-end lg:col-span-2 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">Prix TTC :</span>
                <div>
                  <span class="text-sm font-semibold text-slate-900">{fmt(offre.prix_ttc)}</span>
                  <span class="text-xs text-slate-400 ml-1">FCFA</span>
                </div>
              </div>

              <!-- Délai -->
              <div class="flex items-center justify-between lg:justify-end lg:col-span-1 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">Délai :</span>
                <div>
                  <span class="text-sm text-slate-700">{offre.delai_execution_jours}</span>
                  <span class="text-xs text-slate-400 ml-0.5">j</span>
                </div>
              </div>

              <!-- Marge disponible -->
              <div class="flex items-center justify-between lg:justify-end lg:col-span-2 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">Marge :</span>
                <div>
                  <span class="text-sm font-semibold {offre.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                    {offre.dans_budget ? '+' : ''}{fmt(offre.marge_disponible)}
                  </span>
                  <span class="text-xs text-slate-400 ml-1">FCFA</span>
                </div>
              </div>

              <!-- Action : Rejeter -->
              <div class="flex items-center justify-end pl-11 lg:pl-0 lg:col-span-1 lg:text-right relative">
                {#if offre.statut === 'retenue'}
                  <span class="text-xs px-2 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700">Retenue</span>
                {:else if offre.statut === 'non_retenue' || offre.statut === 'rejetee'}
                  <span class="text-xs px-2 py-1 rounded-full font-semibold bg-red-50 text-red-600">Rejetée</span>
                {:else}
                  <button
                    type="button"
                    onclick={() => rejeterOffre(offre.offre_id, offre.entreprise?.fullName ?? offre.entreprise?.email ?? 'cette entreprise')}
                    disabled={rejecting === offre.offre_id}
                    class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all disabled:opacity-60"
                    title="Rejeter cette offre">
                    {#if rejecting === offre.offre_id}
                      <span class="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin block"></span>
                    {:else}
                      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">cancel</span>
                    {/if}
                  </button>
                {/if}
              </div>
            </div>

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

      <!-- Modal sélection offre -->
      {#if selectedOffreId}
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <!-- Backdrop -->
          <button class="absolute inset-0 bg-white/40 backdrop-blur-sm" onclick={() => selectedOffreId = null} aria-label="Fermer"></button>

          <!-- Modal -->
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <!-- Header modal -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 20px;">check_circle</span>
                <h3 class="font-semibold text-slate-800">Retenir l'offre #{selectedOffreId}</h3>
              </div>
              <button onclick={() => selectedOffreId = null}
                class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
              </button>
            </div>

            <div class="px-6 py-5 space-y-4">
              <!-- Marge disponible -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Marge disponible</p>
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Budget client</span>
                    <span class="font-semibold text-amber-700">{fmt(data.budget_client)} FCFA</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Prix prestataire TTC</span>
                    <span class="font-semibold text-slate-700">− {selectedOffre ? fmt(selectedOffre.prix_ttc) : '—'} FCFA</span>
                  </div>
                  <div class="border-t border-slate-200 pt-2 flex items-center justify-between">
                    <span class="text-sm font-bold text-slate-800">Marge max disponible</span>
                    <span class="text-base font-bold {selectedOffre && (data.budget_client - selectedOffre.prix_ttc) > 0 ? 'text-emerald-600' : 'text-red-500'}">
                      {selectedOffre ? fmt(data.budget_client - selectedOffre.prix_ttc) : '—'} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <!-- Marge commerciale -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5" for="marge">
                  Marge commerciale (FCFA) *
                </label>
                <input id="marge" type="number" bind:value={margeAdmin} placeholder="Ex: 150 000" min="0"
                  class="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                    {depasse ? 'border-red-400 bg-red-50' : 'border-slate-200'}" />
                {#if margeAdmin && depasse}
                  <p class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">warning</span>
                    Max autorisé : {fmt(Number(data.budget_client) - selectedOffre.prix_ttc)} FCFA
                  </p>
                {:else if margeAdmin && !depasse}
                  <p class="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">check_circle</span>
                    Prix final client : {fmt(selectedOffre.prix_ttc + Number(margeAdmin))} FCFA
                  </p>
                {/if}
              </div>

              <!-- Résumé prestation -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5" for="resume">
                  Résumé de la prestation *
                </label>
                <textarea id="resume" bind:value={resumePrestation} rows="4"
                  placeholder="Décrivez la prestation pour le client : type de forage, profondeur, équipements, garanties..."
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>

            <!-- Footer modal -->
            <div class="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onclick={() => selectedOffreId = null}
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                Annuler
              </button>
              <button onclick={selectionner} disabled={selecting || depasse || !margeAdmin || !resumePrestation}
                class="flex-1 py-2.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {#if selecting}
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">check_circle</span>
                {/if}
                Retenir cette offre
              </button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>