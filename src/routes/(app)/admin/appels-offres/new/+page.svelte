<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import FormPage from '$lib/components/layout/FormPage.svelte'

  const demandeId = $derived(Number($page.url.searchParams.get('demandeId')))
  let entreprises = $state<any[]>([])
  let selectedIds = $state<number[]>([])
  let delaiReponse = $state('')
  let loading = $state(false)
  let loadingEntreprises = $state(true)

  onMount(async () => {
    try {
      const res = await api.get('/admin/users?role=entreprise')
      entreprises = (res.data.data ?? []).filter((e: any) => e.isActive)
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
        delaiReponse: new Date(delaiReponse).toISOString(),
      })
      toast.success("Appel d'offre lancé !", `${selectedIds.length} entreprise(s) notifiée(s).`)
      goto('/admin/appels-offres')
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { loading = false }
  }
</script>

<svelte:head><title>Lancer un appel d'offre — Admin</title></svelte:head>

<FormPage maxWidth="max-w-2xl">
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto(`/admin/demandes/${demandeId}`)}
      class="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">Lancer un appel d'offre</h2>
      <p class="text-sm text-slate-500">Demande #{demandeId}</p>
    </div>
  </div>

  <form onsubmit={handleSubmit} class="space-y-5">
    <div class="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 20px;">schedule</span>
        Date limite de réponse
      </h3>
      <input type="datetime-local" bind:value={delaiReponse} required
        class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-800 flex items-center gap-2">
          <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 20px;">business</span>
          Entreprises à inviter
        </h3>
        {#if selectedIds.length > 0}
          <span class="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
            {selectedIds.length} sélectionnée(s)
          </span>
        {/if}
      </div>

      {#if loadingEntreprises}
        <div class="space-y-2">{#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
      {:else if entreprises.length === 0}
        <div class="py-8 text-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size: 32px;">business_off</span>
          <p class="text-sm mt-2">Aucune entreprise active</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each entreprises as e}
            <button type="button" onclick={() => toggleEntreprise(e.id)}
              class="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                {selectedIds.includes(e.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}">
              <div class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">
                {e.email.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">
                  {e.entrepriseProfile?.raisonSociale ?? e.email}
                </p>
                <p class="text-xs text-slate-400 truncate">{e.email}</p>
              </div>
              {#if selectedIds.includes(e.id)}
                <span class="material-symbols-outlined text-blue-500 icon-filled shrink-0" style="font-size: 20px;">check_circle</span>
              {:else}
                <span class="material-symbols-outlined text-slate-300 shrink-0" style="font-size: 20px;">radio_button_unchecked</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <button type="submit" disabled={loading || selectedIds.length === 0}
      class="w-full py-3.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
      {#if loading}
        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {:else}
        <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">campaign</span>
      {/if}
      Lancer l'appel d'offre ({selectedIds.length} entreprise{selectedIds.length > 1 ? 's' : ''})
    </button>
  </form>
</FormPage>

