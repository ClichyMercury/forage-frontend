<script lang="ts">
  import ProfilePage from '$lib/components/ui/ProfilePage.svelte'
  import { t } from '$lib/stores/locale'
</script>

<svelte:head><title>{$t('profile.title')} — Forage</title></svelte:head>

<ProfilePage />
