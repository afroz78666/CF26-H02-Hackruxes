import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Patient,
  Doctor,
  Resource,
  Transaction,
  AuditEvent,
  Notification,
  SagaWorkflow,
  ConcurrencyRunResult,
  TransactionType,
  PriorityLevel,
} from '../types';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'EMERGENCY' | 'TRANSACTION';
  technicalDetails?: string;
  timestamp: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  patients: Patient[];
  doctors: Doctor[];
  resources: Resource[];
  transactions: Transaction[];
  auditEvents: AuditEvent[];
  notifications: Notification[];
  sagas: SagaWorkflow[];
  activeModalTxn: Transaction | null;
  toasts: ToastItem[];
  chaosFlags: {
    serviceUnavailable: boolean;
    dbLockContention: boolean;
    networkTimeoutMs: number;
    forceNextTxnFail: boolean;
    duplicateDropRate: number;
  };
  setActiveModalTxn: (txn: Transaction | null) => void;
  removeToast: (id: string) => void;
  executeTransaction: (params: {
    type: TransactionType;
    patientId: string;
    resourceId: string;
    doctorId?: string;
    priority?: PriorityLevel;
    idempotencyKey?: string;
    expectedVersion?: number;
  }) => Promise<Transaction>;
  executeSaga: (params: {
    patientId: string;
    orId: string;
    doctorId: string;
    equipmentId: string;
    failAtStep?: number;
  }) => Promise<SagaWorkflow>;
  runConcurrencySim: (params: {
    resourceId: string;
    requestCount: number;
    deterministicStrategy?: 'PRIORITY_FIRST' | 'FIRST_COME_FIRST_SERVED' | 'OCC_VERSION_CHECK';
  }) => Promise<ConcurrencyRunResult>;
  resetSystemState: () => Promise<void>;
  updateChaosFlags: (flags: any) => Promise<void>;
  triggerSelfHealing: (patientId?: string, resourceId?: string) => Promise<any>;
  markNotificationRead: (id: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sagas, setSagas] = useState<SagaWorkflow[]>([]);
  const [activeModalTxn, setActiveModalTxn] = useState<Transaction | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [chaosFlags, setChaosFlags] = useState({
    serviceUnavailable: false,
    dbLockContention: false,
    networkTimeoutMs: 0,
    forceNextTxnFail: false,
    duplicateDropRate: 0,
  });

  const addToast = useCallback((toast: Omit<ToastItem, 'id' | 'timestamp'>) => {
    const id = `TOAST-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = {
      id,
      timestamp: new Date().toLocaleTimeString(),
      ...toast,
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const socketUrl = window.location.origin.includes(':5173')
      ? 'http://localhost:5000'
      : window.location.origin;

    const s = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected to MediFlow cluster:', s.id);
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    s.on('init:state', (data) => {
      if (data.patients) setPatients(data.patients);
      if (data.doctors) setDoctors(data.doctors);
      if (data.resources) setResources(data.resources);
      if (data.transactions) setTransactions(data.transactions);
      if (data.notifications) setNotifications(data.notifications);
      if (data.chaosFlags) setChaosFlags(data.chaosFlags);
    });

    s.on('store:update', (data) => {
      if (data.resources) setResources(data.resources);
      if (data.patients) setPatients(data.patients);
      if (data.doctors) setDoctors(data.doctors);
    });

    s.on('transaction:update', (txn: Transaction) => {
      setTransactions((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === txn.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = txn;
          return updated;
        }
        return [txn, ...prev];
      });

      // If active modal matches this txn, update modal view
      setActiveModalTxn((curr) => {
        if (curr && curr.id === txn.id) {
          return txn;
        }
        return curr;
      });
    });

    s.on('audit:event', (event: AuditEvent) => {
      setAuditEvents((prev) => [event, ...prev.slice(0, 300)]);
    });

    s.on('notification:new', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 100)]);
      addToast({
        title: notif.title,
        message: notif.message,
        type: notif.type,
        technicalDetails: notif.technicalDetails,
      });
    });

    s.on('saga:update', (saga: SagaWorkflow) => {
      setSagas((prev) => {
        const idx = prev.findIndex((s) => s.id === saga.id);
        if (idx >= 0) {
          const arr = [...prev];
          arr[idx] = saga;
          return arr;
        }
        return [saga, ...prev];
      });
    });

    s.on('chaos:update', (flags) => {
      setChaosFlags(flags);
    });

    setSocket(s);

    // Initial fetch fallback
    fetch('/api/health')
      .then((r) => r.json())
      .catch(() => {});
    fetch('/api/events')
      .then((r) => r.json())
      .then((evts) => setAuditEvents(evts))
      .catch(() => {});
    fetch('/api/patients')
      .then((r) => r.json())
      .then((p) => setPatients(p))
      .catch(() => {});
    fetch('/api/doctors')
      .then((r) => r.json())
      .then((d) => setDoctors(d))
      .catch(() => {});
    fetch('/api/resources')
      .then((r) => r.json())
      .then((res) => setResources(res))
      .catch(() => {});
    fetch('/api/transactions')
      .then((r) => r.json())
      .then((t) => setTransactions(t))
      .catch(() => {});
    fetch('/api/saga')
      .then((r) => r.json())
      .then((s) => setSagas(s))
      .catch(() => {});

    return () => {
      s.disconnect();
    };
  }, [addToast]);

  const executeTransaction = async (params: any): Promise<Transaction> => {
    // Open modal immediately in pending state
    const tempTxn: Transaction = {
      id: 'TXN-PENDING',
      type: params.type,
      patientId: params.patientId,
      patientName: patients.find((p) => p.id === params.patientId)?.name || 'Patient',
      doctorId: params.doctorId,
      doctorName: doctors.find((d) => d.id === params.doctorId)?.name,
      resourceId: params.resourceId,
      resourceName: resources.find((r) => r.id === params.resourceId)?.name,
      priority: params.priority || 'NORMAL',
      status: 'PROCESSING',
      idempotencyKey: params.idempotencyKey || `IDEMP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      currentStepIndex: 1,
      steps: [
        { stepIndex: 1, name: 'Validate Patient & Clinical Authorization', status: 'IN_PROGRESS' },
        { stepIndex: 2, name: 'Check Resource Availability & Optimistic Version', status: 'PENDING' },
        { stepIndex: 3, name: 'Acquire Distributed Resource Lock', status: 'PENDING' },
        { stepIndex: 4, name: 'Commit State Mutation & Version Bump', status: 'PENDING' },
        { stepIndex: 5, name: 'Publish Synchronized Events & Notifications', status: 'PENDING' },
      ],
    };
    setActiveModalTxn(tempTxn);

    const res = await fetch('/api/transactions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const result: Transaction = await res.json();
    setActiveModalTxn(result);
    return result;
  };

  const executeSaga = async (params: any): Promise<SagaWorkflow> => {
    const res = await fetch('/api/saga/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  };

  const runConcurrencySim = async (params: any): Promise<ConcurrencyRunResult> => {
    const res = await fetch('/api/concurrency/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  };

  const resetSystemState = async () => {
    await fetch('/api/seed/reset', { method: 'POST' });
    addToast({
      title: 'State Reset',
      message: 'MediFlow database reset to clean seeds.',
      type: 'INFO',
    });
  };

  const updateChaosFlags = async (flags: any) => {
    const res = await fetch('/api/chaos/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flags),
    });
    const data = await res.json();
    setChaosFlags(data);
  };

  const triggerSelfHealing = async (patientId?: string, resourceId?: string) => {
    const res = await fetch('/api/chaos/self-healing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, resourceId }),
    });
    return res.json();
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        patients,
        doctors,
        resources,
        transactions,
        auditEvents,
        notifications,
        sagas,
        activeModalTxn,
        toasts,
        chaosFlags,
        setActiveModalTxn,
        removeToast,
        executeTransaction,
        executeSaga,
        runConcurrencySim,
        resetSystemState,
        updateChaosFlags,
        triggerSelfHealing,
        markNotificationRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
