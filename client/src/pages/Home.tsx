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
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f24b7c] mb-4">
            Obsession Trigger AI
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
          
          <div className="mt-16 max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
            <p className="italic text-gray-600 mb-2 text-lg">
              "This quiz helped me understand what was really going on in my relationship. The insights were spot on!"
            </p>
            <p className="text-[#f24b7c] font-semibold">— Sarah, 32</p>
          </div>
          
          <div className="mt-12 bg-white rounded-xl shadow-md p-6 max-w-xl w-full">
            <h3 className="flex items-center text-xl font-semibold text-[#f24b7c] mb-4">
              <Heart className="h-5 w-5 mr-2 inline" fill="#fbb5c8" /> Why Take This Quiz?
            </h3>
            <ul className="space-y-4 text-left">
              <li className="flex items-start">
                <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                <span>Gain clarity on your relationship dynamics</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-[#f24b7c] mr-3 mt-0.5">✓</div>
                <span>Discover psychological insights about his behavior</span>
              </li>
            </ul>
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
