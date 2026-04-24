<script lang="ts">
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let { docId, nomFichier, variant = 'link' } = $props<{
    docId: number
    nomFichier: string
    variant?: 'link' | 'button'
  }>()

  let downloading = $state(false)

  async function download() {
    downloading = true
    try {
      const res = await api.get(`/documents/${docId}/download`, {
        responseType: 'blob',
      })
      // Créer un lien temporaire pour déclencher le téléchargement
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = nomFichier
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Erreur', 'Impossible de télécharger le fichier.')
    } finally {
      downloading = false
    }
  }
</script>

{#if variant === 'button'}
  <button onclick={download} disabled={downloading}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-all border border-blue-200 disabled:opacity-60">
    {#if downloading}
      <span class="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></span>
    {:else}
      <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">download</span>
    {/if}
    {nomFichier}
  </button>
{:else}
  <button onclick={download} disabled={downloading}
    class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-all group w-full text-left border border-slate-100 disabled:opacity-60">
    <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-500 icon-filled shrink-0" style="font-size: 18px;">description</span>
    <span class="flex-1 text-sm text-slate-700 truncate">{nomFichier}</span>
    {#if downloading}
      <span class="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin shrink-0"></span>
    {:else}
      <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-500 shrink-0" style="font-size: 16px;">download</span>
    {/if}
  </button>
{/if}
