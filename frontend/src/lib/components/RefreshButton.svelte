<script>
  import { loading, triggerSync } from '../stores/accounts.js';
  
  let isRefreshing = false;
  
  async function handleRefresh() {
    isRefreshing = true;
    const success = await triggerSync();
    isRefreshing = false;
    
    if (success) {
      showToast('데이터가 성공적으로 갱신되었습니다.', 'success');
    } else {
      showToast('데이터 갱신에 실패했습니다.', 'error');
    }
  }
  
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-top toast-center`;
    toast.innerHTML = `
      <div class="alert alert-${type === 'success' ? 'success' : 'error'}">
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
</script>

<button 
  class="btn btn-primary w-full sm:w-auto" 
  class:loading={isRefreshing || $loading}
  disabled={isRefreshing || $loading}
  on:click={handleRefresh}
  aria-label="데이터 새로고침"
>
  {#if isRefreshing || $loading}
    <span class="loading loading-spinner loading-sm"></span>
    새로고침 중...
  {:else}
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    새로고침
  {/if}
</button>