<svelte:head>
	<title>atmo games</title>
	<meta name="description" content="Quick word and logic games: Fours, Fives, and Nines." />
</svelte:head>

<main class="flex min-h-svh items-center px-4 py-12 sm:px-6 sm:py-16">
	<div class="mx-auto w-full max-w-5xl">
		<header class="max-w-2xl">
			<p class="text-accent-600 dark:text-accent-400 text-sm font-bold tracking-[0.2em] uppercase">
				atmo games
			</p>
			<h1
				class="text-base-950 dark:text-base-50 mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
			>
				Pick a game
			</h1>
			<p class="text-base-500 dark:text-base-400 mt-4 text-base sm:text-lg">
				Quick word and logic games, made for a short break.
			</p>
		</header>

		<section class="mt-10 grid gap-5 sm:grid-cols-2 md:mt-14 lg:grid-cols-3" aria-label="Games">
			<a
				href="/fours/"
				class="group border-base-200 bg-base-50 dark:border-base-800 dark:bg-base-900 flex flex-col overflow-hidden rounded-3xl border shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl dark:shadow-black/20 dark:hover:border-cyan-800"
			>
				<div
					class="relative flex h-52 items-center justify-center overflow-hidden bg-cyan-100 dark:bg-cyan-950/40"
				>
					<div
						class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_55%)] opacity-80 dark:opacity-10"
					></div>
					<div
						class="relative grid w-40 grid-cols-4 gap-2 transition-transform duration-300 group-hover:scale-105"
						aria-hidden="true"
					>
						{#each Array(16) as _, index (index)}
							<div
								class="aspect-square rounded-lg shadow-sm {index < 4
									? 'bg-yellow-400 dark:bg-yellow-600'
									: index < 8
										? 'bg-green-400 dark:bg-green-600'
										: index < 12
											? 'bg-blue-400 dark:bg-blue-600'
											: 'bg-purple-400 dark:bg-purple-600'}"
							></div>
						{/each}
					</div>
					<div
						class="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-cyan-950/80 via-cyan-950/25 to-transparent"
					></div>
					<h2 class="absolute bottom-5 left-6 text-3xl font-bold text-white drop-shadow-sm">
						Fours
					</h2>
				</div>
			</a>

			<a
				href="/fives/"
				class="group border-base-200 bg-base-50 dark:border-base-800 dark:bg-base-900 flex flex-col overflow-hidden rounded-3xl border shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl dark:shadow-black/20 dark:hover:border-violet-800"
			>
				<div
					class="relative flex h-52 items-center justify-center overflow-hidden bg-violet-100 dark:bg-violet-950/40"
				>
					<div
						class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_55%)] opacity-80 dark:opacity-10"
					></div>
					<div
						class="relative flex gap-2 transition-transform duration-300 group-hover:scale-105"
						aria-hidden="true"
					>
						<span
							class="flex size-11 items-center justify-center rounded-lg bg-green-600 text-lg font-black text-white shadow-sm sm:size-12"
							>G</span
						>
						<span
							class="flex size-11 items-center justify-center rounded-lg bg-yellow-500 text-lg font-black text-white shadow-sm sm:size-12"
							>A</span
						>
						<span
							class="bg-base-500 flex size-11 items-center justify-center rounded-lg text-lg font-black text-white shadow-sm sm:size-12"
							>M</span
						>
						<span
							class="flex size-11 items-center justify-center rounded-lg bg-green-600 text-lg font-black text-white shadow-sm sm:size-12"
							>E</span
						>
						<span
							class="flex size-11 items-center justify-center rounded-lg border-2 border-violet-300 bg-white/60 text-lg font-black text-violet-800 shadow-sm sm:size-12 dark:border-violet-700 dark:bg-black/20 dark:text-violet-200"
							>S</span
						>
					</div>
					<div
						class="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-violet-950/80 via-violet-950/25 to-transparent"
					></div>
					<h2 class="absolute bottom-5 left-6 text-3xl font-bold text-white drop-shadow-sm">
						Fives
					</h2>
				</div>
			</a>

			<a
				href="/nines/"
				class="group border-base-200 bg-base-50 dark:border-base-800 dark:bg-base-900 flex flex-col overflow-hidden rounded-3xl border shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl dark:shadow-black/20 dark:hover:border-orange-800"
			>
				<div
					class="relative flex h-52 items-center justify-center overflow-hidden bg-orange-100 dark:bg-orange-950/40"
				>
					<div
						class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_55%)] opacity-80 dark:opacity-10"
					></div>
					<div
						class="relative grid size-36 grid-cols-3 overflow-hidden rounded-xl border-2 border-orange-500 bg-white/70 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-black/20"
						aria-hidden="true"
					>
						{#each [8, '', 4, '', 5, '', 2, '', 7] as number, index (index)}
							<div
								class="flex items-center justify-center border-orange-300 text-xl font-bold text-orange-900 {index %
									3 !==
								2
									? 'border-r'
									: ''} {index < 6 ? 'border-b' : ''} dark:border-orange-800 dark:text-orange-200"
							>
								{number}
							</div>
						{/each}
					</div>
					<div
						class="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-orange-950/80 via-orange-950/25 to-transparent"
					></div>
					<h2 class="absolute bottom-5 left-6 text-3xl font-bold text-white drop-shadow-sm">
						Nines
					</h2>
				</div>
			</a>
		</section>
	</div>
</main>
