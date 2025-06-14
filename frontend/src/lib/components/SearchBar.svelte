<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let searchTerm = '';
  
  function handleInput(event) {
    searchTerm = event.target.value;
    dispatch('search', { term: searchTerm });
  }
</script>

<div class="form-control w-full max-w-md">
  <label class="label sr-only" for="search-input">
    <span class="label-text">계정명, 캐릭터명, 직업명으로 검색</span>
  </label>
  <input 
    id="search-input"
    type="text" 
    placeholder="계정명, 캐릭터명, 직업명으로 검색..." 
    class="input input-bordered w-full" 
    bind:value={searchTerm}
    on:input={handleInput}
    aria-label="계정명, 캐릭터명, 직업명으로 검색"
  />
</div>