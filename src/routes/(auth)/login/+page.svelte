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
<div class="lg:hidden flex items-center gap-2 mb-8">
  <div class="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center">
    <span class="material-symbols-outlined text-white icon-filled" style="font-size: 20px;">water_drop</span>
  </div>
  <span class="font-bold text-xl text-slate-800">ForageCI</span>
</div>

<div class="mb-8">
  <h2 class="text-3xl font-bold text-slate-900">Bienvenue sur votre espace.</h2>
  <p class="text-slate-500 mt-2">Connectez-vous à votre espace</p>
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
    class="w-full py-3.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
    {#if loading}
      <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      Connexion...
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">login</span>
      Se connecter
    {/if}
  </button>
</form>

<!-- Liens -->
<div class="mt-6 text-center space-y-2">
  <p class="text-sm text-slate-500">
    Pas encore de compte ?
    <a href="/register" class="text-blue-600 font-semibold hover:text-blue-700">Créer un compte client</a>
  </p>
  <p class="text-sm text-slate-500">
    Vous êtes une entreprise ?
    <a href="/register-entreprise" class="text-indigo-600 font-semibold hover:text-indigo-700">Inscription entreprise</a>
  </p>
</div>
