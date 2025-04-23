import React from 'react';
import QuizContainer from '@/components/QuizContainer';

const Home: React.FC = () => {
  return (
    <div className="py-4 min-h-screen bg-gradient-to-b from-white via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-32 w-96 h-96 bg-pink-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <QuizContainer />
        </div>
      </div>
    </div>
  );
};

export default Home;
