import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LeadMagnetForm from './LeadMagnetForm';
import { Link } from 'wouter';

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

const defaultCategories: Category[] = [
  { name: 'Communication', slug: 'communication' },
  { name: 'Dating', slug: 'dating' },
  { name: 'Hero Instinct', slug: 'hero-instinct' },
  { name: 'Attraction', slug: 'attraction' },
  { name: 'Commitment', slug: 'commitment' },
];

const defaultRecentPosts: RecentPost[] = [
  { 
    title: 'How to Trigger His Hero Instinct', 
    slug: 'how-to-trigger-his-hero-instinct',
    date: 'Apr 20, 2025' 
  },
  { 
    title: 'Signs He Is Secretly Attracted to You', 
    slug: 'signs-he-is-secretly-attracted-to-you',
    date: 'Apr 18, 2025' 
  },
  { 
    title: 'How to Create Emotional Intimacy', 
    slug: 'how-to-create-emotional-intimacy',
    date: 'Apr 15, 2025' 
  },
];

export default function BlogSidebar({
  categories = defaultCategories,
  recentPosts = defaultRecentPosts,
  showLeadMagnet = true,
  leadMagnetTitle = 'Get Your Free Love Guide',
  leadMagnetDescription = 'Discover powerful psychological triggers that make a man fall in love and stay in love.',
  leadMagnetName = 'Ultimate Relationship Guide',
}: BlogSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Lead Magnet Form */}
      {showLeadMagnet && (
        <div className="mb-8">
          <LeadMagnetForm 
            source="blog-sidebar"
            title={leadMagnetTitle}
            description={leadMagnetDescription}
            leadMagnetName={leadMagnetName}
            variant="sidebar"
          />
        </div>
      )}
      
      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.slug} href={`/blog/category/${category.slug}`}>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Posts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.slug} className="space-y-1">
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-sm font-medium hover:text-[#f24b7c] cursor-pointer">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Obsession Trigger is dedicated to helping women create lasting, fulfilling relationships 
            through understanding male psychology and effective communication strategies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}