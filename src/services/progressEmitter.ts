/**
 * Progress Emitter Service
 * In-memory pub/sub for streaming ingestion progress via SSE
 */

export interface ProgressEvent {
  step:
    | "started"
    | "crawling"
    | "crawl_complete"
    | "processing"
    | "embedding"
    | "storing"
    | "complete"
    | "error";
  progress: number; // 0-100, or -1 for error
  message: string;
  pagesFound?: number;
  currentPage?: number;
  totalPages?: number;
  chunksProcessed?: number;
}

type Listener = (event: ProgressEvent) => void;

class ProgressEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  /**
   * Subscribe to progress events for a specific document
   */
  subscribe(documentId: string, listener: Listener): () => void {
    if (!this.listeners.has(documentId)) {
      this.listeners.set(documentId, new Set());
    }
    this.listeners.get(documentId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const docListeners = this.listeners.get(documentId);
      if (docListeners) {
        docListeners.delete(listener);
        if (docListeners.size === 0) {
          this.listeners.delete(documentId);
        }
      }
    };
  }

  /**
   * Emit a progress event to all subscribers for a document
   */
  emit(documentId: string, event: ProgressEvent): void {
    const docListeners = this.listeners.get(documentId);
    if (docListeners) {
      docListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(
            `[ProgressEmitter] Listener error for ${documentId}:`,
            err
          );
        }
      });
    }
    console.log(
      `[ProgressEmitter] ${documentId}: ${event.step} (${event.progress}%) - ${event.message}`
    );
  }

  /**
   * Check if there are any active listeners for a document
   */
  hasListeners(documentId: string): boolean {
    return (this.listeners.get(documentId)?.size ?? 0) > 0;
  }

  /**
   * Clean up all listeners for a document
   */
  cleanup(documentId: string): void {
    this.listeners.delete(documentId);
  }
}

// Singleton instance
export const progressEmitter = new ProgressEmitter();
