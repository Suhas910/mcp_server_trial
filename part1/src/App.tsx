import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { GroupPage } from './pages/GroupPage';
import { FoodDetailPage } from './pages/FoodDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import './styles/global.css';

/**
 * Gates everything below it on being logged in, and remembers where the user
 * was headed so LoginPage can send them back after a successful login.
 * AppProvider lives inside here (not above) because it throws if mounted
 * without a user — this is the one place that's guaranteed true.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <AppProvider>
      <Navbar />
      {children}
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/groups/:groupId" element={<GroupPage />} />
                  <Route path="/groups/:groupId/food/:foodId" element={<FoodDetailPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
