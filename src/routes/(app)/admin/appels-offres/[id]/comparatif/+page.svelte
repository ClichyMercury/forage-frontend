<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'
  import UserAvatar from '$lib/components/ui/UserAvatar.svelte'

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
      loadError = $t('admin.comparatif.error_id')
      loading = false
      return
    }
    try {
      const res = await api.get(`/admin/appels-offres/${aoId}/comparatif`)
      data = res.data
    } catch (err: any) {
      console.error('[Comparatif] Erreur chargement:', err)
      loadError = err.response?.data?.message ?? err.message ?? $t('admin.comparatif.error_load')
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
      toast.error($t('admin.comparatif.required_fields'), $t('admin.comparatif.fill_fields'))
      return
    }
    selecting = true
    try {
      await api.patch(`/admin/offres/${selectedOffreId}/selectionner`, {
        margeAdmin: Number(margeAdmin),
        resumePrestation,
      })
      toast.success($t('admin.comparatif.retained_toast'), $t('admin.comparatif.retained_sub'))
      goto(`/admin/demandes/${data.demande_id}`)
    } catch (err: any) {
      const d = err.response?.data
      if (d?.calcul) {
        toast.error($t('admin.comparatif.budget_exceeded'), `${$t('admin.comparatif.max_allowed', { amount: Number(d.calcul.marge_maximum_autorisee).toLocaleString('fr-CM') })}`)
      } else {
        toast.error($t('toast.save_error'), d?.message)
      }
    } finally { selecting = false }
  }

  let rejecting = $state<number | null>(null)
  async function rejeterOffre(offreId: number, nomEntreprise: string) {
    if (!confirm(`Rejeter l'offre de "${nomEntreprise}" ?\n\nL'entreprise sera notifiée et l'offre passera en "non retenue".`)) return
    rejecting = offreId
    try {
      await api.patch(`/admin/offres/${offreId}/rejeter`)
      toast.success($t('admin.comparatif.offer_rejected'), $t('admin.comparatif.company_notified'))
      const res = await api.get(`/admin/appels-offres/${id}/comparatif`)
      data = res.data
      if (selectedOffreId === offreId) selectedOffreId = null
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message ?? $t('common.error_save'))
    } finally { rejecting = null }
  }

  let lastDepasse = $state<boolean | null>(null)
  $effect(() => {
    if (!margeAdmin || !selectedOffre) { lastDepasse = null; return }
    if (depasse && lastDepasse !== true) {
      toast.error(
        $t('admin.comparatif.margin_too_high'),
        `${$t('admin.comparatif.max_allowed', { amount: fmt(Number(data?.budget_client) - selectedOffre.prix_ttc) })}`
      )
      lastDepasse = true
    } else if (!depasse && lastDepasse !== false && margeAdmin) {
      toast.success($t('admin.comparatif.margin_ok'), $t('admin.comparatif.margin_ok_sub'))
      lastDepasse = false
    }
  })

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }
</script>

<svelte:head><title>{$t('admin.comparatif.title')} — Admin Forage</title></svelte:head>

<div class="max-w-5xl mx-auto">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => history.back()}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">{$t('admin.comparatif.title')}</h2>
      <p class="text-sm text-slate-500">
        {data ? `Forage ${data.comparatif?.[0]?.demande_type ?? ''} — ${data.comparatif?.[0]?.demande_adresse?.split(',')[0] ?? ''}` : `${$t('ao.detail.tender_label')} #${id}`}
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
      <p class="text-slate-700 font-semibold text-sm">{$t('admin.comparatif.error_load')}</p>
      <p class="text-slate-500 text-xs mt-1">{loadError}</p>
      <button onclick={() => location.reload()}
        class="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all">
        {$t('admin.comparatif.retry')}
      </button>
    </div>
  {:else if data}
    {@const comparatif = data.comparatif ?? []}
    {@const resume = data.resume ?? { total_offres: 0, offres_dans_budget: 0, meilleur_prix_ttc: null }}

    <!-- Résumé budget -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{$t('admin.comparatif.stat_budget')}</p>
        <p class="font-display font-black text-2xl lg:text-3xl tracking-tight text-brand-600">{fmt(data.budget_client ?? 0)}</p>
        <p class="text-xs text-slate-400 mt-1">{$t('admin.comparatif.stat_budget_note')}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{$t('admin.comparatif.stat_offers')}</p>
        <p class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">{resume.total_offres ?? 0}</p>
        <p class="text-xs text-slate-400 mt-1">{$t('admin.comparatif.stat_in_budget', { count: resume.offres_dans_budget ?? 0 })}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{$t('admin.comparatif.stat_best')}</p>
        <p class="font-display font-black text-2xl lg:text-3xl tracking-tight {(resume.offres_dans_budget ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-400'}">
          {resume.meilleur_prix_ttc ? fmt(resume.meilleur_prix_ttc) : '—'}
        </p>
        <p class="text-xs text-slate-400 mt-1">{$t('admin.comparatif.stat_best_note')}</p>
      </div>
    </div>

    {#if comparatif.length === 0}
      <div class="bg-white rounded-2xl border border-slate-100 py-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 28px;">inbox</span>
        </div>
        <p class="text-slate-700 font-semibold text-sm">{$t('admin.comparatif.no_offers')}</p>
        <p class="text-slate-400 text-xs mt-1">{$t('admin.comparatif.no_offers_sub')}</p>
      </div>
    {:else}
      <!-- Tableau comparatif -->
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">{$t('admin.comparatif.table_title')}</h3>
          <p class="text-xs text-slate-400">{$t('admin.comparatif.table_hint')}</p>
        </div>

        <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div class="col-span-1">#</div>
          <div class="col-span-3">{$t('admin.ao.col_companies')}</div>
          <div class="col-span-2 text-right">{$t('admin.comparatif.col_ht')}</div>
          <div class="col-span-2 text-right">{$t('admin.comparatif.col_ttc')}</div>
          <div class="col-span-1 text-right">{$t('admin.comparatif.col_delay')}</div>
          <div class="col-span-2 text-right">{$t('admin.comparatif.col_margin')}</div>
          <div class="col-span-1 text-right">{$t('admin.comparatif.col_action')}</div>
        </div>

        <div class="divide-y divide-slate-50">
          {#each comparatif as offre}
            <div class="relative flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4 transition-all
              {selectedOffreId === offre.offre_id ? 'bg-brand-50 lg:border-l-2 lg:border-l-brand-600' : 'hover:bg-slate-50'}">

              <button type="button" onclick={() => selectedOffreId = offre.offre_id}
                class="hidden lg:block absolute inset-0 right-[8.33%] cursor-pointer"
                aria-label="Sélectionner l'offre #{offre.offre_id}"></button>

              <div class="flex items-center gap-3 min-w-0 lg:col-span-1 relative lg:pointer-events-none">
                <span class="w-8 h-8 rounded-full {offre.meilleure_offre ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} text-xs font-bold flex items-center justify-center shrink-0">
                  {offre.rang}
                </span>
              </div>

              <button type="button" onclick={() => selectedOffreId = offre.offre_id}
                class="flex items-center gap-2 min-w-0 lg:col-span-3 relative text-left lg:pointer-events-none">
                <UserAvatar user={offre.entreprise} size="sm" shape="rounded-full" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-slate-800 truncate">
                    {offre.entreprise?.fullName ?? offre.entreprise?.email ?? '—'}
                  </p>
                  {#if offre.meilleure_offre}
                    <span class="text-xs text-emerald-600 font-medium">{$t('admin.comparatif.best_offer')}</span>
                  {/if}
                </div>
              </button>

              <div class="flex items-center justify-between lg:justify-end lg:col-span-2 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">{$t('admin.comparatif.mobile_ht')}</span>
                <div>
                  <span class="text-sm text-slate-600">{fmt(offre.prix_ht)}</span>
                  <span class="text-xs text-slate-400 ml-1">FCFA</span>
                </div>
              </div>

              <div class="flex items-center justify-between lg:justify-end lg:col-span-2 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">{$t('admin.comparatif.mobile_ttc')}</span>
                <div>
                  <span class="text-sm font-semibold text-slate-900">{fmt(offre.prix_ttc)}</span>
                  <span class="text-xs text-slate-400 ml-1">FCFA</span>
                </div>
              </div>

              <div class="flex items-center justify-between lg:justify-end lg:col-span-1 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">{$t('admin.comparatif.mobile_delay')}</span>
                <div>
                  <span class="text-sm text-slate-700">{offre.delai_execution_jours}</span>
                  <span class="text-xs text-slate-400 ml-0.5">{$t('common.days_short')}</span>
                </div>
              </div>

              <div class="flex items-center justify-between lg:justify-end lg:col-span-2 lg:text-right pl-11 lg:pl-0 relative lg:pointer-events-none">
                <span class="text-xs lg:hidden text-slate-400">{$t('admin.comparatif.mobile_margin')}</span>
                <div>
                  <span class="text-sm font-semibold {offre.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                    {offre.dans_budget ? '+' : ''}{fmt(offre.marge_disponible)}
                  </span>
                  <span class="text-xs text-slate-400 ml-1">FCFA</span>
                </div>
              </div>

              <div class="flex items-center justify-end pl-11 lg:pl-0 lg:col-span-1 lg:text-right relative">
                {#if offre.statut === 'retenue'}
                  <span class="text-xs px-2 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700">{$t('admin.comparatif.retained')}</span>
                {:else if offre.statut === 'non_retenue' || offre.statut === 'rejetee'}
                  <span class="text-xs px-2 py-1 rounded-full font-semibold bg-red-50 text-red-600">{$t('admin.comparatif.rejected')}</span>
                {:else}
                  <button type="button"
                    onclick={() => rejeterOffre(offre.offre_id, offre.entreprise?.fullName ?? offre.entreprise?.email ?? 'cette entreprise')}
                    disabled={rejecting === offre.offre_id}
                    class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all disabled:opacity-60"
                    title={$t('admin.comparatif.rejected')}>
                    {#if rejecting === offre.offre_id}
                      <span class="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin block"></span>
                    {:else}
                      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">cancel</span>
                    {/if}
                  </button>
                {/if}
              </div>
            </div>

            {#if selectedOffreId === offre.offre_id && offre.description_technique}
              <div class="col-span-12 px-5 py-3 bg-blue-50 border-t border-blue-100">
                <p class="text-xs text-slate-500 mb-1 font-medium">{$t('admin.comparatif.tech_desc')}</p>
                <p class="text-sm text-slate-700">{offre.description_technique}</p>
              </div>
            {/if}

            {#if selectedOffreId === offre.offre_id && offre.documents?.length > 0}
              <div class="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <p class="text-xs text-slate-500 mb-2 font-medium">{$t('demande.detail.docs')} ({offre.documents.length})</p>
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
          <button class="absolute inset-0 bg-white/40 backdrop-blur-sm" onclick={() => selectedOffreId = null} aria-label={$t('common.close')}></button>

          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 20px;">check_circle</span>
                <h3 class="font-semibold text-slate-800">{$t('admin.comparatif.modal_title', { id: String(selectedOffreId) })}</h3>
              </div>
              <button onclick={() => selectedOffreId = null}
                class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
              </button>
            </div>

            <div class="px-6 py-5 space-y-4">
              <!-- Marge disponible -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{$t('admin.comparatif.margin_section')}</p>
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">{$t('admin.comparatif.stat_budget')}</span>
                    <span class="font-semibold text-amber-700">{fmt(data.budget_client)} FCFA</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">{$t('admin.comparatif.provider_ttc')}</span>
                    <span class="font-semibold text-slate-700">− {selectedOffre ? fmt(selectedOffre.prix_ttc) : '—'} FCFA</span>
                  </div>
                  <div class="border-t border-slate-200 pt-2 flex items-center justify-between">
                    <span class="text-sm font-bold text-slate-800">{$t('admin.comparatif.max_margin')}</span>
                    <span class="text-base font-bold {selectedOffre && (data.budget_client - selectedOffre.prix_ttc) > 0 ? 'text-emerald-600' : 'text-red-500'}">
                      {selectedOffre ? fmt(data.budget_client - selectedOffre.prix_ttc) : '—'} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <!-- Marge commerciale -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5" for="marge">
                  {$t('admin.comparatif.margin_field')}
                </label>
                <input id="marge" type="number" bind:value={margeAdmin} placeholder="Ex: 150 000" min="0"
                  class="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                    {depasse ? 'border-red-400 bg-red-50' : 'border-slate-200'}" />
                {#if margeAdmin && depasse}
                  <p class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">warning</span>
                    {$t('admin.comparatif.max_allowed', { amount: fmt(Number(data.budget_client) - selectedOffre.prix_ttc) })}
                  </p>
                {:else if margeAdmin && !depasse}
                  <p class="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">check_circle</span>
                    {$t('admin.comparatif.final_price', { amount: fmt(selectedOffre.prix_ttc + Number(margeAdmin)) })}
                  </p>
                {/if}
              </div>

              <!-- Résumé prestation -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5" for="resume">
                  {$t('admin.comparatif.summary_field')}
                </label>
                <textarea id="resume" bind:value={resumePrestation} rows="4"
                  placeholder={$t('admin.comparatif.summary_ph')}
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onclick={() => selectedOffreId = null}
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                {$t('common.cancel')}
              </button>
              <button onclick={selectionner} disabled={selecting || depasse || !margeAdmin || !resumePrestation}
                class="flex-1 py-2.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {#if selecting}
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">check_circle</span>
                {/if}
                {$t('admin.comparatif.retain_btn')}
              </button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>
