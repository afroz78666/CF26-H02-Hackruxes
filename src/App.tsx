import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { AdminPortal } from './components/admin/AdminPortal';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { PatientPortal } from './components/patient/PatientPortal';
import { TransactionModal } from './components/modals/TransactionModal';
import { NewTransactionModal } from './components/modals/NewTransactionModal';
import { SurgerySagaModal } from './components/modals/SurgerySagaModal';

export const App: React.FC = () => {
  const { role, loginAs } = useAuth();

  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isNewTxnOpen, setIsNewTxnOpen] = useState(false);
  const [newTxnPatientId, setNewTxnPatientId] = useState<string | undefined>(undefined);
  const [newTxnResourceId, setNewTxnResourceId] = useState<string | undefined>(undefined);
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false);

  // Default to ADMIN if no role chosen
  const currentRole = role || 'ADMIN';

  const handleOpenNewTxn = (patientId?: string, resourceId?: string) => {
    setNewTxnPatientId(patientId);
    setNewTxnResourceId(resourceId);
    setIsNewTxnOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Global Navigation Bar */}
      <Navbar
        onOpenNotifications={() => setIsNotifsOpen(true)}
        onOpenNewTxnModal={() => handleOpenNewTxn()}
        onOpenSurgeryModal={() => setIsSurgeryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRole === 'ADMIN' && (
          <AdminPortal
            onOpenNewTxnModal={handleOpenNewTxn}
            onOpenSurgeryModal={() => setIsSurgeryModalOpen(true)}
          />
        )}

        {currentRole === 'DOCTOR' && (
          <DoctorPortal
            onOpenNewTxnModal={handleOpenNewTxn}
            onOpenSurgeryModal={() => setIsSurgeryModalOpen(true)}
          />
        )}

        {currentRole === 'PATIENT' && <PatientPortal />}
      </main>

      {/* Overlays & Dialogs */}
      <TransactionModal />

      <NewTransactionModal
        isOpen={isNewTxnOpen}
        onClose={() => setIsNewTxnOpen(false)}
        defaultPatientId={newTxnPatientId}
        defaultResourceId={newTxnResourceId}
      />

      <SurgerySagaModal
        isOpen={isSurgeryModalOpen}
        onClose={() => setIsSurgeryModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
      />

      {/* Floating Notifications Toasts */}
      <ToastContainer />
    </div>
  );
};
