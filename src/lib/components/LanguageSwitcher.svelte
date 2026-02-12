<script lang="ts">
	import { currentLanguage, setLanguage, languages, type LanguageCode } from '$lib/i18n';

	let isOpen = $state(false);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectLanguage(code: LanguageCode) {
		setLanguage(code);
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-switcher')) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="language-switcher">
	<button class="language-switcher__toggle" onclick={toggleDropdown} aria-expanded={isOpen}>
		<span class="language-switcher__flag">{languages[$currentLanguage].flag}</span>
		<span class="language-switcher__code">{$currentLanguage.toUpperCase()}</span>
		<span class="language-switcher__arrow" class:open={isOpen}>▼</span>
	</button>

	{#if isOpen}
		<ul class="language-switcher__dropdown">
			{#each Object.values(languages) as lang (lang.code)}
				<li>
					<button
						class="language-switcher__option"
						class:active={$currentLanguage === lang.code}
						onclick={() => selectLanguage(lang.code as LanguageCode)}
					>
						<span class="language-switcher__flag">{lang.flag}</span>
						<span class="language-switcher__name">{lang.name}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.language-switcher {
		position: relative;
	}

	.language-switcher__toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		color: var(--tg-theme-text-color, #000000);
	}

	.language-switcher__arrow {
		font-size: 10px;
		transition: transform 0.2s ease;
	}

	.language-switcher__arrow.open {
		transform: rotate(180deg);
	}

	.language-switcher__dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin: 4px 0 0 0;
		padding: 4px;
		list-style: none;
		background-color: var(--tg-theme-bg-color, #ffffff);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 140px;
		z-index: 100;
	}

	.language-switcher__option {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		font-size: 14px;
		color: var(--tg-theme-text-color, #000000);
		text-align: left;
	}

	.language-switcher__option:hover {
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
	}

	.language-switcher__option.active {
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	.language-switcher__flag {
		font-size: 18px;
	}

	.language-switcher__code {
		font-weight: 500;
	}

	.language-switcher__name {
		flex: 1;
	}
</style>
