<script lang="ts">
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import MapPicker from '$lib/components/ui/MapPicker.svelte'
  import FormPage from '$lib/components/layout/FormPage.svelte'

  let typeForage = $state('eau')
  let description = $state('')
  let localisationAdresse = $state('')
  let localisationLat = $state<number | null>(null)
  let localisationLng = $state<number | null>(null)
  let profondeurEstimee = $state('')
  let budgetMax = $state('')
  let delaiSouhaite = $state('')
  let files = $state<FileList | null>(null)
  let loading = $state(false)
  let errors = $state<Record<string, string>>({})

  async function handleSubmit(e: Event) {
    e.preventDefault()
    errors = {}
    if (!localisationAdresse.trim()) {
      errors.localisationAdresse = 'Veuillez saisir ou sélectionner une adresse'
      return
    }
    loading = true
    try {
      const formData = new FormData()
      formData.append('typeForage', typeForage)
      formData.append('description', description)
      formData.append('localisationAdresse', localisationAdresse)
      if (localisationLat !== null) formData.append('localisationLat', String(localisationLat))
      if (localisationLng !== null) formData.append('localisationLng', String(localisationLng))
      if (profondeurEstimee) formData.append('profondeurEstimee', profondeurEstimee)
      formData.append('budgetMax', budgetMax)
      if (delaiSouhaite) formData.append('delaiSouhaite', delaiSouhaite)
      if (files) Array.from(files).forEach(f => formData.append('documents', f))
      await api.post('/demandes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Demande soumise !', 'Vous recevrez une confirmation par email.')
      goto('/client/demandes')
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        data.errors?.forEach((e: any) => { errors[e.field] = e.message })
        toast.error('Formulaire invalide', 'Vérifiez les champs en rouge.')
      } else {
        toast.error('Erreur', data?.message)
      }
    } finally { loading = false }
  }
</script>

<svelte:head><title>Nouvelle demande — ForageCI</title></svelte:head>

<FormPage maxWidth="max-w-2xl">
  <div class="flex items-center gap-3 mb-6">
    <button onclick={() => goto('/client/demandes')}
      class="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all">
      <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
    </button>
    <div>
      <h2 class="text-xl font-bold text-slate-900">Nouvelle demande de forage</h2>
      <p class="text-sm text-slate-500">Votre budget reste strictement confidentiel</p>
    </div>
  </div>

  <form onsubmit={handleSubmit}>
    <div class="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2" for="typeForage">
          <span class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">category</span>
            Type de forage *
          </span>
        </label>
        <div class="relative">
          <select id="typeForage" bind:value={typeForage}
            class="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 cursor-pointer">
            <option value="eau">💧 Forage eau</option>
            <option value="geotechnique">🏔️ Géotechnique</option>
            <option value="petrolier">🛢️ Pétrolier</option>
            <option value="autre">⚙️ Autre</option>
          </select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style="font-size: 20px;">expand_more</span>
        </div>
      </div>

      <div class="border-t border-slate-100"></div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2" for="description">
          <span class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">description</span>
            Description des besoins *
          </span>
        </label>
        <textarea id="description" bind:value={description} rows="4" required
          placeholder="Décrivez votre projet : usage prévu, contexte géologique si connu..."
          class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none transition-all"
          class:border-red-400={errors.description}></textarea>
        {#if errors.description}<p class="text-red-500 text-xs mt-1">{errors.description}</p>{/if}
      </div>

      <div class="border-t border-slate-100"></div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">location_on</span>
            Localisation du chantier *
          </span>
          <span class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Carte interactive</span>
        </div>
        <div class="relative mb-3">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size: 20px;">edit_location</span>
          <input type="text" bind:value={localisationAdresse}
            placeholder="Ex: Cocody Riviera 3, Abidjan" required
            class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm transition-all"
            class:border-red-400={errors.localisationAdresse} />
        </div>
        {#if errors.localisationAdresse}<p class="text-red-500 text-xs mb-2">{errors.localisationAdresse}</p>{/if}
        <MapPicker bind:lat={localisationLat} bind:lng={localisationLng} bind:adresse={localisationAdresse} />
        {#if localisationLat && localisationLng}
          <div class="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size: 14px;">gps_fixed</span>
            GPS : {localisationLat.toFixed(6)}, {localisationLng.toFixed(6)}
          </div>
        {/if}
      </div>

      <div class="border-t border-slate-100"></div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2" for="profondeur">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">straighten</span>
              Profondeur (m)
            </span>
          </label>
          <input id="profondeur" type="number" bind:value={profondeurEstimee} placeholder="Ex: 50" min="1"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          <p class="text-xs text-slate-400 mt-1">Optionnel</p>
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2" for="delai">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">calendar_today</span>
              Délai souhaité
            </span>
          </label>
          <input id="delai" type="date" bind:value={delaiSouhaite}
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          <p class="text-xs text-slate-400 mt-1">Optionnel</p>
        </div>
      </div>

      <div class="border-t border-slate-100"></div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2" for="budget">
          <span class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">payments</span>
            Budget maximum (FCFA) *
            <span class="ml-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">🔒 Confidentiel</span>
          </span>
        </label>
        <input id="budget" type="number" bind:value={budgetMax} placeholder="Ex: 5 000 000" required min="1"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm transition-all"
          class:border-red-400={errors.budgetMax} />
        {#if errors.budgetMax}<p class="text-red-500 text-xs mt-1">{errors.budgetMax}</p>{/if}
      </div>

      <div class="border-t border-slate-100"></div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2">
          <span class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 18px;">attach_file</span>
            Documents joints
            <span class="text-xs text-slate-400 font-normal ml-1">Optionnel</span>
          </span>
        </label>
        <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
          <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-400 mb-1" style="font-size: 24px;">cloud_upload</span>
          <span class="text-sm text-slate-500">Glissez ou <span class="text-blue-600 font-medium">parcourir</span></span>
          <input type="file" multiple bind:files class="hidden" accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.doc,.docx,.zip" />
        </label>
        {#if files && files.length > 0}
          <div class="mt-2 space-y-1.5">
            {#each Array.from(files) as file}
              <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size: 16px;">description</span>
                <span class="text-xs text-slate-700 flex-1 truncate">{file.name}</span>
                <span class="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex gap-3 pt-2">
        <button type="button" onclick={() => goto('/client/demandes')}
          class="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">
          Annuler
        </button>
        <button type="submit" disabled={loading}
          class="flex-1 py-3.5 rounded-xl gradient-blue text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {#if loading}
            <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Envoi...
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">send</span>
            Soumettre
          {/if}
        </button>
      </div>
    </div>
  </form>
</FormPage>

