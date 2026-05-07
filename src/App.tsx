import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import HomePage from "@/pages/HomePage";
import PricingPage from "@/pages/PricingPage";
import FAQPage from "@/pages/FAQPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import ContactPage from "@/pages/ContactPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFound from "@/pages/NotFound";

import MyRoutesPage from "@/pages/app/MyRoutesPage";
import CreateRoutePage from "@/pages/app/CreateRoutePage";
import RouteDashboardPage from "@/pages/app/RouteDashboardPage";
import AccountPage from "@/pages/app/AccountPage";
import SupportPage from "@/pages/app/SupportPage";
import BuyCreditsPage from "@/pages/app/BuyCreditsPage";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminPurchasesPage from "@/pages/admin/AdminPurchasesPage";
import AdminRoutesPage from "@/pages/admin/AdminRoutesPage";
import AdminSourcesPage from "@/pages/admin/AdminSourcesPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminScholarshipsPage from "@/pages/admin/AdminScholarshipsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Protected App */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<MyRoutesPage />} />
              <Route path="create" element={<CreateRoutePage />} />
              <Route path="route/:routeId" element={<RouteDashboardPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="buy-credits" element={<BuyCreditsPage />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="purchases" element={<AdminPurchasesPage />} />
              <Route path="routes" element={<AdminRoutesPage />} />
              <Route path="sources" element={<AdminSourcesPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
