import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AdminNavigation from '@/components/AdminNavigation';
import { 
  BarChart3, 
  FileText, 
  Settings,
  Users
} from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { toast } = useToast();
  
  // Fetch dashboard overview data
  const { data: dashboardOverviewResponse, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/overview'],
    queryFn: getQueryFn(),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground">Monitor performance metrics for your quiz and blog system</p>
      
      <AdminNavigation />
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blog">Blog Analytics</TabsTrigger>
          <TabsTrigger value="content">Blog Posts</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sample Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Quiz Responses</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div>Loading...</div>
                ) : (
                  <div className="text-3xl font-bold">
                    {dashboardOverviewResponse?.data?.totalQuizResponses || 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blog Analytics Tab */}
        <TabsContent value="blog" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Blog Analytics</h2>
          <Card>
            <CardHeader>
              <CardTitle>Blog Performance</CardTitle>
              <CardDescription>View detailed analytics of your blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Blog Analytics Content</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blog Posts Tab */}
        <TabsContent value="content" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>
          <Card>
            <CardHeader>
              <CardTitle>Manage Blog Posts</CardTitle>
              <CardDescription>Create, edit, and manage your blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Blog Post Management Content</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Email Subscribers</h2>
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscribers</CardTitle>
              <CardDescription>View and manage your email subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Subscribers Management Content</div>
            </CardContent>
          </Card>
        </TabsContent>





        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure global application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Settings Content</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;