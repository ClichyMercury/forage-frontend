<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  let demande = $state<any>(null)
  let loading = $state(true)
  let acting = $state(false)
  const id = $derived($page.params.id)

  onMount(async () => {
    try {
      const res = await api.get(`/admin/demandes/${id}`)
      demande = res.data
    } catch {} finally { loading = false }
  })

  async function valider() {
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/valider`)
      demande.statut = 'validee'
      toast.success('Demande validée', 'Le client a été notifié par email.')
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { acting = false }
  }

  async function rejeter() {
    if (!confirm('Confirmer le rejet de cette demande ?')) return
    acting = true
    try {
      await api.patch(`/admin/demandes/${id}/rejeter`)
      demande.statut = 'refusee'
      toast.success('Demande rejetée', 'Le client a été notifié.')
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { acting = false }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
</script>

<svelte:head><title>Demande #{id} — Admin</title></svelte:head>

<div class="max-w-3xl mx-auto">

  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto('/admin/demandes')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h2 class="text-xl font-bold text-slate-900">Demande #{id}</h2>
        {#if demande}<Badge status={demande.statut} />{/if}
      </div>
    </div>
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
    {/if}
  </div>

  {#if loading}
    <div class="space-y-4">{#each [1,2,3] as _}<div class="skeleton h-36 rounded-2xl"></div>{/each}</div>
  {:else if demande}

    <!-- Bloc client -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Client</p>
      <div class="flex items-center gap-4">
        <div class="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0">
          {(demande.client?.fullName ?? demande.client?.email ?? '?').charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800">{demande.client?.fullName ?? '—'}</p>
          <p class="text-sm text-slate-500">{demande.client?.email}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-xs text-slate-400">Type de compte</p>
          <p class="text-sm font-medium text-slate-700 capitalize">{demande.client?.userType ?? '—'}</p>
        </div>
      </div>
    </div>

    <!-- Bloc détails -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Détails de la demande</p>

      <div class="grid grid-cols-2 gap-3 mb-4">
        {#each [
          { label: 'Type de forage', value: demande.typeForage, icon: 'water_drop' },
          { label: 'Localisation', value: demande.localisationAdresse, icon: 'location_on' },
          { label: 'Profondeur estimée', value: demande.profondeurEstimee ? `${demande.profondeurEstimee} m` : '—', icon: 'straighten' },
          { label: 'Délai souhaité', value: demande.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-CI') : '—', icon: 'calendar_today' },
          { label: 'Date de soumission', value: new Date(demande.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' }), icon: 'schedule' },
          { label: 'Statut actuel', value: demande.statut.replace(/_/g, ' '), icon: 'info' },
        ] as info}
          <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
            <span class="material-symbols-outlined text-slate-400 icon-filled mt-0.5" style="font-size: 16px;">{info.icon}</span>
            <div class="min-w-0">
              <p class="text-xs text-slate-500">{info.label}</p>
              <p class="text-sm font-medium text-slate-800 mt-0.5 capitalize truncate">{info.value}</p>
            </div>
          </div>
        {/each}
      </div>

      <!-- Budget confidentiel -->
      <div class="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-amber-600 icon-filled" style="font-size: 18px;">lock</span>
          <div>
            <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide">Budget confidentiel</p>
            <p class="text-xs text-amber-600">Visible uniquement par l'administrateur</p>
          </div>
        </div>
        <p class="text-2xl font-bold text-amber-800">{fmt(demande.budgetMax)} <span class="text-sm font-normal">FCFA</span></p>
      </div>

      {#if demande.description}
        <div class="mt-3 p-4 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-500 mb-1.5 font-medium">Description du projet</p>
          <p class="text-sm text-slate-700 leading-relaxed">{demande.description}</p>
        </div>
      {/if}
    </div>

    <!-- Prochaine étape selon statut -->
    {#if demande.statut === 'validee'}
      <div class="bg-white rounded-2xl border border-blue-200 p-5">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-blue-600 icon-filled" style="font-size: 18px;">campaign</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-slate-800 text-sm">Prochaine étape</p>
            <p class="text-sm text-slate-500 mt-0.5 mb-3">La demande est validée. Lancez un appel d'offre vers les entreprises prestataires.</p>
            <a href="/admin/appels-offres/new?demandeId={demande.id}"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
              <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">campaign</span>
              Lancer un appel d'offre
            </a>
          </div>
        </div>
      </div>
    {:else if demande.statut === 'offres_recues'}
      <div class="bg-white rounded-2xl border border-emerald-200 p-5">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size: 18px;">compare_arrows</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-slate-800 text-sm">Des offres ont été reçues</p>
            <p class="text-sm text-slate-500 mt-0.5 mb-3">Comparez les offres et sélectionnez la meilleure.</p>
            <a href="/admin/appels-offres/{demande.id}/comparatif"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all">
              <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">compare_arrows</span>
              Voir le comparatif
            </a>
          </div>
        </div>
      </div>
    {:else if demande.statut === 'en_attente'}
      <div class="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p class="text-sm text-slate-500 flex items-center gap-2">
          <span class="material-symbols-outlined text-slate-400" style="font-size: 18px;">hourglass_empty</span>
          En attente de validation. Utilisez les boutons ci-dessus pour valider ou rejeter.
        </p>
      </div>
    {/if}

  {/if}
</div>
