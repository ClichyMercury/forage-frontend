<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import Badge from '$lib/components/ui/Badge.svelte'
  import UserAvatar from '$lib/components/ui/UserAvatar.svelte'

  let toutesOffres = $state<any[]>([])
  let loading = $state(true)
  let filtreStatut = $state('')

  // Filtrage local — pas de rechargement API à chaque clic
  const offres = $derived(
    filtreStatut
      ? toutesOffres.filter(o => o.statut === filtreStatut)
      : toutesOffres
  )

  async function load() {
    loading = true
    try {
      const res = await api.get('/admin/appels-offres')
      const appelsOffres = res.data.data ?? []

      const allOffres: any[] = []
      await Promise.all(
        appelsOffres.map(async (ao: any) => {
          try {
            const comp = await api.get(`/admin/appels-offres/${ao.id}/comparatif`)
            const comparatif = comp.data.comparatif ?? []
            comparatif.forEach((offre: any) => {
              allOffres.push({
                ...offre,
                appel_offre_id: ao.id,
                demande_id: comp.data.demande_id,
                demande_adresse: ao.demande?.localisation_adresse ?? ao.demande?.localisationAdresse ?? '—',
                demande_type: ao.demande?.type_forage ?? ao.demande?.typeForage ?? '—',
              })
            })
          } catch {}
        })
      )

      toutesOffres = allOffres
    } catch {} finally { loading = false }
  }

  onMount(load)

  function fmt(n: any) { return Number(n).toLocaleString('fr-CM') }
</script>

<svelte:head><title>Gestion des offres — Admin</title></svelte:head>

<div class="mb-5">
  <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
    Offres des <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #1e3fff">entreprises</span>.
  </h2>
  <p class="text-sm text-slate-500 mt-1">Toutes les offres soumises sur les appels d'offres.</p>
</div>

<!-- Filtres -->
<div class="flex gap-2 mb-5 flex-wrap">
  {#each [
    { value: '', label: 'Toutes' },
    { value: 'soumise', label: 'Soumises' },
    { value: 'retenue', label: 'Retenues' },
    { value: 'non_retenue', label: 'Non retenues' },
  ] as f}
    <button onclick={() => filtreStatut = f.value}
      class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border
        {filtreStatut === f.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
      {f.label}
    </button>
  {/each}
</div>

<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3,4] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if offres.length === 0}
    <div class="py-14 text-center px-6">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">description</span>
      </div>
      <p class="text-slate-600 font-medium text-sm">Aucune offre trouvée</p>
    </div>
  {:else}
    <!-- En-têtes desktop -->
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-3">Entreprise</div>
      <div class="col-span-3">Demande</div>
      <div class="col-span-2 text-right">Prix TTC</div>
      <div class="col-span-1 text-right">Délai</div>
      <div class="col-span-1">Budget</div>
      <div class="col-span-2">Statut</div>
    </div>
    
    <div class="divide-y divide-slate-50">
      {#each offres as o}
        <a href="/admin/appels-offres/{o.appel_offre_id}/comparatif"
          class="block px-5 py-4 hover:bg-slate-50 transition-all">
          
          <!-- Version mobile : colonnes empilées verticalement -->
          <div class="lg:hidden space-y-3">
            <!-- Ligne 1 : Entreprise + statut -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <UserAvatar user={o.entreprise} size="sm" />
                <span class="text-sm font-semibold text-slate-800 truncate">
                  {o.entreprise?.fullName ?? o.entreprise?.email ?? '—'}
                </span>
              </div>
              <Badge status={o.statut} />
            </div>
            
            <!-- Ligne 2 : Adresse complète (peut revenir à la ligne) -->
            <div>
              <span class="text-xs text-slate-400">Demande :</span>
              <p class="text-xs text-slate-600 mt-0.5 whitespace-normal break-words">
                {o.demande_adresse}
              </p>
              <p class="text-xs text-slate-400 capitalize mt-0.5">{o.demande_type}</p>
            </div>
            
            <!-- Ligne 3 : Prix + Délai + Budget (tous alignés verticalement et centrés) -->
            <div class="flex items-center justify-between flex-wrap gap-4">
              <!-- Prix TTC -->
              <div class="flex flex-col items-center text-center min-w-[100px]">
                <span class="text-xs text-slate-400">Prix TTC</span>
                <div class="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span class="text-sm font-bold text-slate-900">{fmt(o.prix_ttc)}</span>
                  <span class="text-xs text-slate-400">FCFA</span>
                </div>
              </div>
              
              <!-- Délai -->
              <div class="flex flex-col items-center text-center min-w-[70px]">
                <span class="text-xs text-slate-400">Délai</span>
                <div class="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span class="text-sm font-bold text-slate-900">{o.delai_execution_jours}</span>
                  <span class="text-xs text-slate-400">j</span>
                </div>
              </div>
              
              <!-- Budget -->
              <div class="flex flex-col items-center text-center min-w-[80px]">
                <span class="text-xs text-slate-400">Budget</span>
                <div class="mt-0.5">
                  <span class="text-sm font-semibold {o.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                    {o.dans_budget ? '✓ Oui' : '✗ Non'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Version desktop : grille 12 colonnes rigide -->
          <div class="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-start">
            <!-- Colonne 1 : Entreprise -->
            <div class="col-span-3 flex items-center gap-2 min-w-0">
              <UserAvatar user={o.entreprise} size="sm" />
              <span class="text-sm font-semibold text-slate-800 truncate">
                {o.entreprise?.fullName ?? o.entreprise?.email ?? '—'}
              </span>
            </div>
            
            <!-- Colonne 2 : Demande (adresse complète, peut revenir à la ligne) -->
            <div class="col-span-3">
              <p class="text-xs text-slate-600 whitespace-normal break-words leading-relaxed">
                {o.demande_adresse}
              </p>
              <p class="text-xs text-slate-400 capitalize mt-1">{o.demande_type}</p>
            </div>
            
            <!-- Colonne 3 : Prix TTC (aligné à droite) -->
            <div class="col-span-2 text-right">
              <span class="text-sm font-semibold text-slate-900">{fmt(o.prix_ttc)}</span>
              <span class="text-xs text-slate-400 ml-1">FCFA</span>
            </div>
            
            <!-- Colonne 4 : Délai (aligné à droite) -->
            <div class="col-span-1 text-right">
              <span class="text-sm text-slate-600">{o.delai_execution_jours}j</span>
            </div>
            
            <!-- Colonne 5 : Budget -->
            <div class="col-span-1">
              <span class="text-sm font-semibold {o.dans_budget ? 'text-emerald-600' : 'text-red-500'}">
                {o.dans_budget ? '✓ Oui' : '✗ Non'}
              </span>
            </div>
            
            <!-- Colonne 6 : Statut -->
            <div class="col-span-2">
              <Badge status={o.statut} />
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>