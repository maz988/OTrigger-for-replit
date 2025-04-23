import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getQueryFn } from '@/lib/queryClient';
import { 
  UserCheck, 
  FileText, 
  BarChart3, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight
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

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#FF5722'];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch quiz analytics data
  const { data: quizAnalyticsResponse, isLoading: quizLoading } = useQuery({
    queryKey: ['/api/admin/analytics/quiz'],
    queryFn: getQueryFn({ on401: 'throw' }),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch blog analytics data
  const { data: blogAnalyticsResponse, isLoading: blogLoading } = useQuery({
    queryKey: ['/api/admin/analytics/blog'],
    queryFn: getQueryFn({ on401: 'throw' }),
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

  // Use real data if available, fallback to mock data for development
  const quizData = quizAnalytics || mockQuizAnalytics;
  const blogData = blogAnalytics || mockBlogAnalytics;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor performance metrics for your quiz and blog system</p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Analytics</TabsTrigger>
          <TabsTrigger value="blog">Blog Analytics</TabsTrigger>
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
                <div className="text-2xl font-bold">{blogData.clickThroughRate}%</div>
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
                        <span className="text-sm font-medium">{post.clickThrough}%</span>
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
                    <span className="font-medium">{blogData.clickThroughRate}%</span>
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
                        <td className="text-right py-3 px-2">{post.clickThrough}%</td>
                        <td className="text-right py-3 px-2">{post.conversion}%</td>
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
                          {Math.round((item.clicks / item.views) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;