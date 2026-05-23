<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'
  import Logo from '$lib/components/ui/Logo.svelte'

  let fullName = $state('')
  let email = $state('')
  let telephone = $state('')
  let userType = $state('particulier')
  let password = $state('')
  let passwordConfirmation = $state('')
  let showPassword = $state(false)
  let loading = $state(false)
  let errors = $state<Record<string, string>>({})

  async function handleRegister(e: Event) {
    e.preventDefault()
    errors = {}
    loading = true
    try {
      await api.post('/auth/register', {
        fullName, email, telephone, userType, password, passwordConfirmation,
      })
      toast.success($t('auth.register_success'), $t('auth.register_success_sub'))
      goto('/login')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error($t('auth.register_failed'), data?.message ?? $t('auth.register_error'))
      }
    } finally {
      loading = false
    }
  }
</script>

<svelte:head><title>{$t('auth.register_title')} — Forage</title></svelte:head>

<div class="lg:hidden flex items-center gap-2.5 mb-10">
  <Logo height="h-10" />
</div>

<div class="mb-8">
  <h2 class="font-display font-black text-4xl leading-[1.05]" style="color: #0f1f5c; letter-spacing: -0.03em">
    {$t('auth.register_title')}
  </h2>
  <p class="text-slate-500 mt-3 text-base">{$t('auth.register_subtitle')}</p>
</div>

<form onsubmit={handleRegister} class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.fullname')}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">person</span>
      <input type="text" bind:value={fullName} placeholder={$t('auth.fullname_placeholder')} required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.fullName} />
    </div>
    {#if errors.fullName}<p class="text-red-500 text-xs mt-1">{errors.fullName}</p>{/if}
  </div>

  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.email_label')}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
      <input type="email" bind:value={email} placeholder={$t('auth.email_placeholder2')} required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.email} />
    </div>
    {#if errors.email}<p class="text-red-500 text-xs mt-1">{errors.email}</p>{/if}
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.phone')}</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">phone</span>
        <input type="tel" bind:value={telephone} placeholder={$t('auth.phone_placeholder')} required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.telephone} />
      </div>
      {#if errors.telephone}<p class="text-red-500 text-xs mt-1">{errors.telephone}</p>{/if}
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.user_type')}</label>
      <select bind:value={userType}
        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all">
        <option value="particulier">{$t('auth.particulier')}</option>
        <option value="entreprise">{$t('auth.entreprise_type')}</option>
      </select>
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.password')}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
      <input type={showPassword ? 'text' : 'password'} bind:value={password} placeholder={$t('auth.password_min')} required
        class="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.password} />
      <button type="button" onclick={() => showPassword = !showPassword}
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        <span class="material-symbols-outlined" style="font-size: 20px;">{showPassword ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
    {#if errors.password}<p class="text-red-500 text-xs mt-1">{errors.password}</p>{/if}
  </div>

  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">{$t('auth.confirm_password_label')}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock_reset</span>
      <input type={showPassword ? 'text' : 'password'} bind:value={passwordConfirmation} placeholder="••••••••" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.passwordConfirmation} />
    </div>
    {#if errors.passwordConfirmation}<p class="text-red-500 text-xs mt-1">{errors.passwordConfirmation}</p>{/if}
  </div>

  <button type="submit" disabled={loading}
    class="w-full py-4 rounded-2xl text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
    style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.35)">
    {#if loading}
      <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {$t('auth.registering')}
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">arrow_forward</span>
      {$t('auth.register_btn')}
    {/if}
  </button>
</form>

<p class="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
  {$t('auth.already_account')} <a href="/login" class="text-brand-600 font-semibold hover:text-brand-700">{$t('auth.login_link')}</a>
</p>
