import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import BlogPostList from '@/components/BlogPostList';
import BlogSidebar from '@/components/BlogSidebar';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const BlogCategory: React.FC = () => {
  const [, params] = useRoute('/blog/category/:categorySlug');
  const categorySlug = params?.categorySlug || '';
  
  // State to store category name
  const [categoryName, setCategoryName] = useState('');
  
  // Convert slug to proper category name (e.g., "hero-instinct" to "Hero Instinct")
  useEffect(() => {
    if (categorySlug) {
      // Convert slug to display name
      const name = categorySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setCategoryName(name);
    }
  }, [categorySlug]);
  
  // Get posts by category
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['/api/blog/posts', { category: categorySlug }],
    enabled: !!categorySlug,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-[300px] mx-auto mb-3" />
            <Skeleton className="h-5 w-[500px] mx-auto" />
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-[#f24b7c] mb-3">
              {categoryName} Articles
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our {categoryName.toLowerCase()} advice and insights to improve your relationships and create deeper connections.
            </p>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2">
          <BlogPostList categorySlug={categorySlug} />
        </div>
        
        <div>
          <BlogSidebar
            leadMagnetTitle="Get Your Free Relationship Guide"
            leadMagnetDescription="Discover the psychological triggers that make him fall deeply in love."
            leadMagnetName="Ultimate Relationship Guide"
            categories={[
              { name: 'Communication', slug: 'communication' },
              { name: 'Attraction', slug: 'attraction' },
              { name: 'Dating', slug: 'dating' },
              { name: 'Hero Instinct', slug: 'hero-instinct' },
              { name: 'Emotional Intimacy', slug: 'emotional-intimacy' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogCategory;