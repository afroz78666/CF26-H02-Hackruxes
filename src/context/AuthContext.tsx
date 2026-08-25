import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

interface AuthContextType {
  role: UserRole | null;
  activeDoctorId: string;
  activePatientId: string;
  setRole: (role: UserRole | null) => void;
  setActiveDoctorId: (id: string) => void;
  setActivePatientId: (id: string) => void;
  loginAs: (role: UserRole, id?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('mediflow_role') as UserRole) || null;
  });

  const [activeDoctorId, setActiveDoctorId] = useState<string>(() => {
    return localStorage.getItem('mediflow_doc_id') || 'DOC-001';
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    return localStorage.getItem('mediflow_pat_id') || 'PAT-1001';
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('mediflow_role', role);
    } else {
      localStorage.removeItem('mediflow_role');
    }
  }, [role]);

  useEffect(() => {
    localStorage.setItem('mediflow_doc_id', activeDoctorId);
  }, [activeDoctorId]);

  useEffect(() => {
    localStorage.setItem('mediflow_pat_id', activePatientId);
  }, [activePatientId]);

  const loginAs = (newRole: UserRole, id?: string) => {
    setRole(newRole);
    if (newRole === 'DOCTOR' && id) setActiveDoctorId(id);
    if (newRole === 'PATIENT' && id) setActivePatientId(id);
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        activeDoctorId,
        activePatientId,
        setRole,
        setActiveDoctorId,
        setActivePatientId,
        loginAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
