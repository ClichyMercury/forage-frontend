<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  const demandeId = $derived(Number($page.url.searchParams.get('demandeId')))
  let entreprises = $state<any[]>([])
  let demande = $state<any>(null)
  let selectedIds = $state<number[]>([])
  let delaiReponse = $state('')
  let loading = $state(false)
  let loadingEntreprises = $state(true)
  let showForm = $state(true)

  onMount(async () => {
    try {
      const [entRes, demRes] = await Promise.all([
        api.get('/admin/users?role=entreprise'),
        api.get(`/admin/demandes/${demandeId}`),
      ])
      entreprises = (entRes.data.data ?? []).filter((e: any) => e.isActive)
      demande = demRes.data
    } catch {} finally { loadingEntreprises = false }
  })

  function toggleEntreprise(id: number) {
    selectedIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id]
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (selectedIds.length === 0) {
      toast.error('Sélection requise', 'Sélectionnez au moins une entreprise.')
      return
    }
    loading = true
    try {
      await api.post('/admin/appels-offres', {
        demandeId,
        entrepriseIds: selectedIds,
        delaiReponse,
      })
      toast.success("Appel d'offre lancé !", `${selectedIds.length} entreprise(s) notifiée(s).`)
      goto(`/admin/demandes/${demandeId}`)
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        const msgs = data.errors?.map((e: any) => e.message).join(', ')
        toast.error('Erreur de validation', msgs ?? 'Vérifiez les champs')
      } else {
        toast.error('Erreur', data?.message ?? err.message)
      }
    } finally { loading = false }
  }
</script>

<svelte:head><title>Lancer un appel d'offre — Admin</title></svelte:head>

<!-- Page de fond -->
<div class="max-w-3xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto(`/admin/demandes/${demandeId}`)}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1">
      <h2 class="text-xl font-bold text-slate-900">
        {demande ? `Forage ${demande.typeForage} — ${demande.localisationAdresse?.split(',')[0]}` : 'Appel d\'offre'}
      </h2>
      <p class="text-sm text-slate-500">Lancer un appel d'offre</p>
    </div>
    <button onclick={() => showForm = true}
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm">
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">campaign</span>
      Lancer l'appel d'offre
    </button>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
    {#if demande}
      <div class="text-left">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demande concernée</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3 bg-slate-50 rounded-xl">
            <p class="text-xs text-slate-400">Type</p>
            <p class="text-sm font-semibold text-slate-700 capitalize">{demande.typeForage}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl">
            <p class="text-xs text-slate-400">Localisation</p>
            <p class="text-sm font-semibold text-slate-700 truncate">{demande.localisationAdresse}</p>
          </div>
        </div>
      </div>
    {:else}
      <span class="material-symbols-outlined" style="font-size: 48px;">campaign</span>
      <p class="text-slate-600 font-medium mt-3">Prêt à lancer l'appel d'offre</p>
      <p class="text-sm mt-1">Cliquez sur le bouton en haut à droite pour configurer et lancer</p>
    {/if}
  </div>
</div>

<!-- Modal -->
{#if showForm}
  <div class="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6"
    onclick={(e) => { if (e.target === e.currentTarget) goto(`/admin/demandes/${demandeId}`) }}>

    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fade-in-up">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Lancer un appel d'offre</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {demande ? `Forage ${demande.typeForage}` : ''}
          </p>
        </div>
        <button onclick={() => goto(`/admin/demandes/${demandeId}`)}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500">
          <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
        </button>
      </div>

      <form onsubmit={handleSubmit} class="p-6 space-y-5">
        <!-- Date limite -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="delai">Date limite de réponse *</label>
          <input id="delai" type="datetime-local" bind:value={delaiReponse} required
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
        </div>

        <!-- Entreprises -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-slate-700">Entreprises à inviter *</label>
            {#if selectedIds.length > 0}
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {selectedIds.length} sélectionnée(s)
              </span>
            {/if}
          </div>

          {#if loadingEntreprises}
            <div class="space-y-2">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
          {:else if entreprises.length === 0}
            <div class="py-6 text-center text-slate-400 text-sm">Aucune entreprise active</div>
          {:else}
            <div class="space-y-2 max-h-48 overflow-y-auto">
              {#each entreprises as e}
                <button type="button" onclick={() => toggleEntreprise(e.id)}
                  class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                    {selectedIds.includes(e.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}">
                  <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                    {e.email.charAt(0).toUpperCase()}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate">
                      {e.entrepriseProfile?.raisonSociale ?? e.email}
                    </p>
                    <p class="text-xs text-slate-400 truncate">{e.email}</p>
                  </div>
                  {#if selectedIds.includes(e.id)}
                    <span class="material-symbols-outlined text-blue-500 icon-filled shrink-0" style="font-size: 18px;">check_circle</span>
                  {:else}
                    <span class="material-symbols-outlined text-slate-300 shrink-0" style="font-size: 18px;">radio_button_unchecked</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => goto(`/admin/demandes/${demandeId}`)}
            class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={loading || selectedIds.length === 0}
            class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {#if loading}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">campaign</span>
            {/if}
            Lancer ({selectedIds.length})
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
