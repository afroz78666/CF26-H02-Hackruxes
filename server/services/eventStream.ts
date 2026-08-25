import { Server } from 'socket.io';
import { db } from '../store/db.js';
import { AuditEvent, Notification } from '../types/index.js';

let ioInstance: Server | null = null;

export function setSocketServer(io: Server) {
  ioInstance = io;
}

export function getSocketServer(): Server | null {
  return ioInstance;
}

export function publishAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const event: AuditEvent = {
    id: `EVT-${Math.floor(10000 + Math.random() * 90000)}`,
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  db.auditEvents.unshift(event);
  if (db.auditEvents.length > 500) {
    db.auditEvents.pop();
  }

  // Broadcast event in real time to all connected sockets (especially Admin Event Log & live widgets)
  if (ioInstance) {
    ioInstance.emit('audit:event', event);
  }

  return event;
}

export function dispatchNotification(notifData: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
  const notification: Notification = {
    id: `NOTIF-${Math.floor(10000 + Math.random() * 90000)}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notifData,
  };

  db.notifications.unshift(notification);
  if (db.notifications.length > 300) {
    db.notifications.pop();
  }

  // Broadcast to specific role or room
  if (ioInstance) {
    ioInstance.emit('notification:new', notification);
  }

  return notification;
}
