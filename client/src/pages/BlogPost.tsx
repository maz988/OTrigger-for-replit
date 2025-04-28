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
  imageUrls?: { original: string, photographer?: string, alt?: string }[];
}

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  
  const { data: blogPostResponse, isLoading, error } = useQuery({
    queryKey: [`/api/blog/posts/${slug}`],
    queryFn: getQueryFn<BlogPost>(),
  });

  const post = blogPostResponse?.success && blogPostResponse?.data ? 
    blogPostResponse.data : null;

  // Process the content to enhance image arrangement
  const processContent = (content: string, images?: { original: string, photographer?: string, alt?: string }[]) => {
    if (!content) return content;
    
    // Add custom styling to images
    let enhancedContent = content.replace(
      /<img(.*?)src="(.*?)"(.*?)>/g, 
      '<img$1src="$2"$3 class="rounded-lg shadow-md my-6 w-full h-auto">'
    );
    
    // Add proper figure elements with captions when images reference a photographer
    if (images && images.length > 0) {
      // Replace existing images with proper figure elements
      const imageRegex = /<img.*?src="(.*?)".*?>/g;
      let match;
      let imageIndex = 0;
      const processedUrls: string[] = [];
      
      while ((match = imageRegex.exec(enhancedContent)) !== null && imageIndex < images.length) {
        const imageUrl = match[1];
        
        // Skip if we've already processed this URL
        if (processedUrls.includes(imageUrl)) continue;
        processedUrls.push(imageUrl);
        
        const image = images[imageIndex];
        const caption = image.photographer ? `Photo by ${image.photographer}` : '';
        const alt = image.alt || post?.title || 'Blog image';
        
        const figureHtml = `
          <figure class="my-8">
            <img src="${image.original}" alt="${alt}" class="rounded-lg shadow-md w-full h-auto" />
            ${caption ? `<figcaption class="text-sm text-gray-500 mt-2 text-center italic">${caption}</figcaption>` : ''}
          </figure>
        `;
        
        // Replace the image with the figure element
        enhancedContent = enhancedContent.replace(match[0], figureHtml);
        imageIndex++;
      }
      
      // Insert any remaining images at appropriate points in the content if they weren't already included
      if (imageIndex < images.length) {
        // Find all paragraph elements
        const paragraphs = enhancedContent.match(/<p>(.*?)<\/p>/g);
        
        if (paragraphs && paragraphs.length > 1) {
          // Insert images after intro paragraphs
          for (let i = imageIndex; i < images.length && i < paragraphs.length; i++) {
            const image = images[i];
            const caption = image.photographer ? `Photo by ${image.photographer}` : '';
            const alt = image.alt || post?.title || 'Blog image';
            
            // Calculate position to insert (after the paragraph at index position i+2)
            const insertPosition = Math.min(i + 2, paragraphs.length - 1);
            const paragraphToInsertAfter = paragraphs[insertPosition];
            const insertIndex = enhancedContent.indexOf(paragraphToInsertAfter) + paragraphToInsertAfter.length;
            
            const figureHtml = `
              <figure class="my-8">
                <img src="${image.original}" alt="${alt}" class="rounded-lg shadow-md w-full h-auto" />
                ${caption ? `<figcaption class="text-sm text-gray-500 mt-2 text-center italic">${caption}</figcaption>` : ''}
              </figure>
            `;
            
            enhancedContent = enhancedContent.substring(0, insertIndex) + figureHtml + enhancedContent.substring(insertIndex);
          }
        }
      }
    }
    
    // Add styling to blockquotes
    enhancedContent = enhancedContent.replace(
      /<blockquote>([\s\S]*?)<\/blockquote>/g,
      '<blockquote class="border-l-4 border-[#f24b7c] pl-4 py-1 my-6 text-lg italic text-gray-700">$1</blockquote>'
    );
    
    return enhancedContent;
  };

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
          
          <div 
            className="prose prose-lg max-w-none mb-10 blog-content"
            dangerouslySetInnerHTML={{ __html: processContent(post.content, post.imageUrls) }}
          ></div>
          
          {/* Add custom CSS for better blog layout */}
          <style dangerouslySetInnerHTML={{ __html: `
            .blog-content {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.8;
              color: #333;
            }
            .blog-content h2 {
              color: #f24b7c;
              margin-top: 2rem;
              margin-bottom: 1rem;
              font-weight: 700;
              font-size: 1.75rem;
            }
            .blog-content h3 {
              color: #f24b7c;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              font-weight: 600;
              font-size: 1.5rem;
            }
            .blog-content p {
              margin-bottom: 1.25rem;
            }
            .blog-content figure {
              margin: 2rem 0;
              width: 100%;
              display: block;
            }
            .blog-content figure img {
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              width: 100%;
              height: auto;
              transition: transform 0.3s ease;
            }
            .blog-content figure img:hover {
              transform: scale(1.01);
            }
            .blog-content figcaption {
              text-align: center;
              font-size: 0.875rem;
              color: #718096;
              font-style: italic;
              padding-top: 0.5rem;
            }
            .blog-content blockquote {
              border-left: 4px solid #f24b7c;
              padding-left: 1rem;
              font-style: italic;
              color: #4a5568;
              margin: 1.5rem 0;
              font-size: 1.125rem;
            }
            .blog-content ul, .blog-content ol {
              padding-left: 1.5rem;
              margin-bottom: 1.5rem;
            }
            .blog-content ul li, .blog-content ol li {
              margin-bottom: 0.5rem;
            }
            .blog-content a {
              color: #f24b7c;
              text-decoration: none;
              border-bottom: 1px dotted #f24b7c;
              transition: border-bottom 0.2s ease;
            }
            .blog-content a:hover {
              border-bottom: 1px solid #f24b7c;
            }
            .blog-content .quiz-link {
              font-weight: 600;
              color: #f24b7c;
            }
          `}} />
          
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