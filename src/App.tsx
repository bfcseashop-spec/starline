import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SiteMetaManager from "@/components/SiteMetaManager";
const Index = lazy(() => import("./pages/Index"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ProjectsUpcoming = lazy(() => import("./pages/ProjectsUpcoming"));
const ProjectsOngoing = lazy(() => import("./pages/ProjectsOngoing"));
const ProjectsHandover = lazy(() => import("./pages/ProjectsHandover"));
const ProjectsList = lazy(() => import("./pages/ProjectsList"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const HashScroll = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hash, pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <HashScroll />
          <SiteMetaManager />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/property/:slug" element={<PropertyDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/projects/upcoming" element={<ProjectsUpcoming />} />
              <Route path="/projects/ongoing" element={<ProjectsOngoing />} />
              <Route path="/projects/handover" element={<ProjectsHandover />} />
              <Route path="/properties/upcoming" element={<ProjectsUpcoming />} />
              <Route path="/properties/ongoing" element={<ProjectsOngoing />} />
              <Route path="/properties/handover" element={<ProjectsHandover />} />
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
); 

export default App;
