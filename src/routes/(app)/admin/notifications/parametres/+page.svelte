<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t } from '$lib/stores/locale'

  type Setting = { type: string; actif: boolean }

  let settings = $state<Setting[]>([])
  let loading = $state(true)
  let toggling = $state<string | null>(null)

  const meta = $derived<Record<string, { label: string; description: string; icon: string; group: 'demande' | 'offre' | 'compte' | 'message' }>>({
    nouvelle_demande:     { label: $t('notif.settings.nouvelle_demande'),      description: $t('notif.settings.nouvelle_demande_desc'), icon: 'assignment_add',  group: 'demande' },
    demande_validee:      { label: $t('notif.settings.demande_validee'),       description: $t('notif.settings.demande_validee_desc'),  icon: 'verified',        group: 'demande' },
    demande_rejetee:      { label: $t('notif.settings.demande_rejetee'),       description: $t('notif.settings.demande_rejetee_desc'),  icon: 'block',           group: 'demande' },
    appel_offre_lance:    { label: $t('notif.settings.appel_offre_lance'),     description: $t('notif.settings.appel_offre_desc'),      icon: 'campaign',        group: 'offre' },
    offre_soumise:        { label: $t('notif.settings.offre_soumise'),         description: $t('notif.settings.offre_soumise_desc'),    icon: 'send',            group: 'offre' },
    offre_finale_envoyee: { label: $t('notif.settings.offre_finale'),          description: $t('notif.settings.offre_finale_desc'),     icon: 'mark_email_read', group: 'offre' },
    offre_acceptee:       { label: $t('notif.settings.offre_acceptee'),        description: $t('notif.settings.offre_acceptee_desc'),   icon: 'check_circle',    group: 'offre' },
    offre_refusee:        { label: $t('notif.settings.offre_refusee'),         description: $t('notif.settings.offre_refusee_desc'),    icon: 'cancel',          group: 'offre' },
    compte_valide:        { label: $t('notif.settings.compte_valide'),         description: $t('notif.settings.compte_valide_desc'),    icon: 'how_to_reg',      group: 'compte' },
    nouveau_message:      { label: $t('notif.settings.nouveau_message'),       description: $t('notif.settings.nouveau_message_desc'),  icon: 'chat_bubble',     group: 'message' },
  })

  const groupes = $derived([
    { key: 'demande', label: $t('notif.settings.group_demande'), color: '#1e3fff' },
    { key: 'offre',   label: $t('notif.settings.group_offre'),   color: '#475569' },
    { key: 'compte',  label: $t('notif.settings.group_compte'),  color: '#0f172a' },
    { key: 'message', label: $t('notif.settings.group_message'), color: '#1e3fff' },
  ])

  const grouped = $derived(() => {
    const out: Record<string, Setting[]> = { demande: [], offre: [], compte: [], message: [] }
    for (const s of settings) {
      const g = meta[s.type]?.group ?? 'demande'
      out[g].push(s)
    }
    return out
  })

  const stats = $derived(() => ({
    total: settings.length,
    actifs: settings.filter(s => s.actif).length,
    desactives: settings.filter(s => !s.actif).length,
  }))

  onMount(async () => {
    try {
      const res = await api.get('/admin/notifications/settings')
      settings = res.data ?? []
    } catch {} finally { loading = false }
  })

  async function toggle(s: Setting) {
    toggling = s.type
    const newValue = !s.actif
    try {
      await api.patch(`/admin/notifications/settings/${s.type}`, { actif: newValue })
      settings = settings.map(x => x.type === s.type ? { ...x, actif: newValue } : x)
      toast.success(
        newValue ? $t('notif.settings.activated') : $t('notif.settings.deactivated'),
        meta[s.type]?.label ?? s.type,
      )
    } catch (err: any) {
      toast.error('Erreur', err.response?.data?.message)
    } finally { toggling = null }
  }
</script>

<svelte:head><title>{$t('notif.settings.title')} — Admin Forage</title></svelte:head>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="flex items-start gap-3 mb-6">
    <button onclick={() => goto('/admin/notifications')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600 shrink-0">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div class="flex-1 min-w-0">
      <h2 class="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-900 wrap-break-word">
        {$t('notif.settings.title')}
      </h2>
      <p class="text-sm text-slate-500 mt-1">{$t('notif.settings.subtitle')}</p>
    </div>
  </div>

  <!-- Stats -->
  {#if !loading && settings.length > 0}
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{$t('notif.settings.stat_total')}</p>
        <p class="font-display font-black text-2xl lg:text-3xl text-slate-900 mt-2 leading-none tracking-tight">{stats().total}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{$t('notif.settings.stat_active')}</p>
        <p class="font-display font-black text-2xl lg:text-3xl mt-2 leading-none tracking-tight text-emerald-600">{stats().actifs}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-5">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{$t('notif.settings.stat_inactive')}</p>
        <p class="font-display font-black text-2xl lg:text-3xl mt-2 leading-none tracking-tight" style="color: {stats().desactives > 0 ? '#1e3fff' : '#94a3b8'}">{stats().desactives}</p>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="space-y-4">
      {#each [1,2,3,4] as _}<div class="skeleton h-24 rounded-2xl"></div>{/each}
    </div>
  {:else if settings.length === 0}
    <div class="bg-white rounded-2xl border border-slate-100 py-16 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-slate-400" style="font-size: 24px;">notifications_off</span>
      </div>
      <p class="text-slate-600 font-semibold text-sm">{$t('notif.settings.no_types')}</p>
    </div>
  {:else}
    <!-- Liste groupée -->
    <div class="space-y-6">
      {#each groupes as groupInfo}
        {#if grouped()[groupInfo.key]?.length > 0}
          <div>
            <div class="flex items-center gap-2 mb-3 px-1">
              <span class="w-1.5 h-1.5 rounded-full" style="background-color: {groupInfo.color}"></span>
              <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500">{groupInfo.label}</h3>
              <span class="text-xs text-slate-400">·</span>
              <span class="text-xs text-slate-400">{$t('notif.settings.types_count', { count: grouped()[groupInfo.key].length, s: grouped()[groupInfo.key].length > 1 ? 's' : '' })}</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
              {#each grouped()[groupInfo.key] as s}
                {@const m = meta[s.type] ?? { label: s.type, description: '', icon: 'notifications', group: groupInfo.key }}
                <div class="flex items-start gap-4 px-5 py-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                       style="background-color: {s.actif ? (groupInfo.color === '#0f172a' ? '#f1f5f9' : groupInfo.color + '15') : '#f1f5f9'}">
                    <span class="material-symbols-outlined icon-filled" style="font-size: 18px; color: {s.actif ? groupInfo.color : '#94a3b8'}">{m.icon}</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-800 text-sm">{m.label}</p>
                    <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.description}</p>
                    <p class="text-[10px] text-slate-400 mt-1.5 font-mono">{s.type}</p>
                  </div>

                  <!-- Toggle switch -->
                  <button
                    type="button"
                    onclick={() => toggle(s)}
                    disabled={toggling === s.type}
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-60 mt-1"
                    style="background-color: {s.actif ? '#1e3fff' : '#cbd5e1'}"
                    aria-label="{s.actif ? $t('notif.settings.deactivated') : $t('notif.settings.activated')} — {m.label}"
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform"
                      style="transform: translateX({s.actif ? 20 : 0}px)"
                    ></span>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Note explicative -->
    <div class="mt-8 p-4 rounded-2xl border border-brand-200" style="background-color: #eef1ff">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined icon-filled shrink-0 mt-0.5" style="font-size: 20px; color: #1e3fff">info</span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate-800">{$t('notif.settings.about')}</p>
          <p class="text-xs mt-1 leading-relaxed text-slate-500">{$t('notif.settings.about_msg')}</p>
        </div>
      </div>
    </div>
  {/if}
</div>
