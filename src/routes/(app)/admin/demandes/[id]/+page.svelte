<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte'

  let demande = $state<any>(null)
  let documents = $state<any[]>([])
  let appelOffre = $state<any>(null)
  let loading = $state(true)
  let acting = $state(false)
  const id = $derived($page.params.id)

  onMount(async () => {
    try {
      const res = await api.get(`/admin/demandes/${id}`)
      demande = res.data
      documents = res.data.documents ?? []
      // Charger l'AO lié si existe
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
      toast.success('Demande validée', 'Le client a été notifié.')
    } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
    finally { acting = false }
  }

  async function rejeter() {
    if (!confirm('Confirmer le rejet ?')) return
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/rejeter`)
      demande.statut = 'refusee'
      toast.success('Demande rejetée', 'Le client a été notifié.')
    } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
    finally { acting = false }
  }

  async function cloturer() {
    if (!confirm('Clôturer définitivement ce dossier ? Le chantier est terminé.')) return
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/cloturer`)
      demande.statut = 'cloturee'
      toast.success('Dossier clôturé', 'La demande est archivée.')
    } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
    finally { acting = false }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }

  // Étapes du workflow pour guider l'admin
  const workflowSteps = [
    { statut: 'en_attente',        label: 'Reçue',           icon: 'inbox' },
    { statut: 'validee',           label: 'Validée',          icon: 'verified' },
    { statut: 'appel_offre_lance', label: 'AO lancé',         icon: 'campaign' },
    { statut: 'offres_recues',     label: 'Offres reçues',    icon: 'inbox' },
    { statut: 'offre_envoyee',     label: 'Offre envoyée',    icon: 'send' },
    { statut: 'acceptee',          label: 'Acceptée',         icon: 'check_circle' },
    { statut: 'cloturee',          label: 'Clôturée',         icon: 'lock' },
  ]
  const statutOrder = workflowSteps.map(s => s.statut)
  const currentIdx = $derived(demande ? statutOrder.indexOf(demande.statut) : 0)
</script>

<svelte:head><title>Demande #{id} — Admin</title></svelte:head>

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
    <!-- Actions selon statut -->
    {#if demande?.statut === 'en_attente'}
      <div class="flex gap-2 shrink-0">
        <button onclick={rejeter} disabled={acting}
          class="px-4 py-2 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-60">
          Rejeter
        </button>
        <button onclick={valider} disabled={acting}
          class="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center gap-2">
          {#if acting}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{/if}
          Valider
        </button>
      </div>
    {:else if demande?.statut === 'acceptee'}
      <button onclick={cloturer} disabled={acting}
        class="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center gap-2 shrink-0">
        {#if acting}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{/if}
        <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">lock</span>
        Clôturer le dossier
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2,3] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}</div>
  {:else if demande}

    <!-- Timeline workflow -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Progression du dossier</p>
      <div class="flex items-start overflow-x-auto pb-2">
        {#each workflowSteps as step, i}
          <div class="flex-1 flex flex-col items-center min-w-[80px]">
            <div class="flex items-center w-full">
              <div class="flex-1 {i === 0 ? 'invisible' : ''} h-0.5 {currentIdx >= i ? 'bg-blue-500' : 'bg-slate-200'}"></div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                {currentIdx >= i ? 'bg-blue-600' : 'bg-slate-100'}
                {currentIdx === i ? 'ring-4 ring-blue-100' : ''}">
                <span class="material-symbols-outlined icon-filled {currentIdx >= i ? 'text-white' : 'text-slate-400'}" style="font-size: 14px;">{step.icon}</span>
              </div>
              <div class="flex-1 {i === workflowSteps.length - 1 ? 'invisible' : ''} h-0.5 {currentIdx > i ? 'bg-blue-500' : 'bg-slate-200'}"></div>
            </div>
            <p class="text-xs text-center mt-2 leading-tight {currentIdx >= i ? 'text-blue-600 font-semibold' : 'text-slate-400'}">
              {step.label}
            </p>
          </div>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Colonne gauche : infos demande -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Client -->
        <div class="bg-white rounded-2xl border border-slate-100 p-5">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Client</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {(demande.client?.fullName ?? demande.client?.email ?? '?').charAt(0).toUpperCase()}
            </div>
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
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Détails de la demande</p>
          <div class="grid grid-cols-2 gap-3 mb-3">
            {#each [
              { label: 'Type de forage', value: demande.typeForage, icon: 'water_drop' },
              { label: 'Localisation', value: demande.localisationAdresse, icon: 'location_on' },
              { label: 'Profondeur estimée', value: demande.profondeurEstimee ? `${demande.profondeurEstimee} m` : '—', icon: 'straighten' },
              { label: 'Délai souhaité', value: demande.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-CI') : '—', icon: 'calendar_today' },
            ] as info}
              <div class="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                <span class="material-symbols-outlined text-slate-400 icon-filled mt-0.5" style="font-size: 15px;">{info.icon}</span>
                <div class="min-w-0">
                  <p class="text-xs text-slate-400">{info.label}</p>
                  <p class="text-sm font-medium text-slate-800 truncate capitalize">{info.value}</p>
                </div>
              </div>
            {/each}
          </div>
          {#if demande.description}
            <div class="p-3 bg-slate-50 rounded-xl">
              <p class="text-xs text-slate-400 mb-1">Description</p>
              <p class="text-sm text-slate-700 leading-relaxed">{demande.description}</p>
            </div>
          {/if}
          {#if documents.length > 0}
            <div class="mt-3">
              <p class="text-xs text-slate-400 mb-2">Documents joints ({documents.length})</p>
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
            <p class="text-xs font-bold text-amber-700 uppercase tracking-wide">Budget confidentiel</p>
          </div>
          <p class="text-2xl font-bold text-amber-800">{fmt(demande.budgetMax)}</p>
          <p class="text-xs text-amber-600 mt-1">FCFA — non communiqué aux entreprises</p>
        </div>

        <!-- Prochaine action selon statut -->
        {#if demande.statut === 'validee'}
          <div class="bg-white rounded-2xl border border-blue-200 p-5">
            <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Prochaine étape</p>
            <p class="text-sm text-slate-600 mb-3">Lancez un appel d'offre vers les entreprises prestataires.</p>
            <a href="/admin/appels-offres/new?demandeId={demande.id}"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">campaign</span>
              Lancer un appel d'offre
            </a>
          </div>

        {:else if demande.statut === 'appel_offre_lance'}
          <div class="bg-white rounded-2xl border border-indigo-200 p-5">
            <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">En attente</p>
            <p class="text-sm text-slate-600 mb-3">Les entreprises soumettent leurs offres. Revenez une fois le délai écoulé.</p>
            {#if appelOffre}
              <a href="/admin/appels-offres/{appelOffre.id}/comparatif"
                class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all">
                <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">compare_arrows</span>
                Voir le comparatif
              </a>
            {/if}
          </div>

        {:else if demande.statut === 'offres_recues'}
          <div class="bg-white rounded-2xl border border-emerald-200 p-5">
            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Prochaine étape</p>
            <p class="text-sm text-slate-600 mb-3">
              Une offre a été retenue. Générez maintenant le récapitulatif et envoyez-le au client.
            </p>
            <div class="space-y-2">
              <a href="/admin/demandes/{demande.id}/offre-finale"
                class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
                <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">send</span>
                Générer et envoyer l'offre finale au client
              </a>
              {#if appelOffre}
                <a href="/admin/appels-offres/{appelOffre.id}/comparatif"
                  class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                  <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">compare_arrows</span>
                  Revoir le comparatif
                </a>
              {/if}
            </div>
          </div>

        {:else if demande.statut === 'offre_envoyee'}
          <div class="bg-white rounded-2xl border border-cyan-200 p-5">
            <p class="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-2">En attente du client</p>
            <p class="text-sm text-slate-600">L'offre finale a été envoyée au client. En attente de sa décision.</p>
          </div>

        {:else if demande.statut === 'acceptee'}
          <div class="bg-white rounded-2xl border border-emerald-200 p-5">
            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Offre acceptée ✓</p>
            <p class="text-sm text-slate-600 mb-3">Le client a accepté l'offre. Une fois le chantier terminé, clôturez le dossier.</p>
            <button onclick={cloturer} disabled={acting}
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">lock</span>
              Clôturer le dossier
            </button>
          </div>

        {:else if demande.statut === 'cloturee'}
          <div class="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center">
            <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size: 32px;">lock</span>
            <p class="text-sm font-semibold text-slate-600 mt-2">Dossier clôturé</p>
            <p class="text-xs text-slate-400 mt-1">Ce dossier est archivé.</p>
          </div>

        {:else if demande.statut === 'en_attente'}
          <!-- <div class="bg-white rounded-2xl border border-amber-200 p-5">
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Action requise</p>
            <p class="text-sm text-slate-600">Validez ou rejetez cette demande en utilisant les boutons en haut.</p>
          </div> -->
        {/if}

        <!-- Lien vers l'AO si existe -->
        {#if appelOffre && !['en_attente','validee','refusee'].includes(demande.statut)}
          <div class="bg-white rounded-2xl border border-slate-100 p-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Appel d'offre lié</p>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-800">AO #{appelOffre.id}</p>
                <p class="text-xs text-slate-400">{appelOffre.entreprises?.length ?? 0} entreprise(s) invitée(s)</p>
              </div>
              <a href="/admin/appels-offres/{appelOffre.id}/comparatif"
                class="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-all border border-blue-200">
                Comparatif
              </a>
            </div>
          </div>
        {/if}

      </div>
    </div>
  {/if}
</div>
