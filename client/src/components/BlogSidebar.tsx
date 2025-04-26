import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Heart, Calendar } from 'lucide-react';
import LeadMagnetForm from './LeadMagnetForm';

interface Category {
  name: string;
  slug: string;
}

interface RecentPost {
  title: string;
  slug: string;
  date: string;
}

interface BlogSidebarProps {
  categories?: Category[];
  recentPosts?: RecentPost[];
  showLeadMagnet?: boolean;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
  leadMagnetName?: string;
}

export default function BlogSidebar({
  categories = [],
  recentPosts = [],
  showLeadMagnet = true,
  leadMagnetTitle = "Get Your Free Guide",
  leadMagnetDescription = "Enter your details below to receive exclusive relationship advice.",
  leadMagnetName = "Relationship Guide"
}: BlogSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Quiz CTA Card */}
      <Card className="bg-[#ffedf1] border-[#f24b7c]/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-[#f24b7c]">
            <Heart className="h-5 w-5 mr-2" fill="#fbb5c8" />
            Take Our Relationship Quiz
          </CardTitle>
          <CardDescription>
            Get personalized insights in just 60 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className={buttonVariants({
            className: "w-full bg-[#f24b7c] hover:bg-[#d22e5d] text-white"
          })}>
            Start Free Quiz
          </Link>
        </CardContent>
      </Card>
      
      {/* Lead Magnet Form */}
      {showLeadMagnet && (
        <LeadMagnetForm
          source="blog-sidebar"
          title={leadMagnetTitle}
          description={leadMagnetDescription}
          leadMagnetName={leadMagnetName}
          variant="sidebar"
        />
      )}
      
      {/* Categories */}
      {categories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <Link 
                  key={category.slug}
                  href={`/blog/category/${category.slug}`}
                  className="block text-[#f24b7c] hover:underline"
                  onClick={() => console.log(`Navigating to category: ${category.slug}`)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.slug} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="font-medium text-gray-800 hover:text-[#f24b7c]"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {post.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* About Blog */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">About This Blog</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Expert advice and insights to help you navigate relationship challenges 
            and build deeper, more meaningful connections with your partner.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}