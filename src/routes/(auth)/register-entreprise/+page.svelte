<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Logo from '$lib/components/ui/Logo.svelte'
  import { t } from '$lib/stores/locale'

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

  const domainesOptions = $derived([
    { value: 'eau',          label: $t('domain.eau'),          icon: 'water_drop' },
    { value: 'geotechnique', label: $t('domain.geotechnique'), icon: 'terrain' },
    { value: 'petrolier',    label: $t('domain.petrolier'),    icon: 'oil_barrel' },
    { value: 'autre',        label: $t('domain.autre'),        icon: 'more_horiz' },
  ])

  function toggleDomaine(val: string) {
    domaines = domaines.includes(val)
      ? domaines.filter((d) => d !== val)
      : [...domaines, val]
  }

  async function handleRegister(e: Event) {
    e.preventDefault()
    errors = {}

    if (domaines.length === 0) {
      errors.domaines = $t('auth.ent.domaine_required')
      return
    }

    const zones = zonesGeographiques.split(',').map((z) => z.trim()).filter(Boolean)
    if (zones.length === 0) {
      errors.zonesGeographiques = $t('auth.ent.zones_required')
      return
    }

    loading = true
    try {
      await api.post('/auth/register/entreprise', {
        email, telephone, password, passwordConfirmation,
        raisonSociale, rccm: rccm || undefined,
        domaines, zonesGeographiques: zones,
      })
      toast.success($t('auth.ent.success'), $t('auth.ent.success_sub'))
      goto('/login')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error($t('toast.save_error'), data?.message ?? $t('auth.register_error'))
      }
    } finally {
      loading = false
    }
  }
</script>

<svelte:head><title>{$t('auth.register_entreprise')} — Forage</title></svelte:head>

<div class="lg:hidden flex items-center gap-2.5 mb-10">
  <Logo height="h-10" />
</div>

<div class="mb-8">
  <h2 class="font-display font-black text-4xl leading-[1.05]" style="color: #0f1f5c; letter-spacing: -0.03em">
    {$t('auth.ent.title')}
  </h2>
  <p class="text-slate-500 mt-3 text-base">{$t('auth.ent.subtitle')}</p>
</div>

<form onsubmit={handleRegister} class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.ent.raison_sociale')} *</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">business</span>
      <input type="text" bind:value={raisonSociale} placeholder="Forage Pro SARL" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.raisonSociale} />
    </div>
    {#if errors.raisonSociale}<p class="text-red-500 text-xs mt-1">{errors.raisonSociale}</p>{/if}
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.email_label')} *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
        <input type="email" bind:value={email} placeholder="contact@..." required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.email} />
      </div>
      {#if errors.email}<p class="text-red-500 text-xs mt-1">{errors.email}</p>{/if}
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.phone')} *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">phone</span>
        <input type="tel" bind:value={telephone} placeholder={$t('auth.phone_placeholder')} required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.telephone} />
      </div>
      {#if errors.telephone}<p class="text-red-500 text-xs mt-1">{errors.telephone}</p>{/if}
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.ent.rccm')}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">badge</span>
      <input type="text" bind:value={rccm} placeholder="RC/ABJ/2024/001"
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all" />
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-slate-700 mb-2">{$t('auth.ent.domaines')} *</label>
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

  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">
      {$t('auth.ent.zones')} * <span class="text-slate-400 font-normal">{$t('auth.ent.zones_hint')}</span>
    </label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">location_on</span>
      <input type="text" bind:value={zonesGeographiques} placeholder={$t('auth.ent.zones_placeholder')}
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.zonesGeographiques} />
    </div>
    {#if errors.zonesGeographiques}<p class="text-red-500 text-xs mt-1">{errors.zonesGeographiques}</p>{/if}
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.password')} *</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
        <input type={showPassword ? 'text' : 'password'} bind:value={password} placeholder={$t('auth.password_min')} required
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
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.ent.confirm_short')} *</label>
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
      {$t('auth.ent.submitting')}
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">arrow_forward</span>
      {$t('auth.ent.submit')}
    {/if}
  </button>
</form>

<p class="mt-5 text-center text-sm text-slate-500">
  {$t('auth.already_account')} <a href="/login" class="text-brand-600 font-semibold hover:text-brand-700">{$t('auth.login_link')}</a>
</p>
