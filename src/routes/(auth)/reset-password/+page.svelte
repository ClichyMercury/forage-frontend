<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'

  const token = $derived($page.url.searchParams.get('token') ?? '')

  let password = $state('')
  let passwordConfirmation = $state('')
  let showPassword = $state(false)
  let loading = $state(false)
  let verifying = $state(true)
  let tokenValid = $state(false)
  let done = $state(false)

  onMount(async () => {
    if (!token) {
      tokenValid = false
      verifying = false
      return
    }
    try {
      const res = await api.get(`/auth/verify-reset-token?token=${token}`)
      tokenValid = res.data?.valid === true
    } catch {
      tokenValid = false
    } finally {
      verifying = false
    }
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()

    if (password !== passwordConfirmation) {
      toast.error($t('toast.save_error'), $t('auth.passwords_mismatch'))
      return
    }
    if (password.length < 6) {
      toast.error($t('toast.save_error'), $t('auth.password_min6'))
      return
    }

    loading = true
    try {
      await api.post('/auth/reset-password', { token, password, passwordConfirmation })
      done = true
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message ?? $t('auth.reset_invalid_msg'))
    } finally {
      loading = false
    }
  }
</script>

<svelte:head><title>{$t('auth.reset_title')} — Forage</title></svelte:head>

{#if verifying}
  <div class="text-center py-12">
    <span class="w-10 h-10 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block"></span>
    <p class="text-slate-500 text-sm mt-4">{$t('auth.reset_verifying')}</p>
  </div>

{:else if !tokenValid}
  <div class="text-center">
    <div class="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
      <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size: 32px;">link_off</span>
    </div>
    <h2 class="font-display font-black text-2xl tracking-tight text-slate-900 mb-3">{$t('auth.reset_invalid_title')}</h2>
    <p class="text-slate-500 text-sm mb-8">{$t('auth.reset_invalid_msg')}</p>
    <a href="/forgot-password"
      class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all">
      {$t('auth.reset_new_request')}
    </a>
  </div>

{:else if done}
  <div class="text-center">
    <div class="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
      <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size: 32px;">check_circle</span>
    </div>
    <h2 class="font-display font-black text-2xl tracking-tight text-slate-900 mb-3">{$t('auth.reset_done_title')}</h2>
    <p class="text-slate-500 text-sm mb-8">{$t('auth.reset_done_msg')}</p>
    <a href="/login"
      class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all">
      <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">login</span>
      {$t('auth.login_btn')}
    </a>
  </div>

{:else}
  <div class="mb-8">
    <h2 class="font-display font-black text-4xl leading-[1.05]" style="color: #0f1f5c; letter-spacing: -0.03em">
      {$t('auth.reset_title')}
    </h2>
    <p class="text-slate-500 mt-3 text-sm">{$t('auth.reset_subtitle')}</p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="password">
        {$t('auth.new_password')}
      </label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
        <input id="password" type={showPassword ? 'text' : 'password'} bind:value={password}
          placeholder={$t('auth.password_min6')} required minlength="6"
          class="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
        <button type="button" onclick={() => showPassword = !showPassword}
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined" style="font-size: 20px;">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="confirm">
        {$t('auth.confirm_password')}
      </label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock_reset</span>
        <input id="confirm" type={showPassword ? 'text' : 'password'} bind:value={passwordConfirmation}
          placeholder="••••••••" required
          class="w-full pl-10 pr-4 py-3 rounded-xl border {password && passwordConfirmation && password !== passwordConfirmation ? 'border-red-400' : 'border-slate-200'} bg-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
      </div>
      {#if password && passwordConfirmation && password !== passwordConfirmation}
        <p class="text-red-500 text-xs mt-1">{$t('auth.passwords_mismatch')}</p>
      {/if}
    </div>

    <button type="submit" disabled={loading || (!!password && !!passwordConfirmation && password !== passwordConfirmation)}
      class="w-full py-4 rounded-2xl text-white font-semibold text-sm hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.35)">
      {#if loading}
        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {$t('auth.updating')}
      {:else}
        <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">check</span>
        {$t('auth.save_password')}
      {/if}
    </button>
  </form>
{/if}
