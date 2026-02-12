<script lang="ts">
	import { onMount } from 'svelte';
	import { initTelegram, isTelegram, tgUser } from '$lib/telegram';

	let { children } = $props();

	onMount(() => {
		initTelegram();

		if (isTelegram) {
			console.log('Telegram WebApp detected');
			console.log(tgUser);
		} else {
			console.log('Not opened inside Telegram');
		}
	});
</script>

<div class="app-layout">
	<div class="app-content">
		{@render children()}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
