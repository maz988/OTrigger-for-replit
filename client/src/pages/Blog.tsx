import React from 'react';
import { Link } from 'wouter';
import BlogPostList from '@/components/BlogPostList';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import BlogSidebar from '@/components/BlogSidebar';

const Blog: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#f24b7c] mb-3">
          Relationship Advice Blog
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover practical advice and deep insights to transform your relationship
          and create the connection you've always wanted.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2">
          <BlogPostList />
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

export default Blog;