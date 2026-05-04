<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import FormPage from '$lib/components/layout/FormPage.svelte'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'

  let demande = $state<any>(null)
  let offreFinale = $state<any>(null)
  let documents = $state<any[]>([])
  let loading = $state(true)
  let deciding = $state(false)

  const id = $derived($page.params.id)

  // Timeline — inclut refusee et cloturee comme états terminaux
  const timelineSteps = [
    { key: 'en_attente',        label: 'Soumise',               icon: 'send' },
    { key: 'validee',           label: 'Validée',               icon: 'verified' },
    { key: 'appel_offre_lance', label: "Appel d'offre lancé",   icon: 'campaign' },
    { key: 'offres_recues',     label: 'Offres reçues',         icon: 'inbox' },
    { key: 'offre_envoyee',     label: 'Offre reçue',           icon: 'mark_email_read' },
    { key: 'acceptee',          label: 'Acceptée',              icon: 'check_circle' },
    { key: 'cloturee',          label: 'Clôturée',              icon: 'lock' },
  ]

  const isRefusee = $derived(demande?.statut === 'refusee')

  // Pour refusee, on affiche la timeline jusqu'à offre_envoyee (idx 4)
  const timelineOrder = timelineSteps.map(s => s.key)
  const currentIdx = $derived(() => {
    if (!demande) return 0
    if (demande.statut === 'refusee') return 4 // s'arrête à "Offre reçue"
    return timelineOrder.indexOf(demande.statut)
  })

  onMount(async () => {
    try {
      const res = await api.get(`/demandes/${id}`)
      demande = res.data
      documents = res.data.documents ?? []
      if (['offre_envoyee', 'acceptee', 'refusee', 'cloturee'].includes(demande.statut)) {
        try {
          const ofRes = await api.get(`/demandes/${id}/offre-finale`)
          offreFinale = ofRes.data?.data ?? ofRes.data
        } catch {}
      }
    } catch {} finally { loading = false }
  })

  async function handleDecision(decision: 'acceptee' | 'refusee') {
    deciding = true
    try {
      await api.patch(`/demandes/${id}/decision`, { decision })
      demande.statut = decision === 'refusee' ? 'cloturee' : decision
      if (offreFinale) offreFinale.statut = decision
      toast.success(
        decision === 'acceptee' ? 'Offre acceptée !' : 'Offre refusée',
        decision === 'acceptee'
          ? 'Les parties vont être mises en contact.'
          : 'Votre décision a été enregistrée. Le dossier est clôturé.'
      )
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { deciding = false }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }
</script>

<svelte:head><title>Demande #{id} — Forage</title></svelte:head>

<FormPage maxWidth="max-w-3xl">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto('/client/demandes')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h2 class="text-xl font-bold" style="color: #0f1f5c">
          {demande ? `Forage ${demande.typeForage}` : `Demande #${id}`}
        </h2>
        {#if demande}<Badge status={demande.statut} />{/if}
      </div>
      {#if demande}
        <p class="text-sm text-slate-500 mt-0.5">{demande.localisationAdresse}</p>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2,3] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if demande}

    <!-- Timeline -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Suivi en temps réel</p>

      {#if isRefusee}
        <!-- Cas refus : bandeau explicite -->
        <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 mb-3">
          <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined icon-filled text-white" style="font-size: 16px;">cancel</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-red-700">Vous avez refusé l'offre</p>
            <p class="text-xs text-red-500 mt-0.5">Le dossier a été clôturé automatiquement.</p>
          </div>
        </div>
      {/if}

      <div class="flex items-start overflow-x-auto pb-1">
        {#each timelineSteps as step, i}
          {@const stepIdx = timelineOrder.indexOf(step.key)}
          {@const done = currentIdx() > stepIdx}
          {@const active = currentIdx() === stepIdx}
          {@const isTerminalRefus = isRefusee && step.key === 'offre_envoyee'}
          <div class="flex-1 flex flex-col items-center min-w-[72px]">
            <div class="flex items-center w-full">
              <div class="flex-1 {i === 0 ? 'invisible' : ''} h-0.5 {done ? 'bg-brand-500' : 'bg-slate-200'}"></div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                {isTerminalRefus ? 'bg-red-500 ring-4 ring-red-100' : done ? 'bg-brand-600' : active ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-slate-100'}">
                <span class="material-symbols-outlined icon-filled {done || active || isTerminalRefus ? 'text-white' : 'text-slate-400'}" style="font-size: 14px;">
                  {isTerminalRefus ? 'cancel' : step.icon}
                </span>
              </div>
              <div class="flex-1 {i === timelineSteps.length - 1 ? 'invisible' : ''} h-0.5 {done && !isRefusee ? 'bg-brand-500' : 'bg-slate-200'}"></div>
            </div>
            <p class="text-xs text-center mt-2 w-16 leading-tight
              {isTerminalRefus ? 'text-red-600 font-bold' : done ? 'text-brand-600 font-semibold' : active ? 'text-brand-700 font-bold' : 'text-slate-400'}">
              {isTerminalRefus ? 'Refusée' : step.label}
            </p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Offre finale — si disponible -->
    {#if offreFinale && ['offre_envoyee', 'acceptee', 'refusee', 'cloturee'].includes(demande.statut)}
      <div class="bg-white rounded-2xl border {demande.statut === 'acceptee' ? 'border-emerald-200' : demande.statut === 'cloturee' && offreFinale.statut === 'refusee' ? 'border-red-200' : 'border-brand-200'} p-5 mb-4">
        <p class="text-xs font-semibold uppercase tracking-wide mb-3
          {demande.statut === 'acceptee' ? 'text-emerald-600' : demande.statut === 'cloturee' && offreFinale.statut === 'refusee' ? 'text-red-600' : 'text-brand-600'}">
          {demande.statut === 'acceptee' ? '✓ Offre acceptée' : demande.statut === 'cloturee' && offreFinale.statut === 'refusee' ? '✗ Offre refusée' : 'Offre reçue — Action requise'}
        </p>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="p-3 bg-slate-50 rounded-xl">
            <p class="text-xs text-slate-400">Prix total</p>
            <p class="text-lg font-bold text-slate-900 mt-0.5">{fmt(offreFinale.prixFinalClient ?? offreFinale.prix_final_client)} FCFA</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl">
            <p class="text-xs text-slate-400">Délai d'exécution</p>
            <p class="text-lg font-bold text-slate-900 mt-0.5">{offreFinale.delaiExecution ?? offreFinale.delai_execution} jours</p>
          </div>
        </div>

        {#if offreFinale.resumePrestation ?? offreFinale.resume_prestation}
          <div class="p-3 bg-slate-50 rounded-xl mb-4">
            <p class="text-xs text-slate-400 mb-1">Résumé de la prestation</p>
            <p class="text-sm text-slate-700 leading-relaxed">{offreFinale.resumePrestation ?? offreFinale.resume_prestation}</p>
          </div>
        {/if}

        <!-- Boutons décision — seulement si offre_envoyee -->
        {#if demande.statut === 'offre_envoyee'}
          <div class="flex gap-3">
            <button onclick={() => handleDecision('refusee')} disabled={deciding}
              class="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-60">
              {#if deciding}
                <span class="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin inline-block mr-2"></span>
              {/if}
              Refuser
            </button>
            <button onclick={() => handleDecision('acceptee')} disabled={deciding}
              class="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.3)">
              {#if deciding}
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}
                <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">check_circle</span>
              {/if}
              Accepter l'offre
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Informations de la demande -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Informations</p>
      <div class="grid grid-cols-2 gap-3">
        {#each [
          { label: 'Type de forage', value: demande.typeForage, icon: 'water_drop' },
          { label: 'Localisation', value: demande.localisationAdresse, icon: 'location_on' },
          { label: 'Profondeur estimée', value: demande.profondeurEstimee ? `${demande.profondeurEstimee} m` : '—', icon: 'straighten' },
          { label: 'Délai souhaité', value: demande.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-CM') : '—', icon: 'calendar_today' },
          { label: 'Date de soumission', value: new Date(demande.createdAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' }), icon: 'schedule' },
          { label: 'Budget maximum', value: `${fmt(demande.budgetMax)} FCFA`, icon: 'payments' },
        ] as info}
          <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
            <span class="material-symbols-outlined text-slate-400 icon-filled mt-0.5" style="font-size: 16px;">{info.icon}</span>
            <div class="min-w-0">
              <p class="text-xs text-slate-500">{info.label}</p>
              <p class="text-sm font-medium text-slate-800 mt-0.5 truncate">{info.value}</p>
            </div>
          </div>
        {/each}
      </div>
      {#if demande.description}
        <div class="mt-3 p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-500 mb-1">Description</p>
          <p class="text-sm text-slate-700 leading-relaxed">{demande.description}</p>
        </div>
      {/if}
    </div>

    <!-- Documents -->
    {#if documents.length > 0}
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Documents joints ({documents.length})
        </p>
        <div class="space-y-2">
          {#each documents as doc}
            <DownloadButton docId={doc.id} nomFichier={doc.nomFichier} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</FormPage>
