<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'
  import Logo from '$lib/components/ui/Logo.svelte'

  let email = $state('')
  let password = $state('')
  let loading = $state(false)
  let showPassword = $state(false)
  let errors = $state<Record<string, string>>({})

  async function handleLogin(e: Event) {
    e.preventDefault()
    errors = {}
    loading = true
    try {
      const res = await api.post('/auth/login', { email, password })
      const payload = res.data?.data ?? res.data
      if (!payload?.user || !payload?.token) {
        toast.error($t('auth.login_failed'), $t('auth.unexpected_response'))
        return
      }
      const { user, token } = payload
      auth.login(user, token)
      toast.success($t('auth.login_success'), $t('auth.welcome_user', { name: user.fullName ?? user.email }))
      if (user.role === 'admin') goto('/admin/dashboard')
      else if (user.role === 'entreprise') goto('/entreprise/dashboard')
      else goto('/client/dashboard')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error($t('auth.login_failed'), data?.message ?? $t('auth.wrong_credentials'))
      }
    } finally { loading = false }
  }
</script>

<svelte:head><title>{$t('auth.login_btn')} — Forage</title></svelte:head>

<!-- Logo mobile -->
<div class="lg:hidden flex items-center gap-2.5 mb-10">
  <Logo height="h-10" />
</div>

<div class="mb-8">
  <h2 class="font-display font-black text-4xl leading-[1.05]" style="color: #0f1f5c; letter-spacing: -0.03em">
    {$t('auth.welcome')}
  </h2>
  <p class="text-slate-500 mt-3 text-base">{$t('auth.login_subtitle')}</p>
</div>

<form onsubmit={handleLogin} class="space-y-5">
  <!-- Email -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5" for="email">{$t('auth.email')}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
      <input id="email" type="email" bind:value={email} placeholder={$t('auth.email_placeholder')} required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm transition-all"
        style="background-color: #fafbff"
        class:border-red-400={errors.email} />
    </div>
    {#if errors.email}<p class="text-red-500 text-xs mt-1">{errors.email}</p>{/if}
  </div>

  <!-- Mot de passe -->
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <label class="block text-sm font-medium text-slate-700" for="password">{$t('auth.password')}</label>
      <a href="/forgot-password" class="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
        {$t('auth.forgot_password')}
      </a>
    </div>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
      <input id="password" type={showPassword ? 'text' : 'password'} bind:value={password} placeholder={$t('auth.password_placeholder')} required
        class="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm transition-all"
        style="background-color: #fafbff"
        class:border-red-400={errors.password} />
      <button type="button" onclick={() => showPassword = !showPassword}
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        <span class="material-symbols-outlined" style="font-size: 20px;">
          {showPassword ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
    {#if errors.password}<p class="text-red-500 text-xs mt-1">{errors.password}</p>{/if}
  </div>

  <!-- Bouton -->
  <button type="submit" disabled={loading}
    class="w-full py-4 rounded-2xl text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.35)">
    {#if loading}
      <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {$t('auth.logging_in')}
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">arrow_forward</span>
      {$t('auth.login_btn')}
    {/if}
  </button>
</form>

<!-- Liens -->
<div class="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
  <p class="text-sm text-slate-500">
    {$t('auth.no_account')}
    <a href="/register" class="text-brand-600 font-semibold hover:text-brand-700">{$t('auth.create_client')}</a>
  </p>
  <p class="text-sm text-slate-500">
    {$t('auth.are_entreprise')}
    <a href="/register-entreprise" class="font-semibold text-brand-600 hover:text-brand-700">{$t('auth.register_entreprise')}</a>
  </p>
</div>
