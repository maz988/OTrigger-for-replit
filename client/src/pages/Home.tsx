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
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <p className="italic text-gray-600 mb-2 text-lg">
                  "This quiz helped me understand what was really going on in my relationship. The insights were spot on!"
                </p>
                <p className="text-[#f24b7c] font-semibold">— Sarah, 32</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="flex items-center text-xl font-semibold text-[#f24b7c] mb-4">
                  <Heart className="h-5 w-5 mr-2 inline" fill="#fbb5c8" /> Why Take This Quiz?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                    <span>Gain clarity on your relationship dynamics</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                    <span>Discover psychological insights about his behavior</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                    <span>Learn practical techniques to deepen your connection</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                    <span>Receive a personalized analysis of your relationship</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-[#ffedf1] rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold text-[#f24b7c] mb-4">Why Take This Quiz?</h3>
              <div className="space-y-3">
                <p className="text-gray-700">Uncover the hidden psychological triggers that make him obsessed with you. Our personalized assessment reveals:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>His specific attachment style and how it impacts your relationship</li>
                  <li>The exact words and actions that create deep emotional attraction</li>
                  <li>Personalized strategies to establish a secure and lasting bond</li>
                  <li>Signs of genuine interest versus temporary infatuation</li>
                </ul>
                <p className="text-gray-700 mt-4">Get a tailored PDF guide based on your unique relationship dynamics!</p>
              </div>
            </div>
            
            <div className="bg-[#ffedf1] rounded-xl p-6">
              <h3 className="text-2xl font-semibold text-[#f24b7c] mb-6">Featured Articles</h3>
              
              <div className="space-y-4">
                {featuredPosts.length > 0 ? (
                  featuredPosts.map((post) => (
                    <Card key={post.id} className="bg-white overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-[#f24b7c]">{post.title}</CardTitle>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Link href={`/blog/${post.slug}`} className="text-[#f24b7c] font-medium flex items-center hover:underline">
                          Read more
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">Explore our relationship advice blog</p>
                    <Link href="/blog">
                      <Button variant="outline" className="border-[#f24b7c] text-[#f24b7c]">
                        Visit Blog
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/blog" className="text-[#f24b7c] font-medium flex items-center justify-center hover:underline">
                  View all articles
                  <ArrowRight className="ml-1 h-4 w-4" />
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
