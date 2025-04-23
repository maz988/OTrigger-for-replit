import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Define API response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Get the admin token from localStorage
  const adminToken = localStorage.getItem('adminToken');
  
  // Set up headers with the token if it exists
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (adminToken && url.includes('/api/admin')) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw" | "silent";

export const getQueryFn = <T>(options: {
  on401?: UnauthorizedBehavior;
} = {}): QueryFunction<ApiResponse<T>> => {
  const { on401 = "throw" } = options;
  
  return async ({ queryKey }) => {
    // Get the admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    
    // Set up headers with the token if it exists
    const headers: Record<string, string> = {};
    if (adminToken && (queryKey[0] as string).includes('/api/admin')) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (res.status === 401) {
      if (on401 === "returnNull") {
        return null;
      } else if (on401 === "silent") {
        return { success: false, error: "Unauthorized" };
      } else if (on401 === "throw") {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
