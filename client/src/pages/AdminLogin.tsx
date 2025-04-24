import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormData = z.infer<typeof formSchema>;

const AdminLogin: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (response) => {
      if (!response.success) {
        toast({
          title: 'Login failed',
          description: response.error || 'Authentication failed',
          variant: 'destructive',
        });
        return;
      }
      
      // Save token to localStorage
      if (response.data && response.data.token) {
        console.log('Saving token to localStorage:', response.data.token);
        localStorage.setItem('adminToken', response.data.token);
        
        // Also save admin credentials for debugging
        localStorage.setItem('adminUsername', response.data.username);
        localStorage.setItem('adminId', response.data.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/me'] });
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
      
      // Slight delay before redirecting to ensure token is saved
      setTimeout(() => {
        setLocation('/admin');
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid username or password',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  // Create a separate mutation for creating an admin account
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Registration successful',
        description: 'Admin account created. You can now login.',
      });
      setShowRegister(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create admin account',
        variant: 'destructive',
      });
    },
  });
  
  const [showRegister, setShowRegister] = React.useState(false);
  
  // Create a register form
  const registerForm = useForm({
    resolver: zodResolver(z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      email: z.string().email("Please enter a valid email"),
    })),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });
  
  const onRegisterSubmit = (data: any) => {
    registerMutation.mutate({
      ...data,
      role: "admin"
    });
  };
  
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#ffedf1] flex items-center justify-center">
              <Lock className="h-6 w-6 text-[#f24b7c]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-[#f24b7c]">{showRegister ? 'Register Admin' : 'Admin Login'}</CardTitle>
          <CardDescription className="text-center">
            {showRegister 
              ? 'Create a new admin account' 
              : 'Enter your credentials to access the admin dashboard'}
          </CardDescription>
          {!showRegister && (
            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs text-center">
              <p>Default login: <span className="font-bold">newadmin</span> / <span className="font-bold">password123</span></p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {showRegister ? (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Creating account...' : 'Create Admin Account'}
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowRegister(false)}
                >
                  Back to Login
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
                
                {/* Direct login button */}
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    console.log('Using direct login method');
                    // Direct login with the default credentials
                    loginMutation.mutate({
                      username: 'newadmin',
                      password: 'password123'
                    });
                  }}
                >
                  Login as Default Admin
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setShowRegister(true)}
                >
                  Create New Admin
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Admin access is restricted to authorized personnel only
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;