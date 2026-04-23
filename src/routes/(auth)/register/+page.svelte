<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'

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
      const res = await api.post('/auth/signup', {
        fullName, email, telephone, userType, password, passwordConfirmation,
      })
      const payload = res.data?.data ?? res.data
      const { user, token } = payload
      auth.login(user, token)
      toast.success('Compte créé !', 'Bienvenue sur ForageCI.')
      goto('/client/dashboard')
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

<svelte:head><title>Inscription — ForageCI</title></svelte:head>

<div class="mb-8">
  <h2 class="text-3xl font-bold text-slate-900">Créer un compte</h2>
  <p class="text-slate-500 mt-2">Rejoignez la plateforme ForageCI</p>
</div>

<form onsubmit={handleRegister} class="space-y-4">
  <!-- Nom complet -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">Nom complet</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">person</span>
      <input type="text" bind:value={fullName} placeholder="Jean Dupont" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.fullName} />
    </div>
    {#if errors.fullName}<p class="text-red-500 text-xs mt-1">{errors.fullName}</p>{/if}
  </div>

  <!-- Email -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
      <input type="email" bind:value={email} placeholder="Votre adresse email" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.email} />
    </div>
    {#if errors.email}<p class="text-red-500 text-xs mt-1">{errors.email}</p>{/if}
  </div>

  <!-- Téléphone + Type -->
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label>
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">phone</span>
        <input type="tel" bind:value={telephone} placeholder="0700000000" required
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          class:border-red-400={errors.telephone} />
      </div>
      {#if errors.telephone}<p class="text-red-500 text-xs mt-1">{errors.telephone}</p>{/if}
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
      <select bind:value={userType}
        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all">
        <option value="particulier">Particulier</option>
        <option value="entreprise">Entreprise</option>
      </select>
    </div>
  </div>

  <!-- Mot de passe -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock</span>
      <input type={showPassword ? 'text' : 'password'} bind:value={password} placeholder="Min. 6 caractères" required
        class="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.password} />
      <button type="button" onclick={() => showPassword = !showPassword}
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        <span class="material-symbols-outlined" style="font-size: 20px;">{showPassword ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
    {#if errors.password}<p class="text-red-500 text-xs mt-1">{errors.password}</p>{/if}
  </div>

  <!-- Confirmation -->
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">lock_reset</span>
      <input type={showPassword ? 'text' : 'password'} bind:value={passwordConfirmation} placeholder="••••••••" required
        class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        class:border-red-400={errors.passwordConfirmation} />
    </div>
    {#if errors.passwordConfirmation}<p class="text-red-500 text-xs mt-1">{errors.passwordConfirmation}</p>{/if}
  </div>

  <button type="submit" disabled={loading}
    class="w-full py-3.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
    {#if loading}
      <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      Création...
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">person_add</span>
      Créer mon compte
    {/if}
  </button>
</form>

<p class="mt-6 text-center text-sm text-slate-500">
  Déjà un compte ? <a href="/login" class="text-blue-600 font-semibold hover:text-blue-700">Se connecter</a>
</p>
