import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppCircularLoader from './common/AppCircularLoader';
import AppShell from './layout/AppShell';
import ComingSoon from './pages/ComingSoon';
import Dashboard from './pages/Dashboard/Dashboard';
import EnterpriseProfile from './pages/Enterprise/EnterpriseProfile';
import ApiKeys from './pages/ApiKeys/ApiKeys';
import Templates from './pages/Templates/Templates';
import TemplateEditor from './pages/Templates/TemplateEditor';
import Channels from './pages/Channels/Channels';
import Messages from './pages/Messages/Messages';
import Webhooks from './pages/Webhooks/Webhooks';
import Wallet from './pages/Wallet/Wallet';
import Team from './pages/Team/Team';
import Platform from './pages/Platform/Platform';
import EnterpriseReview from './pages/Platform/EnterpriseReview';
import Plans from './pages/Platform/Plans';
import Overview from './pages/Platform/Overview';
import Support from './pages/Support/Support';
import Desk from './pages/Support/Desk';
import SupportTeam from './pages/Support/SupportTeam';
import TicketView from './pages/Support/TicketView';
import { NAV } from './layout/nav';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import AcceptInvite from './pages/Auth/AcceptInvite';
import { useAppContext } from '../hooks';
import { AppEmptyState } from './common';
import { MSG } from '../constants';

// Pages that exist so far. Everything else in the sidebar shows ComingSoon until its phase.
const PAGES = { '/': Dashboard, '/profile': EnterpriseProfile, '/api-keys': ApiKeys, '/templates': Templates, '/channels': Channels, '/messages': Messages, '/webhooks': Webhooks, '/wallet': Wallet, '/team': Team, '/platform': Platform, '/pricing': Plans, '/overview': Overview, '/support': Support, '/desk': Desk, '/support-team': SupportTeam };

const home = (user) => (user.isSuperAdmin ? '/overview' : user.isStaff ? '/desk' : '/');

function Guarded({ children }) {
  const { user, loading } = useAppContext();
  const location = useLocation();
  if (loading) return <AppCircularLoader overlay />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return children;
}
function PublicOnly({ children }) {
  const { user, loading } = useAppContext();
  if (loading) return <AppCircularLoader overlay />;
  return user ? <Navigate to={home(user)} replace /> : children;
}
function Gate({ permission, children }) {
  const { can } = useAppContext();
  return can(permission) ? children : <AppEmptyState title="No access" message={MSG.FORBIDDEN_PAGE} />;
}

/** Main application view: public auth routes and the signed-in portal. */
export default function Main() {
  const { user } = useAppContext();
  return (
    <Routes>
      <Route path="/signin" element={<PublicOnly><SignIn /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route element={<Guarded><AppShell /></Guarded>}>
        {NAV.map((n) => {
          const Page = PAGES[n.path];
          return <Route key={n.path} path={n.path} element={<Gate permission={n.permission}>{Page ? <Page /> : <ComingSoon title={n.label} />}</Gate>} />;
        })}
        <Route path="/support/:id" element={<Gate permission="tickets.read"><TicketView staff={false} /></Gate>} />
        <Route path="/desk/:id" element={<Gate permission="support.view"><TicketView staff /></Gate>} />
        <Route path="/platform/:id" element={<Gate permission="platform.manage"><EnterpriseReview /></Gate>} />
        <Route path="/templates/new" element={<Gate permission="templates.write"><TemplateEditor /></Gate>} />
        <Route path="/templates/:id" element={<Gate permission="templates.read"><TemplateEditor /></Gate>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? home(user) : '/signin'} replace />} />
    </Routes>
  );
}
