<script lang="ts">
  import MessagesPage from '$lib/components/ui/MessagesPage.svelte'
  import { t } from '$lib/stores/locale'
</script>

<svelte:head><title>{$t('messages.title')} — Forage</title></svelte:head>

<MessagesPage />
