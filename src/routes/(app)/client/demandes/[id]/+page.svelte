<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import FormPage from '$lib/components/layout/FormPage.svelte'

  let demande = $state<any>(null)
  let offreFinale = $state<any>(null)
  let documents = $state<any[]>([])
  let loading = $state(true)
  let deciding = $state(false)

  const id = $derived($page.params.id)

  const timelineSteps = [
    { key: 'en_attente',        label: 'Soumise',          icon: 'send' },
    { key: 'validee',           label: 'Validée',           icon: 'verified' },
    { key: 'appel_offre_lance', label: 'AO lancé',          icon: 'campaign' },
    { key: 'offres_recues',     label: 'Offres reçues',     icon: 'inbox' },
    { key: 'offre_envoyee',     label: 'Offre reçue',       icon: 'mark_email_read' },
    { key: 'acceptee',          label: 'Acceptée',          icon: 'check_circle' },
  ]
  const timelineOrder = ['en_attente','validee','appel_offre_lance','offres_recues','offre_envoyee','acceptee','refusee','cloturee']
  const currentIdx = $derived(demande ? timelineOrder.indexOf(demande.statut) : 0)

  onMount(async () => {
    try {
      const res = await api.get(`/demandes/${id}`)
      demande = res.data
      documents = res.data.documents ?? []
      if (['offre_envoyee','acceptee','refusee'].includes(demande.statut)) {
        try {
          const ofRes = await api.get(`/demandes/${id}/offre-finale`)
          offreFinale = ofRes.data
        } catch {}
      }
    } catch {} finally { loading = false }
  })

  async function handleDecision(decision: 'acceptee' | 'refusee') {
    deciding = true
    try {
      await api.patch(`/demandes/${id}/decision`, { decision })
      demande.statut = decision
      if (offreFinale) offreFinale.statut = decision
      toast.success(
        decision === 'acceptee' ? 'Offre acceptée !' : 'Offre refusée',
        decision === 'acceptee' ? 'Les parties vont être mises en contact.' : 'Votre décision a été enregistrée.'
      )
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { deciding = false }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Demande #{id} — ForageCI</title></svelte:head>

<FormPage maxWidth="max-w-3xl">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto('/client/demandes')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h2 class="text-xl font-bold text-slate-900">Demande #{id}</h2>
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
      <div class="flex items-start">
        {#each timelineSteps as step, i}
          <div class="flex-1 flex flex-col items-center">
            <div class="flex items-center w-full">
              <div class="flex-1 {i === 0 ? 'invisible' : ''} h-0.5 {currentIdx > timelineOrder.indexOf(step.key) - 1 ? 'bg-blue-500' : 'bg-slate-200'}"></div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                {currentIdx >= timelineOrder.indexOf(step.key) ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-slate-100'}
                {currentIdx === timelineOrder.indexOf(step.key) ? 'ring-4 ring-blue-100' : ''}">
                <span class="material-symbols-outlined icon-filled {currentIdx >= timelineOrder.indexOf(step.key) ? 'text-white' : 'text-slate-400'}" style="font-size: 15px;">{step.icon}</span>
              </div>
              <div class="flex-1 {i === timelineSteps.length - 1 ? 'invisible' : ''} h-0.5 {currentIdx > timelineOrder.indexOf(step.key) ? 'bg-blue-500' : 'bg-slate-200'}"></div>
            </div>
            <p class="text-xs text-center mt-2 w-16 leading-tight {currentIdx >= timelineOrder.indexOf(step.key) ? 'text-blue-600 font-semibold' : 'text-slate-400'}">
              {step.label}
            </p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Informations de la demande -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Informations</p>
      <div class="grid grid-cols-2 gap-3">
        {#each [
          { label: 'Type de forage', value: demande.typeForage, icon: 'water_drop' },
          { label: 'Localisation', value: demande.localisationAdresse, icon: 'location_on' },
          { label: 'Profondeur estimée', value: demande.profondeurEstimee ? `${demande.profondeurEstimee} m` : '—', icon: 'straighten' },
          { label: 'Délai souhaité', value: demande.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-CI') : '—', icon: 'calendar_today' },
          { label: 'Date de soumission', value: new Date(demande.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' }), icon: 'schedule' },
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

    <!-- Offre finale -->
    {#if offreFinale}
      <div class="bg-white rounded-2xl border-2 {demande.statut === 'offre_envoyee' ? 'border-blue-300' : 'border-slate-100'} p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Offre finale reçue</p>
          <Badge status={offreFinale.statut} />
        </div>

        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="p-4 rounded-xl bg-blue-50 text-center">
            <p class="text-xs text-slate-500 mb-1">Prix final</p>
            <p class="text-xl font-bold text-blue-700">{fmt(offreFinale.prixFinalClient)}</p>
            <p class="text-xs text-slate-400">FCFA</p>
          </div>
          <div class="p-4 rounded-xl bg-emerald-50 text-center">
            <p class="text-xs text-slate-500 mb-1">Délai</p>
            <p class="text-xl font-bold text-emerald-700">{offreFinale.delaiExecution}</p>
            <p class="text-xs text-slate-400">jours</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 text-center">
            <p class="text-xs text-slate-500 mb-1">Reçue le</p>
            <p class="text-sm font-semibold text-slate-700">
              {new Date(offreFinale.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {#if offreFinale.resumePrestation}
          <div class="p-4 bg-slate-50 rounded-xl mb-4">
            <p class="text-xs text-slate-500 mb-1.5 font-medium">Résumé de la prestation</p>
            <p class="text-sm text-slate-700 leading-relaxed">{offreFinale.resumePrestation}</p>
          </div>
        {/if}

        {#if demande.statut === 'offre_envoyee'}
          <div class="flex gap-3">
            <button onclick={() => handleDecision('refusee')} disabled={deciding}
              class="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">cancel</span>
              Refuser
            </button>
            <button onclick={() => handleDecision('acceptee')} disabled={deciding}
              class="flex-1 py-3 rounded-xl gradient-blue text-white font-semibold text-sm shadow-md hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {#if deciding}
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}
                <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">check_circle</span>
              {/if}
              Accepter l'offre
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Documents -->
    {#if documents.length > 0}
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Documents joints ({documents.length})
        </p>
        <div class="space-y-2">
          {#each documents as doc}
            <a href="http://localhost:3333/api/v1/documents/{doc.id}/download" target="_blank"
              class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-all group">
              <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-500 icon-filled" style="font-size: 20px;">description</span>
              <span class="flex-1 text-sm text-slate-700 truncate">{doc.nomFichier}</span>
              <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-500 transition-colors" style="font-size: 18px;">download</span>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</FormPage>
