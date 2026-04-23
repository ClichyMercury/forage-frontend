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

<div class="flex gap-6 h-[calc(100vh-180px)]">
  <!-- Liste des demandes -->
  <div class="w-72 shrink-0 bg-white rounded-2xl card-shadow overflow-hidden flex flex-col">
    <div class="px-4 py-3.5 border-b border-slate-100">
      <h3 class="font-bold text-slate-800">Conversations</h3>
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
              {selectedDemande?.id === d.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
              {unread > 0 ? 'bg-red-50/30' : ''}">
            <div class="relative shrink-0">
              <div class="w-9 h-9 rounded-xl {unread > 0 ? 'bg-red-100' : 'gradient-blue-soft'} flex items-center justify-center">
                <span class="material-symbols-outlined icon-filled {unread > 0 ? 'text-red-500' : 'text-blue-500'}" style="font-size: 16px;">
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
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Zone de chat -->
  <div class="flex-1 bg-white rounded-2xl card-shadow overflow-hidden flex flex-col">
    {#if !selectedDemande}
      <div class="flex-1 flex flex-col items-center justify-center text-slate-400">
        <div class="w-16 h-16 rounded-2xl gradient-blue-soft flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-blue-400" style="font-size: 32px;">chat</span>
        </div>
        <p class="font-medium text-slate-500">Sélectionnez une conversation</p>
        <p class="text-sm mt-1">pour voir les messages</p>
      </div>
    {:else}
      <!-- Header chat -->
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center">
            <span class="material-symbols-outlined text-white icon-filled" style="font-size: 16px;">water_drop</span>
          </div>
          <div>
            <p class="font-semibold text-slate-800 text-sm">{selectedDemande.localisationAdresse ?? `Demande #${selectedDemande.id}`}</p>
            <p class="text-xs text-slate-400">Mise à jour toutes les 15s</p>
          </div>
        </div>
        {#if auth.user?.role === 'admin'}
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-medium">Répondre à :</span>
            <select bind:value={adminReceiverId}
              class="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium">
              {#if selectedDemande.clientId}
                <option value={selectedDemande.clientId}>👤 {selectedDemande.clientNom ?? 'Client'}</option>
              {/if}
              {#each entreprisesAO as e}
                <option value={e.id}>🏢 {e.fullName ?? e.email}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>

      <!-- Messages -->
      <div bind:this={chatEl} class="flex-1 overflow-y-auto p-5 space-y-3">
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
            <div class="flex {isMine ? 'justify-end' : 'justify-start'}">
              <div class="max-w-xs lg:max-w-md">
                {#if !isMine}
                  <p class="text-xs text-slate-400 mb-1 ml-1 flex items-center gap-1">
                    {msg.sender?.fullName ?? msg.sender?.email ?? 'Expéditeur'}
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] capitalize
                      {msg.sender?.role === 'admin' ? 'bg-indigo-100 text-indigo-600' :
                       msg.sender?.role === 'entreprise' ? 'bg-amber-100 text-amber-600' :
                       'bg-blue-100 text-blue-600'}">
                      {msg.sender?.role ?? ''}
                    </span>
                  </p>
                {/if}
                <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  {isMine ? 'gradient-blue text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}">
                  {msg.contenu}
                </div>
                <p class="text-xs text-slate-400 mt-1 {isMine ? 'text-right mr-1' : 'ml-1'}">
                  {new Date(msg.createdAt).toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' })}
                  {#if isMine}
                    <span class="ml-1 text-slate-300">✓</span>
                  {/if}
                </p>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Saisie message -->
      <div class="px-5 py-4 border-t border-slate-100">
        <div class="flex gap-3">
          <textarea
            bind:value={newMessage}
            onkeydown={handleKey}
            rows="1"
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            class="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none transition-all"
            style="min-height: 44px; max-height: 120px;"
          ></textarea>
          <button onclick={sendMessage} disabled={sending || !newMessage.trim()}
            class="w-11 h-11 rounded-xl gradient-blue text-white flex items-center justify-center shadow-md hover:scale-[1.05] transition-all disabled:opacity-50 shrink-0">
            {#if sending}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">send</span>
            {/if}
          </button>
        </div>
        <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
          <span class="material-symbols-outlined icon-filled" style="font-size: 12px;">mail</span>
          Le destinataire reçoit aussi un email de notification
        </p>
      </div>
    {/if}
  </div>
</div>
