import React, { useState } from 'react';
import { Link } from 'wouter';
import QuizContainer from '@/components/QuizContainer';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  content: string;
  imageUrl?: string; // Optional image URL
}

const Home: React.FC = () => {
  const [showQuiz, setShowQuiz] = useState(false);

  const startQuiz = () => {
    setShowQuiz(true);
  };

  const { data: featuredPostsResponse } = useQuery({
    queryKey: ['/api/blog/featured'],
    queryFn: getQueryFn<BlogPost[]>(),
  });

  const featuredPosts = (featuredPostsResponse?.success && featuredPostsResponse?.data ? 
    featuredPostsResponse.data : []).slice(0, 3);

  return (
    <div className="py-4 min-h-screen bg-white">
      {!showQuiz ? (
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f24b7c] mb-4">
              Obsession Trigger
            </h1>
            
            <h2 className="text-2xl md:text-3xl text-[#f24b7c] font-semibold mb-4">
              Decode His Mind & Trigger His Obsession...
            </h2>
            
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              Take the 60-second quiz to uncover exactly what he's thinking and how to spark 
              <span className="text-[#f24b7c] font-medium"> deep emotional desire</span>.
            </p>
            
            <div className="w-full max-w-xl mx-auto bg-gradient-to-r from-[#ffccd8] to-[#e0e8ff] h-1 mb-8 rounded-full"></div>
            
            <Button 
              onClick={startQuiz}
              className="bg-[#f24b7c] hover:bg-[#d22e5d] text-white font-semibold text-lg px-10 py-6 rounded-full transition-colors"
            >
              Start Free Quiz
            </Button>
          </div>
          
          {/* Testimonials Section - Centered */}
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="italic text-gray-600 mb-2 text-lg">
                  "This quiz helped me understand what was really going on in my relationship. The insights were spot on!"
                </p>
                <p className="text-[#f24b7c] font-semibold">— Sarah, 32</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="italic text-gray-600 mb-2 text-lg">
                  "I was skeptical at first, but the analysis gave me a whole new perspective on my relationship."
                </p>
                <p className="text-[#f24b7c] font-semibold">— Jessica, 28</p>
              </div>
            </div>
          </div>
          
          {/* Why Take This Quiz Section - Centered */}
          <div className="mb-16 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8 border border-[#ffccd8]">
              <h3 className="flex items-center text-2xl font-semibold text-[#f24b7c] mb-6 justify-center">
                <Heart className="h-6 w-6 mr-2 inline" fill="#fbb5c8" /> Why Take This Quiz?
              </h3>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-start">
                  <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                  <span>Gain clarity on your relationship dynamics</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                  <span>Discover psychological insights about his behavior</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                  <span>Learn practical techniques to deepen your connection</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                  <span>Receive a personalized analysis of your relationship</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                  <span>Understand his attachment style and needs</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                  <span>Get a customized PDF with detailed advice</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Featured Articles Section - Moved to bottom of page */}
          <div className="mt-12 py-12 bg-[#fef6f8] rounded-xl">
            <div className="max-w-5xl mx-auto px-4">
              <h3 className="text-3xl font-bold text-center text-[#f24b7c] mb-8">Featured Articles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.length > 0 ? (
                  featuredPosts.map((post) => (
                    <Card key={post.id} className="bg-white shadow-md overflow-hidden h-full flex flex-col">
                      <div className="h-48 w-full bg-gray-200 overflow-hidden">
                        {post.imageUrl ? (
                          <img 
                            src={post.imageUrl} 
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform hover:scale-105" 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#ffedf1] to-[#ffe4e4]">
                            <Heart className="h-12 w-12 text-[#f24b7c] opacity-40" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-[#f24b7c]">{post.title}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </CardHeader>
                      <CardContent className="pb-2 flex-grow">
                        <p className="text-gray-700 line-clamp-3">
                          {post.content?.replace(/<[^>]+>/g, '').substring(0, 120)}...
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Link href={`/blog/${post.slug}`} className="text-[#f24b7c] font-medium flex items-center hover:underline">
                          Read more
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500 mb-4 text-lg">Explore our relationship advice blog</p>
                    <Link href="/blog">
                      <Button variant="outline" className="border-[#f24b7c] text-[#f24b7c]">
                        Visit Blog
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <Link href="/blog" className="inline-block bg-white py-3 px-6 rounded-full shadow-md text-[#f24b7c] font-medium hover:shadow-lg transition-shadow">
                  <span className="flex items-center">
                    View all articles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto relative">
          <QuizContainer />
        </div>
      )}
    </div>
  );
};

export default Home;
