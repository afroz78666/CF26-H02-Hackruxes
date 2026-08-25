import { db } from '../store/db.js';
import { ConcurrencyRunResult, PriorityLevel } from '../types/index.js';
import { getSocketServer, publishAuditEvent } from './eventStream.js';

export class ConcurrencySimulator {
  private priorityRank(p: PriorityLevel): number {
    switch (p) {
      case 'CRITICAL':
        return 4;
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'NORMAL':
      default:
        return 1;
    }
  }

  public async runSimulation(params: {
    resourceId: string;
    requestCount: number; // 5, 10, 20, 50
    deterministicStrategy?: 'PRIORITY_FIRST' | 'FIRST_COME_FIRST_SERVED' | 'OCC_VERSION_CHECK';
  }): Promise<ConcurrencyRunResult> {
    const resource = db.resources.get(params.resourceId);
    if (!resource) {
      throw new Error(`Resource ${params.resourceId} not found`);
    }

    const io = getSocketServer();
    const simId = `SIM-CONCURRENCY-${Date.now()}`;
    const initialVersion = resource.version;
    const startTime = Date.now();

    // Pick random patients for competing requests
    const patientArray = Array.from(db.patients.values());
    const priorities: PriorityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'NORMAL', 'NORMAL'];

    // Generate competing requests
    const candidateRequests = Array.from({ length: params.requestCount }, (_, i) => {
      const p = patientArray[i % patientArray.length];
      const priority = (i === 0 ? 'CRITICAL' : priorities[Math.floor(Math.random() * priorities.length)]) as PriorityLevel;
      const arrivalDelayMs = Math.floor(Math.random() * 40); // 0-40ms spread
      return {
        index: i + 1,
        txnId: `TXN-SIM-${Math.floor(10000 + Math.random() * 90000)}`,
        patientId: p.id,
        patientName: p.name,
        priority,
        arrivalDelayMs,
        expectedVersion: initialVersion, // all read the same version at start
      };
    });

    publishAuditEvent({
      transactionId: simId,
      resourceId: resource.id,
      serviceName: 'Concurrency Simulator',
      eventType: 'CONCURRENCY_BURST_INITIATED',
      newState: 'EVALUATING_LOCKS',
      status: 'WARNING',
      details: `Generated ${params.requestCount} simultaneous competing transactions on resource ${resource.name} (Initial Version: v${initialVersion}).`,
    });

    // Notify connected clients that simulation has started
    if (io) {
      io.emit('concurrency:start', {
        simId,
        resourceId: resource.id,
        resourceName: resource.name,
        requestCount: params.requestCount,
        initialVersion,
        candidates: candidateRequests,
      });
    }

    // Short delay to allow frontend animation to render incoming barrage
    await new Promise((r) => setTimeout(r, 600));

    // Sort candidates according to strategy
    // Priority First: Higher priority wins; tie-breaker is arrivalDelayMs
    const sorted = [...candidateRequests].sort((a, b) => {
      const pDiff = this.priorityRank(b.priority) - this.priorityRank(a.priority);
      if (pDiff !== 0) return pDiff;
      return a.arrivalDelayMs - b.arrivalDelayMs;
    });

    const winner = sorted[0];
    const newVersion = initialVersion + 1;

    // Mutate resource to reflect winner
    resource.status = 'OCCUPIED';
    resource.assignedPatientId = winner.patientId;
    resource.assignedPatientName = winner.patientName;
    resource.version = newVersion;
    resource.lastModified = new Date().toISOString();

    const requestResults = candidateRequests.map((req) => {
      const isWinner = req.txnId === winner.txnId;
      if (isWinner) {
        return {
          txnId: req.txnId,
          patientId: req.patientId,
          patientName: req.patientName,
          priority: req.priority,
          expectedVersion: req.expectedVersion,
          lockStatus: 'ACQUIRED' as const,
          status: 'CONFIRMED' as const,
          latencyMs: req.arrivalDelayMs + 12,
          reason: `Lock successfully acquired. Priority: ${req.priority}. Optimistic version incremented (v${initialVersion} -> v${newVersion}).`,
        };
      } else {
        const isLowerPriority = this.priorityRank(req.priority) < this.priorityRank(winner.priority);
        const reason = isLowerPriority
          ? `Preempted by higher priority request (${winner.priority} vs ${req.priority}) from ${winner.patientName}.`
          : `Optimistic version mismatch: Resource version modified by ${winner.txnId}. Expected v${req.expectedVersion}, found live v${newVersion}.`;

        return {
          txnId: req.txnId,
          patientId: req.patientId,
          patientName: req.patientName,
          priority: req.priority,
          expectedVersion: req.expectedVersion,
          lockStatus: 'CONFLICT' as const,
          status: isLowerPriority ? ('PREEMPTED' as const) : ('REJECTED_VERSION_MISMATCH' as const),
          latencyMs: req.arrivalDelayMs + 18,
          reason,
        };
      }
    });

    const executionTimeMs = Date.now() - startTime;

    const result: ConcurrencyRunResult = {
      id: simId,
      resourceId: resource.id,
      resourceName: resource.name,
      totalRequests: params.requestCount,
      initialVersion,
      finalVersion: newVersion,
      winnerTxnId: winner.txnId,
      winnerPriority: winner.priority,
      winnerPatientName: winner.patientName,
      timestamp: new Date().toISOString(),
      executionTimeMs,
      requests: requestResults,
    };

    publishAuditEvent({
      transactionId: simId,
      resourceId: resource.id,
      serviceName: 'Concurrency Controller',
      eventType: 'CONCURRENCY_BURST_RESOLVED',
      previousState: `v${initialVersion}`,
      newState: `v${newVersion} (Winner: ${winner.txnId} [${winner.priority}])`,
      status: 'SUCCESS',
      details: `Resolved ${params.requestCount} concurrent requests. 1 Winner confirmed, ${params.requestCount - 1} rejected via deterministic priority & OCC version checks.`,
    });

    if (io) {
      io.emit('concurrency:result', result);
      io.emit('store:update', {
        resources: Array.from(db.resources.values()),
        patients: Array.from(db.patients.values()),
      });
    }

    return result;
  }
}

export const concurrencySimulator = new ConcurrencySimulator();
