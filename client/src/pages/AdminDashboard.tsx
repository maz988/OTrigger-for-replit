import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/RichTextEditor';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { 
  UserCheck, 
  FileText, 
  BarChart3, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Pencil,
  Save,
  AlertCircle,
  Link as LinkIcon,
  Calendar,
  ChevronRight,
  Clock,
  RefreshCw,
  Settings,
  CalendarClock,
  FileEdit
} from 'lucide-react';

// Dashboard analytics data types
interface QuizAnalytics {
  totalResponses: number;
  completionRate: number;
  conversionRate: number;
  responsesByDay: Array<{ date: string; count: number }>;
  responsesByReferral: Array<{ source: string; count: number }>;
  topReferringBlogPosts: Array<{ title: string; count: number }>;
  commonConcerns: Array<{ type: string; count: number }>;
}

interface BlogAnalytics {
  totalPosts: number;
  totalViews: number;
  clickThroughRate: number;
  postsByKeyword: Array<{ keyword: string; count: number }>;
  topPerformingPosts: Array<{ title: string; views: number; clickThrough: number; conversion: number }>;
  keywordPerformance: Array<{ keyword: string; posts: number; views: number; clicks: number }>;
}

// Blog post types
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  keyword: string;
  category: string;
  publishedAt: string;
  updatedAt: string | null;
}

interface BlogPostAnalytics {
  id: number;
  postId: number;
  viewDate: string;
  uniqueViews: number;
  totalViews: number;
  quizClicks: number;
  referrers: Record<string, number>;
}

interface BlogPostWithAnalytics {
  post: BlogPost;
  analytics: BlogPostAnalytics | null;
}

interface EmailSubscriber {
  id: number;
  firstName: string;
  email: string;
  source: string;
  createdAt: string;
  unsubscribed: boolean;
  lastEmailSent: string | null;
}

interface LeadMagnet {
  id: number;
  name: string;
  description: string;
  filePath: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string | null;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface SystemSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: string;
  description: string;
  lastUpdated: string;
}

interface DashboardOverview {
  totalQuizResponses: number;
  quizCompletionRate: number;
  totalBlogPosts: number;
  totalBlogViews: number;
  blogCTR: number;
  totalSubscribers: number;
  activeSubscribers: number;
  totalLeadMagnets: number;
  leadMagnetDownloads: number;
  totalAffiliateClicks: number;
  quizResponsesTrend: Array<{ date: string; count: number }>;
  subscribersTrend: Array<{ date: string; count: number }>;
  blogViewsTrend: Array<{ date: string; count: number }>;
  newQuizResponsesLast7Days: number;
  newSubscribersLast7Days: number;
  blogViewsLast7Days: number;
  leadMagnetDownloadsLast7Days: number;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#FF5722'];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddSubscriberDialogOpen, setIsAddSubscriberDialogOpen] = useState(false);
  
  // Form states for creating/editing posts
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    keyword: '',
    category: 'Relationships',
    content: ''
  });
  
  // Form state for adding subscribers
  const [subscriberFormData, setSubscriberFormData] = useState({
    firstName: '',
    email: '',
    source: 'manual'
  });
  
  const { toast } = useToast();
  
  // Get the admin token from localStorage
  const token = localStorage.getItem('adminToken');
  
  // Fetch quiz analytics data
  const { data: quizAnalyticsResponse, isLoading: quizLoading } = useQuery({
    queryKey: ['/api/admin/analytics/quiz'],
    queryFn: getQueryFn(),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Fetch blog analytics data
  const { data: blogAnalyticsResponse, isLoading: blogLoading } = useQuery({
    queryKey: ['/api/admin/analytics/blog'],
    queryFn: getQueryFn(),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Define a type for API responses
  interface ApiResponse<T> {
    data: T;
  }
  
  // Extract the analytics data from the response with proper type safety
  const quizData: QuizAnalytics = quizAnalyticsResponse 
    ? (quizAnalyticsResponse as unknown as ApiResponse<QuizAnalytics>).data 
    : {
        totalResponses: 0,
        completionRate: 0,
        conversionRate: 0,
        responsesByDay: [],
        responsesByReferral: [],
        topReferringBlogPosts: [],
        commonConcerns: []
      };
      
  const blogData: BlogAnalytics = blogAnalyticsResponse 
    ? (blogAnalyticsResponse as unknown as ApiResponse<BlogAnalytics>).data 
    : {
        totalPosts: 0,
        totalViews: 0,
        clickThroughRate: 0,
        postsByKeyword: [],
        topPerformingPosts: [],
        keywordPerformance: []
      };
  
  // Fetch dashboard overview data
  const { data: dashboardOverviewResponse, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: getQueryFn(),
    enabled: activeTab === 'overview',
  });
  
  // Fetch blog posts
  const { data: postsResponse, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/admin/blog/posts'],
    queryFn: getQueryFn(),
    enabled: activeTab === 'content',
  });
  
  // Fetch subscribers
  const { data: subscribersResponse, isLoading: subscribersLoading, refetch: refetchSubscribers } = useQuery({
    queryKey: ['/api/admin/subscribers'],
    queryFn: getQueryFn(),
    enabled: activeTab === 'subscribers',
  });
  
  // Blog posts data
  const blogPosts: BlogPost[] = postsResponse?.data || [];
  const subscribers: EmailSubscriber[] = subscribersResponse?.data || [];
  
  // Blog post mutations
  const createPostMutation = useMutation({
    mutationFn: async (newPost: typeof formData) => {
      const response = await apiRequest('POST', '/api/admin/blog/posts', newPost);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Post Created',
        description: 'The blog post has been created successfully.',
        variant: 'default',
      });
      setIsCreateDialogOpen(false);
      refetchPosts();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating Post',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiRequest('PATCH', `/api/admin/blog/posts/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Post Updated',
        description: 'The blog post has been updated successfully.',
        variant: 'default',
      });
      setIsEditDialogOpen(false);
      refetchPosts();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Post',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/blog/posts/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Post Deleted',
        description: 'The blog post has been deleted successfully.',
        variant: 'default',
      });
      setIsDeleteDialogOpen(false);
      refetchPosts();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Deleting Post',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Subscriber mutations
  const addSubscriberMutation = useMutation({
    mutationFn: async (newSubscriber: typeof subscriberFormData) => {
      const response = await apiRequest('POST', '/api/admin/subscribers', newSubscriber);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscriber Added',
        description: 'The subscriber has been added successfully.',
        variant: 'default',
      });
      setIsAddSubscriberDialogOpen(false);
      refetchSubscribers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Adding Subscriber',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Helper functions
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    setFormData({
      ...formData,
      title,
      slug
    });
  };
  
  const resetFormData = () => {
    setFormData({
      title: '',
      slug: '',
      keyword: '',
      category: 'Relationships',
      content: ''
    });
  };
  
  const resetSubscriberFormData = () => {
    setSubscriberFormData({
      firstName: '',
      email: '',
      source: 'manual'
    });
  };
  
  const handleViewPost = (postId: number) => {
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
      setSelectedPostId(postId);
      setFormData(post);
      setIsViewDialogOpen(true);
    }
  };
  
  const handleEditPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setFormData(post);
    setIsEditDialogOpen(true);
  };
  
  const handleDeletePost = (postId: number) => {
    setSelectedPostId(postId);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor performance metrics for your quiz and blog system</p>
      </div>

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
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard Overview</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quiz Responses Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quiz Responses</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {dashboardOverviewResponse?.data.totalQuizResponses.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs flex items-center ${dashboardOverviewResponse?.data.newQuizResponsesLast7Days > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {dashboardOverviewResponse?.data.newQuizResponsesLast7Days > 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {dashboardOverviewResponse?.data.newQuizResponsesLast7Days} in last 7 days
                      </span>
                    </div>
                    <div className="h-[80px] mt-4">
                      {dashboardOverviewResponse && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardOverviewResponse.data.quizResponsesTrend}>
                            <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Quiz Completion Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quiz Completion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {dashboardOverviewResponse?.data.quizCompletionRate.toFixed(1)}%
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full mt-3">
                      <div 
                        className="h-2 rounded-full bg-primary" 
                        style={{ 
                          width: `${dashboardOverviewResponse?.data.quizCompletionRate}%`,
                        }}
                      ></div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Blog Posts Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blog Posts Published</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {dashboardOverviewResponse?.data.totalBlogPosts.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center mt-2">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Last post: {dashboardOverviewResponse?.data.blogViewsTrend && dashboardOverviewResponse.data.blogViewsTrend.length > 0 ? 
                          new Date(dashboardOverviewResponse.data.blogViewsTrend[dashboardOverviewResponse.data.blogViewsTrend.length - 1].date).toLocaleDateString() : 
                          'N/A'}
                      </p>
                    </div>
                    <div className="h-[80px] mt-4">
                      {dashboardOverviewResponse && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardOverviewResponse.data.blogViewsTrend}>
                            <Bar dataKey="count" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Blog CTR Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blog CTR</CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {dashboardOverviewResponse?.data.blogCTR.toFixed(2)}%
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        {dashboardOverviewResponse?.data.totalBlogViews.toLocaleString() || 0} total views
                      </p>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full mt-3">
                      <div 
                        className="h-2 rounded-full bg-amber-500" 
                        style={{ 
                          width: `${Math.min(100, dashboardOverviewResponse?.data.blogCTR * 5)}%`,
                        }}
                      ></div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Email Subscribers Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {dashboardOverviewResponse?.data.totalSubscribers.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs flex items-center ${dashboardOverviewResponse?.data.newSubscribersLast7Days > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {dashboardOverviewResponse?.data.newSubscribersLast7Days > 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {dashboardOverviewResponse?.data.newSubscribersLast7Days} new in last 7 days
                      </span>
                    </div>
                    <div className="h-[80px] mt-4">
                      {dashboardOverviewResponse && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardOverviewResponse.data.subscribersTrend}>
                            <Bar dataKey="count" fill="#00C49F" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Affiliate Clicks Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Affiliate Clicks</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {dashboardOverviewResponse?.data.totalAffiliateClicks.toLocaleString() || 0}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        CTR: {dashboardOverviewResponse && dashboardOverviewResponse.data.totalBlogViews > 0 
                        ? ((dashboardOverviewResponse.data.totalAffiliateClicks / dashboardOverviewResponse.data.totalBlogViews) * 100).toFixed(2) 
                        : '0.00'}%
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Analytics Dashboard</CardTitle>
                <CardDescription>Detailed quiz response analysis and trends</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Quiz Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    View detailed metrics, response trends, and insights on your relationship assessment quiz
                  </p>
                </div>
                <Link href="/admin/quiz-analytics">
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access Quiz Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Blog Management System</CardTitle>
                <CardDescription>Comprehensive blog post creation and management</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Blog Post Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and manage blog content with advanced features including AI generation and keyword tracking
                  </p>
                </div>
                <Link href="/admin/blog-management">
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access Blog Management
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Integration Control Panel</CardTitle>
                <CardDescription>Manage API keys and service integrations</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <Settings2 className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Settings & Integrations</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure external services, API keys, and system settings for the entire platform
                  </p>
                </div>
                <Link href="/admin/settings">
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access Control Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Sources</CardTitle>
                <CardDescription>Where quiz traffic is coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={quizData.responsesByReferral}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {quizData.responsesByReferral.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Blog Posts</CardTitle>
                <CardDescription>Highest click-through rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blogData.topPerformingPosts.map((post, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{post.title}</p>
                        <p className="text-sm text-muted-foreground">{post.views.toLocaleString()} views</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{post.clickThrough.toFixed(2)}%</span>
                        <div className={`w-10 h-2 rounded-full ${
                          post.clickThrough > 20 ? 'bg-emerald-500' : 
                          post.clickThrough > 15 ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common User Concerns</CardTitle>
                <CardDescription>Main issues reported in quiz</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={quizData.commonConcerns}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                    >
                      {quizData.commonConcerns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blog Analytics Tab */}
        <TabsContent value="blog" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Blog Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Posts</span>
                    <span className="font-medium">{blogData.totalPosts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Views</span>
                    <span className="font-medium">{blogData.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Click-Through Rate</span>
                    <span className="font-medium">{blogData.clickThroughRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Views Per Post</span>
                    <span className="font-medium">
                      {Math.round(blogData.totalViews / blogData.totalPosts).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Keywords Distribution</CardTitle>
                <CardDescription>Posts by keyword category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={blogData.postsByKeyword}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ keyword, percent }) => `${keyword}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="keyword"
                    >
                      {blogData.postsByKeyword.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Blog Posts</CardTitle>
              <CardDescription>Based on views, CTR, and conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Post Title</th>
                      <th className="text-right py-3 px-2 font-medium">Views</th>
                      <th className="text-right py-3 px-2 font-medium">CTR</th>
                      <th className="text-right py-3 px-2 font-medium">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogData.topPerformingPosts.map((post, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-2">{post.title}</td>
                        <td className="text-right py-3 px-2">{post.views.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{post.clickThrough.toFixed(2)}%</td>
                        <td className="text-right py-3 px-2">{post.conversion.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyword Performance</CardTitle>
              <CardDescription>Views and click-through by keyword</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Keyword</th>
                      <th className="text-right py-3 px-2 font-medium">Posts</th>
                      <th className="text-right py-3 px-2 font-medium">Views</th>
                      <th className="text-right py-3 px-2 font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogData.keywordPerformance.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-2">{item.keyword}</td>
                        <td className="text-right py-3 px-2">{item.posts}</td>
                        <td className="text-right py-3 px-2">{item.views.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">
                          {((item.clicks / item.views) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Blog Content Management</h2>
            <div className="flex items-center gap-3">
              <Link href="/admin/blog-management">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Full Blog Management
                </Button>
              </Link>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetFormData()} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Blog Post</DialogTitle>
                    <DialogDescription>
                      Create a new blog post that will be published on your website
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                          id="title" 
                          value={formData.title} 
                          onChange={handleTitleChange} 
                          placeholder="How to Create Emotional Intimacy" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input 
                          id="slug" 
                          value={formData.slug} 
                          onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                          placeholder="how-to-create-emotional-intimacy" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyword">Keyword</Label>
                        <Input 
                          id="keyword" 
                          value={formData.keyword} 
                          onChange={(e) => setFormData({...formData, keyword: e.target.value})} 
                          placeholder="emotional intimacy" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => setFormData({...formData, category: value})}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Relationships">Relationships</SelectItem>
                            <SelectItem value="Communication">Communication</SelectItem>
                            <SelectItem value="Attraction">Attraction</SelectItem>
                            <SelectItem value="Dating">Dating</SelectItem>
                            <SelectItem value="Marriage">Marriage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <RichTextEditor 
                        value={formData.content} 
                        onChange={(value) => setFormData({...formData, content: value})} 
                        placeholder="Write your blog post content here..."
                        minHeight="400px"
                      />
                      <p className="text-xs text-gray-500">
                        Use the toolbar to format text, add links, images, and buttons to make your content engaging.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => createPostMutation.mutate(formData)}
                      disabled={!formData.title || !formData.content || !formData.keyword}
                    >
                      {createPostMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : 'Create Post'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Blog posts table */}
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Manage all blog posts on your website</CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : blogPosts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
                  <p className="text-muted-foreground mb-4">Start creating engaging content for your audience</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Post</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>A list of all your blog posts</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[350px]">Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {/* We'd use real analytics here in production */}
                            {Math.floor(Math.random() * 1000) + 100}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewPost(post.id)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditPost(post)}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeletePost(post.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Email Subscribers</h2>
              <p className="text-muted-foreground">Manage your email list and lead magnets</p>
            </div>
            <Button onClick={() => {
              resetSubscriberFormData();
              setIsAddSubscriberDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscriber
            </Button>
          </div>
          
          {/* Subscribers table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscribers List</CardTitle>
              <CardDescription>
                All email subscribers: {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No subscribers yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start growing your email list by adding subscribers manually or through lead magnets
                  </p>
                  <Button onClick={() => setIsAddSubscriberDialogOpen(true)}>
                    Add Your First Subscriber
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Complete list of email subscribers</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>{subscriber.firstName}</TableCell>
                          <TableCell>{subscriber.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {subscriber.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(subscriber.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={subscriber.unsubscribed ? "destructive" : "default"}
                            >
                              {subscriber.unsubscribed ? 'Unsubscribed' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure global application settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-y-0">
                    <div>
                      <h4 className="font-medium leading-none">Automatic Blog Generation</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable automatic blog posts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between space-y-0 pt-4 border-t">
                    <div>
                      <h4 className="font-medium leading-none">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts for new subscribers
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between space-y-0 pt-4 border-t">
                    <div>
                      <h4 className="font-medium leading-none">Auto-Email New Users</h4>
                      <p className="text-sm text-muted-foreground">
                        Send welcome email automatically
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage connection to third-party services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openai">OpenAI API Key</Label>
                    <div className="flex mt-1.5">
                      <Input 
                        id="openai" 
                        type="password" 
                        value="sk-••••••••••••••••••••••••••••••" 
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none border-l-0">
                        Update
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="sendgrid">SendGrid API Key</Label>
                    <div className="flex mt-1.5">
                      <Input 
                        id="sendgrid" 
                        type="password" 
                        value="SG.••••••••••••••••••••••••••••••" 
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none border-l-0">
                        Update
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="pexels">Pexels API Key</Label>
                    <div className="flex mt-1.5">
                      <Input 
                        id="pexels" 
                        type="password" 
                        value="••••••••••••••••••••••••••••••" 
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none border-l-0">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Subscriber Dialog */}
      <Dialog open={isAddSubscriberDialogOpen} onOpenChange={setIsAddSubscriberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subscriber</DialogTitle>
            <DialogDescription>
              Add a new subscriber to your email list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={subscriberFormData.firstName} 
                onChange={(e) => setSubscriberFormData({...subscriberFormData, firstName: e.target.value})} 
                placeholder="John" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                value={subscriberFormData.email} 
                onChange={(e) => setSubscriberFormData({...subscriberFormData, email: e.target.value})} 
                placeholder="john@example.com" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select 
                value={subscriberFormData.source} 
                onValueChange={(value) => setSubscriberFormData({...subscriberFormData, source: value})}
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manually Added</SelectItem>
                  <SelectItem value="quiz">Quiz Completion</SelectItem>
                  <SelectItem value="lead_magnet">Lead Magnet</SelectItem>
                  <SelectItem value="blog">Blog Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubscriberDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => addSubscriberMutation.mutate(subscriberFormData)}
              disabled={!subscriberFormData.firstName || !subscriberFormData.email || addSubscriberMutation.isPending}
            >
              {addSubscriberMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </div>
              ) : 'Add Subscriber'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;