import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import LandingPage from '@/components/LandingPage';
import LoginPage from '@/components/LoginPage';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';

type AppScreen = 'landing' | 'login-student' | 'login-admin' | 'login-register' | 'student' | 'admin';

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);

  const checkInit = useCallback(async () => {
    try {
      const res = await api.auth.status();
      setInitialized(res.initialized);
    } catch {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    checkInit();
    const saved = localStorage.getItem('college_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        setScreen(user.role === 'admin' ? 'admin' : 'student');
      } catch {
        localStorage.removeItem('college_user');
      }
    }
  }, [checkInit]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('college_user', JSON.stringify(user));
    setScreen(user.role === 'admin' ? 'admin' : 'student');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('college_user');
    setScreen('landing');
  };

  const handleUserUpdate = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('college_user', JSON.stringify(user));
  };

  if (initialized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === 'student' && currentUser) {
    return <StudentDashboard user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
  }

  if (screen === 'admin' && currentUser) {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
  }

  if (screen === 'login-student' || screen === 'login-admin') {
    return (
      <LoginPage
        role={screen === 'login-admin' ? 'admin' : 'student'}
        onLogin={handleLogin}
        onBack={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'login-register') {
    return (
      <LoginPage
        role="register"
        onLogin={(user) => { setInitialized(true); handleLogin(user); }}
        onBack={() => setScreen('landing')}
      />
    );
  }

  return (
    <LandingPage
      initialized={initialized}
      onStudentClick={() => setScreen('login-student')}
      onAdminClick={() => setScreen('login-admin')}
      onRegisterClick={() => setScreen('login-register')}
    />
  );
};

export default Index;
