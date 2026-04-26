<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let {
    lat = $bindable<number | null>(null),
    lng = $bindable<number | null>(null),
    adresse = $bindable(''),
  } = $props<{
    lat?: number | null
    lng?: number | null
    adresse?: string
  }>()

  let mapEl: HTMLDivElement
  let map: any
  let marker: any
  let L: any
  let searchQuery = $state('')
  let searching = $state(false)
  let locating = $state(false)
  let suggestions = $state<any[]>([])
  let showSuggestions = $state(false)
  let showSearchModal = $state(false)
  let searchInputEl: HTMLInputElement | undefined = $state()

  function openSearchModal() {
    showSearchModal = true
    // Auto-focus sur le champ après ouverture
    setTimeout(() => searchInputEl?.focus(), 80)
  }

  function closeSearchModal() {
    showSearchModal = false
    showSuggestions = false
  }

  onMount(async () => {
    // Import dynamique Leaflet (SSR safe — browser only)
    if (typeof window === 'undefined') return
    L = (await import('leaflet')).default

    // Fix icône Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Centrer sur Abidjan par défaut
    const initLat = lat ?? 5.3599517
    const initLng = lng ?? -4.0082563

    map = L.map(mapEl, { zoomControl: true }).setView([initLat, initLng], lat ? 14 : 10)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Marker initial si coordonnées fournies
    if (lat && lng) {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      marker.on('dragend', onMarkerDrag)
    }

    // Clic sur la carte
    map.on('click', onMapClick)
  })

  onDestroy(() => {
    map?.remove()
  })

  async function onMapClick(e: any) {
    const { lat: newLat, lng: newLng } = e.latlng
    setPosition(newLat, newLng)
    await reverseGeocode(newLat, newLng)
  }

  async function onMarkerDrag(e: any) {
    const pos = e.target.getLatLng()
    lat = parseFloat(pos.lat.toFixed(7))
    lng = parseFloat(pos.lng.toFixed(7))
    await reverseGeocode(pos.lat, pos.lng)
  }

  function setPosition(newLat: number, newLng: number) {
    lat = parseFloat(newLat.toFixed(7))
    lng = parseFloat(newLng.toFixed(7))

    if (marker) {
      marker.setLatLng([newLat, newLng])
    } else {
      marker = L.marker([newLat, newLng], { draggable: true }).addTo(map)
      marker.on('dragend', onMarkerDrag)
    }
    map.setView([newLat, newLng], 15)
  }

  async function reverseGeocode(newLat: number, newLng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&accept-language=fr`
      )
      const data = await res.json()
      if (data.display_name) {
        adresse = data.display_name
      }
    } catch {}
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let lastQueryId = 0

  async function searchAddress() {
    const q = searchQuery.trim()
    if (!q) {
      suggestions = []
      showSuggestions = false
      return
    }
    searching = true
    // ID pour ignorer les réponses obsolètes (race conditions sur req parallèles)
    const myId = ++lastQueryId
    try {
      // On boost les résultats CI mais sans les contraindre — countrycodes=ci
      // peut filtrer trop strict si l'OSM tag est manquant.
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Côte d\'Ivoire')}&format=json&limit=6&accept-language=fr&addressdetails=1`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) throw new Error(`Nominatim ${res.status}`)
      const data = await res.json()
      // Ignorer si une recherche plus récente a été lancée entretemps
      if (myId !== lastQueryId) return
      suggestions = Array.isArray(data) ? data : []
      showSuggestions = true
    } catch (err) {
      console.error('[MapPicker] Erreur recherche Nominatim:', err)
      suggestions = []
      showSuggestions = true // afficher le "aucun résultat"
    } finally {
      if (myId === lastQueryId) searching = false
    }
  }

  function debouncedSearch() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) searchAddress()
      else { suggestions = []; showSuggestions = false }
    }, 350)
  }

  function selectSuggestion(s: any) {
    const newLat = parseFloat(s.lat)
    const newLng = parseFloat(s.lon)
    setPosition(newLat, newLng)
    adresse = s.display_name
    searchQuery = s.display_name.split(',')[0]
    showSuggestions = false
    showSearchModal = false  // ferme la popup et revient sur la carte
  }

  async function locateMe() {
    if (!navigator.geolocation) return
    locating = true
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition(latitude, longitude)
        await reverseGeocode(latitude, longitude)
        locating = false
      },
      () => { locating = false },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function handleSearchKey(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); searchAddress() }
  }
</script>

<div class="space-y-3">
  <!-- Boutons d'action -->
  <div class="flex gap-2">
    <button
      type="button"
      onclick={openSearchModal}
      class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-md hover:bg-brand-700 transition-all"
    >
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">search</span>
      Rechercher une adresse
    </button>
    <button
      type="button"
      onclick={locateMe}
      disabled={locating}
      title="Ma position actuelle"
      class="px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-md hover:bg-emerald-600 transition-all disabled:opacity-60 flex items-center gap-2"
    >
      {#if locating}
        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {:else}
        <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">my_location</span>
      {/if}
      <span class="hidden sm:inline">Ma position</span>
    </button>
  </div>

  <!-- Carte -->
  <div class="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md" style="height: 320px;">
    <div bind:this={mapEl} class="w-full h-full"></div>

    <!-- Indicateur position -->
    {#if lat && lng}
      <div class="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-slate-100">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 14px;">location_on</span>
          <span class="text-xs font-mono text-slate-700">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      </div>
    {/if}

    <!-- Aide -->
    <div class="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-slate-100">
      <p class="text-xs text-slate-500">Cliquez sur la carte pour placer le marqueur</p>
    </div>
  </div>

</div>

<!-- ============ Modale de recherche d'adresse ============ -->
{#if showSearchModal}
  <div class="fixed inset-0 z-2000 flex items-start justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Rechercher une adresse">
    <!-- Backdrop -->
    <button
      type="button"
      class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      onclick={closeSearchModal}
      aria-label="Fermer"
    ></button>

    <!-- Contenu -->
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mt-12 sm:mt-20 overflow-hidden animate-fade-in-up">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined icon-filled text-brand-600" style="font-size: 20px;">search</span>
          <h3 class="font-display font-bold text-slate-900">Rechercher une adresse</h3>
        </div>
        <button
          type="button"
          onclick={closeSearchModal}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
          aria-label="Fermer"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
        </button>
      </div>

      <!-- Champ de recherche -->
      <div class="p-5 pb-3">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">location_on</span>
          <input
            bind:this={searchInputEl}
            type="text"
            bind:value={searchQuery}
            onkeydown={handleSearchKey}
            oninput={debouncedSearch}
            placeholder="Ex: Cocody Riviera 3, Abidjan…"
            class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
          />
          {#if searching}
            <span class="absolute right-3.5 top-1/2 -translate-y-1/2">
              <span class="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin block"></span>
            </span>
          {/if}
        </div>
        <p class="text-xs text-slate-400 mt-2 px-1">Tapez au moins 3 caractères pour voir les suggestions.</p>
      </div>

      <!-- Suggestions -->
      <div class="max-h-[60vh] overflow-y-auto border-t border-slate-100">
        {#if !showSuggestions && !searching}
          <div class="px-5 py-10 text-center">
            <span class="material-symbols-outlined text-slate-300 icon-filled" style="font-size: 36px;">travel_explore</span>
            <p class="text-sm text-slate-500 mt-2">Saisissez une adresse pour commencer</p>
          </div>
        {:else if suggestions.length === 0 && !searching}
          <div class="px-5 py-10 text-center">
            <span class="material-symbols-outlined text-slate-300 icon-filled" style="font-size: 36px;">search_off</span>
            <p class="text-sm text-slate-500 mt-2">Aucun résultat trouvé</p>
            <p class="text-xs text-slate-400 mt-1">Essayez avec une adresse plus précise.</p>
          </div>
        {:else}
          <div class="divide-y divide-slate-50">
            {#each suggestions as s}
              <button
                type="button"
                onclick={() => selectSuggestion(s)}
                class="w-full text-left px-5 py-3.5 hover:bg-brand-50 transition-all flex items-start gap-3"
              >
                <span class="material-symbols-outlined text-brand-500 icon-filled shrink-0 mt-0.5" style="font-size: 18px;">location_on</span>
                <span class="text-sm text-slate-700 leading-snug">{s.display_name}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
