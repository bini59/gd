<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let activeTab = 'raid';
  
  const tabs = [
    { id: 'raid', label: 'Raid', icon: '⚔️' },
    { id: 'adv', label: 'Adventure', icon: '🗺️' },
    { id: 'legion', label: 'Legion', icon: '👥' }
  ];
  
  function selectTab(tabId) {
    activeTab = tabId;
    dispatch('tabchange', { tab: tabId });
  }
</script>

<div class="tabs tabs-boxed flex-wrap sm:flex-nowrap">
  {#each tabs as tab}
    <button 
      class="tab flex-1 sm:flex-none min-w-0"
      class:tab-active={activeTab === tab.id}
      on:click={() => selectTab(tab.id)}
      aria-label="{tab.label} 탭"
      role="tab"
      aria-selected={activeTab === tab.id}
    >
      <span class="mr-1 sm:mr-2 text-sm sm:text-base">{tab.icon}</span>
      <span class="text-xs sm:text-sm truncate">{tab.label}</span>
    </button>
  {/each}
</div>