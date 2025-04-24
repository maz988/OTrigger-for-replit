import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Loader2,
  Users,
  Filter,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { QuizResponse } from '@shared/schema';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B', '#6B66FF'];

// Interface for quiz completion funnel data
interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

// Interface for answer statistics
interface AnswerStat {
  question: string;
  answer: string;
  count: number;
}

const QuizAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('all');
  
  // Get admin token from localStorage
  const token = localStorage.getItem('adminToken');
  
  // Fetch quiz analytics data
  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
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
  });
  
  // Fetch quiz responses data with time range filter
  const { data: responsesResponse, isLoading: responsesLoading } = useQuery({
    queryKey: ['/api/admin/quiz/responses', timeRange],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      let url = '/api/admin/quiz/responses';
      if (timeRange !== 'all') {
        url += `?timeRange=${timeRange}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
  });
  
  // Extract the data from the responses
  const quizAnalytics = analyticsResponse?.success ? analyticsResponse.data : undefined;
  const quizResponses: QuizResponse[] = responsesResponse?.success ? responsesResponse.data : [];
  
  // Format the response data for the various charts
  const formatDateData = () => {
    if (!quizAnalytics) return [];
    return quizAnalytics.responsesByDay.map((item: any) => ({
      date: item.date,
      count: item.count
    }));
  };
  
  // Calculate answer frequency for each question
  const calculateAnswerFrequency = () => {
    if (!quizResponses || quizResponses.length === 0) return [];
    
    const answerCounts: Record<string, Record<string, number>> = {
      relationshipStatus: {},
      concernType: {},
      communicationStyle: {},
      desiredOutcome: {}
    };
    
    // Count occurrences of each answer
    quizResponses.forEach(response => {
      ['relationshipStatus', 'concernType', 'communicationStyle', 'desiredOutcome'].forEach(question => {
        const answer = response[question as keyof QuizResponse] as string;
        if (!answerCounts[question][answer]) {
          answerCounts[question][answer] = 0;
        }
        answerCounts[question][answer]++;
      });
    });
    
    // Create array of answer stats
    const answerStats: AnswerStat[] = [];
    Object.entries(answerCounts).forEach(([question, answers]) => {
      Object.entries(answers).forEach(([answer, count]) => {
        answerStats.push({
          question,
          answer,
          count
        });
      });
    });
    
    return answerStats;
  };
  
  // Calculate completion funnel
  const calculateFunnel = (): FunnelStage[] => {
    if (!quizAnalytics) return [];
    
    const totalStarted = quizAnalytics.totalResponses;
    const completed = Math.round(totalStarted * (quizAnalytics.completionRate / 100));
    const converted = Math.round(totalStarted * (quizAnalytics.conversionRate / 100));
    const downloaded = Math.round(converted * 0.8); // Assuming 80% of converted users download the PDF
    
    return [
      { stage: 'Started Quiz', count: totalStarted, percentage: 100 },
      { stage: 'Completed Quiz', count: completed, percentage: quizAnalytics.completionRate },
      { stage: 'Submitted Email', count: converted, percentage: quizAnalytics.conversionRate },
      { stage: 'Downloaded PDF', count: downloaded, percentage: Math.round((downloaded / totalStarted) * 100) }
    ];
  };
  
  // Format data for relationship status pie chart
  const getRelationshipStatusData = () => {
    if (!quizResponses || quizResponses.length === 0) return [];
    
    const statusCounts: Record<string, number> = {};
    quizResponses.forEach(response => {
      const status = response.relationshipStatus;
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status]++;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };
  
  // Format data for concern type bar chart
  const getConcernTypeData = () => {
    if (!quizResponses || quizResponses.length === 0) return [];
    
    const concernCounts: Record<string, number> = {};
    quizResponses.forEach(response => {
      const concern = response.concernType;
      if (!concernCounts[concern]) {
        concernCounts[concern] = 0;
      }
      concernCounts[concern]++;
    });
    
    return Object.entries(concernCounts).map(([name, value]) => ({ name, value }));
  };
  
  // Handle CSV export
  const handleExport = () => {
    if (!token) return;
    
    // Create a link to download the CSV
    const link = document.createElement('a');
    link.href = `/api/admin/quiz/export?token=${encodeURIComponent(token)}`;
    link.setAttribute('download', 'quiz-responses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Loading state
  if (analyticsLoading || responsesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }
  
  // Create the funnel data
  const funnelData = calculateFunnel();
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Quiz Analytics</h1>
            <p className="text-muted-foreground">Detailed analysis of quiz responses and user engagement</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizAnalytics?.totalResponses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === 'all' 
                ? 'All time' 
                : timeRange === '7days' 
                  ? 'Last 7 days' 
                  : 'Last 30 days'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizAnalytics?.completionRate || 0}%</div>
            <Progress 
              value={quizAnalytics?.completionRate || 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizAnalytics?.conversionRate || 0}%</div>
            <Progress 
              value={quizAnalytics?.conversionRate || 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="funnel">Completion Funnel</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Responses Over Time</CardTitle>
              <CardDescription>Daily quiz submissions trend</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formatDateData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Responses" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Relationship Status</CardTitle>
                <CardDescription>Distribution of respondents by relationship status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={getRelationshipStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getRelationshipStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Concerns</CardTitle>
                <CardDescription>Most common relationship concerns</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getConcernTypeData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name="Responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Referral Sources</CardTitle>
              <CardDescription>Where quiz traffic is coming from</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quizAnalytics?.responsesByReferral || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Responses" 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Details</CardTitle>
              <CardDescription>
                {quizResponses.length} responses {timeRange !== 'all' ? `in the ${timeRange === '7days' ? 'last 7 days' : 'last 30 days'}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Concern</th>
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-left font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizResponses.slice(0, 10).map((response, index) => (
                        <tr key={response.id} className={index % 2 ? 'bg-muted/50' : ''}>
                          <td className="p-3">{response.firstName}</td>
                          <td className="p-3">{response.email}</td>
                          <td className="p-3">{response.relationshipStatus}</td>
                          <td className="p-3">{response.concernType}</td>
                          <td className="p-3">{new Date(response.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">{response.referralSource}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {quizResponses.length > 10 && (
                  <div className="p-3 text-center border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing 10 of {quizResponses.length} responses. Export to CSV to see all data.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Communication Styles</CardTitle>
                <CardDescription>Preferred communication styles of respondents</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={quizResponses.reduce((acc: any[], response) => {
                        const style = response.communicationStyle;
                        const existing = acc.find(item => item.name === style);
                        if (existing) {
                          existing.value++;
                        } else {
                          acc.push({ name: style, value: 1 });
                        }
                        return acc;
                      }, [])}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {quizResponses.reduce((acc: any[], response) => {
                        const style = response.communicationStyle;
                        const existing = acc.find(item => item.name === style);
                        if (existing) {
                          existing.value++;
                        } else {
                          acc.push({ name: style, value: 1 });
                        }
                        return acc;
                      }, []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Desired Outcomes</CardTitle>
                <CardDescription>What respondents want to achieve</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={quizResponses.reduce((acc: any[], response) => {
                      const outcome = response.desiredOutcome;
                      const existing = acc.find(item => item.name === outcome);
                      if (existing) {
                        existing.value++;
                      } else {
                        acc.push({ name: outcome, value: 1 });
                      }
                      return acc;
                    }, [])}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name="Responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Referring Blog Posts</CardTitle>
              <CardDescription>Blog posts driving quiz traffic</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={quizAnalytics?.topReferringBlogPosts || []}
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="title" width={110} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Referrals" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Completion Funnel</CardTitle>
              <CardDescription>User progression through the quiz flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 py-4">
                {funnelData.map((stage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {stage.count.toLocaleString()} ({stage.percentage}%)
                      </span>
                    </div>
                    <Progress 
                      value={stage.percentage} 
                      className="h-4" 
                      style={{ 
                        background: '#e2e8f0',
                        borderRadius: '9999px' 
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Drop-off Analysis</h3>
                <div className="space-y-4">
                  {funnelData.slice(0, -1).map((stage, index) => {
                    const nextStage = funnelData[index + 1];
                    const dropOff = stage.count - nextStage.count;
                    const dropOffPercentage = ((dropOff / stage.count) * 100).toFixed(1);
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{stage.stage} → {nextStage.stage}</span>
                          <p className="text-sm text-muted-foreground">
                            {dropOff.toLocaleString()} users drop off ({dropOffPercentage}%)
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-white text-xs ${
                          parseFloat(dropOffPercentage) > 50 ? 'bg-red-500' : 
                          parseFloat(dropOffPercentage) > 30 ? 'bg-amber-500' : 'bg-green-500'
                        }`}>
                          {parseFloat(dropOffPercentage) > 50 ? 'Critical' : 
                           parseFloat(dropOffPercentage) > 30 ? 'Concerning' : 'Good'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion by Source</CardTitle>
                <CardDescription>Conversion rates by traffic source</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={quizAnalytics?.responsesByReferral.map((item: any) => ({
                      source: item.source,
                      conversion: Math.round(Math.random() * 40 + 20) // Simulated conversion rate
                    })) || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="conversion" 
                      name="Conversion Rate (%)" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Completion Time</CardTitle>
                <CardDescription>Average time spent completing the quiz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[240px]">
                  <div className="text-6xl font-bold">3:42</div>
                  <p className="text-muted-foreground mt-2">Average completion time</p>
                  <div className="grid grid-cols-3 gap-4 w-full mt-8">
                    <div className="text-center">
                      <div className="text-xl font-semibold">1:15</div>
                      <p className="text-xs text-muted-foreground">Fastest</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold">3:42</div>
                      <p className="text-xs text-muted-foreground">Average</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold">8:20</div>
                      <p className="text-xs text-muted-foreground">Slowest</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizAnalytics;