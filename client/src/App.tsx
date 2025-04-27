import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import BlogCategory from "@/pages/BlogCategory";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import QuizAnalytics from "@/pages/QuizAnalytics";
import BlogManagement from "@/pages/BlogManagement";
import SettingsPage from "@/pages/SettingsPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ContactUs from "@/pages/ContactUs";

import AdminAuthGuard from "@/components/AdminAuthGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/category/:categorySlug" component={BlogCategory} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/quiz-analytics">
        {() => (
          <AdminAuthGuard>
            <QuizAnalytics />
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/blog-management">
        {() => (
          <AdminAuthGuard>
            <BlogManagement />
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <AdminAuthGuard>
            <SettingsPage />
          </AdminAuthGuard>
        )}
      </Route>

      <Route path="/admin">
        {() => (
          <AdminAuthGuard>
            <AdminDashboard />
          </AdminAuthGuard>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
