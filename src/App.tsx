import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { logoutWithNotice } from './store/authSlice';
import { setUnauthorizedHandler } from './services/api';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ThemeAtmosphere } from './components/ThemeAtmosphere';
import { Chat } from './pages/Chat';
import { FileManager } from './pages/FileManager';
import { Integrations } from './pages/Integrations';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Agents } from './pages/Agents';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { APP_ROUTES } from './constants/route.constants';
function App() {
  const theme = useSelector((state: RootState) => state.app.theme);
  const dispatch = useDispatch();

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      dispatch(logoutWithNotice(message));
    });

    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  return (
    <Router>
      <ThemeAtmosphere theme={theme} />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path={APP_ROUTES.login} element={<Login />} />
          <Route path={APP_ROUTES.register} element={<Register />} />
        </Route>

        {/* Main App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to={APP_ROUTES.chat} replace />} />
            <Route path="chat" element={<Chat />} />
            <Route path="agents" element={<Agents />} />
            <Route path="knowledge-base" element={<Navigate to={APP_ROUTES.files} replace />} />
            <Route path="files" element={<FileManager />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
