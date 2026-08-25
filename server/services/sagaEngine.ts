import { db } from '../store/db.js';
import { SagaWorkflow, TransactionStatus } from '../types/index.js';
import { dispatchNotification, getSocketServer, publishAuditEvent } from './eventStream.js';

export class SagaEngine {
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async executeSaga(params: {
    patientId: string;
    orId: string;
    doctorId: string;
    equipmentId: string;
    failAtStep?: number; // 1, 2, or 3 (0 for no failure)
  }): Promise<SagaWorkflow> {
    const sagaId = `SAGA-${Math.floor(1000 + Math.random() * 9000)}`;
    const patient = db.patients.get(params.patientId);
    const orResource = db.resources.get(params.orId);
    const doctor = db.doctors.get(params.doctorId);
    const equipment = db.resources.get(params.equipmentId);
    const io = getSocketServer();

    const saga: SagaWorkflow = {
      id: sagaId,
      name: 'Emergency Surgical Suite Orchestration (Saga)',
      patientId: params.patientId,
      patientName: patient ? patient.name : 'Unknown Patient',
      status: 'PROCESSING',
      currentStep: 1,
      totalSteps: 3,
      createdAt: new Date().toISOString(),
      steps: [
        {
          name: `Reserve Surgical Suite (${orResource?.name || params.orId})`,
          service: 'Operation Room Service',
          resourceId: params.orId,
          status: 'PENDING',
          compensationName: 'Compensate: Release Surgical Suite Lock & Revert Reservation',
        },
        {
          name: `Assign Lead Surgeon (${doctor?.name || params.doctorId})`,
          service: 'Staff Scheduling Service',
          resourceId: params.doctorId,
          status: 'PENDING',
          compensationName: 'Compensate: Revert Surgeon Assignment to On-Call/Available',
        },
        {
          name: `Allocate Life Support Equipment (${equipment?.name || params.equipmentId})`,
          service: 'Biomedical Equipment Service',
          resourceId: params.equipmentId,
          status: 'PENDING',
          compensationName: 'Compensate: Release Equipment Lock & Reset Telemetry',
        },
      ],
    };

    db.sagas.set(sagaId, saga);

    const emitSaga = () => {
      if (io) {
        io.emit('saga:update', saga);
      }
    };

    emitSaga();

    publishAuditEvent({
      transactionId: sagaId,
      patientId: params.patientId,
      serviceName: 'Saga Orchestrator',
      eventType: 'SAGA_TRANSACTION_STARTED',
      newState: 'PROCESSING',
      status: 'INFO',
      details: `Distributed Saga ${sagaId} initiated for multi-service surgery preparation.`,
    });

    // -------------------------------------------------------------
    // STEP 1: Reserve Operation Suite
    // -------------------------------------------------------------
    saga.currentStep = 1;
    saga.steps[0].status = 'PROCESSING';
    emitSaga();
    await this.sleep(700);

    if (params.failAtStep === 1) {
      saga.steps[0].status = 'FAILED';
      saga.status = 'FAILED';
      saga.errorMessage = 'Step 1 Failed: Surgical Suite sterilization cycle incomplete / environmental lock active.';
      emitSaga();

      publishAuditEvent({
        transactionId: sagaId,
        serviceName: 'Operation Room Service',
        eventType: 'SAGA_STEP1_FAILED',
        newState: 'FAILED',
        status: 'FAILED',
        details: 'Intentional failure simulated on OR Suite reservation.',
      });
      return saga;
    }

    // Mutate OR
    if (orResource) {
      orResource.status = 'RESERVED';
      orResource.version += 1;
      orResource.assignedPatientId = patient?.id;
      orResource.assignedPatientName = patient?.name;
      orResource.lockedByTxnId = sagaId;
    }
    saga.steps[0].status = 'SUCCESS';
    emitSaga();

    publishAuditEvent({
      transactionId: sagaId,
      resourceId: params.orId,
      serviceName: 'Operation Room Service',
      eventType: 'SAGA_STEP1_CONFIRMED',
      newState: 'RESERVED',
      status: 'SUCCESS',
      details: `Saga step 1 committed: ${orResource?.name} reserved for ${patient?.name}.`,
    });

    // -------------------------------------------------------------
    // STEP 2: Assign Lead Surgeon
    // -------------------------------------------------------------
    saga.currentStep = 2;
    saga.steps[1].status = 'PROCESSING';
    emitSaga();
    await this.sleep(750);

    if (params.failAtStep === 2) {
      saga.steps[1].status = 'FAILED';
      saga.status = 'COMPENSATING';
      saga.errorMessage = 'Step 2 Failed: Lead Surgeon emergency override conflict with another trauma bay.';
      emitSaga();

      publishAuditEvent({
        transactionId: sagaId,
        serviceName: 'Staff Scheduling Service',
        eventType: 'SAGA_STEP2_FAILED',
        newState: 'COMPENSATING',
        status: 'FAILED',
        details: 'Step 2 failed. Initiating backward compensation for Step 1.',
      });

      // Backward Compensation for Step 1
      await this.sleep(800);
      saga.steps[0].status = 'COMPENSATING';
      emitSaga();

      await this.sleep(600);
      if (orResource) {
        orResource.status = 'AVAILABLE';
        orResource.assignedPatientId = undefined;
        orResource.assignedPatientName = undefined;
        orResource.lockedByTxnId = undefined;
        orResource.version += 1;
      }
      saga.steps[0].status = 'COMPENSATED';
      saga.status = 'COMPENSATED';
      emitSaga();

      publishAuditEvent({
        transactionId: sagaId,
        serviceName: 'Saga Orchestrator',
        eventType: 'SAGA_COMPENSATION_COMPLETED',
        newState: 'COMPENSATED',
        status: 'WARNING',
        details: `Saga ${sagaId} fully compensated: OR Suite lock released.`,
      });

      return saga;
    }

    if (doctor) {
      doctor.availability = 'IN_SURGERY';
    }
    saga.steps[1].status = 'SUCCESS';
    emitSaga();

    publishAuditEvent({
      transactionId: sagaId,
      resourceId: params.doctorId,
      serviceName: 'Staff Scheduling Service',
      eventType: 'SAGA_STEP2_CONFIRMED',
      newState: 'IN_SURGERY',
      status: 'SUCCESS',
      details: `Saga step 2 committed: Surgeon ${doctor?.name} assigned.`,
    });

    // -------------------------------------------------------------
    // STEP 3: Allocate Critical Equipment
    // -------------------------------------------------------------
    saga.currentStep = 3;
    saga.steps[2].status = 'PROCESSING';
    emitSaga();
    await this.sleep(800);

    if (params.failAtStep === 3) {
      saga.steps[2].status = 'FAILED';
      saga.status = 'COMPENSATING';
      saga.errorMessage = 'Step 3 Failed: Life Support Equipment self-calibration sensor error / power fault.';
      emitSaga();

      publishAuditEvent({
        transactionId: sagaId,
        serviceName: 'Biomedical Equipment Service',
        eventType: 'SAGA_STEP3_FAILED',
        newState: 'COMPENSATING',
        status: 'FAILED',
        details: 'Step 3 failed. Initiating multi-stage reverse compensation workflow.',
      });

      // Backward Compensation Step 2: Release Surgeon
      await this.sleep(700);
      saga.steps[1].status = 'COMPENSATING';
      emitSaga();
      await this.sleep(600);
      if (doctor) {
        doctor.availability = 'AVAILABLE';
      }
      saga.steps[1].status = 'COMPENSATED';
      emitSaga();

      publishAuditEvent({
        transactionId: sagaId,
        serviceName: 'Staff Scheduling Service',
        eventType: 'SAGA_STEP2_COMPENSATED',
        newState: 'AVAILABLE',
        status: 'INFO',
        details: `Compensated Step 2: Surgeon ${doctor?.name} status restored to AVAILABLE.`,
      });

      // Backward Compensation Step 1: Release OR
      await this.sleep(700);
      saga.steps[0].status = 'COMPENSATING';
      emitSaga();
      await this.sleep(600);
      if (orResource) {
        orResource.status = 'AVAILABLE';
        orResource.assignedPatientId = undefined;
        orResource.assignedPatientName = undefined;
        orResource.lockedByTxnId = undefined;
        orResource.version += 1;
      }
      saga.steps[0].status = 'COMPENSATED';
      saga.status = 'COMPENSATED';
      emitSaga();

      publishAuditEvent({
        transactionId: sagaId,
        serviceName: 'Operation Room Service',
        eventType: 'SAGA_STEP1_COMPENSATED',
        newState: 'AVAILABLE',
        status: 'WARNING',
        details: `Compensated Step 1: OR ${orResource?.name} lock released and state restored.`,
      });

      dispatchNotification({
        recipientRole: 'ADMIN',
        title: `Saga ${sagaId} Compensated`,
        message: `Step 3 failed. Backward compensations completed successfully. All 3 resources restored.`,
        type: 'WARNING',
        relatedTxnId: sagaId,
      });

      return saga;
    }

    if (equipment) {
      equipment.status = 'OCCUPIED';
      equipment.version += 1;
      equipment.assignedPatientId = patient?.id;
      equipment.assignedPatientName = patient?.name;
      equipment.lockedByTxnId = sagaId;
    }
    saga.steps[2].status = 'SUCCESS';
    saga.status = 'SUCCESS';
    emitSaga();

    publishAuditEvent({
      transactionId: sagaId,
      serviceName: 'Saga Orchestrator',
      eventType: 'SAGA_ALL_STEPS_COMMITTED',
      newState: 'SUCCESS',
      status: 'SUCCESS',
      details: `Distributed Saga ${sagaId} committed: OR, Surgeon, and Equipment allocated synchronously.`,
    });

    dispatchNotification({
      recipientRole: 'DOCTOR',
      recipientId: doctor?.id,
      title: 'Surgical Suite Ready (Saga Succeeded)',
      message: `${orResource?.name} + ${equipment?.name} prepared for ${patient?.name}.`,
      type: 'SUCCESS',
      relatedTxnId: sagaId,
    });

    return saga;
  }
}

export const sagaEngine = new SagaEngine();
