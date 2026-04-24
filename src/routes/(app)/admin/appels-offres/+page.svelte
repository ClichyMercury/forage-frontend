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

  onMount(async () => {
    try {
      const res = await api.get(`/admin/appels-offres/${id}/comparatif`)
      data = res.data
    } catch {} finally { loading = false }
  })

  const selectedOffre = $derived(
    data?.comparatif?.find((o: any) => o.offre_id === selectedOffreId) ?? null
  )

  const depasse = $derived(
    selectedOffre && margeAdmin && data
      ? (selectedOffre.prix_ttc + Number(margeAdmin)) > Number(data.budget_client)
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

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head>
  <title>Comparatif des offres — Admin</title>
</svelte:head>

<!-- Conteneur principal sans flex qui pousse -->
<div class="max-w-5xl mx-auto px-4 py-6">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => history.back()}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">Comparatif des offres</h2>
      <p class="text-sm text-slate-500">
        {data ? `Forage ${data.comparatif?.[0]?.demande_type ?? ''}` : `Appel d'offre #${id}`}
      </p>
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2,3] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if data}

    <!-- Cartes résumé -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Budget client</p>
        <p class="text-2xl font-bold text-amber-700">{fmt(data.budget_client)} FCFA</p>
        <p class="text-xs text-slate-400 mt-1">confidentiel</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Offres reçues</p>
        <p class="text-2xl font-bold text-slate-900">{data.resume.total_offres}</p>
        <p class="text-xs text-slate-400 mt-1">{data.resume.offres_dans_budget} dans le budget</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Meilleur prix</p>
        <p class="text-2xl font-bold {data.resume.offres_dans_budget > 0 ? 'text-emerald-600' : 'text-red-500'}">
          {data.resume.meilleur_prix_ttc ? fmt(data.resume.meilleur_prix_ttc) : '—'} FCFA
        </p>
        <p class="text-xs text-slate-400 mt-1">TTC</p>
      </div>
    </div>

    {#if data.comparatif.length === 0}
      <div class="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
        <span class="material-symbols-outlined" style="font-size: 48px;">inbox</span>
        <p class="text-sm mt-2">Aucune offre reçue pour cet appel d'offre</p>
      </div>
    {:else}
      <!-- Tableau comparatif -->
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm mb-8">
        <div class="px-5 py-3.5 border-b border-slate-100 bg-white">
          <h3 class="font-semibold text-slate-800">Tableau comparatif</h3>
          <p class="text-xs text-slate-400 mt-0.5">Cliquez sur une offre pour la configurer</p>
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
            <div>
              <button
                onclick={() => selectedOffreId = offre.offre_id}
                class="w-full grid grid-cols-12 gap-4 px-5 py-4 text-left transition-all hover:bg-slate-50
                  {selectedOffreId === offre.offre_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}">
                
                <div class="col-span-1">
                  <span class="inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold
                    {offre.meilleure_offre ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                    {offre.rang}
                  </span>
                </div>

                <div class="col-span-3">
                  <p class="text-sm font-medium text-slate-800 truncate">
                    {offre.entreprise?.fullName ?? offre.entreprise?.email ?? '—'}
                  </p>
                  {#if offre.meilleure_offre}
                    <span class="text-xs text-emerald-600 font-medium">⭐ Meilleure offre</span>
                  {/if}
                </div>

                <div class="col-span-2 text-right">
                  <span class="text-sm text-slate-600">{fmt(offre.prix_ht)}</span>
                </div>

                <div class="col-span-2 text-right">
                  <span class="text-sm font-semibold text-slate-900">{fmt(offre.prix_ttc)}</span>
                </div>

                <div class="col-span-2 text-right">
                  <span class="text-sm text-slate-700">{offre.delai_execution_jours} jours</span>
                </div>

                <div class="col-span-2 text-right">
                  <span class="text-sm font-semibold {offre.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                    {offre.dans_budget ? '+' : ''}{fmt(offre.marge_disponible)}
                  </span>
                </div>
              </button>

              <!-- Détails de l'offre sélectionnée (juste en dessous) -->
              {#if selectedOffreId === offre.offre_id}
                <!-- Description technique -->
                {#if offre.description_technique}
                  <div class="px-5 py-3 bg-blue-50 border-t border-blue-100">
                    <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">📋 Description technique</p>
                    <p class="text-sm text-slate-700">{offre.description_technique}</p>
                  </div>
                {/if}

                <!-- Documents -->
                {#if offre.documents?.length > 0}
                  <div class="px-5 py-3 bg-slate-50 border-t border-slate-100">
                    <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">📎 Documents joints ({offre.documents.length})</p>
                    <div class="flex flex-wrap gap-2">
                      {#each offre.documents as doc}
                        <DownloadButton docId={doc.id} nomFichier={doc.nomFichier} variant="button" />
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- ⭐ FORMULAIRE DE CONFIGURATION - DIRECTEMENT ICI, PAS EN BAS ⭐ -->
                <div class="m-4 border-2 border-blue-200 rounded-xl overflow-hidden shadow-lg bg-white">
                  <!-- En-tête du formulaire -->
                  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-blue-200">
                    <h4 class="font-bold text-slate-800 flex items-center gap-2">
                      <span class="material-symbols-outlined text-blue-600" style="font-size: 20px;">settings</span>
                      Configuration de l'offre
                    </h4>
                    <p class="text-xs text-slate-500 mt-0.5">Définissez la marge commerciale et le résumé de la prestation</p>
                  </div>

                  <!-- Corps du formulaire -->
                  <div class="p-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <!-- Colonne gauche : Marge -->
                      <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                          Marge commerciale <span class="text-red-500">*</span>
                          <span class="text-xs font-normal text-slate-400 ml-1">(FCFA)</span>
                        </label>
                        <input 
                          type="number" 
                          bind:value={margeAdmin}
                          placeholder="Ex: 150000" 
                          min="0"
                          class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                          class:border-red-400={depasse}
                        />
                        
                        <!-- Carte info marge -->
                        <div class="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">📊 Marge disponible</p>
                          <div class="space-y-1.5 text-sm">
                            <div class="flex justify-between">
                              <span class="text-slate-500">Budget client :</span>
                              <span class="font-semibold text-amber-700">{fmt(data.budget_client)} FCFA</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-slate-500">Prix prestataire TTC :</span>
                              <span class="font-semibold text-slate-700">− {fmt(selectedOffre.prix_ttc)} FCFA</span>
                            </div>
                            <div class="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold">
                              <span>Marge max disponible :</span>
                              <span class="text-emerald-600">{fmt(data.budget_client - selectedOffre.prix_ttc)} FCFA</span>
                            </div>
                          </div>
                        </div>

                        {#if depasse}
                          <p class="mt-2 text-xs text-red-500 flex items-center gap-1">
                            <span class="material-symbols-outlined" style="font-size: 14px;">warning</span>
                            Marge trop élevée ! Maximum : {fmt(data.budget_client - selectedOffre.prix_ttc)} FCFA
                          </p>
                        {/if}
                      </div>

                      <!-- Colonne droite : Résumé -->
                      <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">
                          Résumé de la prestation <span class="text-red-500">*</span>
                        </label>
                        <textarea 
                          bind:value={resumePrestation}
                          rows="6"
                          placeholder="Décrivez la prestation pour le client :&#10;• Type de forage&#10;• Profondeur&#10;• Équipements fournis&#10;• Garanties..."
                          class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Boutons d'action -->
                  <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex gap-3">
                    <button 
                      onclick={() => {
                        selectedOffreId = null
                        margeAdmin = ''
                        resumePrestation = ''
                      }}
                      class="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-white transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      onclick={selectionner} 
                      disabled={selecting || depasse || !margeAdmin || !resumePrestation}
                      class="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {#if selecting}
                        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {:else}
                        <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
                      {/if}
                      Valider et retenir l'offre
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>