import React from 'react';
import { Link } from 'wouter';
import BlogPostList from '@/components/BlogPostList';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

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
        
        <div className="space-y-6">
          <div className="bg-[#ffedf1] rounded-lg p-6">
            <h3 className="flex items-center text-xl font-semibold text-[#f24b7c] mb-4">
              <Heart className="h-5 w-5 mr-2" fill="#fbb5c8" />
              Take Our Relationship Quiz
            </h3>
            <p className="text-gray-700 mb-4">
              Get personalized insights about your relationship in just 60 seconds.
            </p>
            <Link href="/">
              <Button className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]">
                Start Free Quiz
              </Button>
            </Link>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Popular Categories
            </h3>
            <div className="space-y-2">
              <Link href="/blog?category=Communication" className="block text-[#f24b7c] hover:underline">Communication</Link>
              <Link href="/blog?category=Attraction" className="block text-[#f24b7c] hover:underline">Attraction</Link>
              <Link href="/blog?category=Dating" className="block text-[#f24b7c] hover:underline">Dating</Link>
              <Link href="/blog?category=Relationships" className="block text-[#f24b7c] hover:underline">Relationships</Link>
              <Link href="/blog?category=Marriage" className="block text-[#f24b7c] hover:underline">Marriage</Link>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              About This Blog
            </h3>
            <p className="text-gray-600 mb-2">
              Expert advice and insights to help you navigate relationship challenges and build deeper connections.
            </p>
            <p className="text-gray-600">
              Our content is created using the latest research in relationship psychology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;