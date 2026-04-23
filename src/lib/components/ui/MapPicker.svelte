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

  async function searchAddress() {
    if (!searchQuery.trim()) return
    searching = true
    showSuggestions = false
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=fr&countrycodes=ci`
      )
      suggestions = await res.json()
      showSuggestions = suggestions.length > 0
    } catch {} finally { searching = false }
  }

  function selectSuggestion(s: any) {
    const newLat = parseFloat(s.lat)
    const newLng = parseFloat(s.lon)
    setPosition(newLat, newLng)
    adresse = s.display_name
    searchQuery = s.display_name.split(',')[0]
    showSuggestions = false
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
  <!-- Barre de recherche -->
  <div class="relative">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">search</span>
        <input
          type="text"
          bind:value={searchQuery}
          onkeydown={handleSearchKey}
          oninput={() => { if (searchQuery.length > 2) searchAddress() }}
          placeholder="Rechercher une adresse en Côte d'Ivoire..."
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm transition-all"
        />
      </div>
      <button
        type="button"
        onclick={searchAddress}
        disabled={searching}
        class="px-4 py-3 rounded-xl gradient-blue text-white text-sm font-semibold shadow-md hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center gap-1.5"
      >
        {#if searching}
          <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {:else}
          <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">search</span>
        {/if}
        Chercher
      </button>
      <button
        type="button"
        onclick={locateMe}
        disabled={locating}
        title="Ma position actuelle"
        class="px-3 py-3 rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all disabled:opacity-60 flex items-center"
      >
        {#if locating}
          <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {:else}
          <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">my_location</span>
        {/if}
      </button>
    </div>

    <!-- Suggestions -->
    {#if showSuggestions}
      <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-down">
        {#each suggestions as s}
          <button
            type="button"
            onclick={() => selectSuggestion(s)}
            class="w-full text-left px-4 py-3 hover:bg-blue-50 transition-all border-b border-slate-50 last:border-0 flex items-start gap-2"
          >
            <span class="material-symbols-outlined text-blue-400 icon-filled flex-shrink-0 mt-0.5" style="font-size: 16px;">location_on</span>
            <span class="text-sm text-slate-700 line-clamp-2">{s.display_name}</span>
          </button>
        {/each}
        <button type="button" onclick={() => showSuggestions = false}
          class="w-full text-center py-2 text-xs text-slate-400 hover:bg-slate-50 transition-all">
          Fermer
        </button>
      </div>
    {/if}
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

  <!-- Adresse détectée -->
  {#if adresse}
    <div class="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
      <span class="material-symbols-outlined text-blue-500 icon-filled flex-shrink-0 mt-0.5" style="font-size: 16px;">location_on</span>
      <p class="text-sm text-blue-800 leading-snug">{adresse}</p>
    </div>
  {/if}
</div>
