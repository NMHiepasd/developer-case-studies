/**
 * CartQuantityManager
 * Solves race conditions and inconsistent state during rapid quantity updates.
 * Features: Debounce, Optimistic UI Updates, and In-Flight Request Cancellation.
 */

export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class CartQuantityManager {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private isSyncing = false;

  constructor(
    private item: CartItem,
    private onStateChange: (item: CartItem, isSyncing: boolean) => void,
    private apiSyncCallback: (itemId: number, quantity: number, signal: AbortSignal) => Promise<{ success: boolean; subtotal: number }>,
    private debounceDelayMs: number = 300
  ) {}

  /**
   * Optimistically increments/decrements quantity and triggers debounced sync.
   */
  public updateQuantity(delta: number, minLimit: number = 1, maxLimit: number = 99): void {
    const nextQty = Math.max(minLimit, Math.min(maxLimit, this.item.quantity + delta));
    if (nextQty === this.item.quantity) return;

    // 1. Optimistic UI update
    this.item.quantity = nextQty;
    this.item.subtotal = nextQty * this.item.unitPrice;
    this.onStateChange({ ...this.item }, true);

    // 2. Clear previous timer and abort obsolete pending requests
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.abortController) {
      this.abortController.abort();
    }

    // 3. Debounce dispatch
    this.debounceTimer = setTimeout(() => {
      this.syncWithServer(this.item.id, this.item.quantity);
    }, this.debounceDelayMs);
  }

  private async syncWithServer(itemId: number, quantity: number): Promise<void> {
    this.abortController = new AbortController();
    this.isSyncing = true;

    try {
      const response = await this.apiSyncCallback(itemId, quantity, this.abortController.signal);
      if (response.success) {
        this.item.subtotal = response.subtotal;
        this.onStateChange({ ...this.item }, false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Obsolete request cancelled intentionally, safely ignore
        return;
      }
      console.error(`Failed to synchronize cart item ${itemId}:`, err);
      // Revert or show error toast
      this.onStateChange({ ...this.item }, false);
    } finally {
      this.isSyncing = false;
    }
  }
}
