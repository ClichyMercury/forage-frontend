<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'

  let mouseX = $state(0)
  let mouseY = $state(0)
  let scrollY = $state(0)
  let isLogged = $state(false)
  let userRole = $state<string | null>(null)

  function onMouseMove(e: MouseEvent) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2
  }
  function onScroll() { scrollY = window.scrollY }

  onMount(() => {
    auth.init()
    isLogged = auth.isAuthenticated()
    userRole = auth.user?.role ?? null
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', onScroll, { passive: true })

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible') })
    }, { threshold: 0.15 })
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el))

    return () => obs.disconnect()
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
    }
  })

  function goToDashboard() {
    if (userRole === 'admin') goto('/admin/dashboard')
    else if (userRole === 'entreprise') goto('/entreprise/dashboard')
    else goto('/client/dashboard')
  }

  function px(amp: number) { return `translate(${mouseX * amp}px, ${mouseY * amp}px)` }
</script>

<svelte:head>
  <title>Forage — La plateforme de mise en relation pour le forage</title>
  <meta name="description" content="Soumettez votre projet de forage, comparez les offres des prestataires, signez en confiance." />
</svelte:head>

<!-- ============ Snippet étoile 4 branches ============ -->
{#snippet drop(size: number, color: string = '#ffffff', opacity: number = 1)}
  <svg width={size} height={size} viewBox="0 0 100 100" style="opacity: {opacity}">
    <path d="M50 5 C50 5, 18 42, 18 65 C18 83, 33 95, 50 95 C67 95, 82 83, 82 65 C82 42, 50 5, 50 5 Z"
          fill={color} />
  </svg>
{/snippet}

{#snippet drill(size: number, color: string = '#ffffff', opacity: number = 1)}
  <svg width={size} height={size} viewBox="0 0 100 100" style="opacity: {opacity}">
    <!-- Tour de forage stylisée -->
    <path d="M30 5 L70 5 L62 25 L65 30 L60 35 L63 45 L58 50 L61 60 L56 65 L59 75 L54 80 L56 90 L44 90 L46 80 L41 75 L44 65 L39 60 L42 50 L37 45 L40 35 L35 30 L38 25 Z"
          fill={color} />
  </svg>
{/snippet}

{#snippet layers(size: number, color: string = '#ffffff', opacity: number = 1)}
  <svg width={size} height={size} viewBox="0 0 100 100" style="opacity: {opacity}">
    <!-- Couches géologiques empilées -->
    <ellipse cx="50" cy="20" rx="42" ry="10" fill={color} />
    <path d="M8 20 L8 38 C8 44, 26 50, 50 50 C74 50, 92 44, 92 38 L92 20" fill={color} opacity="0.85" />
    <path d="M8 50 L8 68 C8 74, 26 80, 50 80 C74 80, 92 74, 92 68 L92 50" fill={color} opacity="0.7" />
  </svg>
{/snippet}

{#snippet target(size: number, color: string = '#ffffff', opacity: number = 1)}
  <svg width={size} height={size} viewBox="0 0 100 100" style="opacity: {opacity}" fill="none" stroke={color} stroke-width="3">
    <!-- Mire de localisation forage -->
    <circle cx="50" cy="50" r="42" />
    <circle cx="50" cy="50" r="28" />
    <circle cx="50" cy="50" r="14" />
    <circle cx="50" cy="50" r="3" fill={color} />
    <line x1="50" y1="2"  x2="50" y2="20" />
    <line x1="50" y1="80" x2="50" y2="98" />
    <line x1="2"  y1="50" x2="20" y2="50" />
    <line x1="80" y1="50" x2="98" y2="50" />
  </svg>
{/snippet}

<div class="landing-root">

  <!-- =================== NAV =================== -->
  <nav class="fixed top-0 inset-x-0 z-50 px-6 lg:px-12 py-5 flex items-center justify-between
              backdrop-blur-md bg-white/60 border-b border-slate-200/60">
    <a href="/" class="flex items-center gap-2.5 group">
      <img src="/images/logo.jpeg" alt="Forage" class="w-9 h-9 object-contain" />
      <span class="font-display font-black text-xl tracking-tight text-slate-900">Forage</span>
    </a>

    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
      <a href="#process" class="hover:text-brand transition-colors">Comment ça marche</a>
      <a href="#acteurs" class="hover:text-brand transition-colors">Pour qui</a>
      <a href="#confiance" class="hover:text-brand transition-colors">Confiance</a>
    </div>

    <div class="flex items-center gap-3">
      {#if isLogged}
        <button onclick={goToDashboard}
          class="px-5 py-2.5 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-sm">
          Mon espace
        </button>
      {:else}
        <a href="/login" class="hidden sm:inline text-sm font-semibold text-slate-700 hover:text-brand transition-colors">
          Connexion
        </a>
        <a href="/register"
          class="px-5 py-2.5 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-700 transition-all shadow-sm">
          S'inscrire
        </a>
      {/if}
    </div>
  </nav>

  <!-- =================== HERO =================== -->
  <section class="relative min-h-screen flex items-center overflow-hidden bg-brand">

    <!-- Icônes forage en parallax -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[12%] right-[8%] animate-float-slow"
           style="transform: {px(30)} translateY({scrollY * 0.3}px)">
        {@render drop(140, '#ffffff', 0.6)}
      </div>
      <div class="absolute top-[28%] right-[22%] animate-float-slower"
           style="transform: {px(20)} translateY({scrollY * 0.5}px)">
        {@render target(80, '#ffffff', 0.35)}
      </div>
      <div class="absolute bottom-[18%] right-[14%] animate-float-slow"
           style="transform: {px(40)} translateY({scrollY * 0.2}px); animation-delay: -3s">
        {@render drill(110, '#ffffff', 0.4)}
      </div>
      <div class="absolute top-[60%] left-[6%] animate-float-slower"
           style="transform: {px(25)} translateY({scrollY * 0.35}px)">
        {@render layers(80, '#94a3b8', 0.5)}
      </div>
      <div class="absolute top-[20%] left-[12%] animate-float-slow"
           style="transform: {px(15)} translateY({scrollY * 0.4}px); animation-delay: -5s">
        {@render drop(50, '#94a3b8', 0.55)}
      </div>

      <!-- Halo radial bleu vers haut, accent terre vers bas -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.18),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_95%,rgba(179,93,46,0.18),transparent_45%)]"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16 w-full">

      <h1 class="font-display font-black text-white leading-[0.95] tracking-tight mb-8 animate-reveal-up"
          style="font-size: clamp(3rem, 9vw, 8rem); animation-delay: 0.1s">
        Le forage,<br/>
        <span class="italic font-light relative inline-block" style="font-family: 'Instrument Serif', 'Satoshi', serif; color: rgba(255,255,255,0.75)">
          simplifié.
          <span class="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-white/40"></span>
        </span>
      </h1>

      <p class="max-w-2xl text-lg lg:text-xl text-white/85 leading-relaxed mb-10 animate-reveal-up"
         style="animation-delay: 0.25s">
        Soumettez votre projet, recevez les meilleures offres de prestataires qualifiés, et signez en toute confiance — votre budget reste confidentiel.
      </p>

      <div class="flex flex-wrap gap-4 animate-reveal-up" style="animation-delay: 0.4s">
        {#if isLogged}
          <button onclick={goToDashboard}
            class="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-all shadow-xl">
            Aller à mon espace
            <span class="material-symbols-outlined icon-filled transition-transform group-hover:translate-x-1" style="font-size: 20px;">arrow_forward</span>
          </button>
        {:else}
          <a href="/register"
            class="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-all shadow-xl">
            Soumettre une demande
            <span class="material-symbols-outlined icon-filled transition-transform group-hover:translate-x-1" style="font-size: 20px;">arrow_forward</span>
          </a>
        {/if}
        <a href="#process"
          class="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-transparent border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-all">
          Découvrir le fonctionnement
        </a>
      </div>

      <div class="mt-20 grid grid-cols-3 gap-6 max-w-2xl animate-reveal-up" style="animation-delay: 0.55s">
        {#each [
          { value: '100%', label: 'Budget protégé', accent: true },
          { value: '3', label: 'Acteurs cloisonnés', accent: false },
          { value: '8', label: 'Étapes contrôlées', accent: false },
        ] as stat}
          <div class="pl-4 border-l-2" style="border-color: {stat.accent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'}">
            <p class="font-display text-3xl lg:text-4xl font-black tracking-tight text-white">{stat.value}</p>
            <p class="text-xs lg:text-sm mt-1 text-white/70">{stat.label}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60">
      <span class="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
      <div class="w-px h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
    </div>
  </section>

  <!-- =================== MARQUEE =================== -->
  <section class="bg-white py-8 border-y border-slate-200 overflow-hidden">
    <div class="flex gap-16 whitespace-nowrap animate-marquee">
      {#each Array(2) as _}
        {#each ['Forage Eau', 'Géotechnique', 'Pétrolier', 'Forage Eau', 'Géotechnique', 'Pétrolier', 'Forage Eau', 'Géotechnique'] as type}
          <span class="font-display font-black text-4xl lg:text-6xl text-slate-200 tracking-tight">
            {type} <span class="text-terre">●</span>
          </span>
        {/each}
      {/each}
    </div>
  </section>

  <!-- =================== PROCESS =================== -->
  <section id="process" class="relative py-32 px-6 lg:px-12 bg-white overflow-hidden">

    <div class="absolute top-20 right-10 opacity-10" style="transform: translateY({(scrollY - 800) * 0.15}px)">
      {@render drill(300, '#1e3fff', 1)}
    </div>
    <div class="absolute bottom-10 left-10 opacity-10" style="transform: translateY({(scrollY - 1100) * 0.1}px)">
      {@render layers(220, '#1e3fff', 1)}
    </div>

    <div class="max-w-7xl mx-auto relative">
      <div class="mb-20" data-reveal>
        <p class="text-sm font-bold uppercase tracking-widest text-brand mb-4">Comment ça marche</p>
        <h2 class="font-display font-black text-slate-900 leading-[1] tracking-tight"
            style="font-size: clamp(2.5rem, 6vw, 5rem)">
          Trois étapes.<br/>
          <span class="text-slate-300">Zéro friction.</span>
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each [
          { num: '01', title: 'Le client soumet', text: "Type de forage, localisation, budget confidentiel et délai souhaité. Téléversement de plans et rapports géologiques.", icon: 'edit_document', accent: 'brand' },
          { num: '02', title: 'Les offres arrivent', text: "Des prestataires qualifiés étudient votre projet et soumettent leurs propositions techniques et tarifaires.", icon: 'compare_arrows', accent: 'terre' },
          { num: '03', title: 'Le chantier démarre', text: "Le client accepte l'offre finale, les parties sont mises en relation officiellement et le chantier peut commencer.", icon: 'rocket_launch', accent: 'brand' },
        ] as step, i}
          <div data-reveal
               class="step-card group relative bg-slate-50 rounded-3xl p-8 transition-all duration-500"
               data-accent={step.accent}
               style="transition-delay: {i * 80}ms">
            <p class="step-num font-display font-black text-7xl text-slate-200 transition-colors mb-6 leading-none">
              {step.num}
            </p>
            <div class="step-icon-bg w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-5 transition-colors">
              <span class="step-icon material-symbols-outlined icon-filled transition-colors" style="font-size: 22px;">{step.icon}</span>
            </div>
            <h3 class="step-title font-display font-bold text-2xl mb-3 tracking-tight text-slate-900 transition-colors">{step.title}</h3>
            <p class="step-text text-sm leading-relaxed text-slate-600 transition-colors">{step.text}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- =================== ACTEURS =================== -->
  <section id="acteurs" class="relative py-32 px-6 lg:px-12 bg-slate-50 overflow-hidden">
    <div class="max-w-7xl mx-auto">
      <div class="mb-20 max-w-3xl" data-reveal>
        <p class="text-sm font-bold uppercase tracking-widest text-brand mb-4">Pour qui</p>
        <h2 class="font-display font-black text-slate-900 leading-[1] tracking-tight"
            style="font-size: clamp(2.5rem, 6vw, 5rem)">
          Un espace dédié<br/>
          <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif">par acteur.</span>
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {#each [
          { label: 'Client', title: 'Particulier ou entreprise', bg: 'bg-brand', txt: 'text-white', features: ['Soumission rapide', 'Budget confidentiel', 'Suivi temps réel', 'Acceptation en 1 clic'], cta: 'Devenir client', href: '/register', ctaCls: 'bg-white text-[#1e3fff] hover:bg-slate-100' },
          { label: 'Prestataire', title: 'Entreprise de forage', bg: 'bg-slate-800', txt: 'text-white', features: ['Appels d\'offres ciblés', 'Soumission structurée', 'Pas de mise en concurrence visible', 'Notifications prioritaires'], cta: "S'inscrire en tant qu'entreprise", href: '/register-entreprise', ctaCls: 'bg-white text-slate-800 hover:bg-slate-100' },
        ] as acteur, i}
          <div data-reveal class="rounded-3xl p-8 lg:p-10 {acteur.bg} {acteur.txt} transition-all duration-500 hover:scale-[1.02]"
               style="transition-delay: {i * 100}ms">
            <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{acteur.label}</p>
            <h3 class="font-display font-black text-3xl lg:text-4xl tracking-tight mb-8 leading-tight">{acteur.title}</h3>

            <ul class="space-y-3 mb-10">
              {#each acteur.features as f}
                <li class="flex items-center gap-3 text-sm">
                  <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">check_circle</span>
                  {f}
                </li>
              {/each}
            </ul>

            {#if acteur.cta && acteur.href}
              <a href={acteur.href}
                class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all {acteur.ctaCls}">
                {acteur.cta}
                <span class="material-symbols-outlined icon-filled" style="font-size: 16px;">arrow_forward</span>
              </a>
            {:else}
              <p class="text-sm opacity-70 italic">Accès sur invitation uniquement</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- =================== CONFIANCE =================== -->
  <section id="confiance" class="relative py-32 px-6 lg:px-12 bg-slate-900 text-white overflow-hidden">
    <div class="absolute -bottom-32 -right-32 opacity-25" style="transform: rotate({scrollY * 0.05}deg)">
      {@render target(500, '#1e3fff', 1)}
    </div>
    <div class="absolute top-10 -left-10 opacity-15" style="transform: translateY({(scrollY - 1800) * 0.1}px)">
      {@render drop(180, '#1e3fff', 1)}
    </div>

    <div class="max-w-7xl mx-auto relative">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div data-reveal>
          <p class="text-sm font-bold uppercase tracking-widest text-brand-400 mb-4">Confiance & confidentialité</p>
          <h2 class="font-display font-black leading-[1] tracking-tight mb-8"
              style="font-size: clamp(2.5rem, 5vw, 4rem)">
            Un cloisonnement<br/>strict, par design.
          </h2>
          <p class="text-lg text-slate-300 leading-relaxed">
            Le budget du client n'est jamais visible des entreprises. Les offres sont masquées entre prestataires. Toutes les communications sont centralisées et sécurisées par la plateforme.
          </p>
        </div>

        <div data-reveal class="space-y-4">
          {#each [
            { icon: 'lock', title: 'Budget confidentiel', text: "Jamais communiqué aux prestataires.", color: '#1e3fff' },
            { icon: 'shield', title: "Pas d'enchères visibles", text: 'Les offres entreprises sont cloisonnées.', color: '#475569' },
            { icon: 'forum', title: 'Messagerie centralisée', text: "Toutes les communications transitent par la plateforme.", color: '#1e3fff' },
            { icon: 'task_alt', title: 'Workflow contrôlé', text: 'Aucune transition de statut hors séquence.', color: '#1e3fff' },
          ] as item}
            <div class="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background-color: {item.color}">
                <span class="material-symbols-outlined text-white icon-filled" style="font-size: 20px;">{item.icon}</span>
              </div>
              <div>
                <h4 class="font-display font-bold text-lg mb-1">{item.title}</h4>
                <p class="text-sm text-slate-400">{item.text}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- =================== CTA FINAL =================== -->
  <section class="relative bg-brand py-32 px-6 lg:px-12 overflow-hidden">
    <div class="absolute top-10 left-10 animate-float-slow">
      {@render drop(120, '#ffffff', 0.25)}
    </div>
    <div class="absolute bottom-10 right-10 animate-float-slower">
      {@render drill(100, '#ffffff', 0.3)}
    </div>
    <div class="absolute top-1/2 right-1/4 animate-float-slow" style="animation-delay: -4s">
      {@render layers(70, '#eef1ff', 0.35)}
    </div>

    <div class="max-w-4xl mx-auto text-center text-white relative" data-reveal>
      <h2 class="font-display font-black leading-[0.95] tracking-tight mb-8"
          style="font-size: clamp(2.5rem, 7vw, 6rem)">
        Prêt à forer<br/>
        <span class="italic font-light" style="font-family: 'Instrument Serif', 'Satoshi', serif">en confiance ?</span>
      </h2>
      <p class="text-lg lg:text-xl text-white/85 max-w-2xl mx-auto mb-10">
        Créez votre compte en quelques secondes. La première demande est gratuite.
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        {#if isLogged}
          <button onclick={goToDashboard}
            class="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-all shadow-xl">
            Aller à mon espace
            <span class="material-symbols-outlined icon-filled transition-transform group-hover:translate-x-1" style="font-size: 20px;">arrow_forward</span>
          </button>
        {:else}
          <a href="/register"
            class="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-all shadow-xl">
            Créer un compte client
            <span class="material-symbols-outlined icon-filled transition-transform group-hover:translate-x-1" style="font-size: 20px;">arrow_forward</span>
          </a>
          <a href="/register-entreprise"
            class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-transparent border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-all">
            Je suis une entreprise
          </a>
        {/if}
      </div>
    </div>
  </section>

  <!-- =================== FOOTER =================== -->
  <footer class="bg-slate-950 text-slate-400 py-12 px-6 lg:px-12">
    <div class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2.5">
        <img src="/images/logo.jpeg" alt="Forage" class="w-8 h-8 object-contain" />
        <span class="font-display font-black text-lg text-white tracking-tight">Forage</span>
      </div>
      <p class="text-xs">© 2026 Forage · Plateforme de mise en relation pour prestations de forage</p>
    </div>
  </footer>

</div>

<style>
  .landing-root {
    font-family: 'Satoshi', sans-serif;
    overflow-x: hidden;
  }

  [data-reveal] {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1);
  }
  :global([data-reveal].is-visible) {
    opacity: 1;
    transform: translateY(0);
  }

  :global(.bg-brand-700) { background-color: #1730d6; }
  :global(.text-brand-400) { color: #5c70ff; }
  :global(.hover\:bg-brand-700:hover) { background-color: #1730d6; }

  /* === Cartes process — hover bleu OU terre selon accent === */
  .step-card[data-accent="brand"]:hover { background-color: #1e3fff; }
  .step-card[data-accent="terre"]:hover { background-color: #475569; }

  .step-card[data-accent="brand"] .step-icon { color: #1e3fff; }
  .step-card[data-accent="terre"] .step-icon { color: #475569; }

  .step-card:hover .step-num   { color: rgba(255,255,255,0.2); }
  .step-card:hover .step-icon-bg { background-color: rgba(255,255,255,0.2); }
  .step-card:hover .step-icon  { color: #ffffff; }
  .step-card:hover .step-title { color: #ffffff; }
  .step-card:hover .step-text  { color: rgba(255,255,255,0.85); }
</style>
