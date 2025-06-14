<script>
  import { onMount } from 'svelte';
  import { accounts, loading, error, fetchAccounts } from '../lib/stores/accounts.js';
  import AccountAccordion from '../lib/components/AccountAccordion.svelte';
  import RefreshButton from '../lib/components/RefreshButton.svelte';
  import SearchBar from '../lib/components/SearchBar.svelte';
  
  let searchTerm = '';
  let filteredAccounts = [];
  
  onMount(() => {
    fetchAccounts();
  });
  
  function handleSearch(event) {
    searchTerm = event.detail.term.toLowerCase();
    filterAccounts();
  }
  
  function filterAccounts() {
    if (!searchTerm) {
      filteredAccounts = $accounts;
    } else {
      filteredAccounts = $accounts.filter(account => 
        account.accountName?.toLowerCase().includes(searchTerm) ||
        account.characters?.some(char => 
          char.characterName?.toLowerCase().includes(searchTerm) ||
          char.jobName?.toLowerCase().includes(searchTerm)
        )
      );
    }
  }
  
  $: {
    if ($accounts) {
      filterAccounts();
    }
  }
</script>

<svelte:head>
  <title>던파 캐릭터 분류·컨텐츠 추천</title>
</svelte:head>

<div class="space-y-6">
  <header class="text-center">
    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
      던파 캐릭터 분류·컨텐츠 추천
    </h1>
    <p class="text-sm sm:text-base text-base-content/70 max-w-2xl mx-auto">
      길드원들의 캐릭터 명성을 확인하고 컨텐츠 입장 가능 여부를 한눈에 파악하세요
    </p>
  </header>
  
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div class="w-full sm:w-auto">
      <SearchBar on:search={handleSearch} />
    </div>
    <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <RefreshButton />
      <a href="/admin" class="btn btn-outline btn-sm whitespace-nowrap">
        운영 콘솔
      </a>
    </div>
  </div>
  
  {#if $error}
    <div class="alert alert-error">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
      <span>{$error}</span>
    </div>
  {/if}
  
  {#if $loading && !$accounts.length}
    <div class="flex flex-col items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg mb-4"></span>
      <p class="text-base-content/70">데이터를 불러오는 중...</p>
    </div>
  {:else if filteredAccounts.length > 0}
    <div class="space-y-2">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold">
          계정 목록
          <span class="badge badge-neutral ml-2">{filteredAccounts.length}개</span>
        </h2>
        {#if searchTerm}
          <div class="text-sm text-base-content/70">
            "{searchTerm}" 검색 결과
          </div>
        {/if}
      </div>
      
      {#each filteredAccounts as account (account.id)}
        <AccountAccordion {account} />
      {/each}
    </div>
  {:else if searchTerm}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-semibold mb-2">검색 결과가 없습니다</h3>
      <p class="text-base-content/70">
        "{searchTerm}"에 대한 검색 결과를 찾을 수 없습니다.
      </p>
    </div>
  {:else}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">📋</div>
      <h3 class="text-xl font-semibold mb-2">계정 정보가 없습니다</h3>
      <p class="text-base-content/70 mb-4">
        데이터를 불러오려면 새로고침 버튼을 클릭하세요.
      </p>
      <RefreshButton />
    </div>
  {/if}
</div>