import { create } from 'zustand';

interface InventoryState {
    metrics: any[];
    setMetrics: (metrics: any[]) => void;
    isSyncing: boolean;
    setIsSyncing: (isSyncing: boolean) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
    metrics: [],
    setMetrics: (metrics) => set({ metrics }),
    isSyncing: false,
    setIsSyncing: (isSyncing) => set({ isSyncing })
}));
