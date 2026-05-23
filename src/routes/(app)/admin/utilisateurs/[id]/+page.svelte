<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'

  const id = $derived($page.params.id)
  let user = $state<any>(null)
  let loading = $state(true)
  let acting = $state(false)

  onMount(async () => {
    await loadUser()
  })

  async function loadUser() {
    loading = true
    try {
      const res = await api.get(`/admin/users/${id}`)
      user = res.data
    } catch {} finally { loading = false }
  }

  async function valider() {
    if (!confirm(`Valider le compte de "${user.fullName ?? user.email}" ?`)) return
    acting = true
    try {
      await api.patch(`/admin/users/${id}/valider`)
      toast.success($t('admin.users.validated'), $t('admin.users.validated_msg'))
      await loadUser()
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message)
    } finally { acting = false }
  }

  async function suspendre() {
    if (!confirm(`Suspendre le compte de "${user.fullName ?? user.email}" ?\n\nL'utilisateur ne pourra plus se connecter.`)) return
    acting = true
    try {
      await api.patch(`/admin/users/${id}/suspendre`)
      toast.success($t('admin.users.suspended'))
      await loadUser()
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message)
    } finally { acting = false }
  }

  async function reactiver() {
    if (!confirm(`Réactiver le compte de "${user.fullName ?? user.email}" ?`)) return
    acting = true
    try {
      await api.patch(`/admin/users/${id}/reactiver`)
      toast.success($t('admin.users.reactivated'))
      await loadUser()
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message)
    } finally { acting = false }
  }

  async function supprimer() {
    if (!confirm(`SUPPRIMER DÉFINITIVEMENT le compte de "${user.fullName ?? user.email}" ?\n\nCette action est irréversible.`)) return
    acting = true
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success($t('admin.users.deleted'))
      goto('/admin/utilisateurs')
    } catch (err: any) {
      toast.error($t('toast.save_error'), err.response?.data?.message)
    } finally { acting = false }
  }

  function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const profile = $derived(user?.entreprise_profile ?? null)
</script>

<svelte:head><title>{$t('admin.user_detail.actions')} — Admin Forage</title></svelte:head>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="flex items-start gap-3 mb-6">
    <button onclick={() => goto('/admin/utilisateurs')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600 shrink-0">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1 min-w-0">
      <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900 wrap-break-word">
        {#if loading}
          {$t('admin.user_detail.loading')}
        {:else}
          {user?.fullName ?? user?.email ?? 'Utilisateur'}
        {/if}
      </h2>
      {#if user}
        <p class="text-sm text-slate-500 mt-1 capitalize">{user.role} · #{user.id}</p>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">
      {#each [1,2,3] as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}
    </div>
  {:else if user}

    <!-- Carte identité + statut -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 mb-5">
      <div class="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-display font-black shrink-0"
             style="background-color: {user.role === 'entreprise' ? '#475569' : user.role === 'admin' ? '#0f172a' : '#1e3fff'}">
          {user.initials ?? (user.fullName ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-lg text-slate-900 truncate">{user.fullName ?? '—'}</p>
          <p class="text-sm text-slate-500 truncate">{user.email}</p>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                  style="background-color: {user.role === 'entreprise' ? '#f1f5f9' : user.role === 'admin' ? '#0f172a' : '#eef1ff'}; color: {user.role === 'entreprise' ? '#334155' : user.role === 'admin' ? '#ffffff' : '#1226a8'}">
              {user.role}
            </span>
            {#if user.isActive}
              <span class="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">check_circle</span>
                {$t('admin.users.active')}
              </span>
            {:else if user.role === 'entreprise'}
              <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 bg-slate-100 text-slate-600">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">schedule</span>
                {$t('admin.user_detail.pending')}
              </span>
            {:else}
              <span class="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">block</span>
                {$t('admin.user_detail.suspended')}
              </span>
            {/if}
            {#if user.userType}
              <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium capitalize">
                {user.userType}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Informations -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('admin.user_detail.phone')}</p>
          <p class="text-sm font-semibold text-slate-700">{user.telephone ?? '—'}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('admin.user_detail.registered')}</p>
          <p class="text-sm font-semibold text-slate-700">{fmtDate(user.createdAt ?? user.created_at)}</p>
        </div>
      </div>
    </div>

    <!-- Profil entreprise -->
    {#if profile}
      <div class="bg-white rounded-2xl border border-slate-100 p-6 mb-5">
        <h3 class="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined icon-filled text-brand-600" style="font-size: 18px;">business</span>
          {$t('admin.user_detail.profile')}
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div class="p-3 bg-slate-50 rounded-xl">
            <p class="text-xs text-slate-400 mb-1">{$t('admin.user_detail.raison_sociale')}</p>
            <p class="text-sm font-semibold text-slate-700">{profile.raisonSociale ?? profile.raison_sociale ?? '—'}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl">
            <p class="text-xs text-slate-400 mb-1">{$t('admin.user_detail.rccm')}</p>
            <p class="text-sm font-semibold text-slate-700">{profile.rccm ?? '—'}</p>
          </div>
        </div>

        {#if profile.domaines?.length > 0}
          <div class="mb-3">
            <p class="text-xs text-slate-400 mb-2 px-1">{$t('admin.user_detail.domaines')}</p>
            <div class="flex flex-wrap gap-2">
              {#each profile.domaines as d}
                <span class="px-3 py-1 rounded-lg text-xs font-semibold capitalize bg-brand-50 text-brand-700">{d}</span>
              {/each}
            </div>
          </div>
        {/if}

        {#if (profile.zonesGeographiques ?? profile.zones_geographiques)?.length > 0}
          <div class="mb-3">
            <p class="text-xs text-slate-400 mb-2 px-1">{$t('admin.user_detail.zones')}</p>
            <div class="flex flex-wrap gap-2">
              {#each profile.zonesGeographiques ?? profile.zones_geographiques as z}
                <span class="px-3 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700">{z}</span>
              {/each}
            </div>
          </div>
        {/if}

        {#if profile.validatedAt ?? profile.validated_at}
          <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size: 16px;">verified</span>
            <p class="text-xs text-emerald-700">
              {$t('admin.user_detail.validated_at', { date: fmtDate(profile.validatedAt ?? profile.validated_at) })}
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Actions -->
    {#if user.role !== 'admin'}
      <div class="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 class="font-display font-bold text-slate-900 mb-1">{$t('admin.user_detail.actions')}</h3>
        <p class="text-xs text-slate-500 mb-5">{$t('admin.user_detail.actions_sub')}</p>

        <div class="flex flex-wrap gap-2">
          {#if !user.isActive && user.role === 'entreprise'}
            <button onclick={valider} disabled={acting}
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-60">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">verified</span>
              {$t('admin.user_detail.validate_btn')}
            </button>
          {/if}

          {#if user.isActive}
            <button onclick={suspendre} disabled={acting}
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-60">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">block</span>
              {$t('admin.user_detail.suspend_btn')}
            </button>
          {:else if user.role !== 'entreprise' || (profile?.validatedAt ?? profile?.validated_at)}
            <button onclick={reactiver} disabled={acting}
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all disabled:opacity-60">
              <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">restart_alt</span>
              {$t('admin.user_detail.reactivate_btn')}
            </button>
          {/if}

          <button onclick={supprimer} disabled={acting}
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-60 ml-auto">
            <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">delete</span>
            {$t('admin.user_detail.delete_btn')}
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
