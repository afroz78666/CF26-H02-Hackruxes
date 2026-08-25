import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './store/db.js';
import { setSocketServer, publishAuditEvent, dispatchNotification } from './services/eventStream.js';
import { transactionOrchestrator } from './services/transactionOrchestrator.js';
import { sagaEngine } from './services/sagaEngine.js';
import { concurrencySimulator } from './services/concurrencySimulator.js';
import { failureLabService } from './services/failureLab.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setSocketServer(io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send initial bootstrap state to newly connected client
  socket.emit('init:state', {
    patients: Array.from(db.patients.values()),
    doctors: Array.from(db.doctors.values()),
    resources: Array.from(db.resources.values()),
    transactions: Array.from(db.transactions.values()),
    notifications: db.notifications.slice(0, 50),
    chaosFlags: db.chaosFlags,
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// System Health & Metrics
app.get('/api/health', (req, res) => {
  const resources = Array.from(db.resources.values());
  const transactions = Array.from(db.transactions.values());
  const occupiedCount = resources.filter((r) => r.status === 'OCCUPIED').length;
  const availableCount = resources.filter((r) => r.status === 'AVAILABLE').length;
  const lockedCount = resources.filter((r) => r.status === 'LOCKED').length;
  const failedTxns = transactions.filter((t) => t.status === 'FAILED' || t.status === 'CONFLICTED').length;
  const successTxns = transactions.filter((t) => t.status === 'SUCCESS').length;

  res.json({
    status: db.chaosFlags.serviceUnavailable ? 'DEGRADED' : 'HEALTHY',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    metrics: {
      totalResources: resources.length,
      availableResources: availableCount,
      occupiedResources: occupiedCount,
      lockedResources: lockedCount,
      totalPatients: db.patients.size,
      totalDoctors: db.doctors.size,
      totalTransactions: transactions.length,
      successTransactions: successTxns,
      failedTransactions: failedTxns,
      successRatePct: transactions.length ? Math.round((successTxns / transactions.length) * 100) : 100,
      activeChaosFlags: db.chaosFlags,
    },
  });
});

// Patients API
app.get('/api/patients', (req, res) => {
  res.json(Array.from(db.patients.values()));
});

app.get('/api/patients/:id', (req, res) => {
  const patient = db.patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

app.post('/api/patients/:id/journey', (req, res) => {
  const patient = db.patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { stepId, status, details } = req.body;
  const step = patient.journey.find((j) => j.id === stepId);
  if (step) {
    step.status = status || step.status;
    if (details) step.details = details;
    step.timestamp = 'Just now';
    patient.lastUpdated = new Date().toISOString();

    io.emit('patient:updated', patient);
    publishAuditEvent({
      transactionId: `JOURNEY-${patient.id}`,
      patientId: patient.id,
      serviceName: 'Patient Care Service',
      eventType: 'CARE_JOURNEY_STAGE_ADVANCED',
      newState: `${step.label} -> ${status}`,
      status: 'INFO',
      details: `Treatment journey stage '${step.friendlyLabel}' updated to ${status} for ${patient.name}.`,
    });
  }

  res.json(patient);
});

// Doctors API
app.get('/api/doctors', (req, res) => {
  res.json(Array.from(db.doctors.values()));
});

app.get('/api/doctors/:id', (req, res) => {
  const doctor = db.doctors.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json(doctor);
});

// Resources API
app.get('/api/resources', (req, res) => {
  res.json(Array.from(db.resources.values()));
});

app.post('/api/resources/:id/reset', (req, res) => {
  const resource = db.resources.get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  const oldStatus = resource.status;
  resource.status = 'AVAILABLE';
  resource.assignedPatientId = undefined;
  resource.assignedPatientName = undefined;
  resource.lockedByTxnId = undefined;
  resource.version += 1;
  resource.lastModified = new Date().toISOString();

  publishAuditEvent({
    transactionId: `RESET-${resource.id}`,
    resourceId: resource.id,
    serviceName: 'Resource Management Service',
    eventType: 'MANUAL_RESOURCE_STATE_RESET',
    previousState: oldStatus,
    newState: 'AVAILABLE',
    status: 'WARNING',
    details: `Admin manually reset resource ${resource.name} to AVAILABLE (v${resource.version}).`,
  });

  io.emit('store:update', {
    resources: Array.from(db.resources.values()),
    patients: Array.from(db.patients.values()),
  });

  res.json(resource);
});

// Transactions API
app.get('/api/transactions', (req, res) => {
  res.json(Array.from(db.transactions.values()).reverse());
});

app.post('/api/transactions/execute', async (req, res) => {
  try {
    const result = await transactionOrchestrator.executeTransaction(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Transaction execution failed' });
  }
});

// Audit Events & Replay
app.get('/api/events', (req, res) => {
  let events = [...db.auditEvents];
  const { resourceId, patientId, service, status } = req.query;

  if (resourceId) events = events.filter((e) => e.resourceId === resourceId);
  if (patientId) events = events.filter((e) => e.patientId === patientId);
  if (service) events = events.filter((e) => e.serviceName.toLowerCase().includes(String(service).toLowerCase()));
  if (status) events = events.filter((e) => e.status === status);

  res.json(events);
});

app.get('/api/events/resource/:resourceId/replay', (req, res) => {
  const resourceEvents = db.auditEvents
    .filter((e) => e.resourceId === req.params.resourceId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json(resourceEvents);
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  let notifs = [...db.notifications];
  const { role, recipientId } = req.query;

  if (role) notifs = notifs.filter((n) => n.recipientRole === role || n.recipientRole === 'ADMIN');
  if (recipientId) notifs = notifs.filter((n) => !n.recipientId || n.recipientId === recipientId);

  res.json(notifs);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// Saga Workflows API
app.get('/api/saga', (req, res) => {
  res.json(Array.from(db.sagas.values()).reverse());
});

app.post('/api/saga/execute', async (req, res) => {
  try {
    const result = await sagaEngine.executeSaga(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Concurrency Simulator API
app.post('/api/concurrency/simulate', async (req, res) => {
  try {
    const result = await concurrencySimulator.runSimulation(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Failure Lab API
app.get('/api/chaos/status', (req, res) => {
  res.json(failureLabService.getStatus());
});

app.post('/api/chaos/flags', (req, res) => {
  const updated = failureLabService.updateFlags(req.body);
  res.json(updated);
});

app.post('/api/chaos/self-healing', async (req, res) => {
  try {
    const { patientId = 'PAT-1004', resourceId = 'BED-ICU-04' } = req.body;
    const result = await failureLabService.runSelfHealingDemo(patientId, resourceId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// System Reset API
app.post('/api/seed/reset', (req, res) => {
  db.patients.clear();
  db.doctors.clear();
  db.resources.clear();
  db.transactions.clear();
  db.sagas.clear();
  db.idempotencyStore.clear();
  db.auditEvents = [];
  db.notifications = [];
  db.chaosFlags = {
    serviceUnavailable: false,
    dbLockContention: false,
    networkTimeoutMs: 0,
    forceNextTxnFail: false,
    duplicateDropRate: 0,
  };

  db.seedData();

  publishAuditEvent({
    transactionId: 'SYSTEM-RESET',
    serviceName: 'System Operations Controller',
    eventType: 'COMPLETE_STATE_RESEEDED',
    newState: 'CLEAN_SEED',
    status: 'INFO',
    details: 'System database restored to default clean demonstrator state.',
  });

  io.emit('init:state', {
    patients: Array.from(db.patients.values()),
    doctors: Array.from(db.doctors.values()),
    resources: Array.from(db.resources.values()),
    transactions: Array.from(db.transactions.values()),
    notifications: db.notifications,
    chaosFlags: db.chaosFlags,
  });

  res.json({ success: true, message: 'MediFlow system state reset to original seed data.' });
});

server.listen(PORT, () => {
  console.log(`[MediFlow Backend] Server running on http://localhost:${PORT}`);
});
