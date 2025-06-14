<script>
  import { onMount } from 'svelte';
  import RefreshButton from '../../lib/components/RefreshButton.svelte';
  
  let syncLogs = [];
  let loading = false;
  let error = null;
  
  onMount(() => {
    fetchSyncLogs();
  });
  
  async function fetchSyncLogs() {
    loading = true;
    error = null;
    
    try {
      const response = await fetch('http://localhost:3000/sync/logs');
      if (!response.ok) throw new Error('Failed to fetch sync logs');
      
      syncLogs = await response.json();
    } catch (err) {
      error = err.message;
      console.error('Error fetching sync logs:', err);
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString('ko-KR');
  }
  
  function getStatusBadge(status) {
    switch (status) {
      case 'success':
        return 'badge-success';
      case 'failed':
        return 'badge-error';
      case 'running':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }
  
  function getStatusText(status) {
    switch (status) {
      case 'success':
        return '성공';
      case 'failed':
        return '실패';
      case 'running':
        return '실행 중';
      default:
        return '알 수 없음';
    }
  }
</script>

<svelte:head>
  <title>운영 콘솔 - 던파 캐릭터 분류·컨텐츠 추천</title>
</svelte:head>

<div class="space-y-6">
  <div class="navbar bg-base-200 rounded-lg flex-col sm:flex-row">
    <div class="navbar-start w-full sm:w-auto justify-between sm:justify-start">
      <a href="/" class="btn btn-ghost btn-sm sm:btn-md">
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        <span class="hidden sm:inline">대시보드로 돌아가기</span>
        <span class="sm:hidden">대시보드</span>
      </a>
      <h1 class="text-lg sm:text-xl font-bold sm:hidden">운영 콘솔</h1>
    </div>
    <div class="navbar-center hidden sm:block">
      <h1 class="text-xl font-bold">운영 콘솔</h1>
    </div>
    <div class="navbar-end w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
      <RefreshButton />
    </div>
  </div>
  
  <div class="stats shadow w-full stats-vertical sm:stats-horizontal">
    <div class="stat">
      <div class="stat-figure text-primary">
        <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="stat-title text-xs sm:text-sm">총 Sync 실행</div>
      <div class="stat-value text-lg sm:text-2xl">{syncLogs.length}</div>
      <div class="stat-desc text-xs">전체 기간</div>
    </div>
    
    <div class="stat">
      <div class="stat-figure text-success">
        <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      </div>
      <div class="stat-title text-xs sm:text-sm">성공률</div>
      <div class="stat-value text-lg sm:text-2xl">
        {syncLogs.length ? Math.round((syncLogs.filter(log => log.status === 'success').length / syncLogs.length) * 100) : 0}%
      </div>
      <div class="stat-desc text-xs">
        {syncLogs.filter(log => log.status === 'success').length}/{syncLogs.length} 성공
      </div>
    </div>
    
    <div class="stat">
      <div class="stat-figure text-info">
        <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="stat-title text-xs sm:text-sm">마지막 Sync</div>
      <div class="stat-value text-xs sm:text-sm">
        {syncLogs.length ? formatDate(syncLogs[0]?.created_at).split(' ')[1] : 'N/A'}
      </div>
      <div class="stat-desc text-xs">
        {syncLogs.length ? formatDate(syncLogs[0]?.created_at).split(' ')[0] : '데이터 없음'}
      </div>
    </div>
  </div>
  
  <div class="card bg-base-100 shadow-xl">
    <div class="card-header p-6 pb-0">
      <div class="flex items-center justify-between">
        <h2 class="card-title text-2xl">Sync 로그</h2>
        <button 
          class="btn btn-outline btn-sm"
          class:loading={loading}
          disabled={loading}
          on:click={fetchSyncLogs}
        >
          {#if loading}
            새로고침 중...
          {:else}
            새로고침
          {/if}
        </button>
      </div>
    </div>
    
    <div class="card-body">
      {#if error}
        <div class="alert alert-error">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span>{error}</span>
        </div>
      {:else if loading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else if syncLogs.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra table-xs sm:table-sm">
            <thead>
              <tr>
                <th class="text-xs sm:text-sm">실행 시간</th>
                <th class="text-xs sm:text-sm">상태</th>
                <th class="text-xs sm:text-sm hidden sm:table-cell">소요 시간</th>
                <th class="text-xs sm:text-sm hidden lg:table-cell">처리된 데이터</th>
                <th class="text-xs sm:text-sm">메시지</th>
              </tr>
            </thead>
            <tbody>
              {#each syncLogs as log}
                <tr>
                  <td class="font-mono text-xs sm:text-sm">
                    <div class="sm:hidden">{formatDate(log.created_at).split(' ')[1]}</div>
                    <div class="hidden sm:block">{formatDate(log.created_at)}</div>
                  </td>
                  <td>
                    <div class="badge {getStatusBadge(log.status)} badge-xs sm:badge-sm">
                      {getStatusText(log.status)}
                    </div>
                  </td>
                  <td class="font-mono text-xs sm:text-sm hidden sm:table-cell">
                    {log.duration ? `${log.duration}ms` : 'N/A'}
                  </td>
                  <td class="hidden lg:table-cell">
                    {#if log.records_processed}
                      <div class="text-xs sm:text-sm">
                        <div>{log.records_processed}건 처리</div>
                        {#if log.records_failed > 0}
                          <div class="text-error">{log.records_failed}건 실패</div>
                        {/if}
                      </div>
                    {:else}
                      N/A
                    {/if}
                  </td>
                  <td class="max-w-xs sm:max-w-sm">
                    <div class="truncate text-xs sm:text-sm" title={log.message}>
                      {log.message || '메시지 없음'}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2">Sync 로그가 없습니다</h3>
          <p class="text-base-content/70">
            데이터 동기화를 실행하면 로그가 여기에 표시됩니다.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>