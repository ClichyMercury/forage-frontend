<script lang="ts">
  let { status } = $props<{ status: string }>()

  const config: Record<string,{ 
    label: string;
    class: string;
    icon: string 
  }> = {
    en_attente:       { label: 'En attente',       class: 'bg-terre-50 text-terre-700 border-terre-200',     icon: 'schedule' },
    validee:          { label: 'Validée',           class: 'bg-brand-100 text-brand-700 border-brand-200',    icon: 'verified' },
    appel_offre_lance:{ label: 'AO lancé',          class: 'bg-brand-100 text-brand-700 border-brand-200',    icon: 'campaign' },
    offres_recues:    { label: 'Offres reçues',     class: 'bg-brand-100 text-brand-700 border-brand-200',    icon: 'inbox' },
    offre_envoyee:    { label: 'Offre reçue',       class: 'bg-terre-100 text-terre-700 border-terre-200',    icon: 'mark_email_read' },
    acceptee:         { label: 'Acceptée',          class: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'check_circle' },
    refusee:          { label: 'Refusée',           class: 'bg-red-100 text-red-700 border-red-200',         icon: 'cancel' },
    cloturee:         { label: 'Clôturée',          class: 'bg-slate-100 text-slate-600 border-slate-200',   icon: 'lock' },
    soumise:          { label: 'Soumise',           class: 'bg-brand-100 text-brand-700 border-brand-200',    icon: 'send' },
    retenue:          { label: 'Retenue',           class: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'star' },
    non_retenue:      { label: 'Non retenue',       class: 'bg-red-100 text-red-700 border-red-200',         icon: 'close' },
    ouvert:           { label: 'Ouvert',            class: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'lock_open' },
    clos:             { label: 'Clôturé',           class: 'bg-slate-100 text-slate-600 border-slate-200',   icon: 'lock' },
    envoyee:          { label: 'Envoyée',           class: 'bg-terre-100 text-terre-700 border-terre-200',    icon: 'send' },
  }

  const cfg = $derived(config[status] ?? { label: status, class: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'circle' })
</script>

<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border {cfg.class}">
  <span class="material-symbols-outlined icon-filled" style="font-size: 12px;">{cfg.icon}</span>
  {cfg.label}
</span>
