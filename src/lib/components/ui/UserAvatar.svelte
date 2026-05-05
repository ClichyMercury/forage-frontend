<script lang="ts">
  import { fileUrl } from '$lib/utils/file-url'

  let {
    user,
    size = 'md',
    shape = 'rounded-xl',
  } = $props<{
    user: { fullName?: string | null; email?: string; avatarUrl?: string | null; role?: string } | null | undefined
    size?: 'sm' | 'md' | 'lg'
    shape?: string
  }>()

  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const bgColor = (user?.role === 'entreprise' || user?.role === 'admin') ? '#475569' : '#1e3fff'
  const initials = (user?.fullName ?? user?.email ?? '?').charAt(0).toUpperCase()
</script>

<div
  class="{sizeClass[size]} {shape} flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
  style="background-color: {bgColor}"
>
  {#if user?.avatarUrl}
    <img
      src={fileUrl(user.avatarUrl)}
      alt={user.fullName ?? user.email ?? 'Avatar'}
      class="w-full h-full object-cover"
    />
  {:else}
    {initials}
  {/if}
</div>
