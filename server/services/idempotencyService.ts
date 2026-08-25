import { db } from '../store/db.js';
import { publishAuditEvent } from './eventStream.js';

export class IdempotencyService {
  /**
   * Check if an idempotency key was already executed.
   * If yes, returns the cached result without re-executing.
   */
  public check(idempotencyKey?: string): { isDuplicate: boolean; cachedData?: any } {
    if (!idempotencyKey) return { isDuplicate: false };

    const record = db.idempotencyStore.get(idempotencyKey);
    if (record) {
      publishAuditEvent({
        transactionId: record.txnId,
        serviceName: 'Idempotency Service',
        eventType: 'DUPLICATE_REQUEST_DETECTED',
        newState: 'IDEMPOTENT_REPLAY_SUPPRESSED',
        status: 'WARNING',
        idempotencyKey,
        details: `Duplicate request with key ${idempotencyKey} suppressed. Returning cached transaction ${record.txnId}.`,
      });

      return { isDuplicate: true, cachedData: record.response };
    }

    return { isDuplicate: false };
  }

  public register(idempotencyKey: string, txnId: string, response: any) {
    db.idempotencyStore.set(idempotencyKey, {
      txnId,
      response,
      timestamp: Date.now(),
    });
  }
}

export const idempotencyService = new IdempotencyService();
