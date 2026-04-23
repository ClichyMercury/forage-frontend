<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte'

  let { points = [] } = $props<{
    points: Array<{
      lat: number
      lng: number
      adresse: string
      statut: string
      typeForage: string
      id?: number
    }>
  }>()

  let mapEl: HTMLDivElement
  let map: any
  let L: any
  let markers: any[] = []

  const statutConfig: Record<string, { color: string; label: string }> = {
    en_attente:        { color: '#f59e0b', label: 'En attente' },
    validee:           { color: '#3b82f6', label: 'Validée' },
    appel_offre_lance: { color: '#6366f1', label: 'AO lancé' },
    offres_recues:     { color: '#8b5cf6', label: 'Offres reçues' },
    offre_envoyee:     { color: '#06b6d4', label: 'Offre envoyée' },
    acceptee:          { color: '#10b981', label: 'Acceptée' },
    refusee:           { color: '#ef4444', label: 'Refusée' },
    cloturee:          { color: '#94a3b8', label: 'Clôturée' },
  }

  const typeLabels: Record<string, string> = {
    eau: '💧 Eau', geotechnique: '🏔️ Géotechnique', petrolier: '🛢️ Pétrolier', autre: '⚙️ Autre'
  }

  function createMarkerIcon(statut: string) {
    const cfg = statutConfig[statut] ?? { color: '#94a3b8', label: statut }
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width: 14px; height: 14px;
          border-radius: 50%;
          background: ${cfg.color};
          border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
  }

  function addMarkers() {
    if (!map || !L) return
    // Supprimer anciens marqueurs
    markers.forEach(m => m.remove())
    markers = []

    points.forEach((p: { lat: number; lng: number; adresse: string; statut: string; typeForage: string; id?: number }) => {
      if (!p.lat || !p.lng) return
      const cfg = statutConfig[p.statut] ?? { color: '#94a3b8', label: p.statut }
      const marker = L.marker([p.lat, p.lng], { icon: createMarkerIcon(p.statut) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px;padding:2px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <div style="width:10px;height:10px;border-radius:50%;background:${cfg.color};flex-shrink:0"></div>
              <span style="font-size:11px;font-weight:600;color:${cfg.color};text-transform:uppercase;letter-spacing:0.05em">${cfg.label}</span>
            </div>
            <p style="font-weight:600;font-size:13px;color:#1e293b;margin:0 0 4px;line-height:1.3">${p.adresse}</p>
            <p style="font-size:11px;color:#64748b;margin:0">${typeLabels[p.typeForage] ?? p.typeForage}</p>
            ${p.id ? `<a href="/admin/demandes/${p.id}" style="display:inline-block;margin-top:8px;font-size:11px;color:#3b82f6;font-weight:600;text-decoration:none">Voir la demande →</a>` : ''}
          </div>
        `, { maxWidth: 220 })
      markers.push(marker)
    })

    // Ajuster la vue si des points existent, sinon centrer sur la Côte d'Ivoire
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      const bounds = group.getBounds()
      // Vérifier que les bounds sont valides (pas en plein océan)
      const center = bounds.getCenter()
      if (center.lat > 4 && center.lat < 11 && center.lng > -9 && center.lng < -2) {
        map.fitBounds(bounds.pad(0.3))
      } else {
        // Coordonnées hors Côte d'Ivoire — centrer sur CI quand même
        map.setView([7.5399, -5.5471], 7)
        markers.forEach((m: any) => m.addTo(map))
      }
    } else {
      map.setView([7.5399, -5.5471], 7)
    }
  }

  onMount(async () => {
    if (typeof window === 'undefined') return
    L = (await import('leaflet')).default

    // S'assurer que le CSS Leaflet est bien chargé
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      // Attendre que le CSS soit chargé
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    map = L.map(mapEl, { zoomControl: true }).setView([7.5399, -5.5471], 7)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Forcer le recalcul de la taille après rendu
    setTimeout(() => {
      map?.invalidateSize()
      addMarkers()
    }, 300)
  })

  // Réagir aux changements de points
  $effect(() => {
    const _ = points.length
    untrack(() => addMarkers())
  })

  onDestroy(() => map?.remove())
</script>

<div bind:this={mapEl} class="w-full h-full"></div>
