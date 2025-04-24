import React, { useState, useEffect } from 'react';
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
  Link,
  Calendar,
  ChevronRight
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
  
  // Form states for creating/editing posts
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    keyword: '',
    category: 'Relationships',
    content: ''
  });
  
  const { toast } = useToast();
  
  // Get the admin token from localStorage
  const token = localStorage.getItem('adminToken');
  
  // Fetch quiz analytics data
  const { data: quizAnalyticsResponse, isLoading: quizLoading } = useQuery({
    queryKey: ['/api/admin/analytics/quiz'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/analytics/quiz', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch blog analytics data
  const { data: blogAnalyticsResponse, isLoading: blogLoading } = useQuery({
    queryKey: ['/api/admin/analytics/blog'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/analytics/blog', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Define a type for API responses
  interface ApiResponse<T> {
    data: T;
  }
  
  // Extract the analytics data from the response with proper type safety
  const quizAnalytics: QuizAnalytics | undefined = quizAnalyticsResponse ? 
    (quizAnalyticsResponse as unknown as ApiResponse<QuizAnalytics>).data : undefined;
  const blogAnalytics: BlogAnalytics | undefined = blogAnalyticsResponse ? 
    (blogAnalyticsResponse as unknown as ApiResponse<BlogAnalytics>).data : undefined;
    
  // Fetch dashboard overview data
  const { data: dashboardOverviewResponse, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: activeTab === 'overview',
  });
  
  // Fetch subscribers
  const { data: subscribersResponse, isLoading: subscribersLoading, refetch: refetchSubscribers } = useQuery({
    queryKey: ['/api/admin/subscribers'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/subscribers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: activeTab === 'subscribers',
  });
  
  // Fetch lead magnets
  const { data: leadMagnetsResponse, isLoading: leadMagnetsLoading, refetch: refetchLeadMagnets } = useQuery({
    queryKey: ['/api/admin/lead-magnets'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/lead-magnets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: activeTab === 'settings',
  });
  
  // Fetch system settings
  const { data: settingsResponse, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: activeTab === 'settings',
  });
  
  // Fetch keywords
  const { data: keywordsResponse, isLoading: keywordsLoading, refetch: refetchKeywords } = useQuery({
    queryKey: ['/api/admin/keywords'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/keywords', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: activeTab === 'settings',
  });

  // Mock data for development
  const mockQuizAnalytics: QuizAnalytics = {
    totalResponses: 842,
    completionRate: 68.4,
    conversionRate: 42.7,
    responsesByDay: [
      { date: 'Apr 17', count: 42 },
      { date: 'Apr 18', count: 56 },
      { date: 'Apr 19', count: 71 },
      { date: 'Apr 20', count: 84 },
      { date: 'Apr 21', count: 97 },
      { date: 'Apr 22', count: 105 },
      { date: 'Apr 23', count: 117 },
    ],
    responsesByReferral: [
      { source: 'blog', count: 384 },
      { source: 'direct', count: 226 },
      { source: 'social', count: 124 },
      { source: 'search', count: 108 },
    ],
    topReferringBlogPosts: [
      { title: 'How to Trigger His Hero Instinct', count: 124 },
      { title: 'How to Make Him Obsessed With You', count: 86 },
      { title: 'How to Create Emotional Intimacy', count: 73 },
      { title: 'How to Make Him Want You More', count: 62 },
    ],
    commonConcerns: [
      { type: 'Commitment', count: 271 },
      { type: 'Communication', count: 184 },
      { type: 'Trust', count: 156 },
      { type: 'Attraction', count: 143 },
      { type: 'Other', count: 88 },
    ],
  };

  const mockBlogAnalytics: BlogAnalytics = {
    totalPosts: 32,
    totalViews: 12850,
    clickThroughRate: 18.7,
    postsByKeyword: [
      { keyword: 'hero instinct', count: 8 },
      { keyword: 'emotional intimacy', count: 7 },
      { keyword: 'attract', count: 10 },
      { keyword: 'commitment', count: 7 },
    ],
    topPerformingPosts: [
      { title: 'How to Trigger His Hero Instinct', views: 2458, clickThrough: 22.4, conversion: 9.8 },
      { title: 'How to Make Him Obsessed With You', views: 1872, clickThrough: 19.8, conversion: 8.7 },
      { title: 'How to Create Emotional Intimacy', views: 1654, clickThrough: 17.3, conversion: 7.2 },
      { title: 'Signs He Is Secretly Attracted to You', views: 1427, clickThrough: 16.9, conversion: 7.0 },
    ],
    keywordPerformance: [
      { keyword: 'hero instinct', posts: 8, views: 4256, clicks: 789 },
      { keyword: 'emotional intimacy', posts: 7, views: 3845, clicks: 654 },
      { keyword: 'attraction', posts: 10, views: 3218, clicks: 587 },
      { keyword: 'commitment', posts: 7, views: 1531, clicks: 276 },
    ],
  };

  // Fetch all blog posts for content management
  const { data: blogPostsResponse, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/admin/blog/posts'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/blog/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: activeTab === 'content',
  });
  
  // Get specific blog post
  const { data: selectedPostResponse, isLoading: selectedPostLoading, refetch: refetchSelectedPost } = useQuery({
    queryKey: ['/api/admin/blog/posts', selectedPostId],
    queryFn: async () => {
      if (!token || !selectedPostId) {
        throw new Error('No authentication token or post ID found');
      }
      
      const response = await fetch(`/api/admin/blog/posts/${selectedPostId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: !!selectedPostId,
  });
  
  // Create blog post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'>) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create blog post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post created successfully',
        variant: 'default',
      });
      refetchPosts();
      setIsCreateDialogOpen(false);
      resetFormData();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update blog post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'>> }) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update blog post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
        variant: 'default',
      });
      refetchPosts();
      refetchSelectedPost();
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete blog post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete blog post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
        variant: 'default',
      });
      refetchPosts();
      setIsDeleteDialogOpen(false);
      setSelectedPostId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Subscriber management mutations
  const createSubscriberMutation = useMutation({
    mutationFn: async (subscriberData: Omit<EmailSubscriber, 'id' | 'createdAt' | 'lastEmailSent'>) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriberData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscriber');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subscriber added successfully',
        variant: 'default',
      });
      refetchSubscribers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateSubscriberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Omit<EmailSubscriber, 'id' | 'createdAt'>> }) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/subscribers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscriber');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subscriber updated successfully',
        variant: 'default',
      });
      refetchSubscribers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const unsubscribeEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/subscribers/${email}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unsubscribe email');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email unsubscribed successfully',
        variant: 'default',
      });
      refetchSubscribers();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Lead magnet mutations
  const createLeadMagnetMutation = useMutation({
    mutationFn: async (leadMagnetData: Omit<LeadMagnet, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/lead-magnets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leadMagnetData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lead magnet');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead magnet created successfully',
        variant: 'default',
      });
      refetchLeadMagnets();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateLeadMagnetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Omit<LeadMagnet, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>> }) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/lead-magnets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead magnet');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead magnet updated successfully',
        variant: 'default',
      });
      refetchLeadMagnets();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const deleteLeadMagnetMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/lead-magnets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lead magnet');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead magnet deleted successfully',
        variant: 'default',
      });
      refetchLeadMagnets();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // System settings mutations
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Setting updated successfully',
        variant: 'default',
      });
      refetchSettings();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Keywords mutations
  const addKeywordMutation = useMutation({
    mutationFn: async (keyword: string) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add keyword');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Keyword added successfully',
        variant: 'default',
      });
      refetchKeywords();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const deleteKeywordMutation = useMutation({
    mutationFn: async (keyword: string) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/keywords/${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete keyword');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Keyword deleted successfully',
        variant: 'default',
      });
      refetchKeywords();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Auto scheduling mutations
  const toggleAutoSchedulingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/blog/auto-scheduling', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update auto scheduling');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Auto scheduling ${data.data.enabled ? 'enabled' : 'disabled'} successfully`,
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Helper functions
  const resetFormData = () => {
    setFormData({
      title: '',
      slug: '',
      keyword: '',
      category: 'Relationships',
      content: ''
    });
  };
  
  // Handler for edit post
  const handleEditPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      keyword: post.keyword,
      category: post.category,
      content: post.content
    });
    setIsEditDialogOpen(true);
  };
  
  // Handler for view post
  const handleViewPost = (postId: number) => {
    setSelectedPostId(postId);
    setIsViewDialogOpen(true);
  };
  
  // Handler for delete post
  const handleDeletePost = (postId: number) => {
    setSelectedPostId(postId);
    setIsDeleteDialogOpen(true);
  };
  
  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-');   // Replace spaces with hyphens
  };
  
  // Handle title change and auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };
  
  // Extract data from responses
  const blogPosts: BlogPost[] = blogPostsResponse?.data || [];
  const selectedPostWithAnalytics: BlogPostWithAnalytics | undefined = selectedPostResponse?.data;
  const subscribers: EmailSubscriber[] = subscribersResponse?.data || [];
  const leadMagnets: LeadMagnet[] = leadMagnetsResponse?.data || [];
  const settings: SystemSetting[] = settingsResponse?.data || [];
  const keywords: string[] = keywordsResponse?.data || [];
  const dashboardOverview: DashboardOverview | undefined = dashboardOverviewResponse?.data;
  
  // Use real data if available, fallback to mock data for development
  const quizData = quizAnalytics || mockQuizAnalytics;
  const blogData = blogAnalytics || mockBlogAnalytics;
  
  // State for add subscriber form
  const [subscriberFormData, setSubscriberFormData] = useState({
    firstName: '',
    email: '',
    source: 'Admin',
    unsubscribed: false
  });
  
  // State for add lead magnet form
  const [leadMagnetFormData, setLeadMagnetFormData] = useState({
    name: '',
    description: '',
    filePath: ''
  });
  
  // State for keyword form
  const [newKeyword, setNewKeyword] = useState('');
  
  // State for modals and dialogs
  const [isAddSubscriberDialogOpen, setIsAddSubscriberDialogOpen] = useState(false);
  const [isEditSubscriberDialogOpen, setIsEditSubscriberDialogOpen] = useState(false);
  const [isAddLeadMagnetDialogOpen, setIsAddLeadMagnetDialogOpen] = useState(false);
  const [isEditLeadMagnetDialogOpen, setIsEditLeadMagnetDialogOpen] = useState(false);
  const [isDeleteLeadMagnetDialogOpen, setIsDeleteLeadMagnetDialogOpen] = useState(false);
  
  // Selected items for editing
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<number | null>(null);
  const [selectedLeadMagnetId, setSelectedLeadMagnetId] = useState<number | null>(null);
  
  // Helper functions for forms
  const resetSubscriberFormData = () => {
    setSubscriberFormData({
      firstName: '',
      email: '',
      source: 'Admin',
      unsubscribed: false
    });
  };
  
  const resetLeadMagnetFormData = () => {
    setLeadMagnetFormData({
      name: '',
      description: '',
      filePath: ''
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor performance metrics for your quiz and blog system</p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Analytics</TabsTrigger>
          <TabsTrigger value="blog">Blog Analytics</TabsTrigger>
          <TabsTrigger value="content">Blog Posts</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quiz Responses</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizData.totalResponses}</div>
                <p className="text-xs text-muted-foreground">
                  +{Math.round(quizData.responsesByDay[quizData.responsesByDay.length - 1].count / quizData.totalResponses * 100)}% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quiz Completion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizData.completionRate}%</div>
                <div className="flex items-center pt-1">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+2.5% this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{blogData.totalPosts}</div>
                <div className="flex items-center pt-1">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+4 this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blog CTR</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{blogData.clickThroughRate.toFixed(2)}%</div>
                <div className="flex items-center pt-1">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+0.8% this week</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Responses Trend</CardTitle>
                <CardDescription>Daily responses over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={quizData.responsesByDay}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
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

        {/* Quiz Analytics Tab */}
        <TabsContent value="quiz" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Responses</span>
                    <span className="font-medium">{quizData.totalResponses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">{quizData.completionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-medium">{quizData.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Time to Complete</span>
                    <span className="font-medium">3:42</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Daily Quiz Responses</CardTitle>
                <CardDescription>Response trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={quizData.responsesByDay}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Daily Responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Referring Blog Posts</CardTitle>
                <CardDescription>Blog posts driving quiz traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={quizData.topReferringBlogPosts}
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="title" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Referrals" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Breakdown</CardTitle>
                <CardDescription>Traffic sources</CardDescription>
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
                      nameKey="source"
                    >
                      {quizData.responsesByReferral.map((entry, index) => (
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
              <CardTitle>Common Concerns Distribution</CardTitle>
              <CardDescription>Issues users are seeking help with</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={quizData.commonConcerns}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Number of Responses" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
                            {/* We'd use real analytics here, using mock for now */}
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
          
          {/* Edit dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Blog Post</DialogTitle>
                <DialogDescription>
                  Make changes to your blog post
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input 
                      id="edit-title" 
                      value={formData.title} 
                      onChange={handleTitleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-slug">Slug</Label>
                    <Input 
                      id="edit-slug" 
                      value={formData.slug} 
                      onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-keyword">Keyword</Label>
                    <Input 
                      id="edit-keyword" 
                      value={formData.keyword} 
                      onChange={(e) => setFormData({...formData, keyword: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({...formData, category: value})}
                    >
                      <SelectTrigger id="edit-category">
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
                  <Label htmlFor="edit-content">Content</Label>
                  <RichTextEditor 
                    value={formData.content} 
                    onChange={(value) => setFormData({...formData, content: value})} 
                    minHeight="400px"
                  />
                  <p className="text-xs text-gray-500">
                    Use the toolbar to format text, add links, images, and buttons to make your content engaging.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => updatePostMutation.mutate({
                    id: selectedPostId as number,
                    data: formData
                  })}
                  disabled={!formData.title || !formData.content || !formData.keyword || !selectedPostId}
                >
                  {updatePostMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : 'Update Post'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* View dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedPostLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedPostWithAnalytics ? (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Badge variant="outline">{selectedPostWithAnalytics.post.category}</Badge>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedPostWithAnalytics.post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl">{selectedPostWithAnalytics.post.title}</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Keyword: {selectedPostWithAnalytics.post.keyword}</Badge>
                        <Badge variant="secondary">Slug: {selectedPostWithAnalytics.post.slug}</Badge>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4 space-y-6">
                    <div 
                      className="prose max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedPostWithAnalytics.post.content }}
                    ></div>
                    
                    {selectedPostWithAnalytics.analytics && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Post Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Total Views</div>
                              <div className="text-2xl font-bold">{selectedPostWithAnalytics.analytics.totalViews}</div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Unique Views</div>
                              <div className="text-2xl font-bold">{selectedPostWithAnalytics.analytics.uniqueViews}</div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Quiz Clicks</div>
                              <div className="text-2xl font-bold">{selectedPostWithAnalytics.analytics.quizClicks}</div>
                            </div>
                          </div>
                          
                          {Object.keys(selectedPostWithAnalytics.analytics.referrers).length > 0 && (
                            <>
                              <div className="mt-6 mb-2 font-medium">Link Clicks</div>
                              <div className="space-y-2">
                                {Object.entries(selectedPostWithAnalytics.analytics.referrers).map(([url, count], idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <div className="text-sm truncate max-w-[400px]">
                                      <Link className="h-4 w-4 inline mr-2" />
                                      {url}
                                    </div>
                                    <Badge>{count} clicks</Badge>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                    <Button onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditPost(selectedPostWithAnalytics.post);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Post
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="text-center py-10">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Post not found</h3>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Delete confirmation dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the blog post
                  and all its analytics data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletePostMutation.mutate(selectedPostId as number)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deletePostMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  ) : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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

          <Card>
            <CardHeader>
              <CardTitle>Subscribers List</CardTitle>
              <CardDescription>
                Total Active Subscribers: {subscribers.filter(sub => !sub.unsubscribed).length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map(subscriber => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">{subscriber.firstName}</TableCell>
                          <TableCell>{subscriber.email}</TableCell>
                          <TableCell>{subscriber.source}</TableCell>
                          <TableCell>{new Date(subscriber.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {subscriber.unsubscribed ? (
                              <Badge variant="destructive">Unsubscribed</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  const selected = subscribers.find(s => s.id === subscriber.id);
                                  if (selected) {
                                    setSelectedSubscriberId(selected.id);
                                    setSubscriberFormData({
                                      firstName: selected.firstName,
                                      email: selected.email,
                                      source: selected.source,
                                      unsubscribed: selected.unsubscribed
                                    });
                                    setIsEditSubscriberDialogOpen(true);
                                  }
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!subscriber.unsubscribed && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => unsubscribeEmailMutation.mutate(subscriber.email)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Subscriber Dialog */}
          <Dialog open={isAddSubscriberDialogOpen} onOpenChange={setIsAddSubscriberDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
                <DialogDescription>
                  Add a new subscriber to your email list
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    className="col-span-3"
                    value={subscriberFormData.firstName}
                    onChange={(e) => setSubscriberFormData({
                      ...subscriberFormData,
                      firstName: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="col-span-3"
                    value={subscriberFormData.email}
                    onChange={(e) => setSubscriberFormData({
                      ...subscriberFormData,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">
                    Source
                  </Label>
                  <Select 
                    value={subscriberFormData.source}
                    onValueChange={(value) => setSubscriberFormData({
                      ...subscriberFormData,
                      source: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Blog">Blog</SelectItem>
                      <SelectItem value="Lead Magnet">Lead Magnet</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddSubscriberDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    createSubscriberMutation.mutate(subscriberFormData);
                    setIsAddSubscriberDialogOpen(false);
                  }}
                  disabled={createSubscriberMutation.isPending}
                >
                  {createSubscriberMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : 'Add Subscriber'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Subscriber Dialog */}
          <Dialog open={isEditSubscriberDialogOpen} onOpenChange={setIsEditSubscriberDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Subscriber</DialogTitle>
                <DialogDescription>
                  Update subscriber information
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="edit-firstName"
                    className="col-span-3"
                    value={subscriberFormData.firstName}
                    onChange={(e) => setSubscriberFormData({
                      ...subscriberFormData,
                      firstName: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    className="col-span-3"
                    value={subscriberFormData.email}
                    onChange={(e) => setSubscriberFormData({
                      ...subscriberFormData,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-source" className="text-right">
                    Source
                  </Label>
                  <Select 
                    value={subscriberFormData.source}
                    onValueChange={(value) => setSubscriberFormData({
                      ...subscriberFormData,
                      source: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Blog">Blog</SelectItem>
                      <SelectItem value="Lead Magnet">Lead Magnet</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <div className="flex items-center space-x-2 col-span-3">
                    <Checkbox 
                      id="status" 
                      checked={!subscriberFormData.unsubscribed}
                      onCheckedChange={(checked) => setSubscriberFormData({
                        ...subscriberFormData,
                        unsubscribed: !checked
                      })}
                    />
                    <label
                      htmlFor="status"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Active Subscriber
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditSubscriberDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedSubscriberId) {
                      updateSubscriberMutation.mutate({
                        id: selectedSubscriberId,
                        data: subscriberFormData
                      });
                      setIsEditSubscriberDialogOpen(false);
                    }
                  }}
                  disabled={updateSubscriberMutation.isPending}
                >
                  {updateSubscriberMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : 'Update Subscriber'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">System Settings</h2>
              <p className="text-muted-foreground">Configure the application settings and integrations</p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Magnets</CardTitle>
                <CardDescription>Manage downloadable materials for subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                {leadMagnetsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => {
                      resetLeadMagnetFormData();
                      setIsAddLeadMagnetDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead Magnet
                    </Button>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Downloads</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leadMagnets.map(leadMagnet => (
                            <TableRow key={leadMagnet.id}>
                              <TableCell className="font-medium">{leadMagnet.name}</TableCell>
                              <TableCell>{leadMagnet.downloadCount}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      const selected = leadMagnets.find(lm => lm.id === leadMagnet.id);
                                      if (selected) {
                                        setSelectedLeadMagnetId(selected.id);
                                        setLeadMagnetFormData({
                                          name: selected.name,
                                          description: selected.description,
                                          filePath: selected.filePath
                                        });
                                        setIsEditLeadMagnetDialogOpen(true);
                                      }
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setSelectedLeadMagnetId(leadMagnet.id);
                                      setIsDeleteLeadMagnetDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Blog Keywords</CardTitle>
                <CardDescription>Manage keywords for blog post generation</CardDescription>
              </CardHeader>
              <CardContent>
                {keywordsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter new keyword"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                      />
                      <Button 
                        onClick={() => {
                          if (newKeyword.trim()) {
                            addKeywordMutation.mutate(newKeyword.trim());
                            setNewKeyword('');
                          }
                        }}
                        disabled={addKeywordMutation.isPending || !newKeyword.trim()}
                      >
                        {addKeywordMutation.isPending ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {keywords.map((keyword, index) => (
                        <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                          <span>{keyword}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 rounded-full"
                            onClick={() => deleteKeywordMutation.mutate(keyword)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Auto Blog Scheduling</CardTitle>
                <CardDescription>Configure automated blog post generation settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="auto-scheduling" className="flex items-center gap-2">
                    <Switch 
                      id="auto-scheduling" 
                      checked={settings.find(s => s.settingKey === 'auto_scheduling_enabled')?.settingValue === 'true'}
                      onCheckedChange={(checked) => {
                        toggleAutoSchedulingMutation.mutate(checked);
                      }}
                    />
                    <span>Enable automatic blog post generation</span>
                  </Label>
                  {toggleAutoSchedulingMutation.isPending && (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  When enabled, the system will automatically generate blog posts based on configured keywords.
                  Posts will be scheduled daily according to the content calendar.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Add Lead Magnet Dialog */}
          <Dialog open={isAddLeadMagnetDialogOpen} onOpenChange={setIsAddLeadMagnetDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Lead Magnet</DialogTitle>
                <DialogDescription>
                  Create a new downloadable lead magnet
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={leadMagnetFormData.name}
                    onChange={(e) => setLeadMagnetFormData({
                      ...leadMagnetFormData,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    value={leadMagnetFormData.description}
                    onChange={(e) => setLeadMagnetFormData({
                      ...leadMagnetFormData,
                      description: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="filePath" className="text-right">
                    File Path
                  </Label>
                  <Input
                    id="filePath"
                    className="col-span-3"
                    value={leadMagnetFormData.filePath}
                    onChange={(e) => setLeadMagnetFormData({
                      ...leadMagnetFormData,
                      filePath: e.target.value
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddLeadMagnetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    createLeadMagnetMutation.mutate(leadMagnetFormData);
                    setIsAddLeadMagnetDialogOpen(false);
                  }}
                  disabled={createLeadMagnetMutation.isPending}
                >
                  {createLeadMagnetMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : 'Add Lead Magnet'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Lead Magnet Dialog */}
          <Dialog open={isEditLeadMagnetDialogOpen} onOpenChange={setIsEditLeadMagnetDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Lead Magnet</DialogTitle>
                <DialogDescription>
                  Update lead magnet information
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    className="col-span-3"
                    value={leadMagnetFormData.name}
                    onChange={(e) => setLeadMagnetFormData({
                      ...leadMagnetFormData,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    className="col-span-3"
                    value={leadMagnetFormData.description}
                    onChange={(e) => setLeadMagnetFormData({
                      ...leadMagnetFormData,
                      description: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-filePath" className="text-right">
                    File Path
                  </Label>
                  <Input
                    id="edit-filePath"
                    className="col-span-3"
                    value={leadMagnetFormData.filePath}
                    onChange={(e) => setLeadMagnetFormData({
                      ...leadMagnetFormData,
                      filePath: e.target.value
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditLeadMagnetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedLeadMagnetId) {
                      updateLeadMagnetMutation.mutate({
                        id: selectedLeadMagnetId,
                        data: leadMagnetFormData
                      });
                      setIsEditLeadMagnetDialogOpen(false);
                    }
                  }}
                  disabled={updateLeadMagnetMutation.isPending}
                >
                  {updateLeadMagnetMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : 'Update Lead Magnet'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete Lead Magnet Dialog */}
          <AlertDialog open={isDeleteLeadMagnetDialogOpen} onOpenChange={setIsDeleteLeadMagnetDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the lead magnet
                  and remove it from all related subscriber data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    if (selectedLeadMagnetId) {
                      deleteLeadMagnetMutation.mutate(selectedLeadMagnetId);
                      setIsDeleteLeadMagnetDialogOpen(false);
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleteLeadMagnetMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  ) : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;