<script lang="ts">
  import Toast from '$lib/components/ui/Toast.svelte'
  import '../../app.css'
  let { children } = $props()
</script>

<Toast />

<div class="min-h-screen flex">
  <!-- Panneau gauche — visuel -->
  <div class="hidden lg:flex lg:w-1/2 gradient-blue relative overflow-hidden flex-col justify-between p-12">
    <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
    <div class="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-400/20 blur-2xl"></div>

    <!-- Logo -->
    <div class="relative z-10 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-white icon-filled">water_drop</span>
      </div>
      <span class="text-white font-bold text-xl">ForageCI</span>
    </div>

    <!-- Contenu central -->
    <div class="relative z-10 text-white">
      <h1 class="text-4xl font-bold leading-tight mb-4">
        La plateforme de<br />
        <span class="text-cyan-300">mise en relation</span><br />
        pour le forage
      </h1>
      <p class="text-white/70 text-lg leading-relaxed">
        Connectez clients, entreprises prestataires et administrateurs en toute transparence.
      </p>

      <div class="mt-10 grid grid-cols-3 gap-6">
        {#each [
          { label: 'Demandes', value: '500+', icon: 'assignment' },
          { label: 'Entreprises', value: '80+', icon: 'business' },
          { label: 'Projets réalisés', value: '350+', icon: 'check_circle' },
        ] as stat}
          <div class="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
            <span class="material-symbols-outlined text-cyan-300 icon-filled mb-1" style="font-size: 28px;">{stat.icon}</span>
            <div class="text-2xl font-bold">{stat.value}</div>
            <div class="text-white/60 text-xs mt-1">{stat.label}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="relative z-10 text-white/40 text-sm">© 2025 ForageCI — Côte d'Ivoire</div>
  </div>

  <!-- Panneau droit — formulaire -->
  <div class="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
    <div class="w-full max-w-md animate-fade-in-up">
      {@render children()}
    </div>
  </div>
</div>
