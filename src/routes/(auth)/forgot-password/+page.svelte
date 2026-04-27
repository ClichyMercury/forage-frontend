<script lang="ts">
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let email = $state('')
  let loading = $state(false)
  let sent = $state(false) // true = email envoyé, on affiche la confirmation

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    try {
      // On appelle le backend — il répond toujours OK (sécurité)
      await api.post('/auth/forgot-password', { email })
      sent = true // Passer à l'écran de confirmation
    } catch {
      // Même en cas d'erreur réseau, on affiche un message générique
      toast.error('Erreur', 'Impossible d\'envoyer l\'email. Réessayez.')
    } finally {
      loading = false
    }
  }
</script>

<svelte:head><title>Mot de passe oublié — ForageCI</title></svelte:head>

{#if sent}
  <!-- Écran de confirmation après envoi -->
  <div class="text-center">
    <div class="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
      <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size: 32px;">mark_email_read</span>
    </div>
    <h2 class="font-display font-black text-3xl tracking-tight text-slate-900 mb-3">Email envoyé</h2>
    <p class="text-slate-500 text-sm leading-relaxed mb-2">
      Si l'adresse <strong class="text-slate-700">{email}</strong> est associée à un compte,
      vous recevrez un lien de réinitialisation dans quelques minutes.
    </p>
    <p class="text-slate-400 text-xs mb-8">Vérifiez aussi vos spams.</p>
    <a href="/login"
      class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
      <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
      Retour à la connexion
    </a>
  </div>

{:else}
  <!-- Formulaire de demande -->
  <div class="mb-8">
    <h2 class="font-display font-black text-4xl tracking-tight leading-[1.05] text-slate-900">
      Mot de passe<br />oublié ?
    </h2>
    <p class="text-slate-500 mt-3 text-sm leading-relaxed">
      Entrez votre adresse email. Nous vous enverrons un lien pour créer un nouveau mot de passe.
    </p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="email">
        Adresse email
      </label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
        <input id="email" type="email" bind:value={email} placeholder="votre@email.com" required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
      </div>
    </div>

    <button type="submit" disabled={loading}
      class="w-full py-4 rounded-2xl bg-brand-600 text-white font-semibold text-sm shadow-xl hover:bg-brand-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
      {#if loading}
        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        Envoi en cours...
      {:else}
        <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
        Envoyer le lien
      {/if}
    </button>
  </form>

  <div class="mt-8 text-center">
    <a href="/login" class="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors">
      <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
      Retour à la connexion
    </a>
  </div>
{/if}
