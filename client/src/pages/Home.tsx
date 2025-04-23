import React, { useState } from 'react';
import QuizContainer from '@/components/QuizContainer';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const Home: React.FC = () => {
  const [showQuiz, setShowQuiz] = useState(false);

  const startQuiz = () => {
    setShowQuiz(true);
  };

  return (
    <div className="py-4 min-h-screen bg-white">
      {!showQuiz ? (
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-16 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover How to Trigger His <span className="text-[#f24b7c]">Obsession</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            Take our 5-question quiz and get personalized advice on how to activate his Hero Instinct
            and transform your relationship.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto mb-12">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-xl font-semibold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Quiz</h3>
              <p className="text-gray-600 text-center">
                Answer 5 simple questions about your relationship situation
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-center">
                Our AI analyzes your answers using relationship psychology principles
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-xl font-semibold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Plan</h3>
              <p className="text-gray-600 text-center">
                Get your personalized advice plan with actionable relationship tips
              </p>
            </div>
          </div>
          
          <Button 
            onClick={startQuiz}
            className="bg-[#f24b7c] hover:bg-[#d22e5d] text-white font-semibold text-lg px-10 py-6 rounded-full transition-colors"
          >
            Start Free Quiz
          </Button>
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
