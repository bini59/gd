import { writable } from 'svelte/store';

export const accounts = writable([]);
export const loading = writable(false);
export const error = writable(null);

const API_BASE = 'http://localhost:3000';

export async function fetchAccounts() {
  loading.set(true);
  error.set(null);
  
  try {
    const response = await fetch(`${API_BASE}/accounts`);
    if (!response.ok) throw new Error('Failed to fetch accounts');
    
    const data = await response.json();
    accounts.set(data);
  } catch (err) {
    error.set(err.message);
    console.error('Error fetching accounts:', err);
  } finally {
    loading.set(false);
  }
}

export async function fetchAccountEligibles(accountId) {
  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}/eligibles`);
    if (!response.ok) throw new Error('Failed to fetch eligibles');
    return await response.json();
  } catch (err) {
    console.error('Error fetching eligibles:', err);
    throw err;
  }
}

export async function triggerSync() {
  loading.set(true);
  error.set(null);
  
  try {
    const response = await fetch(`${API_BASE}/sync/run`, { method: 'POST' });
    if (!response.ok) throw new Error('Sync failed');
    
    await fetchAccounts();
    return true;
  } catch (err) {
    error.set(err.message);
    console.error('Error triggering sync:', err);
    return false;
  } finally {
    loading.set(false);
  }
}