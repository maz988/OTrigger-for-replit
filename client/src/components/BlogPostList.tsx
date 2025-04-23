import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  keyword: string;
  category: string;
  publishedAt: string;
}

export function BlogPostList() {
  const { data: blogPostsResponse, isLoading } = useQuery({
    queryKey: ['/api/blog/posts'],
    queryFn: getQueryFn(),
  });

  const blogPosts = blogPostsResponse?.data as BlogPost[] || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!blogPosts?.length) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No blog posts available yet. Check back soon!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {blogPosts.map((post) => (
        <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-[#f24b7c]">{post.title}</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>{formatDate(post.publishedAt)}</span>
              <span className="px-2 py-1 text-xs bg-[#ffedf1] text-[#f24b7c] rounded-full">{post.category}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{truncateContent(post.content)}</p>
          </CardContent>
          <CardFooter className="pt-2">
            <Link href={`/blog/${post.slug}`} className="text-[#f24b7c] font-medium flex items-center hover:underline">
              Read more
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default BlogPostList;