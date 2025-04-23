import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Heart, Calendar } from 'lucide-react';
import BlogSidebar from '@/components/BlogSidebar';
import LeadMagnetForm from '@/components/LeadMagnetForm';

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

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  
  const { data: blogPostResponse, isLoading, error } = useQuery({
    queryKey: [`/api/blog/posts/${slug}`],
    queryFn: getQueryFn<BlogPost>(),
  });

  const post = blogPostResponse?.success && blogPostResponse?.data ? 
    blogPostResponse.data : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:w-2/3">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-40 w-full rounded-lg mt-8" />
          </div>
          
          {/* Sidebar Skeleton - Only visible on desktop */}
          <div className="lg:w-1/3 hidden lg:block">
            <Skeleton className="h-80 w-full rounded-md mb-6" />
            <Skeleton className="h-40 w-full rounded-md mb-6" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="text-center py-10">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
              <p className="text-gray-600 mb-6">Sorry, the blog post you're looking for doesn't exist or has been removed.</p>
              <div className="flex justify-center gap-4">
                <Link href="/blog">
                  <Button variant="outline">Browse Blog</Button>
                </Link>
                <Link href="/">
                  <Button className="bg-[#f24b7c] hover:bg-[#d22e5d]">Return Home</Button>
                </Link>
              </div>
            </div>
            
            {/* Lead magnet on error page */}
            <div className="mt-12">
              <LeadMagnetForm 
                source="blog-error-page"
                title="While You're Here..."
                description="Get our free relationship guide with practical tips you can apply today."
                leadMagnetName="Ultimate Relationship Guide"
                variant="inline"
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 hidden lg:block">
            <BlogSidebar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="lg:w-2/3">
          <Link href="/blog" className="text-[#f24b7c] flex items-center mb-6 hover:underline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to all posts
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-[#f24b7c] mb-3">{post.title}</h1>
          
          <div className="flex items-center text-gray-500 mb-8">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="mr-4">{formatDate(post.publishedAt)}</span>
            <span className="px-2 py-1 text-xs bg-[#ffedf1] text-[#f24b7c] rounded-full">{post.category}</span>
          </div>
          
          <div className="prose prose-lg max-w-none mb-10">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700">{paragraph}</p>
            ))}
          </div>
          
          {/* Quiz Call-to-Action */}
          <div className="bg-[#ffedf1] rounded-lg p-6 my-8">
            <h3 className="flex items-center text-xl font-semibold text-[#f24b7c] mb-4">
              <Heart className="h-5 w-5 mr-2" fill="#fbb5c8" />
              Struggling with your relationship?
            </h3>
            <p className="text-gray-700 mb-4">
              Take our free 60-second quiz to gain personalized insights into your relationship dynamics 
              and discover practical strategies tailored to your specific situation.
            </p>
            <Link href="/">
              <Button className="bg-[#f24b7c] hover:bg-[#d22e5d]">
                Take the Free Quiz
              </Button>
            </Link>
          </div>
          
          {/* Mobile Lead Magnet (only shows on mobile) */}
          <div className="lg:hidden mt-8">
            <LeadMagnetForm 
              source="blog-post-mobile"
              title="Get Your Free Relationship Guide"
              description="Join thousands of women who have transformed their relationships with our proven strategies."
              leadMagnetName="Ultimate Relationship Guide"
              variant="sidebar"
            />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-1/3 hidden lg:block">
          <BlogSidebar 
            leadMagnetTitle="Get Your Free Relationship Guide"
            leadMagnetDescription="Discover the psychological triggers that make him fall deeply in love."
            leadMagnetName="Ultimate Relationship Guide"
          />
        </div>
      </div>
    </div>
  );
};

export default BlogPost;