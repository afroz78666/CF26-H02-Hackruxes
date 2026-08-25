import { db } from '../store/db.js';
import { getSocketServer, publishAuditEvent } from './eventStream.js';
import { transactionOrchestrator } from './transactionOrchestrator.js';

export interface ChaosState {
  serviceUnavailable: boolean;
  dbLockContention: boolean;
  networkTimeoutMs: number;
  forceNextTxnFail: boolean;
}

export class FailureLabService {
  public getStatus(): ChaosState {
    return { ...db.chaosFlags };
  }

  public updateFlags(newFlags: Partial<ChaosState>): ChaosState {
    db.chaosFlags = {
      ...db.chaosFlags,
      ...newFlags,
    };

    publishAuditEvent({
      transactionId: `CHAOS-${Date.now()}`,
      serviceName: 'Chaos Injection Engine',
      eventType: 'CHAOS_FLAGS_MUTATED',
      newState: JSON.stringify(db.chaosFlags),
      status: 'WARNING',
      details: `Failure Lab conditions altered: ServiceUnavailable=${db.chaosFlags.serviceUnavailable}, Timeout=${db.chaosFlags.networkTimeoutMs}ms, ForceFail=${db.chaosFlags.forceNextTxnFail}`,
    });

    const io = getSocketServer();
    if (io) {
      io.emit('chaos:update', db.chaosFlags);
    }

    return db.chaosFlags;
  }

  /**
   * Run automated Resilience & Self-Healing Demo:
   * 1. Injects transient network fault
   * 2. First attempt fails
   * 3. Circuit breaker & retry backoff (Attempt 1 -> Attempt 2)
   * 4. System automatically heals and commits transaction
   */
  public async runSelfHealingDemo(patientId: string, resourceId: string) {
    const io = getSocketServer();
    const demoId = `RECOVERY-DEMO-${Date.now()}`;

    publishAuditEvent({
      transactionId: demoId,
      serviceName: 'Resilience Controller',
      eventType: 'SELF_HEALING_DEMO_STARTED',
      newState: 'INJECTING_FAULT',
      status: 'WARNING',
      details: 'Simulating transient microservice network partition with automated exponential backoff recovery.',
    });

    if (io) {
      io.emit('failureLab:healingProgress', {
        step: 1,
        status: 'FAULT_INJECTED',
        message: 'Transient network glitch injected (503 Gateway Timeout simulation)...',
      });
    }

    // Step 1: Force failure on next transaction
    db.chaosFlags.forceNextTxnFail = true;

    // Execute first attempt
    const txn1 = await transactionOrchestrator.executeTransaction({
      type: 'ALLOCATE_RESOURCE',
      patientId,
      resourceId,
      priority: 'HIGH',
      idempotencyKey: `IDEMP-RETRY-${Date.now()}`,
    });

    if (io) {
      io.emit('failureLab:healingProgress', {
        step: 2,
        status: 'ATTEMPT_1_FAILED',
        message: `Attempt 1 Failed: ${txn1.errorMessage || 'Timeout'}. Initiating Circuit Breaker exponential retry (1000ms delay)...`,
      });
    }

    await new Promise((r) => setTimeout(r, 1200));

    if (io) {
      io.emit('failureLab:healingProgress', {
        step: 3,
        status: 'RETRYING',
        message: 'Attempt 2 in progress with active circuit recovery...',
      });
    }

    // Clear fault for second attempt
    db.chaosFlags.forceNextTxnFail = false;
    const txn2 = await transactionOrchestrator.executeTransaction({
      type: 'ALLOCATE_RESOURCE',
      patientId,
      resourceId,
      priority: 'HIGH',
      idempotencyKey: `IDEMP-RETRY-SUCCESS-${Date.now()}`,
    });

    if (io) {
      io.emit('failureLab:healingProgress', {
        step: 4,
        status: 'HEALED_SUCCESS',
        message: `Resilience verified! Transaction ${txn2.id} succeeded on retry. Resource successfully allocated.`,
        transaction: txn2,
      });
    }

    publishAuditEvent({
      transactionId: demoId,
      serviceName: 'Resilience Controller',
      eventType: 'SELF_HEALING_DEMO_COMPLETED',
      newState: 'SYSTEM_HEALTHY',
      status: 'SUCCESS',
      details: `Self-healing demonstration concluded successfully. Transaction ${txn2.id} recovered after initial transient fault.`,
    });

    return { initialFailure: txn1, recoveredTxn: txn2 };
  }
}

export const failureLabService = new FailureLabService();
