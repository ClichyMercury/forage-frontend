<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'

  onMount(() => {
    auth.init()
    if (!auth.isAuthenticated()) {
      goto('/login')
    } else {
      const role = auth.user?.role
      if (role === 'admin') goto('/admin/dashboard')
      else if (role === 'entreprise') goto('/entreprise/dashboard')
      else goto('/client/dashboard')
    }
  })
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50">
  <div class="flex flex-col items-center gap-4">
    <div class="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center animate-pulse-blue">
      <span class="material-symbols-outlined text-white icon-filled" style="font-size: 24px;">goutte d'eau</span>
    </div>
    <div class="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p class="text-slate-500 text-sm">Chargement...</p>
  </div>
</div>
