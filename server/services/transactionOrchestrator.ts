import { v4 as uuidv4 } from 'uuid';
import { db } from '../store/db.js';
import { PriorityLevel, Transaction, TransactionStatus, TransactionType } from '../types/index.js';
import { dispatchNotification, getSocketServer, publishAuditEvent } from './eventStream.js';
import { idempotencyService } from './idempotencyService.js';

interface RequestParams {
  type: TransactionType;
  patientId: string;
  resourceId: string;
  doctorId?: string;
  priority?: PriorityLevel;
  idempotencyKey?: string;
  expectedVersion?: number;
}

export class TransactionOrchestrator {
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async executeTransaction(params: RequestParams): Promise<Transaction> {
    const priority = params.priority || 'NORMAL';
    const idempotencyKey = params.idempotencyKey || `IDEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Idempotency Check
    const idempCheck = idempotencyService.check(idempotencyKey);
    if (idempCheck.isDuplicate) {
      return idempCheck.cachedData;
    }

    const patient = db.patients.get(params.patientId);
    const doctor = params.doctorId ? db.doctors.get(params.doctorId) : undefined;
    const resource = db.resources.get(params.resourceId);

    const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    const io = getSocketServer();

    const transaction: Transaction = {
      id: txnId,
      type: params.type,
      patientId: params.patientId,
      patientName: patient ? patient.name : 'Unknown Patient',
      doctorId: doctor?.id,
      doctorName: doctor?.name,
      resourceId: params.resourceId,
      resourceName: resource ? resource.name : 'Unknown Resource',
      priority,
      status: 'PENDING',
      idempotencyKey,
      createdAt: new Date().toISOString(),
      expectedVersion: params.expectedVersion ?? resource?.version,
      currentStepIndex: 0,
      steps: [
        { stepIndex: 1, name: 'Validate Patient & Clinical Authorization', status: 'PENDING' },
        { stepIndex: 2, name: 'Check Resource Availability & Optimistic Version', status: 'PENDING' },
        { stepIndex: 3, name: 'Acquire Distributed Resource Lock', status: 'PENDING' },
        { stepIndex: 4, name: 'Commit State Mutation & Version Bump', status: 'PENDING' },
        { stepIndex: 5, name: 'Publish Synchronized Events & Notifications', status: 'PENDING' },
      ],
    };

    db.transactions.set(txnId, transaction);

    const broadcastTxnUpdate = (status: TransactionStatus, stepIdx: number, stepStatus: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED') => {
      transaction.status = status;
      transaction.currentStepIndex = stepIdx;
      if (transaction.steps[stepIdx - 1]) {
        transaction.steps[stepIdx - 1].status = stepStatus;
        transaction.steps[stepIdx - 1].timestamp = new Date().toISOString();
      }
      if (io) {
        io.emit('transaction:update', transaction);
      }
    };

    // Begin Orchestration Workflow
    broadcastTxnUpdate('PROCESSING', 1, 'IN_PROGRESS');

    // Simulate network delay / chaos latency if active
    if (db.chaosFlags.networkTimeoutMs > 0) {
      await this.sleep(db.chaosFlags.networkTimeoutMs);
    } else {
      await this.sleep(300);
    }

    // Step 1: Validate Patient
    if (!patient) {
      transaction.errorMessage = `Patient ${params.patientId} not found in hospital registry.`;
      broadcastTxnUpdate('FAILED', 1, 'FAILED');
      publishAuditEvent({
        transactionId: txnId,
        serviceName: 'Patient Service',
        eventType: 'PATIENT_VALIDATION_FAILED',
        newState: 'FAILED',
        status: 'FAILED',
        idempotencyKey,
        details: `Validation failed: patient ${params.patientId} does not exist.`,
      });
      return transaction;
    }
    broadcastTxnUpdate('PROCESSING', 1, 'SUCCESS');

    // Step 2: Check Resource & Chaos Injection
    broadcastTxnUpdate('PROCESSING', 2, 'IN_PROGRESS');
    await this.sleep(350);

    if (db.chaosFlags.serviceUnavailable) {
      transaction.errorMessage = '503 Service Unavailable: Bed Management Cluster node offline.';
      broadcastTxnUpdate('FAILED', 2, 'FAILED');
      publishAuditEvent({
        transactionId: txnId,
        serviceName: 'Bed Management Service',
        eventType: 'SERVICE_CLUSTER_UNAVAILABLE',
        newState: 'FAILED',
        status: 'FAILED',
        idempotencyKey,
        details: 'Simulated failure: Bed Management Service unresponsive due to chaos injection.',
      });
      return transaction;
    }

    if (db.chaosFlags.forceNextTxnFail) {
      db.chaosFlags.forceNextTxnFail = false;
      transaction.errorMessage = 'Hardware allocation bus timeout: Transponder failed to reply.';
      broadcastTxnUpdate('FAILED', 2, 'FAILED');
      publishAuditEvent({
        transactionId: txnId,
        serviceName: 'Transaction Orchestrator',
        eventType: 'HARDWARE_BUS_TIMEOUT',
        newState: 'FAILED',
        status: 'FAILED',
        idempotencyKey,
        details: 'Injected failure triggered on step 2.',
      });
      return transaction;
    }

    if (!resource) {
      transaction.errorMessage = `Resource ${params.resourceId} does not exist.`;
      broadcastTxnUpdate('FAILED', 2, 'FAILED');
      return transaction;
    }

    // Optimistic Concurrency Control (OCC) Check
    if (params.expectedVersion !== undefined && params.expectedVersion !== resource.version) {
      transaction.status = 'CONFLICTED';
      transaction.conflictReason = `Version mismatch: Expected version ${params.expectedVersion}, but actual live resource version is ${resource.version}. Concurrent modification detected.`;
      transaction.actualVersion = resource.version;
      broadcastTxnUpdate('CONFLICTED', 2, 'FAILED');

      publishAuditEvent({
        transactionId: txnId,
        patientId: patient.id,
        resourceId: resource.id,
        serviceName: 'Concurrency Controller',
        eventType: 'OPTIMISTIC_LOCK_CONFLICT',
        previousState: `v${params.expectedVersion}`,
        newState: `v${resource.version}`,
        status: 'FAILED',
        idempotencyKey,
        details: `OCC Conflict: Expected version ${params.expectedVersion} differs from current version ${resource.version}.`,
      });

      return transaction;
    }

    // Check if resource is already in use by another patient
    if (resource.status === 'OCCUPIED' || resource.status === 'LOCKED') {
      const isAlreadyMine = resource.assignedPatientId === patient.id;
      if (!isAlreadyMine) {
        // Check priority preemption: CRITICAL beats NORMAL/MEDIUM/HIGH
        if (priority === 'CRITICAL' && resource.status === 'OCCUPIED') {
          publishAuditEvent({
            transactionId: txnId,
            patientId: patient.id,
            resourceId: resource.id,
            serviceName: 'Emergency Escalation Controller',
            eventType: 'PRIORITY_PREEMPTION_REQUESTED',
            previousState: resource.status,
            newState: 'PREEMPTION_EVALUATION',
            status: 'WARNING',
            idempotencyKey,
            details: `CRITICAL priority request from Doctor ${doctor?.name || 'Staff'} attempting emergency preemption on ${resource.name} (currently held by ${resource.assignedPatientName}).`,
          });
          // Proceed with preemption override
        } else {
          transaction.status = 'CONFLICTED';
          transaction.conflictReason = `Resource ${resource.name} is currently ${resource.status} by patient ${resource.assignedPatientName || 'another process'} (Txn: ${resource.lockedByTxnId || 'N/A'}).`;
          broadcastTxnUpdate('CONFLICTED', 2, 'FAILED');

          publishAuditEvent({
            transactionId: txnId,
            patientId: patient.id,
            resourceId: resource.id,
            serviceName: 'Bed Management Service',
            eventType: 'RESOURCE_ALLOCATION_CONFLICT',
            previousState: resource.status,
            newState: 'CONFLICTED',
            status: 'FAILED',
            idempotencyKey,
            details: `Resource conflict on ${resource.id}. Requested by ${priority} priority, but resource is already ${resource.status}.`,
          });

          return transaction;
        }
      }
    }

    broadcastTxnUpdate('PROCESSING', 2, 'SUCCESS');

    // Step 3: Acquire Distributed Resource Lock
    broadcastTxnUpdate('PROCESSING', 3, 'IN_PROGRESS');
    await this.sleep(400);

    const previousResourceState = resource.status;
    resource.status = 'LOCKED';
    resource.lockedByTxnId = txnId;

    publishAuditEvent({
      transactionId: txnId,
      patientId: patient.id,
      resourceId: resource.id,
      serviceName: 'Transaction Orchestrator',
      eventType: 'RESOURCE_LOCKED',
      previousState: previousResourceState,
      newState: 'LOCKED',
      status: 'INFO',
      idempotencyKey,
      details: `Distributed mutex acquired on ${resource.name} for Txn ${txnId}.`,
    });

    broadcastTxnUpdate('PROCESSING', 3, 'SUCCESS');

    // Step 4: Commit State Mutation & Version Bump
    broadcastTxnUpdate('PROCESSING', 4, 'IN_PROGRESS');
    await this.sleep(350);

    const oldVersion = resource.version;
    resource.version += 1;
    transaction.actualVersion = resource.version;

    if (params.type === 'CANCEL_ALLOCATION') {
      resource.status = 'AVAILABLE';
      resource.assignedPatientId = undefined;
      resource.assignedPatientName = undefined;
      resource.lockedByTxnId = undefined;
      patient.assignedResources = patient.assignedResources.filter((r) => r !== resource.id);
      if (patient.assignedBedId === resource.id) {
        patient.assignedBedId = undefined;
        patient.roomNumber = undefined;
      }
    } else if (params.type === 'RESERVE_RESOURCE') {
      resource.status = 'RESERVED';
      resource.assignedPatientId = patient.id;
      resource.assignedPatientName = patient.name;
      resource.lockedByTxnId = undefined;
      if (!patient.assignedResources.includes(resource.id)) {
        patient.assignedResources.push(resource.id);
      }
    } else {
      // ALLOCATE_RESOURCE or TRANSFER_PATIENT or EMERGENCY_ESCALATION
      // If transferring, release previous bed
      if (params.type === 'TRANSFER_PATIENT' && patient.assignedBedId && patient.assignedBedId !== resource.id) {
        const oldBed = db.resources.get(patient.assignedBedId);
        if (oldBed) {
          oldBed.status = 'AVAILABLE';
          oldBed.assignedPatientId = undefined;
          oldBed.assignedPatientName = undefined;
          oldBed.version += 1;
          publishAuditEvent({
            transactionId: txnId,
            patientId: patient.id,
            resourceId: oldBed.id,
            serviceName: 'Bed Management Service',
            eventType: 'RESOURCE_RELEASED',
            previousState: 'OCCUPIED',
            newState: 'AVAILABLE',
            status: 'SUCCESS',
            details: `Previous bed ${oldBed.name} released due to patient transfer to ${resource.name}.`,
          });
        }
      }

      resource.status = 'OCCUPIED';
      resource.assignedPatientId = patient.id;
      resource.assignedPatientName = patient.name;
      resource.lockedByTxnId = undefined;

      if (!patient.assignedResources.includes(resource.id)) {
        patient.assignedResources.push(resource.id);
      }

      if (resource.type.startsWith('BED')) {
        patient.assignedBedId = resource.id;
        patient.roomNumber = resource.name;
        // Update patient treatment journey
        const journeyBedStep = patient.journey.find((j) => j.id === 'J-3' || j.label.toLowerCase().includes('bed'));
        if (journeyBedStep) {
          journeyBedStep.status = 'COMPLETED';
          journeyBedStep.timestamp = 'Just now';
          journeyBedStep.details = `${resource.name} assigned`;
        }
      }
    }

    resource.lastModified = new Date().toISOString();
    patient.lastUpdated = new Date().toISOString();

    publishAuditEvent({
      transactionId: txnId,
      patientId: patient.id,
      resourceId: resource.id,
      serviceName: 'Bed Management Service',
      eventType: 'ALLOCATION_CONFIRMED',
      previousState: `v${oldVersion}`,
      newState: `${resource.status} (v${resource.version})`,
      status: 'SUCCESS',
      idempotencyKey,
      details: `Resource ${resource.name} state transitioned to ${resource.status}. Optimistic version incremented: ${oldVersion} -> ${resource.version}.`,
    });

    broadcastTxnUpdate('PROCESSING', 4, 'SUCCESS');

    // Step 5: Publish Synchronized Events & Notifications
    broadcastTxnUpdate('PROCESSING', 5, 'IN_PROGRESS');
    await this.sleep(300);

    transaction.status = 'SUCCESS';
    transaction.completedAt = new Date().toISOString();
    broadcastTxnUpdate('SUCCESS', 5, 'SUCCESS');

    // Dispatch Technical Notification to Doctor
    if (doctor) {
      dispatchNotification({
        recipientRole: 'DOCTOR',
        recipientId: doctor.id,
        title: `Resource ${params.type === 'CANCEL_ALLOCATION' ? 'Deallocated' : 'Allocated'}`,
        message: `${resource.name} successfully ${params.type === 'CANCEL_ALLOCATION' ? 'released' : 'assigned'} for ${patient.name} (${patient.id}).`,
        technicalDetails: `Txn: ${txnId} | OCC Version: ${resource.version} | Lock Released`,
        type: priority === 'CRITICAL' ? 'EMERGENCY' : 'SUCCESS',
        relatedTxnId: txnId,
      });
    }

    // Dispatch Friendly Non-Technical Notification to Patient
    const friendlyMessage =
      params.type === 'CANCEL_ALLOCATION'
        ? `Your assignment for ${resource.name} has been concluded.`
        : `Your ${resource.type.startsWith('BED') ? 'hospital bed' : 'medical resource'} (${resource.name}) has been successfully assigned to your care plan.`;

    dispatchNotification({
      recipientRole: 'PATIENT',
      recipientId: patient.id,
      title: params.type === 'CANCEL_ALLOCATION' ? 'Resource Update' : 'Care Space Assigned',
      message: friendlyMessage,
      type: 'SUCCESS',
      relatedTxnId: txnId,
    });

    // Dispatch Operations Notification to Admin
    dispatchNotification({
      recipientRole: 'ADMIN',
      title: `Txn ${txnId} Committed [${priority}]`,
      message: `${params.type} on ${resource.id} for ${patient.id} committed at version ${resource.version}.`,
      technicalDetails: `Latency: 1.4s | Idempotency: OK`,
      type: 'TRANSACTION',
      relatedTxnId: txnId,
    });

    // Register Idempotency
    idempotencyService.register(idempotencyKey, txnId, transaction);

    // Broadcast full live store update
    if (io) {
      io.emit('store:update', {
        resources: Array.from(db.resources.values()),
        patients: Array.from(db.patients.values()),
        doctors: Array.from(db.doctors.values()),
      });
    }

    return transaction;
  }
}

export const transactionOrchestrator = new TransactionOrchestrator();
