<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  const id = $derived($page.params.id)

  let demande = $state<any>(null)
  let offreRetenue = $state<any>(null)
  let loading = $state(true)
  let sending = $state(false)

  // Formulaire offre finale
  let margeAdmin = $state('')
  let delaiExecution = $state('')
  let resumePrestation = $state('')

  // Prix final calculé automatiquement
  const prixFinalCalcule = $derived(
    offreRetenue && margeAdmin
      ? offreRetenue.prix_ttc + Number(margeAdmin)
      : offreRetenue?.prix_ttc ?? 0
  )

  const depasse = $derived(
    demande && prixFinalCalcule > parseFloat(demande.budgetMax ?? '0')
  )


  onMount(async () => {
    try {
      const res = await api.get(`/admin/demandes/${id}`)
      demande = res.data

      if (demande.statut !== 'offres_recues') {
        toast.error('Étape incorrecte', `Statut actuel: "${demande.statut}". Vous devez d'abord retenir une offre.`)
        goto(`/admin/demandes/${id}`)
        return
      }

      // Charger l'AO et l'offre retenue
      const aoRes = await api.get('/admin/appels-offres')
      const aos = aoRes.data.data ?? []
      const ao = aos.find((a: any) => (a.demandeId ?? a.demande_id) === demande.id)
      if (ao) {
        const compRes = await api.get(`/admin/appels-offres/${ao.id}/comparatif`)
        const comp = compRes.data.comparatif ?? []
        offreRetenue = comp.find((o: any) => o.statut === 'retenue') ?? null
        if (offreRetenue) {
          delaiExecution = String(offreRetenue.delai_execution_jours)
          resumePrestation = offreRetenue.description_technique ?? ''
        }
      }
    } catch (err: any) {
      toast.error('Erreur', 'Impossible de charger la demande')
      goto('/admin/demandes')
    } finally {
      loading = false
    }
  })

  async function envoyer(e: Event) {
    e.preventDefault()
    const prix = prixFinalCalcule
    const delai = parseInt(delaiExecution)
    const budget = parseFloat(demande?.budgetMax)

    if (!prix || prix <= 0) { toast.error('Erreur', 'Prix final invalide'); return }
    if (!delai || delai <= 0) { toast.error('Erreur', 'Délai invalide'); return }
    if (!resumePrestation.trim()) { toast.error('Erreur', 'Le résumé de prestation est requis'); return }
    if (depasse) {
      toast.error('Dépassement budget', `Le prix final (${fmt(prix)} FCFA) dépasse le budget client (${fmt(budget)} FCFA)`)
      return
    }

    sending = true
    try {
      await api.post(`/admin/demandes/${id}/offre-finale`, {
        prixFinalClient: prix,
        delaiExecution: delai,
        resumePrestation: resumePrestation.trim(),
      })
      toast.success('Offre envoyée', 'Le client a été notifié et peut maintenant accepter ou refuser.')
      goto(`/admin/demandes/${id}`)
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Erreur lors de l\'envoi'
      toast.error('Erreur', msg)
    } finally {
      sending = false
    }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Offre finale — Demande #{id}</title></svelte:head>

<div class="max-w-2xl mx-auto">

  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto(`/admin/demandes/${id}`)}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">Envoyer l'offre finale au client</h2>
      {#if demande}
        <p class="text-sm text-slate-500 mt-0.5">
          Forage {demande.typeForage} — {demande.localisationAdresse?.split(',')[0]}
        </p>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">
      {#each [1,2,3] as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
    </div>

  {:else if demande}

    <!-- Offre retenue (résumé) -->
    {#if offreRetenue}
      <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size: 18px;">check_circle</span>
          <p class="text-sm font-bold text-emerald-700">Offre retenue — {offreRetenue.entreprise?.full_name ?? offreRetenue.entreprise?.email ?? '—'}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xs text-emerald-600">Prix TTC prestataire</p>
            <p class="text-base font-bold text-emerald-800">{fmt(offreRetenue.prix_ttc)} FCFA</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-emerald-600">Budget client</p>
            <p class="text-base font-bold text-emerald-800">{fmt(demande.budgetMax)} FCFA</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-emerald-600">Marge disponible</p>
            <p class="text-base font-bold text-emerald-800">{fmt(parseFloat(demande.budgetMax) - offreRetenue.prix_ttc)} FCFA</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Formulaire -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Récapitulatif à envoyer au client</p>

      <form onsubmit={envoyer} class="space-y-5">

        <!-- Marge admin → prix final calculé automatiquement -->
        <div>
          <label for="marge" class="block text-sm font-medium text-slate-700 mb-1.5">
            Votre marge commerciale (FCFA)
          </label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 icon-filled" style="font-size: 18px;">add_circle</span>
            <input id="marge" type="number" bind:value={margeAdmin} min="0" required
              class="w-full pl-10 pr-4 py-3 rounded-xl border {depasse ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ex: 150000" />
          </div>

          <!-- Récapitulatif calcul -->
          {#if offreRetenue}
            <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Prix prestataire TTC</span>
                <span class="font-medium text-slate-700">{fmt(offreRetenue.prix_ttc)} FCFA</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">+ Votre marge</span>
                <span class="font-medium text-slate-700">{fmt(Number(margeAdmin) || 0)} FCFA</span>
              </div>
              <div class="border-t border-slate-200 pt-1.5 flex justify-between">
                <span class="text-sm font-bold text-slate-800">Prix final client</span>
                <span class="text-sm font-bold {depasse ? 'text-red-600' : 'text-blue-700'}">{fmt(prixFinalCalcule)} FCFA</span>
              </div>
              {#if depasse}
                <p class="text-xs text-red-500 flex items-center gap-1 pt-0.5">
                  <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">warning</span>
                  Dépasse le budget client ({fmt(parseFloat(demande.budgetMax))} FCFA). Réduisez votre marge.
                </p>
              {:else}
                <p class="text-xs text-emerald-600 flex items-center gap-1 pt-0.5">
                  <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">check_circle</span>
                  Dans le budget — marge restante : {fmt(parseFloat(demande.budgetMax) - prixFinalCalcule)} FCFA
                </p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Délai -->
        <div>
          <label for="delai" class="block text-sm font-medium text-slate-700 mb-1.5">Délai d'exécution (jours)</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 icon-filled" style="font-size: 18px;">schedule</span>
            <input id="delai" type="number" bind:value={delaiExecution} min="1" required
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ex: 30" />
          </div>
        </div>

        <!-- Résumé prestation -->
        <div>
          <label for="resume" class="block text-sm font-medium text-slate-700 mb-1.5">Résumé de la prestation</label>
          <textarea id="resume" bind:value={resumePrestation} rows="5" required
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Décrivez la prestation proposée au client : nature des travaux, équipements, garanties..."></textarea>
          <p class="text-xs text-slate-400 mt-1">Ce texte sera visible par le client dans son espace.</p>
        </div>

        <!-- Info -->
        <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <span class="material-symbols-outlined text-blue-500 icon-filled shrink-0 mt-0.5" style="font-size: 18px;">info</span>
          <p class="text-xs text-blue-700 leading-relaxed">
            Une fois envoyée, le client recevra une notification et pourra <strong>accepter ou refuser</strong> cette offre depuis son espace. Le nom du prestataire ne lui sera pas communiqué.
          </p>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => goto(`/admin/demandes/${id}`)}
            class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={sending || depasse || !margeAdmin || !resumePrestation.trim()}
            class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {#if sending}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Envoi...
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">send</span>
              Envoyer au client
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
