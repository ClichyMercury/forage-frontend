<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'

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
        toast.error('Connexion échouée', 'Réponse inattendue du serveur.')
        return
      }
      const { user, token } = payload
      auth.login(user, token)
      toast.success('Connexion réussie', `Bienvenue ${user.fullName ?? user.email} !`)
      if (user.role === 'admin') goto('/admin/dashboard')
      else if (user.role === 'entreprise') goto('/entreprise/dashboard')
      else goto('/client/dashboard')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error('Connexion échouée', data?.message ?? 'Email ou mot de passe incorrect')
      }
    } finally { loading = false }
  }
</script>

<svelte:head><title>Connexion — ForageCI</title></svelte:head>

<!-- Logo mobile -->
<div class="lg:hidden flex items-center gap-2.5 mb-10">
  <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: #1e3fff">
    <span class="material-symbols-outlined text-white icon-filled" style="font-size: 20px;">water_drop</span>
  </div>
  <span class="font-display font-black text-xl tracking-tight text-slate-900">ForageCI</span>
</div>

<div class="mb-8">
  <h2 class="font-display font-black text-4xl tracking-tight leading-[1.05] text-slate-900">
    Bienvenue.
  </h2>
  <p class="text-slate-500 mt-3 text-base">Connectez-vous à votre espace ForageCI.</p>
</div>

<form onsubmit={handleLogin} class="space-y-5">
  <!-- Email -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5" for="email">Adresse email</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
      <input id="email" type="email" bind:value={email} placeholder="Entrez votre adresse email" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm transition-all"
        class:border-red-400={errors.email} />
    </div>
    {#if errors.email}<p class="text-red-500 text-xs mt-1">{errors.email}</p>{/if}
  </div>

  <!-- Mot de passe -->
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <label class="block text-sm font-medium text-slate-700" for="password">Mot de passe</label>
    </div>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
      <input id="password" type={showPassword ? 'text' : 'password'} bind:value={password} placeholder="••••••••" required
        class="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm transition-all"
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
    class="w-full py-4 rounded-2xl bg-brand-600 text-white font-semibold text-sm shadow-xl hover:bg-brand-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
    {#if loading}
      <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      Connexion...
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">arrow_forward</span>
      Se connecter
    {/if}
  </button>
</form>

<!-- Liens -->
<div class="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
  <p class="text-sm text-slate-500">
    Pas encore de compte ?
    <a href="/register" class="text-brand-600 font-semibold hover:text-brand-700">Créer un compte client</a>
  </p>
  <p class="text-sm text-slate-500">
    Vous êtes une entreprise ?
    <a href="/register-entreprise" class="font-semibold hover:underline" style="color: #b35d2e">Inscription entreprise</a>
  </p>
</div>
