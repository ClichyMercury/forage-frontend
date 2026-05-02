<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let email = $state('')
  let telephone = $state('')
  let password = $state('')
  let passwordConfirmation = $state('')
  let raisonSociale = $state('')
  let rccm = $state('')
  let domaines = $state<string[]>([])
  let zonesGeographiques = $state('')
  let showPassword = $state(false)
  let loading = $state(false)
  let errors = $state<Record<string, string>>({})

  const domainesOptions = [
    { value: 'eau', label: 'Forage eau', icon: 'water_drop' },
    { value: 'geotechnique', label: 'Géotechnique', icon: 'terrain' },
    { value: 'petrolier', label: 'Pétrolier', icon: 'oil_barrel' },
    { value: 'autre', label: 'Autre', icon: 'more_horiz' },
  ]

  function toggleDomaine(val: string) {
    domaines = domaines.includes(val)
      ? domaines.filter((d) => d !== val)
      : [...domaines, val]
  }

  async function handleRegister(e: Event) {
    e.preventDefault()
    errors = {}

    if (domaines.length === 0) {
      errors.domaines = 'Sélectionnez au moins un domaine'
      return
    }

    const zones = zonesGeographiques.split(',').map((z) => z.trim()).filter(Boolean)
    if (zones.length === 0) {
      errors.zonesGeographiques = 'Entrez au moins une zone'
      return
    }

    loading = true
    try {
      await api.post('/auth/register/entreprise', {
        email, telephone, password, passwordConfirmation,
        raisonSociale, rccm: rccm || undefined,
        domaines, zonesGeographiques: zones,
      })
      toast.success('Demande envoyée !', 'Votre compte est en attente de validation par notre équipe.')
      goto('/login')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error('Erreur', data?.message ?? 'Impossible de créer le compte')
      }
    } finally {
      loading = false
    }
  }
</script>

<svelte:head><title>Inscription Entreprise — Forage</title></svelte:head>

<!-- Logo mobile -->
<div class="lg:hidden flex items-center gap-2.5 mb-10">
  <img src="/images/logo.jpeg" alt="Forage" class="w-10 h-10 object-contain" />
  <span class="font-display font-black text-xl tracking-tight text-slate-900">Forage</span>
</div>

<div class="mb-8">
  <h2 class="font-display font-black text-4xl leading-[1.05]" style="color: #0f1f5c; letter-spacing: -0.03em">
    Espace <span style="color: #1e3fff">prestataire</span>.
  </h2>
  <p class="text-slate-500 mt-3 text-base">Votre compte sera activé après validation par notre équipe.</p>
</div>

<form onsubmit={handleRegister} class="space-y-4">
  <!-- Raison sociale -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">Raison sociale *</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">business</span>
      <input type="text" bind:value={raisonSociale} placeholder="Forage Pro SARL" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.raisonSociale} />
    </div>
    {#if errors.raisonSociale}<p class="text-red-500 text-xs mt-1">{errors.raisonSociale}</p>{/if}
  </div>

  <!-- Email + Téléphone -->
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
        <input type="email" bind:value={email} placeholder="contact@..." required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.email} />
      </div>
      {#if errors.email}<p class="text-red-500 text-xs mt-1">{errors.email}</p>{/if}
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">Téléphone *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">phone</span>
        <input type="tel" bind:value={telephone} placeholder="0700000000" required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.telephone} />
      </div>
      {#if errors.telephone}<p class="text-red-500 text-xs mt-1">{errors.telephone}</p>{/if}
    </div>
  </div>

  <!-- RCCM -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">RCCM (optionnel)</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">badge</span>
      <input type="text" bind:value={rccm} placeholder="RC/ABJ/2024/001"
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all" />
    </div>
  </div>

  <!-- Domaines -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-2">Domaines d'intervention *</label>
    <div class="grid grid-cols-2 gap-2">
      {#each domainesOptions as opt}
        <button type="button" onclick={() => toggleDomaine(opt.value)}
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all {domaines.includes(opt.value) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}">
          <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">{opt.icon}</span>
          {opt.label}
          {#if domaines.includes(opt.value)}
            <span class="material-symbols-outlined ml-auto text-blue-500 icon-filled" style="font-size: 16px;">check_circle</span>
          {/if}
        </button>
      {/each}
    </div>
    {#if errors.domaines}<p class="text-red-500 text-xs mt-1">{errors.domaines}</p>{/if}
  </div>

  <!-- Zones -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">Zones géographiques * <span class="text-slate-400 font-normal">(séparées par virgule)</span></label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">location_on</span>
      <input type="text" bind:value={zonesGeographiques} placeholder="Abidjan, Bouaké, Yamoussoukro"
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.zonesGeographiques} />
    </div>
    {#if errors.zonesGeographiques}<p class="text-red-500 text-xs mt-1">{errors.zonesGeographiques}</p>{/if}
  </div>

  <!-- Mot de passe -->
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
        <input type={showPassword ? 'text' : 'password'} bind:value={password} placeholder="Min. 6 car." required
          class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.password} />
        <button type="button" onclick={() => showPassword = !showPassword}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <span class="material-symbols-outlined" style="font-size: 18px;">{showPassword ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
      {#if errors.password}<p class="text-red-500 text-xs mt-1">{errors.password}</p>{/if}
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirmation *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock_reset</span>
        <input type={showPassword ? 'text' : 'password'} bind:value={passwordConfirmation} placeholder="••••••" required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.passwordConfirmation} />
      </div>
    </div>
  </div>

  <button type="submit" disabled={loading}
    class="w-full py-4 rounded-2xl text-white font-semibold text-sm hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
    style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.35)">
    {#if loading}
      <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      Envoi en cours...
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">arrow_forward</span>
      Soumettre la demande
    {/if}
  </button>
</form>

<p class="mt-5 text-center text-sm text-slate-500">
  Déjà un compte ? <a href="/login" class="text-brand-600 font-semibold hover:text-brand-700">Se connecter</a>
</p>
