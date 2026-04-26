<script lang="ts">
  let {
    title,
    value,
    icon,
    color = 'blue',
    trend = '',
    trendUp = true,
    subtitle = '',
  } = $props<{
    title: string
    value: string | number
    icon: string
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan'
    trend?: string
    trendUp?: boolean
    subtitle?: string
  }>()

  const colorMap = {
    blue:   { bg: 'bg-brand-50',  icon: 'text-brand-600',  border: 'border-brand-100' },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-600',border: 'border-emerald-100' },
    orange: { bg: 'bg-terre-50',  icon: 'text-terre-600',  border: 'border-terre-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    purple: { bg: 'bg-brand-50',  icon: 'text-brand-700',  border: 'border-brand-100' },
    cyan:   { bg: 'bg-terre-50',  icon: 'text-terre-500',  border: 'border-terre-100' },
  }

  const c = $derived(colorMap[color as keyof typeof colorMap] ?? colorMap.blue)
</script>

<div class="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
  <div class="flex items-start justify-between">
    <div class="flex-1 min-w-0">
      <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      <p class="font-display font-black text-3xl text-slate-900 mt-2 leading-none tracking-tight">{value}</p>
      {#if subtitle}
        <p class="text-xs text-slate-400 mt-1.5">{subtitle}</p>
      {/if}
      {#if trend}
        <div class="flex items-center gap-1 mt-2">
          <span class="material-symbols-outlined icon-filled {trendUp ? 'text-emerald-500' : 'text-red-500'}" style="font-size: 14px;">
            {trendUp ? 'arrow_upward' : 'arrow_downward'}
          </span>
          <span class="text-xs font-medium {trendUp ? 'text-emerald-600' : 'text-red-600'}">{trend}</span>
        </div>
      {/if}
    </div>
    <div class="hidden lg:flex w-11 h-11 rounded-xl {c.bg} border {c.border} items-center justify-center shrink-0 ml-3">
      <span class="material-symbols-outlined {c.icon} icon-filled" style="font-size: 22px;">{icon}</span>
    </div>
  </div>
</div>
