<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'
  import { fileUrl } from '$lib/utils/file-url'

  let loading = $state(true)
  let saving = $state(false)
  let user = $state<any>(null)
  let errors = $state<Record<string, string>>({})

  let fileInput = $state<HTMLInputElement | null>(null)
  let avatarPreview = $state<string | null>(null)
  let uploadingAvatar = $state(false)

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE = 2 * 1024 * 1024

  function triggerFilePicker() { fileInput?.click() }

  function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      toast.error($t('profile.avatar_format_err'), $t('profile.avatar_format_sub'))
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error($t('profile.avatar_size_err'), $t('profile.avatar_size_sub'))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => { avatarPreview = ev.target?.result as string }
    reader.readAsDataURL(file)
    uploadAvatar(file)
  }

  async function uploadAvatar(file: File) {
    uploadingAvatar = true
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await api.post('/account/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = res.data?.data ?? res.data
      const newAvatarUrl = updated.avatarUrl ?? updated.avatar_url ?? null
      user = { ...user, avatarUrl: newAvatarUrl }
      avatarPreview = null
      if (auth.user) auth.update({ avatarUrl: newAvatarUrl })
      toast.success($t('profile.avatar_updated'), $t('profile.avatar_updated_sub'))
    } catch (err: any) {
      avatarPreview = null
      toast.error($t('profile.avatar_upload_err'), err.response?.data?.message ?? $t('common.error_save'))
    } finally {
      uploadingAvatar = false
      if (fileInput) fileInput.value = ''
    }
  }

  async function removeAvatar() {
    if (!confirm($t('profile.avatar_removed') + ' ?')) return
    uploadingAvatar = true
    try {
      await api.delete('/account/profile/avatar')
      user = { ...user, avatarUrl: null }
      avatarPreview = null
      if (auth.user) auth.update({ avatarUrl: null })
      toast.success($t('profile.avatar_removed'), $t('profile.avatar_removed_sub'))
    } catch (err: any) {
      toast.error($t('common.error_save'), err.response?.data?.message ?? $t('profile.avatar_delete_err'))
    } finally { uploadingAvatar = false }
  }

  const currentAvatar = $derived(
    avatarPreview ?? (user?.avatarUrl ?? user?.avatar_url
      ? fileUrl(user?.avatarUrl ?? user?.avatar_url)
      : null)
  )

  let fullName = $state('')
  let telephone = $state('')
  let userType = $state<'particulier' | 'entreprise'>('particulier')

  onMount(async () => {
    try {
      const res = await api.get('/account/profile')
      user = res.data?.data ?? res.data
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
      const updated = res.data?.data ?? res.data
      user = { ...user, ...updated, avatarUrl: updated.avatarUrl ?? updated.avatar_url ?? user.avatarUrl }
      if (auth.user) auth.update({ fullName: user.fullName, telephone: user.telephone, userType: user.userType })
      toast.success($t('profile.updated'), $t('profile.updated_sub'))
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
      } else {
        toast.error($t('common.error_save'), data?.message ?? $t('profile.update_err'))
      }
    } finally { saving = false }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' })
  }
</script>

<div class="max-w-3xl mx-auto">
  <div class="mb-8">
    <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
      {$t('profile.title')}
    </h2>
    <p class="text-sm text-slate-500 mt-1">{$t('profile.subtitle')}</p>
  </div>

  {#if loading}
    <div class="space-y-4">
      {#each [1,2,3] as _}<div class="skeleton h-24 rounded-2xl"></div>{/each}
    </div>
  {:else if user}

    <div class="bg-white rounded-2xl border border-slate-100 p-6 mb-5">
      <div class="flex items-center gap-4 mb-6">
        <div class="relative shrink-0 group">
          <button type="button" onclick={triggerFilePicker} disabled={uploadingAvatar}
            class="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            title={$t('profile.avatar_title')}>
            {#if uploadingAvatar}
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center" style="background-color: #1e3fff">
                <span class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              </div>
            {:else if currentAvatar}
              <img src={currentAvatar} alt={user.fullName ?? 'Profil'} class="w-16 h-16 rounded-2xl object-cover" />
            {:else}
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-display font-black" style="background-color: #1e3fff">
                {user.initials ?? '?'}
              </div>
            {/if}
            {#if !uploadingAvatar}
              <div class="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="material-symbols-outlined text-white icon-filled" style="font-size: 20px;">photo_camera</span>
              </div>
            {/if}
          </button>

          {#if currentAvatar && !uploadingAvatar}
            <button type="button" onclick={removeAvatar}
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-sm"
              title={$t('common.delete')}>
              <span class="material-symbols-outlined icon-filled" style="font-size: 12px;">close</span>
            </button>
          {/if}
        </div>

        <input bind:this={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden" onchange={onFileChange} />

        <div class="min-w-0 flex-1">
          <p class="font-display font-bold text-lg text-slate-900 truncate">{user.fullName ?? user.email}</p>
          <p class="text-sm text-slate-500 truncate">{user.email}</p>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                  style="background-color: {user.role === 'entreprise' ? '#f1f5f9' : '#eef1ff'}; color: {user.role === 'entreprise' ? '#334155' : '#1226a8'}">
              {user.role}
            </span>
            {#if user.isActive}
              <span class="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">check_circle</span>
                {$t('profile.active')}
              </span>
            {:else}
              <span class="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size: 11px;">schedule</span>
                {$t('profile.pending')}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-slate-100">
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('profile.member_since')}</p>
          <p class="text-sm font-semibold text-slate-700">{fmtDate(user.createdAt)}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-1">{$t('profile.last_update')}</p>
          <p class="text-sm font-semibold text-slate-700">{fmtDate(user.updatedAt)}</p>
        </div>
      </div>
    </div>

    <form onsubmit={handleSubmit} class="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <div>
        <h3 class="font-display font-bold text-slate-900 mb-1">{$t('profile.info_section')}</h3>
        <p class="text-xs text-slate-500">{$t('profile.info_sub')}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-name">{$t('profile.full_name')}</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">person</span>
          <input id="profile-name" type="text" bind:value={fullName} placeholder="Jean Dupont"
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
            class:border-red-400={errors.fullName} />
        </div>
        {#if errors.fullName}<p class="text-red-500 text-xs mt-1">{errors.fullName}</p>{/if}
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-email">Email</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">mail</span>
          <input id="profile-email" type="email" value={user.email} readonly disabled
            class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-500 cursor-not-allowed" />
          <span class="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300" style="font-size: 18px;">lock</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">{$t('profile.email_readonly')}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-tel">{$t('profile.phone')}</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">phone</span>
          <input id="profile-tel" type="tel" bind:value={telephone} placeholder="+237 6XX XXX XXX"
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
            class:border-red-400={errors.telephone} />
        </div>
        {#if errors.telephone}<p class="text-red-500 text-xs mt-1">{errors.telephone}</p>{/if}
      </div>

      {#if user.role === 'client'}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5" for="profile-type">{$t('profile.account_type')}</label>
          <select id="profile-type" bind:value={userType}
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all">
            <option value="particulier">{$t('profile.particulier')}</option>
            <option value="entreprise">{$t('common.entreprise')}</option>
          </select>
          {#if errors.userType}<p class="text-red-500 text-xs mt-1">{errors.userType}</p>{/if}
        </div>
      {/if}

      <div class="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          class="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-sm disabled:opacity-60">
          {#if saving}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {$t('profile.saving')}
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">check</span>
            {$t('profile.save')}
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
