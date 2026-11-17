import type { ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Loading } from "@/components/ui";
import { AppShell } from "@/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { PortalChooser } from "@/pages/PortalChooser";
import { CadastreQueue } from "@/pages/cadastre/CadastreQueue";
import { CreateAssign } from "@/pages/cadastre/CreateAssign";
import { FinalApproval } from "@/pages/cadastre/FinalApproval";
import { LisSync } from "@/pages/cadastre/LisSync";
import { CloseTask } from "@/pages/district/CloseTask";
import { CreateTask } from "@/pages/district/CreateTask";
import { DistrictQueue } from "@/pages/district/DistrictQueue";
import { FieldSurvey } from "@/pages/district/FieldSurvey";
import { MyAssignments } from "@/pages/editor/MyAssignments";
import { SubmissionResults } from "@/pages/editor/SubmissionResults";
import { TaskWorkspace } from "@/pages/editor/TaskWorkspace";
import { ReviewQueue } from "@/pages/reviewer/ReviewQueue";
import { TechnicalReview } from "@/pages/reviewer/TechnicalReview";
import type { PortalKey } from "@/portals";
import { AuthProvider, useAuth } from "@/state/auth";
import { ThemeProvider } from "@/state/theme";
import { ToastProvider } from "@/state/toast";

function RequirePortal({ portal, children }: { portal: PortalKey; children: ReactNode }) {
  const { user, ready, canAccess } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to={`/login?portal=${portal}&next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!canAccess(portal)) return <Navigate to={`/login?portal=${portal}&denied=1`} replace />;
  return <>{children}</>;
}

function portalRoutes(portal: PortalKey, routes: Array<[string, ReactNode]>) {
  return (
    <Route
      path={`/${portal}`}
      element={
        <RequirePortal portal={portal}>
          <AppShell portal={portal} />
        </RequirePortal>
      }
    >
      {routes.map(([path, element]) =>
        path === "" ? <Route key="index" index element={element} /> : <Route key={path} path={path} element={element} />,
      )}
    </Route>
  );
}

function NotFound() {
  return (
    <div className="empty" style={{ paddingTop: 120 }}>
      <div className="empty__title">Page not found</div>
      <Link to="/" className="btn btn--primary mt-16">
        Choose a portal
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PortalChooser />} />
              <Route path="/login" element={<LoginPage />} />

              {portalRoutes("district", [
                ["", <DistrictQueue />],
                ["create", <CreateTask />],
                ["field-survey", <FieldSurvey />],
                ["field-survey/:taskId", <FieldSurvey />],
                ["close", <CloseTask />],
                ["close/:taskId", <CloseTask />],
              ])}

              {portalRoutes("cadastre", [
                ["", <CadastreQueue />],
                ["assign", <CreateAssign />],
                ["assign/:taskId", <CreateAssign />],
                ["approval", <FinalApproval />],
                ["approval/:taskId", <FinalApproval />],
                ["lis-sync", <LisSync />],
              ])}

              {portalRoutes("editor", [
                ["", <MyAssignments />],
                ["workspace", <TaskWorkspace />],
                ["workspace/:taskId", <TaskWorkspace />],
                ["results", <SubmissionResults />],
                ["results/:taskId", <SubmissionResults />],
              ])}

              {portalRoutes("reviewer", [
                ["", <ReviewQueue />],
                ["review", <TechnicalReview />],
                ["review/:taskId", <TechnicalReview />],
              ])}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
