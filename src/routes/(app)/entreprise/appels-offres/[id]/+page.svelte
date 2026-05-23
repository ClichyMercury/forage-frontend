<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'
  import Badge from '$lib/components/ui/Badge.svelte'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'

  const id = $derived($page.params.id)
  let ao = $state<any>(null)
  let offreDocuments = $state<any[]>([])
  let loading = $state(true)
  let submitting = $state(false)
  let showForm = $state(false)

  let prixHt = $state('')
  let prixTtc = $state('')
  let delaiExecution = $state('')
  let descriptionTechnique = $state('')
  let files = $state<FileList | null>(null)

  onMount(async () => {
    try {
      const res = await api.get(`/appels-offres/${id}`)
      ao = res.data
      if (ao.ma_reponse?.soumise && ao.ma_reponse?.offre_id) {
        try {
          const docsRes = await api.get(`/documents?entity_type=offre&entity_id=${ao.ma_reponse.offre_id}`)
          offreDocuments = docsRes.data ?? []
        } catch {}
      }
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
      toast.success($t('ao.detail.success'), $t('ao.detail.success_sub'))
      goto('/entreprise/mes-offres')
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message)
    } finally { submitting = false }
  }

  const titreDemande = $derived(
    ao?.demande?.localisationAdresse ?? ao?.demande?.localisation_adresse ?? `${$t('ao.detail.tender_label')} #${id}`
  )
</script>

<svelte:head><title>{$t('ao.detail.tender_label')} #{id} — Forage</title></svelte:head>

<div class="max-w-3xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between gap-3 mb-6">
    <div class="flex items-center gap-3">
      <button onclick={() => goto('/entreprise/appels-offres')}
        class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
        <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
      </button>
      <div>
        <h2 class="text-xl font-bold text-slate-900">{titreDemande}</h2>
        <p class="text-sm text-slate-500">{$t('ao.detail.tender_label')} — {ao?.demande?.typeForage ?? ao?.demande?.type_forage ?? ''}</p>
      </div>
    </div>

    {#if ao && !ao.ma_reponse?.soumise && !ao.compte_a_rebours?.expire}
      <button onclick={() => showForm = true}
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm shrink-0">
        <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
        {$t('ao.detail.submit_offer')}
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if ao}

    <!-- Fiche de la demande -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-800">{$t('ao.detail.request_info')}</h3>
        <Badge status={ao.statut} />
      </div>

      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('demande.detail.info_type')}</p>
          <p class="text-sm font-semibold text-slate-700 capitalize">
            {ao.demande?.typeForage ?? ao.demande?.type_forage ?? '—'}
          </p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('demande.detail.info_loc')}</p>
          <p class="text-sm font-semibold text-slate-700 truncate">
            {ao.demande?.localisationAdresse ?? ao.demande?.localisation_adresse ?? '—'}
          </p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('demande.detail.info_depth')}</p>
          <p class="text-sm font-semibold text-slate-700">
            {(ao.demande?.profondeurEstimee ?? ao.demande?.profondeur_estimee)
              ? `${ao.demande?.profondeurEstimee ?? ao.demande?.profondeur_estimee} m`
              : '—'}
          </p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('demande.detail.info_delay')}</p>
          <p class="text-sm font-semibold text-slate-700">
            {(ao.demande?.delaiSouhaite ?? ao.demande?.delai_souhaite)
              ? new Date(ao.demande?.delaiSouhaite ?? ao.demande?.delai_souhaite).toLocaleDateString('fr-CM')
              : '—'}
          </p>
        </div>
      </div>

      {#if ao.demande?.description}
        <div class="p-3 bg-slate-50 rounded-xl mb-3">
          <p class="text-xs text-slate-400 mb-1">{$t('demande.detail.desc')}</p>
          <p class="text-sm text-slate-700 leading-relaxed">{ao.demande.description}</p>
        </div>
      {/if}

      {#if ao.demande?.documents?.length > 0}
        <div class="mb-3">
          <p class="text-xs text-slate-400 mb-2">{$t('demande.detail.docs')} ({ao.demande.documents.length})</p>
          <div class="space-y-1.5">
            {#each ao.demande.documents as doc}
              <DownloadButton docId={doc.id} nomFichier={doc.nomFichier} />
            {/each}
          </div>
        </div>
      {/if}

      {#if ao.compte_a_rebours && !ao.ma_reponse?.soumise}
        <div class="p-3 rounded-xl flex items-center gap-2 {ao.compte_a_rebours.expire ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}">
          <span class="material-symbols-outlined icon-filled {ao.compte_a_rebours.expire ? 'text-red-500' : 'text-amber-600'}" style="font-size: 18px;">
            {ao.compte_a_rebours.expire ? 'timer_off' : 'timer'}
          </span>
          <div>
            <p class="text-xs font-semibold {ao.compte_a_rebours.expire ? 'text-red-700' : 'text-amber-700'}">
              {ao.compte_a_rebours.expire ? $t('entreprise.ao.expired') : $t('ao.detail.deadline')}
            </p>
            {#if !ao.compte_a_rebours.expire}
              <p class="text-xs text-amber-600">
                {new Date(ao.compte_a_rebours.delai_reponse ?? ao.delaiReponse).toLocaleString('fr-CM')}
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Offre déjà soumise -->
    {#if ao.ma_reponse?.soumise}
      <div class="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-3">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size: 32px;">check_circle</span>
          <div>
            <p class="font-bold text-emerald-800">{$t('ao.detail.offer_submitted')}</p>
            <div class="mt-1"><Badge status={ao.ma_reponse.statut} /></div>
          </div>
        </div>
        {#if offreDocuments.length > 0}
          <div class="mt-3 pt-3 border-t border-emerald-200">
            <p class="text-xs font-semibold text-emerald-700 mb-2">{$t('ao.detail.docs')} ({offreDocuments.length})</p>
            <div class="space-y-1.5">
              {#each offreDocuments as doc}
                <DownloadButton docId={doc.id} nomFichier={doc.nomFichier} />
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<!-- Modal formulaire -->
{#if showForm}
  <div class="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm flex items-center justify-center p-4"
    onclick={(e) => { if (e.target === e.currentTarget) showForm = false }}>

    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-hidden">
      <!-- Header modal -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 class="text-lg font-bold text-slate-900">{$t('ao.detail.submit_offer')}</h3>
          <p class="text-xs text-slate-500 mt-0.5">{titreDemande}</p>
        </div>
        <button onclick={() => showForm = false}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500">
          <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
        </button>
      </div>

      <!-- Formulaire -->
      <form onsubmit={handleSubmit} class="p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="prixHt">{$t('ao.detail.price_ht')} *</label>
            <input id="prixHt" type="number" bind:value={prixHt} placeholder="Ex: 1 500 000" required
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5" for="prixTtc">{$t('ao.detail.price_ttc')} *</label>
            <input id="prixTtc" type="number" bind:value={prixTtc} required
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            <p class="text-xs text-slate-400 mt-1">{$t('ao.detail.tax_note')}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="delai">{$t('ao.detail.exec_time')} *</label>
          <input id="delai" type="number" bind:value={delaiExecution} placeholder="Ex: 30" required
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="desc">{$t('ao.detail.tech_desc')}</label>
          <textarea id="desc" bind:value={descriptionTechnique} rows="3"
            placeholder={$t('ao.detail.tech_placeholder')}
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('ao.detail.docs')}</label>
          <label class="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
            <span class="material-symbols-outlined text-slate-400" style="font-size: 20px;">cloud_upload</span>
            <span class="text-sm text-slate-500">
              {files && files.length > 0 ? `${files.length} fichier(s) sélectionné(s)` : 'Devis, certifications, références...'}
            </span>
            <input type="file" multiple bind:files class="hidden" />
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showForm = false}
            class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
            {$t('common.cancel')}
          </button>
          <button type="submit" disabled={submitting}
            class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {#if submitting}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {$t('ao.detail.submitting')}
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
              {$t('ao.detail.submit_offer')}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
