<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { msgStore } from '$lib/stores/messages.svelte'

  let demandes = $state<any[]>([])
  let selectedDemande = $state<any>(null)
  let messages = $state<any[]>([])
  let newMessage = $state('')
  let loading = $state(true)
  let sending = $state(false)
  let loadingMessages = $state(false)
  let adminReceiverId = $state<number | null>(null)
  let entreprisesAO = $state<any[]>([])
  let pollInterval: ReturnType<typeof setInterval> | null = null
  let chatEl: HTMLDivElement

  onMount(async () => {
    try {
      const role = auth.user?.role
      if (role === 'client') {
        const res = await api.get('/demandes')
        demandes = res.data ?? []
      } else if (role === 'entreprise') {
        const res = await api.get('/appels-offres')
        demandes = (res.data.data ?? [])
          .map((ao: any) => ({
            id: ao.demande?.id ?? ao.demandeId,
            localisationAdresse: ao.demande?.localisation_adresse ?? `AO #${ao.id}`,
            typeForage: ao.demande?.type_forage ?? '',
          }))
          .filter((d: any) => d.id)
      } else {
        const res = await api.get('/admin/demandes?limit=50')
        demandes = (res.data.data ?? []).map((d: any) => ({
          ...d,
          clientId: d.clientId ?? d.client_id ?? d.client?.id,
          clientNom: d.client?.fullName ?? d.client?.email ?? 'Client',
        }))
      }
    } catch {} finally { loading = false }
  })

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval)
  })

  async function selectDemande(demande: any) {
    selectedDemande = demande
    adminReceiverId = demande.clientId ?? null
    loadingMessages = true

    if (auth.user?.role === 'admin') {
      try {
        const res = await api.get('/admin/appels-offres')
        const allAO = res.data.data ?? res.data ?? []
        const ao = allAO.find((a: any) =>
          (a.demandeId ?? a.demande_id) === demande.id
        )
        entreprisesAO = ao?.entreprises ?? []
      } catch { entreprisesAO = [] }
    }

    await loadMessages(true)

    // Polling toutes les 15s — sans toast, juste mise à jour silencieuse
    if (pollInterval) clearInterval(pollInterval)
    pollInterval = setInterval(() => loadMessages(false), 15000)
  }

  async function loadMessages(initial = false) {
    if (!selectedDemande) return
    try {
      const res = await api.get(`/demandes/${selectedDemande.id}/messages`)
      const fetched: any[] = res.data ?? []

      // Détecter nouveaux messages reçus (pas les miens)
      if (!initial && fetched.length > messages.length) {
        const userId = auth.user?.id
        const nouveaux = fetched.slice(messages.length).filter(
          (m) => m.senderId !== userId && m.sender_id !== userId
        )
        if (nouveaux.length > 0) {
          // Mettre à jour le store seulement pour les messages non lus reçus
          // Le badge reste jusqu'à ce que l'utilisateur lise (scroll en bas)
          msgStore.loadUnread()
        }
      }

      messages = fetched

      // Marquer comme lus uniquement si la conversation est visible et scrollée en bas
      if (chatEl) {
        const isAtBottom = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 100
        if (isAtBottom) {
          msgStore.markDemandeRead(selectedDemande.id)
        }
      }
    } catch {}
    loadingMessages = false
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedDemande) return
    sending = true
    const content = newMessage
    newMessage = '' // Vider immédiatement pour UX fluide

    try {
      const body: any = { contenu: content }

      if (auth.user?.role === 'admin') {
        if (!adminReceiverId) {
          toast.error('Destinataire requis', 'Choisissez à qui envoyer le message.')
          newMessage = content
          sending = false
          return
        }
        body.receiverId = adminReceiverId
      }

      const res = await api.post(`/demandes/${selectedDemande.id}/messages`, body)
      messages = [...messages, res.data]
      toast.success('Message envoyé')
    } catch (err: any) {
      newMessage = content // Remettre le message en cas d'erreur
      toast.error('Erreur', err.response?.data?.message)
    } finally { sending = false }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Scroll automatique vers le bas + marquer comme lu quand on arrive en bas
  $effect(() => {
    if (messages.length > 0 && chatEl) {
      setTimeout(() => {
        chatEl.scrollTop = chatEl.scrollHeight
        // Marquer comme lu quand on voit les messages
        if (selectedDemande) msgStore.markDemandeRead(selectedDemande.id)
      }, 50)
    }
  })
</script>

<div class="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-180px)]">
  <!-- Liste des demandes : pleine largeur mobile (cachée si conversation ouverte), 288px desktop -->
  <div class="w-full lg:w-72 lg:shrink-0 bg-white rounded-2xl card-shadow overflow-hidden flex-col
              {selectedDemande ? 'hidden lg:flex' : 'flex'}">
    <div class="px-4 py-3.5 border-b border-slate-100">
      <h3 class="font-display font-bold text-slate-900">Conversations</h3>
      <p class="text-xs text-slate-400 mt-0.5">Mise à jour automatique</p>
    </div>
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <div class="p-4 space-y-2">{#each [1,2,3] as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
      {:else if demandes.length === 0}
        <div class="py-12 text-center text-slate-400 px-4">
          <span class="material-symbols-outlined" style="font-size: 32px;">chat</span>
          <p class="text-sm mt-2">Aucune conversation</p>
        </div>
      {:else}
        {#each demandes as d}
          {@const unread = msgStore.unreadByDemande[d.id] ?? 0}
          <button onclick={() => selectDemande(d)}
            class="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-all border-b border-slate-50
              {selectedDemande?.id === d.id ? 'bg-brand-50 lg:border-l-2 lg:border-l-brand-600' : ''}
              {unread > 0 ? 'bg-red-50/30' : ''}">
            <div class="relative shrink-0">
              <div class="w-10 h-10 rounded-xl {unread > 0 ? 'bg-red-100' : 'bg-brand-50'} flex items-center justify-center">
                <span class="material-symbols-outlined icon-filled {unread > 0 ? 'text-red-500' : 'text-brand-600'}" style="font-size: 16px;">
                  {unread > 0 ? 'mark_chat_unread' : 'water_drop'}
                </span>
              </div>
              {#if unread > 0}
                <span class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-md">
                  {unread > 9 ? '9+' : unread}
                </span>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm truncate {unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}">
                {d.localisationAdresse ?? `Demande #${d.id}`}
              </p>
              <p class="text-xs truncate {unread > 0 ? 'text-red-500 font-medium' : 'text-slate-400 capitalize'}">
                {unread > 0 ? `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}` : (d.typeForage ?? '')}
              </p>
            </div>
            <span class="material-symbols-outlined text-slate-300 lg:hidden" style="font-size: 18px;">chevron_right</span>
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Zone de chat : pleine largeur mobile (cachée si pas de conversation), flex-1 desktop -->
  <div class="flex-1 bg-white rounded-2xl card-shadow overflow-hidden flex-col
              {selectedDemande ? 'flex' : 'hidden lg:flex'}">
    {#if !selectedDemande}
      <div class="flex-1 flex flex-col items-center justify-center text-slate-400">
        <div class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-brand-400" style="font-size: 32px;">chat</span>
        </div>
        <p class="font-medium text-slate-500">Sélectionnez une conversation</p>
        <p class="text-sm mt-1">pour voir les messages</p>
      </div>
    {:else}
      <!-- Header chat -->
      <div class="px-4 lg:px-5 py-3 lg:py-3.5 border-b border-slate-100 flex items-center gap-2">
        <!-- Bouton retour mobile -->
        <button
          type="button"
          onclick={() => { selectedDemande = null; if (pollInterval) clearInterval(pollInterval) }}
          class="lg:hidden w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 transition-all"
          aria-label="Retour aux conversations"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
        </button>

        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background-color: #1e3fff">
            <span class="material-symbols-outlined text-white icon-filled" style="font-size: 16px;">
              {auth.user?.role === 'admin' ? 'forum' : 'support_agent'}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            {#if auth.user?.role === 'admin'}
              <p class="font-semibold text-slate-800 text-sm truncate">{selectedDemande.localisationAdresse ?? `Demande #${selectedDemande.id}`}</p>
              <p class="text-xs text-slate-400">Mise à jour toutes les 15s</p>
            {:else}
              <p class="font-semibold text-slate-800 text-sm flex items-center gap-1.5 truncate">
                Équipe Forage
                <span class="material-symbols-outlined icon-filled text-slate-400 shrink-0" style="font-size: 13px;">verified</span>
              </p>
              <p class="text-xs text-slate-400 truncate">{selectedDemande.localisationAdresse ?? `Demande #${selectedDemande.id}`}</p>
            {/if}
          </div>
        </div>

        <!-- Sélecteur destinataire (admin) ou badge privé -->
        {#if auth.user?.role === 'admin'}
          <select bind:value={adminReceiverId}
            class="text-xs px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium shrink-0 max-w-[140px] sm:max-w-none truncate">
            {#if selectedDemande.clientId}
              <option value={selectedDemande.clientId}>👤 {selectedDemande.clientNom ?? 'Client'}</option>
            {/if}
            {#each entreprisesAO as e}
              <option value={e.id}>🏢 {e.fullName ?? e.email}</option>
            {/each}
          </select>
        {:else}
          <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 shrink-0">
            <span class="material-symbols-outlined icon-filled text-emerald-600" style="font-size: 13px;">lock</span>
            <span class="text-[11px] font-semibold text-emerald-700">Privée</span>
          </div>
        {/if}
      </div>

      {#if auth.user?.role !== 'admin'}
        <div class="px-4 lg:px-5 py-2 bg-brand-50/60 border-b border-brand-100">
          <p class="text-[11px] text-brand-700 flex items-start gap-1.5 leading-snug">
            <span class="material-symbols-outlined icon-filled shrink-0 mt-0.5" style="font-size: 13px;">info</span>
            <span>Conversation privée et sécurisée par la plateforme. {auth.user?.role === 'client' ? "Les prestataires ne voient pas ce fil." : "Le client ne voit pas ce fil."}</span>
          </p>
        </div>
      {/if}

      <!-- Messages -->
      <div bind:this={chatEl} class="flex-1 overflow-y-auto p-4 lg:p-5 space-y-3">
        {#if loadingMessages}
          <div class="space-y-3">{#each [1,2,3] as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
        {:else if messages.length === 0}
          <div class="text-center text-slate-400 py-8">
            <span class="material-symbols-outlined" style="font-size: 32px;">chat_bubble</span>
            <p class="text-sm mt-2">Aucun message — commencez la conversation</p>
          </div>
        {:else}
          {#each messages as msg}
            {@const isMine = msg.senderId === auth.user?.id || msg.sender_id === auth.user?.id}
            {@const isAdmin = auth.user?.role === 'admin'}
            {@const otherParty = msg.sender?.role === 'admin' ? msg.receiver : msg.sender}
            {@const canalRole = otherParty?.role}
            <div class="flex {isMine ? 'justify-end' : 'justify-start'}">
              <div class="max-w-[85%] sm:max-w-xs lg:max-w-md">
                {#if !isMine}
                  <p class="text-xs text-slate-400 mb-1 ml-1 flex items-center gap-1 flex-wrap">
                    <span class="truncate">{msg.sender?.fullName ?? msg.sender?.email ?? 'Expéditeur'}</span>
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] capitalize shrink-0
                      {msg.sender?.role === 'admin' ? 'bg-slate-100 text-slate-600' :
                       msg.sender?.role === 'entreprise' ? 'bg-terre-100 text-terre-700' :
                       'bg-brand-100 text-brand-700'}">
                      {msg.sender?.role ?? ''}
                    </span>
                  </p>
                {/if}
                <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  {isMine ? 'text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}"
                  style={isMine ? 'background-color: #1e3fff' : ''}>
                  {msg.contenu}
                </div>
                <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap {isMine ? 'justify-end mr-1' : 'ml-1'}">
                  {#if isAdmin && canalRole}
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium max-w-[180px] truncate
                      {canalRole === 'entreprise' ? 'bg-terre-50 text-terre-700 border border-terre-200' : 'bg-brand-50 text-brand-700 border border-brand-200'}">
                      <span class="material-symbols-outlined icon-filled shrink-0" style="font-size: 11px;">
                        {canalRole === 'entreprise' ? 'business' : 'person'}
                      </span>
                      <span class="truncate">Canal {canalRole === 'entreprise' ? `Entreprise · ${otherParty?.fullName ?? otherParty?.email ?? ''}` : 'Client'}</span>
                    </span>
                  {/if}
                  <span>{new Date(msg.createdAt).toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' })}</span>
                  {#if isMine}
                    <span class="text-slate-300">✓</span>
                  {/if}
                </p>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Saisie message -->
      <div class="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-100">
        <div class="flex gap-2 lg:gap-3">
          <textarea
            bind:value={newMessage}
            onkeydown={handleKey}
            rows="1"
            placeholder="Écrivez votre message…"
            class="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none transition-all min-w-0"
            style="min-height: 44px; max-height: 120px;"
          ></textarea>
          <button onclick={sendMessage} disabled={sending || !newMessage.trim()}
            class="w-11 h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md transition-all disabled:opacity-50 shrink-0">
            {#if sending}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">send</span>
            {/if}
          </button>
        </div>
        <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
          <span class="material-symbols-outlined icon-filled" style="font-size: 12px;">mail</span>
          <span class="hidden sm:inline">Le destinataire reçoit aussi un email de notification</span>
          <span class="sm:hidden">Email envoyé au destinataire</span>
        </p>
      </div>
    {/if}
  </div>
</div>
