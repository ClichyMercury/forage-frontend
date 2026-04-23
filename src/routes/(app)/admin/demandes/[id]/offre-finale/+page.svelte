<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import FormPage from '$lib/components/layout/FormPage.svelte'

  const demandeId = $derived($page.params.id)
  let demande = $state<any>(null)
  let loading = $state(true)
  let sending = $state(false)

  let resumePrestation = $state('')
  let prixFinalClient = $state('')
  let delaiExecution = $state('')

  onMount(async () => {
    try {
      const res = await api.get(`/admin/demandes/${demandeId}`)
      demande = res.data
    } catch {} finally { loading = false }
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    sending = true
    try {
      await api.post(`/admin/demandes/${demandeId}/offre-finale`, {
        resumePrestation,
        prixFinalClient: Number(prixFinalClient),
        delaiExecution: Number(delaiExecution),
      })
      toast.success('Offre finale envoyée !', 'Le client a été notifié.')
      goto(`/admin/demandes/${demandeId}`)
    } catch (err: any) {
      const d = err.response?.data
      if (d?.calcul) {
        toast.error('Budget dépassé !', `Prix max autorisé: ${Number(d.calcul.prix_maximum_autorise).toLocaleString('fr-CI')} FCFA`)
      } else {
        toast.error('Erreur', d?.message)
      }
    } finally { sending = false }
  }
</script>

<svelte:head><title>Envoyer l'offre finale — Admin</title></svelte:head>

<FormPage maxWidth="max-w-xl">
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto(`/admin/demandes/${demandeId}`)}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">Générer l'offre finale</h2>
      <p class="text-sm text-slate-500">Demande #{demandeId}</p>
    </div>
  </div>

  {#if loading}
    <div class="skeleton h-48 rounded-2xl"></div>
  {:else if demande}
    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
      <div class="flex items-center gap-2 mb-1">
        <span class="material-symbols-outlined text-amber-600 icon-filled" style="font-size: 18px;">lock</span>
        <p class="text-xs font-bold text-amber-700 uppercase">Budget client confidentiel</p>
      </div>
      <p class="text-xl font-bold text-amber-800">{Number(demande.budgetMax).toLocaleString('fr-CI')} FCFA</p>
      <p class="text-xs text-amber-600 mt-1">Le prix final ne doit pas dépasser ce montant</p>
    </div>

    <form onsubmit={handleSubmit} class="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <h3 class="font-bold text-slate-800 flex items-center gap-2">
        <span class="material-symbols-outlined text-blue-500 icon-filled">description</span>
        Récapitulatif d'offre (CDC §3.3)
      </h3>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="resume">Résumé de la prestation *</label>
        <textarea id="resume" bind:value={resumePrestation} rows="4" required
          placeholder="Décrivez la prestation : type de forage, profondeur, équipements, garanties..."
          class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="prix">Prix final client (FCFA) *</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">payments</span>
            <input id="prix" type="number" bind:value={prixFinalClient} required
              placeholder="Ex: 800000"
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm" />
          </div>
          {#if prixFinalClient && demande}
            <p class="text-xs mt-1 {Number(prixFinalClient) > Number(demande.budgetMax) ? 'text-red-500 font-semibold' : 'text-emerald-600'}">
              {Number(prixFinalClient) > Number(demande.budgetMax) ? '⚠️ Dépasse le budget !' : '✓ Dans le budget'}
            </p>
          {/if}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="delai">Délai d'exécution (jours) *</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">schedule</span>
            <input id="delai" type="number" bind:value={delaiExecution} required placeholder="30"
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={sending}
        class="w-full py-3.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {#if sending}
          <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {:else}
          <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
        {/if}
        Envoyer l'offre au client
      </button>
    </form>
  {/if}
</FormPage>