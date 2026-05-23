<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'
  import Badge from '$lib/components/ui/Badge.svelte'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'
  import UserAvatar from '$lib/components/ui/UserAvatar.svelte'

  let demande = $state<any>(null)
  let documents = $state<any[]>([])
  let appelOffre = $state<any>(null)
  let loading = $state(true)
  let acting = $state(false)
  let showCloturerModal = $state(false)
  const id = $derived($page.params.id)

  onMount(async () => {
    try {
      const res = await api.get(`/admin/demandes/${id}`)
      demande = res.data
      documents = res.data.documents ?? []
      try {
        const aoRes = await api.get('/admin/appels-offres')
        const aos = aoRes.data.data ?? []
        appelOffre = aos.find((a: any) => (a.demandeId ?? a.demande_id) === demande.id) ?? null
      } catch {}
    } catch {} finally { loading = false }
  })

  async function valider() {
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/valider`)
      demande.statut = 'validee'
      toast.success($t('admin.demande_detail.validate_toast'), $t('admin.demande_detail.validate_sub'))
    } catch (err: any) { toast.error($t('toast.save_error'), err.response?.data?.message) }
    finally { acting = false }
  }

  async function rejeter() {
    if (!confirm('Confirmer le rejet ?')) return
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/rejeter`)
      demande.statut = 'refusee'
      toast.success($t('admin.demande_detail.reject_toast'), $t('admin.demande_detail.validate_sub'))
    } catch (err: any) { toast.error($t('toast.save_error'), err.response?.data?.message) }
    finally { acting = false }
  }

  async function cloturer() {
    showCloturerModal = false
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/cloturer`)
      demande.statut = 'cloturee'
      toast.success($t('admin.demande_detail.close_toast'), $t('admin.demande_detail.close_toast_sub'))
    } catch (err: any) { toast.error($t('toast.save_error'), err.response?.data?.message) }
    finally { acting = false }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }

  const workflowSteps = $derived([
    { statut: 'en_attente',        label: $t('admin.demande_detail.step_received'),  icon: 'inbox' },
    { statut: 'validee',           label: $t('timeline.validee'),                    icon: 'verified' },
    { statut: 'appel_offre_lance', label: $t('timeline.ao_lance'),                   icon: 'campaign' },
    { statut: 'offres_recues',     label: $t('timeline.offres_recues'),               icon: 'inbox' },
    { statut: 'offre_envoyee',     label: $t('admin.demande_detail.step_sent'),       icon: 'send' },
    { statut: 'acceptee',          label: $t('timeline.acceptee'),                   icon: 'check_circle' },
    { statut: 'cloturee',          label: $t('timeline.cloturee'),                   icon: 'lock' },
  ])

  const isRefusee = $derived(demande?.statut === 'refusee')
  const statutOrder = $derived(workflowSteps.map(s => s.statut))
  const currentIdx = $derived(demande ? statutOrder.indexOf(demande.statut) : 0)

  const infoItems = $derived(demande ? [
    { label: $t('demande.detail.info_type'),  value: demande.typeForage,                  icon: 'water_drop' },
    { label: $t('demande.detail.info_loc'),   value: demande.localisationAdresse,          icon: 'location_on' },
    { label: $t('demande.detail.info_depth'), value: demande.profondeurEstimee
        ? `${demande.profondeurEstimee} m`
        : (demande.inclureEtudeGeotechnique ? $t('admin.demande_detail.depth_study') : '—'), icon: 'straighten' },
    { label: $t('demande.detail.info_delay'), value: demande.delaiSouhaite
        ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-CM') : '—',               icon: 'calendar_today' },
  ] : [])
</script>

<svelte:head><title>Demande #{id} — Admin Forage</title></svelte:head>

<!-- Bannière de confirmation clôture -->
{#if showCloturerModal}
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 flex items-center gap-4">
      <span class="material-symbols-outlined icon-filled text-slate-600 shrink-0" style="font-size: 22px;">lock</span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-900 text-sm">{$t('admin.demande_detail.close_modal')}</p>
        <p class="text-xs text-slate-500 mt-0.5">{$t('admin.demande_detail.close_modal_msg')}</p>
      </div>
      <div class="flex gap-2 shrink-0">
        <button onclick={() => showCloturerModal = false}
          class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all">
          {$t('common.cancel')}
        </button>
        <button onclick={cloturer} disabled={acting}
          class="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition-all disabled:opacity-60 flex items-center gap-1.5">
          {#if acting}
            <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {/if}
          {$t('common.confirm')}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="max-w-4xl mx-auto">

  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto('/admin/demandes')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h2 class="text-xl font-bold text-slate-900">
          {demande ? `Forage ${demande.typeForage} — ${demande.localisationAdresse?.split(',')[0]}` : `Demande #${id}`}
        </h2>
        {#if demande}<Badge status={demande.statut} />{/if}
      </div>
      {#if demande}
        <p class="text-sm text-slate-500 mt-0.5">{demande.localisationAdresse}</p>
      {/if}
    </div>
    {#if demande?.statut === 'en_attente'}
      <div class="flex gap-2 shrink-0">
        <button onclick={rejeter} disabled={acting}
          class="px-4 py-2 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-60">
          {$t('admin.demande_detail.reject')}
        </button>
        <button onclick={valider} disabled={acting}
          class="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center gap-2">
          {#if acting}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{/if}
          {$t('admin.demande_detail.validate')}
        </button>
      </div>
    {:else if demande?.statut === 'acceptee'}
      <button onclick={() => showCloturerModal = true} disabled={acting}
        class="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center gap-2 shrink-0">
        <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">lock</span>
        {$t('admin.demande_detail.close_btn')}
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2,3] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if demande}

    <!-- Timeline workflow -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">{$t('admin.demande_detail.progress')}</p>

      {#if isRefusee}
        <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined icon-filled text-white" style="font-size: 14px;">cancel</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-red-700">{$t('admin.demande_detail.refused_title')}</p>
            <p class="text-xs text-red-500 mt-0.5">{$t('admin.demande_detail.refused_msg')}</p>
          </div>
        </div>
      {:else}
        <div class="flex items-start overflow-x-auto pb-2">
          {#each workflowSteps as step, i}
            {@const isActive = currentIdx === i}
            {@const isDone = currentIdx > i}
            <div class="flex-1 flex flex-col items-center min-w-[80px]">
              <div class="flex items-center w-full">
                <div class="flex-1 {i === 0 ? 'invisible' : ''} h-0.5 {isDone ? 'bg-brand-500' : 'bg-slate-200'}"></div>
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                  {isDone ? 'bg-brand-600' : isActive ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-slate-100'}">
                  <span class="material-symbols-outlined icon-filled {isDone || isActive ? 'text-white' : 'text-slate-400'}" style="font-size: 14px;">{step.icon}</span>
                </div>
                <div class="flex-1 {i === workflowSteps.length - 1 ? 'invisible' : ''} h-0.5 {isDone ? 'bg-brand-500' : 'bg-slate-200'}"></div>
              </div>
              <p class="text-xs text-center mt-2 leading-tight {isDone ? 'text-brand-600 font-semibold' : isActive ? 'text-brand-700 font-bold' : 'text-slate-400'}">
                {step.label}
              </p>
              {#if isActive}
                <span class="text-[9px] text-brand-500 font-bold uppercase tracking-wide mt-0.5">{$t('admin.demande_detail.in_progress')}</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Colonne gauche : infos demande -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Client -->
        <div class="bg-white rounded-2xl border border-slate-100 p-5">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{$t('admin.demande_detail.client')}</p>
          <div class="flex items-center gap-3">
            <UserAvatar user={demande.client} size="md" shape="rounded-full" />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-800">{demande.client?.fullName ?? '—'}</p>
              <p class="text-sm text-slate-500">{demande.client?.email}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize shrink-0">
              {demande.client?.userType ?? '—'}
            </span>
          </div>
        </div>

        <!-- Détails demande -->
        <div class="bg-white rounded-2xl border border-slate-100 p-5">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{$t('admin.demande_detail.info')}</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            {#each infoItems as info}
              <div class="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                <span class="material-symbols-outlined text-slate-400 icon-filled mt-0.5" style="font-size: 15px;">{info.icon}</span>
                <div class="min-w-0">
                  <p class="text-xs text-slate-400">{info.label}</p>
                  <p class="text-sm font-medium text-slate-800 truncate capitalize">{info.value}</p>
                </div>
              </div>
            {/each}
          </div>
          {#if demande.inclureEtudeGeotechnique}
            <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
              <span class="material-symbols-outlined text-amber-600 icon-filled shrink-0" style="font-size: 16px;">science</span>
              <p class="text-xs font-semibold text-amber-700">{$t('admin.demande_detail.study_include')}</p>
            </div>
          {/if}
          {#if demande.etudeGeophysiqueRealisee}
            <div class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3">
              <span class="material-symbols-outlined text-blue-600 icon-filled shrink-0" style="font-size: 16px;">task_alt</span>
              <p class="text-xs font-semibold text-blue-700">{$t('admin.demande_detail.study_done')}</p>
            </div>
          {/if}
          {#if demande.description}
            <div class="p-3 bg-slate-50 rounded-xl">
              <p class="text-xs text-slate-400 mb-1">{$t('demande.detail.desc')}</p>
              <p class="text-sm text-slate-700 leading-relaxed">{demande.description}</p>
            </div>
          {/if}
          {#if documents.length > 0}
            <div class="mt-3">
              <p class="text-xs text-slate-400 mb-2">{$t('demande.detail.docs')} ({documents.length})</p>
              <div class="space-y-1.5">
                {#each documents as doc}
                  <DownloadButton docId={doc.id} nomFichier={doc.nomFichier} />
                {/each}
              </div>
            </div>
          {/if}
        </div>

      </div>

      <!-- Colonne droite : budget + actions -->
      <div class="space-y-4">

        <!-- Budget confidentiel -->
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-amber-600 icon-filled" style="font-size: 18px;">lock</span>
            <p class="text-xs font-bold text-amber-700 uppercase tracking-wide">{$t('admin.demande_detail.budget_label')}</p>
          </div>
          <p class="text-2xl font-bold text-amber-800">{fmt(demande.budgetMax)}</p>
          <p class="text-xs text-amber-600 mt-1">{$t('admin.demande_detail.budget_note')}</p>
        </div>

        <!-- Prochaine action selon statut -->
        {#if demande.statut === 'validee'}
          <div class="bg-white rounded-2xl border border-blue-200 p-5">
            <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">{$t('admin.demande_detail.next_step')}</p>
            <p class="text-sm text-slate-600 mb-3">{$t('admin.demande_detail.launch_ao_hint')}</p>
            <a href="/admin/appels-offres/new?demandeId={demande.id}"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">campaign</span>
              {$t('admin.demande_detail.launch_ao_btn')}
            </a>
          </div>

        {:else if demande.statut === 'offres_recues'}
          <div class="bg-white rounded-2xl border border-emerald-200 p-5">
            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{$t('admin.demande_detail.next_step')}</p>
            <p class="text-sm text-slate-600 mb-3">{$t('admin.demande_detail.offer_selected')}</p>
            <div class="space-y-2">
              <a href="/admin/demandes/{demande.id}/offre-finale"
                class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
                <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">send</span>
                {$t('admin.demande_detail.generate_btn')}
              </a>
              {#if appelOffre}
                <a href="/admin/appels-offres/{appelOffre.id}/comparatif"
                  class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                  <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">compare_arrows</span>
                  {$t('admin.demande_detail.review_comp')}
                </a>
              {/if}
            </div>
          </div>

        {:else if demande.statut === 'offre_envoyee'}
          <div class="bg-white rounded-2xl border border-cyan-200 p-5">
            <p class="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-2">{$t('admin.demande_detail.awaiting_client')}</p>
            <p class="text-sm text-slate-600">{$t('admin.demande_detail.awaiting_msg')}</p>
          </div>

        {:else if demande.statut === 'acceptee'}
          <div class="bg-white rounded-2xl border border-emerald-200 p-5">
            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{$t('admin.demande_detail.accepted_title')}</p>
            <p class="text-sm text-slate-600 mb-3">{$t('admin.demande_detail.accepted_msg')}</p>
            <button onclick={() => showCloturerModal = true} disabled={acting}
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">lock</span>
              {$t('admin.demande_detail.close_btn')}
            </button>
          </div>

        {:else if demande.statut === 'refusee' || demande.statut === 'cloturee'}
          <div class="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center">
            <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size: 32px;">lock</span>
            <p class="text-sm font-semibold text-slate-600 mt-2">{$t('admin.demande_detail.closed_title')}</p>
            <p class="text-xs text-slate-400 mt-1">{$t('admin.demande_detail.closed_note')}</p>
          </div>
        {/if}

      </div>
    </div>
  {/if}
</div>
