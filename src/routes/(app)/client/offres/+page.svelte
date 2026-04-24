<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  let offres = $state<any[]>([])
  let loading = $state(true)
  let deciding = $state<number | null>(null)

  onMount(async () => {
    try {
      const res = await api.get('/demandes/offres-finales')
      offres = res.data ?? []
    } catch {} finally { loading = false }
  })

  async function handleDecision(demandeId: number, decision: 'acceptee' | 'refusee') {
    deciding = demandeId
    try {
      await api.patch(`/demandes/${demandeId}/decision`, { decision })
      offres = offres.map(o =>
        (o.demande_id ?? o.demandeId) === demandeId
          ? { ...o, statut: decision, demande: { ...o.demande, statut: decision } }
          : o
      )
      toast.success(
        decision === 'acceptee' ? 'Offre acceptée' : 'Offre refusée',
        decision === 'acceptee' ? 'Les parties vont être mises en contact.' : 'Votre décision a été enregistrée.'
      )
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { deciding = null }
  }

  function fmt(n: any) { return Number(n).toLocaleString('fr-CI') }
  function getStatut(o: any) { return o.demande?.statut ?? o.statut ?? 'envoyee' }
</script>

<svelte:head><title>Mes offres — ForageCI</title></svelte:head>

<div class="mb-5 flex items-center justify-between">
  <div>
    <h2 class="text-xl font-bold text-slate-900">Mes offres reçues</h2>
    <p class="text-sm text-slate-500 mt-0.5">Offres finales préparées par l'administrateur</p>
  </div>
  {#if offres.length > 0}
    <span class="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">{offres.length} offre{offres.length > 1 ? 's' : ''}</span>
  {/if}
</div>

{#if loading}
  <div class="space-y-2">{#each [1,2,3] as _}<div class="skeleton h-20 rounded-xl"></div>{/each}</div>

{:else if offres.length === 0}
  <div class="bg-white rounded-2xl border border-slate-100 py-14 text-center px-6">
    <span class="material-symbols-outlined text-slate-300 icon-filled" style="font-size: 40px;">description</span>
    <p class="text-slate-600 font-medium text-sm mt-3">Aucune offre reçue pour le moment</p>
    <p class="text-slate-400 text-xs mt-1 mb-4">Les offres de l'administrateur apparaîtront ici</p>
    <button onclick={() => goto('/client/demandes')}
      class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
      Voir mes demandes
    </button>
  </div>

{:else}
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    {#each offres as o, i}
      {@const statut = getStatut(o)}
      {@const demandeId = o.demande_id ?? o.demandeId}
      {@const prix = o.prix_final_client ?? o.prixFinalClient}
      {@const delai = o.delai_execution ?? o.delaiExecution}
      {@const resume = o.resume_prestation ?? o.resumePrestation}
      {@const typeForage = o.demande?.type_forage ?? o.demande?.typeForage}
      {@const localisation = (o.demande?.localisation_adresse ?? o.demande?.localisationAdresse)?.split(',')[0]}

      <div class="{i > 0 ? 'border-t border-slate-100' : ''} px-5 py-4 {statut === 'offre_envoyee' ? 'bg-blue-50/40' : ''}">

        <!-- Ligne principale -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-blue-600 icon-filled" style="font-size: 18px;">water_drop</span>
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-slate-800 text-sm truncate">
                {typeForage ? `Forage ${typeForage}` : `Demande #${demandeId}`}{localisation ? ` — ${localisation}` : ''}
              </p>
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                <span class="text-xs font-semibold text-blue-700">{fmt(prix)} FCFA</span>
                <span class="text-xs text-slate-400">·</span>
                <span class="text-xs text-slate-500">{delai} jours</span>
                <span class="text-xs text-slate-400">·</span>
                <span class="text-xs text-slate-400">{new Date(o.created_at ?? o.createdAt).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>

          <!-- Statut + actions -->
          <div class="flex items-center gap-2 shrink-0">
            {#if statut === 'offre_envoyee'}
              <button onclick={() => handleDecision(demandeId, 'refusee')} disabled={deciding === demandeId}
                class="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50">
                Refuser
              </button>
              <button onclick={() => handleDecision(demandeId, 'acceptee')} disabled={deciding === demandeId}
                class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1">
                {#if deciding === demandeId}
                  <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size: 13px;">check</span>
                {/if}
                Accepter
              </button>
            {:else}
              <Badge status={statut} />
            {/if}
          </div>
        </div>

        <!-- Résumé (si présent, compact) -->
        {#if resume}
          <p class="text-xs text-slate-500 mt-2.5 ml-12 leading-relaxed line-clamp-2">{resume}</p>
        {/if}

        <!-- Lien discret -->
        <div class="mt-2 ml-12">
          <a href="/client/demandes/{demandeId}" class="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-0.5 w-fit">
            Voir la demande <span class="material-symbols-outlined" style="font-size: 13px;">chevron_right</span>
          </a>
        </div>

      </div>
    {/each}
  </div>
{/if}
