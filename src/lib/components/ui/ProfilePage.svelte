<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'

  let loading = $state(true)
  let saving = $state(false)
  let user = $state<any>(null)
  let errors = $state<Record<string, string>>({})

  // Champs éditables
  let fullName = $state('')
  let telephone = $state('')
  let userType = $state<'particulier' | 'entreprise'>('particulier')

  onMount(async () => {
    try {
      const res = await api.get('/account/profile')
      user = res.data
      fullName = user.fullName ?? ''
      telephone = user.telephone ?? ''
      userType = user.userType ?? 'particulier'
    } catch {} finally { loading = false }
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    errors = {}
    saving = true
    try {
      const payload: any = { fullName, telephone }
      if (user?.role === 'client') payload.userType = userType

      const res = await api.patch('/account/profile', payload)
      user = res.data

      // Mettre à jour le store auth pour refléter le nouveau nom partout
      if (auth.user) {
        auth.user = { ...auth.user, fullName: user.fullName, telephone: user.telephone, userType: user.userType }
        if (typeof localStorage !== 'undefined' && auth.token) {
          localStorage.setItem('auth', JSON.stringify({ user: auth.user, token: auth.token }))
        }
      }

      toast.success('Profil mis à jour', 'Vos informations ont bien été enregistrées.')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error('Erreur', data?.message ?? 'Impossible de mettre à jour le profil')
      }
    } finally { saving = false }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' })
  }
</script>

<div class="max-w-3xl mx-auto">
  <!-- Titre -->
  <div class="mb-8">
    <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
      Mon <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #b35d2e">profil</span>.
    </h2>
    <p class="text-sm text-slate-500 mt-1">Gérez vos informations personnelles et vos préférences.</p>
  </div>

  {#if loading}
    <div class="space-y-4">
      {#each [1,2,3] as _}<div class="skeleton h-24 rounded-2xl"></div>{/each}
    </div>
  {:else if user}

    <!-- Carte identité -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 mb-5">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-display font-black shrink-0"
             style="background-color: {user.role === 'entreprise' ? '#b35d2e' : '#1e3fff'}">
          {user.initials ?? '?'}
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-lg text-slate-900 truncate">{user.fullName ?? user.email}</p>
          <p class="text-sm text-slate-500 truncate">{user.email}</p>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                  style="background-color: {user.role === 'entreprise' ? '#fbf3ec' : '#eef1ff'}; color: {user.role === 'entreprise' ? '#743820' : '#1226a8'}">
              {user.role}
            </span>
            {#if user.isActive}
              <span class="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">check_circle</span>
                Actif
              </span>
            {:else}
              <span class="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">schedule</span>
                En attente
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-slate-100">
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">Membre depuis</p>
          <p class="text-sm font-semibold text-slate-700">{fmtDate(user.createdAt)}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">Dernière mise à jour</p>
          <p class="text-sm font-semibold text-slate-700">{fmtDate(user.updatedAt)}</p>
        </div>
      </div>
    </div>

    <!-- Formulaire -->
    <form onsubmit={handleSubmit} class="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <div>
        <h3 class="font-display font-bold text-slate-900 mb-1">Informations</h3>
        <p class="text-xs text-slate-500">Mettez à jour votre nom, votre téléphone ou votre type de compte.</p>
      </div>

      <!-- Nom complet -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-name">Nom complet</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">person</span>
          <input id="profile-name" type="text" bind:value={fullName} placeholder="Jean Dupont"
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
            class:border-red-400={errors.fullName} />
        </div>
        {#if errors.fullName}<p class="text-red-500 text-xs mt-1">{errors.fullName}</p>{/if}
      </div>

      <!-- Email (read-only) -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-email">Email</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
          <input id="profile-email" type="email" value={user.email} readonly disabled
            class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-500 cursor-not-allowed" />
          <span class="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300" style="font-size: 18px;">lock</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié.</p>
      </div>

      <!-- Téléphone -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-tel">Téléphone</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">phone</span>
          <input id="profile-tel" type="tel" bind:value={telephone} placeholder="0700000000"
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
            class:border-red-400={errors.telephone} />
        </div>
        {#if errors.telephone}<p class="text-red-500 text-xs mt-1">{errors.telephone}</p>{/if}
      </div>

      <!-- Type de compte (clients seulement) -->
      {#if user.role === 'client'}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-type">Type de compte</label>
          <select id="profile-type" bind:value={userType}
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all">
            <option value="particulier">Particulier</option>
            <option value="entreprise">Entreprise</option>
          </select>
          {#if errors.userType}<p class="text-red-500 text-xs mt-1">{errors.userType}</p>{/if}
        </div>
      {/if}

      <!-- Bouton -->
      <div class="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          class="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-sm disabled:opacity-60">
          {#if saving}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Enregistrement...
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">check</span>
            Enregistrer
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
