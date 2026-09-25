import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  violet: {
    password: 'violet123',
    user: { id: 'admin1', name: 'Violet Leisanyane', email: 'violet@hms.edu', role: 'admin' },
  },
  admin: {
    password: 'violet123',
    user: { id: 'admin1', name: 'Violet Leisanyane', email: 'violet@hms.edu', role: 'admin' },
  },
  student: {
    password: 'stu123',
    user: { id: 's1', name: 'Amit Rathore', email: 'amit.r@hms.edu', role: 'student', studentId: 'STU-2024-001' },
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('hms_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userId: string, password: string): boolean => {
    const normalizedId = userId.trim().toLowerCase();

    // 1. Check fixed demo accounts
    const entry = DEMO_USERS[normalizedId];
    if (entry && entry.password === password) {
      setUser(entry.user);
      localStorage.setItem('hms_user', JSON.stringify(entry.user));
      return true;
    }

    // 2. Check dynamically registered accounts
    try {
      const registered = localStorage.getItem('hms_registered_users');
      if (registered) {
        const usersMap = JSON.parse(registered);
        const match = usersMap[normalizedId];
        if (match && match.password === password) {
          setUser(match.user);
          localStorage.setItem('hms_user', JSON.stringify(match.user));
          return true;
        }
      }
    } catch (e) {
      console.error('Error reading registered users:', e);
    }

    // 3. Allow logging in using student ID from students storage (with 'stu123' password)
    try {
      const storedStudents = localStorage.getItem('hms_students_data');
      if (storedStudents && password === 'stu123') {
        const studentsList = JSON.parse(storedStudents);
        const found = studentsList.find(
          (s: any) =>
            s.studentId?.toLowerCase() === normalizedId ||
            s.id?.toLowerCase() === normalizedId ||
            s.email?.toLowerCase() === normalizedId
        );
        if (found) {
          const studentUser: User = {
            id: found.id,
            name: `${found.firstName} ${found.lastName}`,
            email: found.email,
            role: 'student',
            studentId: found.studentId,
          };
          setUser(studentUser);
          localStorage.setItem('hms_user', JSON.stringify(studentUser));
          return true;
        }
      }
    } catch (e) {
      console.error('Error reading student data for login:', e);
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hms_user');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUser };
      localStorage.setItem('hms_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
