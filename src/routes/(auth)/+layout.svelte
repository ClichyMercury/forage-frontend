<script lang="ts">
  import Toast from '$lib/components/ui/Toast.svelte'
  import '../../app.css'
  let { children } = $props()
</script>

<Toast />

<div class="min-h-screen flex">
  <!-- Panneau gauche — visuel brand -->
  <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style="background-color: #1e3fff">

    <!-- Décorations forage -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <!-- Goutte XL en haut droite -->
      <svg class="absolute top-[8%] right-[10%] animate-float-slow" width="180" height="180" viewBox="0 0 100 100" style="opacity: 0.55">
        <path d="M50 5 C50 5, 18 42, 18 65 C18 83, 33 95, 50 95 C67 95, 82 83, 82 65 C82 42, 50 5, 50 5 Z" fill="#ffffff" />
      </svg>
      <!-- Mire au milieu -->
      <svg class="absolute top-[42%] right-[35%] animate-float-slower" width="90" height="90" viewBox="0 0 100 100" fill="none" stroke="#ffffff" stroke-width="3" style="opacity: 0.3">
        <circle cx="50" cy="50" r="42" />
        <circle cx="50" cy="50" r="28" />
        <circle cx="50" cy="50" r="14" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
      </svg>
      <!-- Couches géo en bas (terre) -->
      <svg class="absolute bottom-[10%] left-[8%] animate-float-slow" width="100" height="100" viewBox="0 0 100 100" style="opacity: 0.55; animation-delay: -3s">
        <ellipse cx="50" cy="20" rx="42" ry="10" fill="#d99c6f" />
        <path d="M8 20 L8 38 C8 44, 26 50, 50 50 C74 50, 92 44, 92 38 L92 20" fill="#d99c6f" opacity="0.85" />
        <path d="M8 50 L8 68 C8 74, 26 80, 50 80 C74 80, 92 74, 92 68 L92 50" fill="#d99c6f" opacity="0.7" />
      </svg>
      <!-- Petite goutte terre -->
      <svg class="absolute top-[18%] left-[18%] animate-float-slower" width="50" height="50" viewBox="0 0 100 100" style="opacity: 0.5; animation-delay: -5s">
        <path d="M50 5 C50 5, 18 42, 18 65 C18 83, 33 95, 50 95 C67 95, 82 83, 82 65 C82 42, 50 5, 50 5 Z" fill="#d99c6f" />
      </svg>

      <!-- Halos -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.18),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_95%,rgba(179,93,46,0.22),transparent_45%)]"></div>
    </div>

    <!-- Logo -->
    <div class="relative z-10 flex items-center gap-2.5">
      <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
        <span class="material-symbols-outlined text-white icon-filled">water_drop</span>
      </div>
      <span class="text-white font-display font-black text-xl tracking-tight">ForageCI</span>
    </div>

    <!-- Contenu central -->
    <div class="relative z-10 text-white">
      <h1 class="font-display font-black leading-[0.95] tracking-tight mb-6" style="font-size: clamp(2.5rem, 4.5vw, 4rem)">
        Le forage,<br />
        <span class="italic font-light relative inline-block" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: #e9c2a3">
          simplifié.
          <span class="absolute -bottom-1.5 left-0 right-0 h-1 rounded-full" style="background-color: #b35d2e"></span>
        </span>
      </h1>
      <p class="text-white/85 text-lg leading-relaxed max-w-md">
        Soumettez votre projet, recevez les meilleures offres, signez en toute confiance.
      </p>

      <div class="mt-10 grid grid-cols-3 gap-4 max-w-md">
        {#each [
          { value: '100%', label: 'Budget protégé', accent: true },
          { value: '500+', label: 'Demandes', accent: false },
          { value: '80+', label: 'Entreprises', accent: false },
        ] as stat}
          <div class="pl-3 border-l-2" style="border-color: {stat.accent ? '#b35d2e' : 'rgba(255,255,255,0.3)'}">
            <p class="font-display font-black text-2xl tracking-tight" style="color: {stat.accent ? '#e9c2a3' : '#ffffff'}">{stat.value}</p>
            <p class="text-xs mt-1" style="color: {stat.accent ? 'rgba(233,194,163,0.85)' : 'rgba(255,255,255,0.7)'}">{stat.label}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="relative z-10 text-white/40 text-xs">© 2026 ForageCI — Côte d'Ivoire</div>
  </div>

  <!-- Panneau droit — formulaire -->
  <div class="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
    <div class="w-full max-w-md animate-fade-in-up">
      {@render children()}
    </div>
  </div>
</div>
