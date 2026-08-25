export type UserRole = 'DOCTOR' | 'PATIENT' | 'ADMIN';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STABLE';
export type ResourceType = 'BED_ICU' | 'BED_EMERGENCY' | 'BED_WARD' | 'OPERATION_ROOM' | 'EQUIPMENT' | 'DOCTOR';
export type ResourceStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'LOCKED' | 'OFFLINE';
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';
export type TransactionType = 'ALLOCATE_RESOURCE' | 'RESERVE_RESOURCE' | 'TRANSFER_PATIENT' | 'CANCEL_ALLOCATION' | 'EMERGENCY_ESCALATION' | 'SAGA_SURGERY_SUITE';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CONFLICTED' | 'COMPENSATING' | 'COMPENSATED' | 'CANCELLED';

export interface Vitals {
  heartRate: number;
  bloodPressure: string;
  oxygenLevel: number;
  temperature: number;
  respiratoryRate: number;
  lastUpdated: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  status: 'SCHEDULED' | 'ADMINISTERED' | 'DELAYED';
  prescribedBy: string;
}

export interface LabReport {
  id: string;
  title: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'REVIEWED';
  summary: string;
  criticalFlag?: boolean;
}

export interface TreatmentStep {
  id: string;
  label: string;
  friendlyLabel: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  timestamp?: string;
  details?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  severity: Severity;
  department: string;
  assignedDoctorId: string;
  assignedDoctorName: string;
  assignedBedId?: string;
  roomNumber?: string;
  treatmentStatus: string;
  diagnosis: string;
  medicalHistory: string[];
  allergies: string[];
  vitals: Vitals;
  medications: Medication[];
  reports: LabReport[];
  journey: TreatmentStep[];
  assignedResources: string[];
  lastUpdated: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  availability: 'AVAILABLE' | 'IN_SURGERY' | 'ON_CALL' | 'OFF_DUTY';
  assignedPatientsCount: number;
  activeEmergencyCount: number;
  email: string;
  phone: string;
  rating: number;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  department: string;
  status: ResourceStatus;
  version: number;
  assignedPatientId?: string;
  assignedPatientName?: string;
  lockedByTxnId?: string;
  lastModified: string;
  specs?: Record<string, string>;
}

export interface TransactionStep {
  stepIndex: number;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  timestamp?: string;
  details?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  resourceId?: string;
  resourceName?: string;
  priority: PriorityLevel;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: string;
  completedAt?: string;
  expectedVersion?: number;
  actualVersion?: number;
  steps: TransactionStep[];
  currentStepIndex: number;
  conflictReason?: string;
  errorMessage?: string;
  compensated?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  transactionId: string;
  patientId?: string;
  resourceId?: string;
  serviceName: string;
  eventType: string;
  previousState?: string;
  newState: string;
  status: 'SUCCESS' | 'FAILED' | 'INFO' | 'WARNING';
  idempotencyKey?: string;
  details: string;
  payload?: any;
}

export interface Notification {
  id: string;
  recipientRole: 'DOCTOR' | 'PATIENT' | 'ADMIN';
  recipientId?: string;
  title: string;
  message: string;
  technicalDetails?: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'EMERGENCY' | 'TRANSACTION';
  relatedTxnId?: string;
}

export interface SagaWorkflow {
  id: string;
  name: string;
  patientId: string;
  patientName: string;
  status: TransactionStatus;
  currentStep: number;
  totalSteps: number;
  steps: {
    name: string;
    service: string;
    resourceId?: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED';
    compensationName: string;
    details?: string;
  }[];
  createdAt: string;
  errorMessage?: string;
}

export interface ConcurrencyRunResult {
  id: string;
  resourceId: string;
  resourceName: string;
  totalRequests: number;
  initialVersion: number;
  finalVersion: number;
  winnerTxnId: string;
  winnerPriority: PriorityLevel;
  winnerPatientName: string;
  timestamp: string;
  executionTimeMs: number;
  requests: {
    txnId: string;
    patientId: string;
    patientName: string;
    priority: PriorityLevel;
    expectedVersion: number;
    lockStatus: 'ACQUIRED' | 'CONFLICT' | 'REJECTED';
    status: 'CONFIRMED' | 'REJECTED_VERSION_MISMATCH' | 'REJECTED_LOCKED' | 'PREEMPTED';
    latencyMs: number;
    reason: string;
  }[];
}
