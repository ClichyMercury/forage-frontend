<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  const id = $derived($page.params.id)
  let ao = $state<any>(null)
  let loading = $state(true)
  let submitting = $state(false)
  let prixHt = $state('')
  let prixTtc = $state('')
  let delaiExecution = $state('')
  let descriptionTechnique = $state('')
  let files = $state<FileList | null>(null)

  onMount(async () => {
    try {
      const res = await api.get(`/appels-offres/${id}`)
      ao = res.data
    } catch {} finally { loading = false }
  })

  $effect(() => {
    if (prixHt) prixTtc = (Number(prixHt) * 1.18).toFixed(0)
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    submitting = true
    try {
      const formData = new FormData()
      formData.append('prixHt', prixHt)
      formData.append('prixTtc', prixTtc)
      formData.append('delaiExecution', delaiExecution)
      if (descriptionTechnique) formData.append('descriptionTechnique', descriptionTechnique)
      if (files) Array.from(files).forEach(f => formData.append('documents', f))
      await api.post(`/appels-offres/${id}/offres`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Offre soumise !', "Votre offre a été transmise à l'administrateur.")
      goto('/entreprise/mes-offres')
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { submitting = false }
  }
</script>

<svelte:head><title>Soumettre une offre — ForageCI</title></svelte:head>

<div class="max-w-2xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto('/entreprise/appels-offres')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <h2 class="text-xl font-bold text-slate-900">Soumettre une offre — AO #{id}</h2>
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if ao}
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-800">Détails de la demande</h3>
        <Badge status={ao.statut} />
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400">Type</p>
          <p class="font-semibold text-slate-700 capitalize">{ao.demande?.type_forage ?? 'N/A'}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400">Localisation</p>
          <p class="font-semibold text-slate-700 truncate">{ao.demande?.localisation_adresse ?? 'N/A'}</p>
        </div>
      </div>
      {#if ao.compte_a_rebours}
        <div class="mt-3 p-3 rounded-xl {ao.compte_a_rebours.expire ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}">
          <span class="text-sm font-semibold {ao.compte_a_rebours.expire ? 'text-red-700' : 'text-amber-700'}">
            {ao.compte_a_rebours.expire ? 'Délai expiré' : `Limite: ${new Date(ao.compte_a_rebours.delai_reponse).toLocaleString('fr-CI')}`}
          </span>
        </div>
      {/if}
    </div>

    {#if ao.ma_reponse?.soumise}
      <div class="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center">
        <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size: 40px;">check_circle</span>
        <p class="font-bold text-emerald-800 mt-2">Offre déjà soumise</p>
        <div class="mt-2"><Badge status={ao.ma_reponse.statut} /></div>
      </div>
    {:else if !ao.compte_a_rebours?.expire}
      <form onsubmit={handleSubmit} class="space-y-5">
        <div class="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h3 class="font-bold text-slate-800">Prix et délai</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5" for="prixHt">Prix HT (FCFA) *</label>
              <input id="prixHt" type="number" bind:value={prixHt} placeholder="1500000" required
                class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5" for="prixTtc">Prix TTC (FCFA) *</label>
              <input id="prixTtc" type="number" bind:value={prixTtc} required
                class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50" />
              <p class="text-xs text-slate-400 mt-1">TVA 18% auto</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="delai">Délai d'exécution (jours) *</label>
            <input id="delai" type="number" bind:value={delaiExecution} placeholder="30" required
              class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="desc">Description technique</label>
            <textarea id="desc" bind:value={descriptionTechnique} rows="4"
              placeholder="Approche technique, matériel, garanties..."
              class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 class="font-bold text-slate-800 mb-3">Documents joints</h3>
          <p class="text-xs text-slate-400 mb-3">Devis formel, certifications, références de projets</p>
          <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
            <span class="material-symbols-outlined text-slate-400 mb-1" style="font-size: 24px;">cloud_upload</span>
            <span class="text-sm text-slate-500">Glissez ou <span class="text-blue-600 font-medium">parcourir</span></span>
            <input type="file" multiple bind:files class="hidden" />
          </label>
          {#if files && files.length > 0}
            <div class="mt-3 space-y-1.5">
              {#each Array.from(files) as f}
                <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 16px;">description</span>
                  <span class="text-xs text-slate-700 truncate">{f.name}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <button type="submit" disabled={submitting}
          class="w-full py-3.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {#if submitting}
            <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
          {/if}
          Soumettre mon offre
        </button>
      </form>
    {/if}
  {/if}
</div>
