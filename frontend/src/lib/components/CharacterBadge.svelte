<script>
  export let character;
  export let contentType = 'raid';
  export let isTopFame = false;
  
  function getTierColor(fame) {
    if (fame >= 60000) return 'var(--tier-legend)';
    if (fame >= 55000) return 'var(--tier-epic)';
    if (fame >= 50000) return 'var(--tier-rare)';
    return 'var(--tier-unranked)';
  }
  
  function getEligibilityStatus(character, contentType) {
    const rules = {
      raid: { nabeel: 58000, nightmare: 55000 },
      adv: { goddess: 52000, azure: 50000 },
      legion: { venus: 60000 }
    };
    
    const content = rules[contentType];
    if (!content) return { eligible: false, reason: 'Unknown content' };
    
    for (const [name, requiredFame] of Object.entries(content)) {
      if (character.fame >= requiredFame) {
        return { eligible: true, content: name };
      }
    }
    
    return { eligible: false, reason: 'Fame too low' };
  }
  
  $: eligibility = getEligibilityStatus(character, contentType);
  $: tierColor = getTierColor(character.fame);
</script>

<div class="card card-compact bg-base-100 shadow-sm border hover:shadow-md transition-shadow">
  <div class="card-body p-3 sm:p-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <div class="avatar placeholder flex-shrink-0">
          <div class="bg-neutral text-neutral-content rounded-full w-6 h-6 sm:w-8 sm:h-8">
            <span class="text-xs">{character.jobName?.charAt(0) || '?'}</span>
          </div>
        </div>
        
        <div class="min-w-0 flex-1">
          <div class="font-semibold flex items-center gap-1 text-sm sm:text-base">
            <span class="truncate">{character.characterName}</span>
            {#if isTopFame}
              <div class="badge badge-warning badge-xs sm:badge-sm flex-shrink-0">👑</div>
            {/if}
          </div>
          <div class="text-xs sm:text-sm text-base-content/70 truncate">{character.jobName}</div>
        </div>
      </div>
      
      <div class="text-right flex-shrink-0">
        <div 
          class="font-mono text-xs sm:text-sm font-semibold"
          style="color: {tierColor}"
          title="{character.fame?.toLocaleString() || 'N/A'} 명성"
        >
          <span class="hidden sm:inline">{character.fame?.toLocaleString() || 'N/A'}</span>
          <span class="sm:hidden">{character.fame ? Math.round(character.fame / 1000) + 'k' : 'N/A'}</span>
        </div>
        <div class="flex gap-1 mt-1 justify-end">
          {#if eligibility.eligible}
            <div class="badge badge-success badge-xs sm:badge-sm" title="입장 가능">✓</div>
            <div class="badge badge-outline badge-xs sm:badge-sm" title="{eligibility.content} 컨텐츠">{eligibility.content}</div>
          {:else}
            <div class="badge badge-error badge-xs sm:badge-sm" title="입장 불가">✕</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>