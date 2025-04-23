import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

const LoadingStep: React.FC = () => {
  return (
    <Card className="bg-white rounded-xl shadow-card">
      <CardContent className="p-8 md:p-10">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6 pulse-animate">
            <Heart className="text-primary-500 text-3xl fill-current" />
          </div>
          <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-3 text-center">Creating Your Personalized Plan</h2>
          <p className="text-neutral-600 text-center max-w-md mb-6">
            Our AI is analyzing your answers and crafting personalized relationship advice just for you...
          </p>
          
          <div className="w-full max-w-sm">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-neutral-500">Analyzing responses</span>
              <span className="text-xs text-primary-500">45%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div className="bg-primary-400 h-2 rounded-full animate-pulse-slow" style={{ width: '45%' }}></div>
            </div>
          </div>
          
          <div className="mt-8 text-neutral-500 italic text-sm text-center">
            "Understanding his emotional triggers is the key to creating a deeper connection..."
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingStep;
