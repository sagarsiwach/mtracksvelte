<script>
  import { onMount } from 'svelte';
  import { format } from 'date-fns';

  // Mock data for initial UI development
  let mantras = {
    "Mantra1": 5,
    "Mantra2": 3,
    "Mantra3": 7
  };

  let isLoading = false;
  let isUpdating = false;
  let error = null;
  let newMantra = '';

  function fetchMantras() {
    // Simulate loading
    isLoading = true;

    // Simulate API call with timeout
    setTimeout(() => {
      // No changes to data in this mock version
      isLoading = false;
    }, 1000);
  }

  function incrementMantra(name) {
    if (isUpdating) return;

    // Simulate updating
    isUpdating = true;

    // Optimistic update
    mantras = { ...mantras, [name]: (mantras[name] || 0) + 1 };

    // Simulate API call with timeout
    setTimeout(() => {
      isUpdating = false;
    }, 800);
  }

  function addMantra() {
    if (!newMantra.trim()) return;

    if (!mantras[newMantra]) {
      mantras = { ...mantras, [newMantra]: 0 };
      newMantra = '';
    }
  }

  // Simulate error for UI testing (uncomment to test)
  // onMount(() => {
  //   setTimeout(() => {
  //     error = "This is a sample error message for UI testing";
  //   }, 2000);
  // });
</script>

<main class="min-h-screen">
  <!-- IBM Header -->
  <header class="bg-black text-white py-4">
    <div class="max-w-6xl mx-auto px-4">
      <h1 class="text-2xl font-medium">Mantra Tracker</h1>
    </div>
  </header>

  <div class="max-w-6xl mx-auto p-8">
    <div class="mb-8 flex justify-between items-center">
      <h2 class="text-2xl font-medium">
        Today's Counts ({format(new Date(), 'MMMM d, yyyy')})
      </h2>
      <button
        on:click={fetchMantras}
        class="ibm-button-secondary"
        disabled={isLoading}
      >
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>

    <!-- Error message -->
    {#if error}
      <div class="bg-ibm-red bg-opacity-10 border-l-4 border-ibm-red text-ibm-red-60 p-4 mb-6">
        <p class="font-medium">Error</p>
        <p>{error}</p>
      </div>
    {/if}

    <!-- Add new mantra form -->
    <div class="ibm-card mb-6">
      <h3 class="text-lg font-medium mb-4">Add New Mantra</h3>
      <div class="flex gap-3">
        <div class="flex-grow">
          <input
            type="text"
            bind:value={newMantra}
            placeholder="Enter a new mantra"
            class="ibm-input"
            on:keypress={(e) => e.key === 'Enter' && addMantra()}
          />
        </div>
        <button
          on:click={addMantra}
          class="ibm-button-primary"
          disabled={isLoading || !newMantra.trim()}
        >
          Add
        </button>
      </div>
    </div>

    <!-- Mantra list -->
    <div class="ibm-card">
      {#if isLoading && Object.keys(mantras).length === 0}
        <div class="py-8 text-center text-ibm-gray-30">
          <div class="inline-block w-6 h-6 border-2 border-ibm-gray-60 border-t-ibm-blue rounded-full animate-spin mr-2"></div>
          Loading mantras...
        </div>
      {:else}
        {#each Object.entries(mantras) as [name, count]}
          <div class="py-5 border-b border-ibm-gray-70 last:border-b-0">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-xl">{name}</h3>
                <div class="mt-2 flex items-center">
                  <span class="text-ibm-gray-30 mr-2">Count:</span>
                  <span class="bg-ibm-gray-80 px-3 py-1 font-medium">
                    {count}
                  </span>
                </div>
              </div>
              <button
                on:click={() => incrementMantra(name)}
                class="ibm-button-primary"
                disabled={isUpdating}
              >
                {#if isUpdating}
                  <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Updating...
                {:else}
                  Increment
                {/if}
              </button>
            </div>
          </div>
        {/each}

        {#if Object.keys(mantras).length === 0}
          <div class="py-8 text-center text-ibm-gray-30">
            No mantras added yet. Add your first mantra above.
          </div>
        {/if}
      {/if}
    </div>
  </div>
</main>
