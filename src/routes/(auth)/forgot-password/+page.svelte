<script lang="ts">
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'

  let email = $state('')
  let loading = $state(false)
  let sent = $state(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    try {
      await api.post('/auth/forgot-password', { email })
      sent = true
    } catch {
      toast.error($t('toast.save_error'), $t('auth.sending'))
    } finally {
      loading = false
    }
  }
</script>

<svelte:head><title>{$t('auth.forgot_title')} — Forage</title></svelte:head>

{#if sent}
  <div class="text-center">
    <div class="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
      <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size: 32px;">mark_email_read</span>
    </div>
    <h2 class="font-display font-black text-3xl tracking-tight text-slate-900 mb-3">{$t('auth.forgot_sent')}</h2>
    <p class="text-slate-500 text-sm leading-relaxed mb-2">
      {$t('auth.forgot_sent_msg', { email })}
    </p>
    <p class="text-slate-400 text-xs mb-8">{$t('auth.forgot_spam')}</p>
    <a href="/login"
      class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
      <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
      {$t('auth.back_to_login')}
    </a>
  </div>

{:else}
  <div class="mb-8">
    <h2 class="font-display font-black text-4xl leading-[1.05]" style="color: #0f1f5c; letter-spacing: -0.03em">
      {$t('auth.forgot_title')}
    </h2>
    <p class="text-slate-500 mt-3 text-sm leading-relaxed">
      {$t('auth.forgot_subtitle')}
    </p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="email">
        {$t('auth.email_label')}
      </label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
        <input id="email" type="email" bind:value={email} placeholder={$t('auth.forgot_placeholder')} required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
      </div>
    </div>

    <button type="submit" disabled={loading}
      class="w-full py-4 rounded-2xl text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      style="background-color: #1e3fff; box-shadow: 0 4px 14px rgba(30,63,255,0.35)">
      {#if loading}
        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {$t('auth.sending')}
      {:else}
        <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
        {$t('auth.send_link')}
      {/if}
    </button>
  </form>

  <div class="mt-8 text-center">
    <a href="/login" class="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors">
      <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
      {$t('auth.back_to_login')}
    </a>
  </div>
{/if}
