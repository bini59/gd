<script>
  import CharacterBadge from './CharacterBadge.svelte';
  import ContentTabs from './ContentTabs.svelte';
  
  export let account;
  export let isExpanded = false;
  
  let activeTab = 'raid';
  let characters = [];
  let loading = false;
  
  async function toggleExpand() {
    isExpanded = !isExpanded;
    
    if (isExpanded && characters.length === 0) {
      await fetchCharacters();
    }
  }
  
  async function fetchCharacters() {
    loading = true;
    try {
      const response = await fetch(`http://localhost:3000/accounts/${account.id}/eligibles`);
      if (!response.ok) throw new Error('Failed to fetch characters');
      characters = await response.json();
    } catch (err) {
      console.error('Error fetching characters:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleTabChange(event) {
    activeTab = event.detail.tab;
  }
  
  function getSlotStatus(characters, contentType) {
    const slotLimits = {
      raid: { nightmare: 4, nabeel: 1 },
      adv: { goddess: 2, azure: 2 },
      legion: { venus: 1 }
    };
    
    const eligible = characters.filter(char => {
      if (contentType === 'raid') {
        return char.fame >= 55000;
      } else if (contentType === 'adv') {
        return char.fame >= 50000;
      } else if (contentType === 'legion') {
        return char.fame >= 60000;
      }
      return false;
    });
    
    const limit = contentType === 'raid' ? 4 : contentType === 'adv' ? 4 : 1;
    return { eligible: eligible.length, limit };
  }
  
  function getTopFameCharacter(characters) {
    if (!characters.length) return null;
    return characters.reduce((top, char) => 
      char.fame > (top?.fame || 0) ? char : top
    );
  }
  
  $: slotStatus = getSlotStatus(characters, activeTab);
  $: topFameChar = getTopFameCharacter(characters);
</script>

<div class="collapse collapse-arrow bg-base-200 mb-2">
  <input 
    type="checkbox" 
    bind:checked={isExpanded} 
    on:change={toggleExpand}
    aria-label="{account.accountName || `Account ${account.id}`} 펼치기/접기"
  />
  
  <div class="collapse-title text-sm sm:text-lg font-medium">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <span class="truncate">{account.accountName || `Account ${account.id}`}</span>
        <div class="badge badge-neutral badge-sm sm:badge-md">{characters.length}명</div>
      </div>
      
      <div class="flex gap-1 sm:gap-2 flex-wrap">
        <div class="badge badge-primary badge-sm sm:badge-md">
          {slotStatus.eligible}/{slotStatus.limit}
        </div>
        {#if topFameChar}
          <div class="badge badge-warning badge-sm sm:badge-md">
            👑 <span class="hidden sm:inline ml-1">{topFameChar.fame?.toLocaleString()}</span>
            <span class="sm:hidden ml-1">{Math.round(topFameChar.fame / 1000)}k</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <div class="collapse-content">
    {#if isExpanded}
      <div class="pt-4">
        <div class="flex justify-center mb-4">
          <ContentTabs {activeTab} on:tabchange={handleTabChange} />
        </div>
        
        {#if loading}
          <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        {:else if characters.length > 0}
          <div class="grid gap-2 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {#each characters as character}
              <CharacterBadge 
                {character} 
                contentType={activeTab}
                isTopFame={character.id === topFameChar?.id}
              />
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-base-content/70">
            캐릭터 정보가 없습니다.
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>