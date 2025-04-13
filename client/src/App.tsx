import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import FilesPage from "@/pages/files-page";
import FileDetailPage from "@/pages/file-detail-page";
import CommentsPage from "@/pages/comments-page";
import TeamPage from "@/pages/team-page";
import StatsPage from "@/pages/stats-page";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/files" component={FilesPage} />
      <ProtectedRoute path="/files/:id" component={FileDetailPage} />
      <ProtectedRoute path="/comments" component={CommentsPage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/stats" component={StatsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
