<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let users = $state<any[]>([])
  let loading = $state(true)
  let filtreRole = $state('')
  let acting = $state<number | null>(null)

  // Modale de confirmation
  type ModalConfig = {
    title: string
    message: string
    confirmLabel: string
    confirmClass: string
    icon: string
    onConfirm: () => Promise<void>
  }
  let modal = $state<ModalConfig | null>(null)
  let modalLoading = $state(false)

  async function confirmModal() {
    if (!modal) return
    modalLoading = true
    try {
      await modal.onConfirm()
    } finally {
      modalLoading = false
      modal = null
    }
  }

  async function load() {
    loading = true
    try {
      const url = filtreRole ? `/admin/users?role=${filtreRole}` : '/admin/users'
      const res = await api.get(url)
      users = res.data.data ?? []
    } catch {} finally { loading = false }
  }

  onMount(load)
  $effect(() => { load() })

  async function valider(id: number) {
    acting = id
    try {
      await api.patch(`/admin/users/${id}/valider`)
      users = users.map(u => u.id === id ? { ...u, isActive: true } : u)
      toast.success('Compte validé', "L'entreprise a été notifiée par email.")
    } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
    finally { acting = null }
  }

  function demanderSuspension(id: number, nom: string) {
    modal = {
      title: 'Suspendre le compte',
      message: `Voulez-vous suspendre le compte de ${nom} ? L'utilisateur ne pourra plus se connecter.`,
      confirmLabel: 'Suspendre',
      confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      icon: 'pause_circle',
      onConfirm: async () => {
        acting = id
        try {
          await api.patch(`/admin/users/${id}/suspendre`)
          users = users.map(u => u.id === id ? { ...u, isActive: false } : u)
          toast.success('Compte suspendu', `${nom} ne peut plus se connecter.`)
        } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
        finally { acting = null }
      }
    }
  }

  async function reactiver(id: number) {
    acting = id
    try {
      await api.patch(`/admin/users/${id}/reactiver`)
      users = users.map(u => u.id === id ? { ...u, isActive: true } : u)
      toast.success('Compte réactivé', "L'utilisateur peut à nouveau se connecter.")
    } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
    finally { acting = null }
  }

  function demanderSuppression(id: number, nom: string) {
    modal = {
      title: 'Supprimer le compte',
      message: `Vous êtes sur le point de supprimer définitivement le compte de ${nom}. Cette action est irréversible et supprimera toutes les données associées.`,
      confirmLabel: 'Supprimer définitivement',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'delete_forever',
      onConfirm: async () => {
        acting = id
        try {
          await api.delete(`/admin/users/${id}`)
          users = users.filter(u => u.id !== id)
          toast.success('Compte supprimé', `Le compte de ${nom} a été supprimé.`)
        } catch (err: any) { toast.error('Erreur', err.response?.data?.message) }
        finally { acting = null }
      }
    }
  }
</script>

<svelte:head><title>Utilisateurs — Admin</title></svelte:head>

<!-- Modale de confirmation -->
{#if modal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-down">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <!-- Header modale -->
      <div class="px-6 pt-6 pb-4 flex items-start gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
          {modal.icon === 'delete_forever' ? 'bg-red-100' : 'bg-amber-100'}">
          <span class="material-symbols-outlined icon-filled {modal.icon === 'delete_forever' ? 'text-red-600' : 'text-amber-600'}" style="font-size: 22px;">
            {modal.icon}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-display font-bold text-slate-900 text-lg">{modal.title}</h3>
          <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">{modal.message}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 pb-6 flex gap-3 justify-end">
        <button
          onclick={() => modal = null}
          disabled={modalLoading}
          class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-60">
          Annuler
        </button>
        <button
          onclick={confirmModal}
          disabled={modalLoading}
          class="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center gap-2 {modal.confirmClass}">
          {#if modalLoading}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">{modal.icon}</span>
          {/if}
          {modal.confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="mb-5 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
      Gestion des <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #1e3fff">utilisateurs</span>.
    </h2>
    <p class="text-sm text-slate-500 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''} au total.</p>
  </div>
</div>

<!-- Filtres -->
<div class="flex gap-2 mb-4">
  {#each [{ value: '', label: 'Tous' }, { value: 'client', label: 'Clients' }, { value: 'entreprise', label: 'Entreprises' }] as f}
    <button onclick={() => filtreRole = f.value}
      class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border
        {filtreRole === f.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
      {f.label}
    </button>
  {/each}
</div>

<!-- Tableau -->
<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
  {#if loading}
    <div class="p-5 space-y-3">{#each [1,2,3,4] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
  {:else if users.length === 0}
    <div class="py-14 text-center text-slate-400">
      <span class="material-symbols-outlined" style="font-size: 32px;">group</span>
      <p class="text-sm mt-2">Aucun utilisateur trouvé</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      <div class="col-span-4">Utilisateur</div>
      <div class="col-span-2">Rôle</div>
      <div class="col-span-2">Statut</div>
      <div class="col-span-2">Inscription</div>
      <div class="col-span-2 text-right">Actions</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each users as u}
        <div class="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center px-5 py-4  ">
          <a href="/admin/utilisateurs/{u.id}" class="flex items-center gap-3 min-w-0 group lg:col-span-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                 style="background-color: {u.role === 'entreprise' ? '#475569' : '#1e3fff'}">
              {(u.fullName ?? u.email).charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">{u.fullName ?? u.email}</p>
              <p class="text-xs text-slate-400 truncate">{u.email}</p>
            </div>
          </a>
          <div class="flex items-center gap-2 flex-wrap pl-13 lg:pl-0 lg:col-span-2">
            <span class="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                  style="background-color: {u.role === 'entreprise' ? '#f1f5f9' : '#eef1ff'}; color: {u.role === 'entreprise' ? '#334155' : '#1226a8'}">
              {u.role}
            </span>
          </div>
          <div class="flex items-center gap-2 flex-wrap pl-13 lg:pl-0 lg:col-span-2">
            <span class="text-xs px-2.5 py-1 rounded-full font-semibold {u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}">
              {u.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div class="flex items-center gap-1 pl-13 lg:pl-0 lg:col-span-2">
            <span class="text-xs lg:hidden text-slate-400">Inscrit :</span>
            <span class="text-xs text-slate-400">
              {new Date(u.createdAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div class="flex items-center gap-1 lg:justify-end lg:col-span-2 pl-13 lg:pl-0 flex-wrap">
            {#if !u.isActive && u.role === 'entreprise'}
              <button onclick={() => valider(u.id)} disabled={acting === u.id}
                class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all disabled:opacity-60 border border-emerald-200">
                Valider
              </button>
            {/if}
            {#if u.isActive}
              <button onclick={() => demanderSuspension(u.id, u.fullName ?? u.email)} disabled={acting === u.id}
                class="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-60" title="Suspendre">
                <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">pause_circle</span>
              </button>
            {:else}
              <button onclick={() => reactiver(u.id)} disabled={acting === u.id}
                class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-60" title="Réactiver">
                <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">play_circle</span>
              </button>
            {/if}
            <button onclick={() => demanderSuppression(u.id, u.fullName ?? u.email)} disabled={acting === u.id}
              class="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all disabled:opacity-60" title="Supprimer">
              <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">delete</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
