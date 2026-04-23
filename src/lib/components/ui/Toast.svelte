<script lang="ts">
  import { toast } from '$lib/stores/toast.svelte'

  const icons: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }

  const colors: Record<string, string> = {
    success: 'from-emerald-500 to-teal-500',
    error: 'from-red-500 to-rose-500',
    warning: 'from-amber-500 to-orange-500',
    info: 'from-blue-500 to-indigo-500',
  }

  const bgColors: Record<string, string> = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const textColors: Record<string, string> = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  }
</script>

<!-- Toast container — haut droite -->
<div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none" style="min-width: 320px; max-width: 400px;">
  {#each toast.toasts as t (t.id)}
    <div
      class="pointer-events-auto animate-slide-in-right flex items-start gap-3 rounded-2xl border p-4 shadow-xl {bgColors[t.type]}"
      style="backdrop-filter: blur(8px);"
    >
      <!-- Icône avec gradient -->
      <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br {colors[t.type]} flex items-center justify-center shadow-md">
        <span class="material-symbols-outlined text-white icon-filled" style="font-size: 18px;">
          {icons[t.type]}
        </span>
      </div>

      <!-- Contenu -->
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm {textColors[t.type]}">{t.title}</p>
        {#if t.message}
          <p class="text-xs mt-0.5 opacity-80 {textColors[t.type]}">{t.message}</p>
        {/if}
      </div>

      <!-- Bouton fermer -->
      <button
        onclick={() => toast.remove(t.id)}
        class="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity {textColors[t.type]}"
      >
        <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
      </button>
    </div>
  {/each}
</div>
