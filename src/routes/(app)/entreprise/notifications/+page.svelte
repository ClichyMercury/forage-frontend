<script lang="ts">
  import NotificationsPage from '$lib/components/ui/NotificationsPage.svelte'
  import { t } from '$lib/stores/locale'
</script>

<svelte:head><title>{$t('notif.title')} — Forage</title></svelte:head>

<NotificationsPage />
