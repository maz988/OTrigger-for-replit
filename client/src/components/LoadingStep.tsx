import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

const LoadingStep: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Analyzing your responses...');

  useEffect(() => {
    const loadingTexts = [
      'Analyzing your responses...',
      'Identifying relationship patterns...',
      'Determining emotional triggers...',
      'Crafting personalized advice...',
      'Finalizing your custom plan...'
    ];

    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const startProgress = () => {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          
          // Change the loading text at specific progress points
          if (newProgress === 20) setLoadingText(loadingTexts[1]);
          if (newProgress === 40) setLoadingText(loadingTexts[2]);
          if (newProgress === 60) setLoadingText(loadingTexts[3]);
          if (newProgress === 80) setLoadingText(loadingTexts[4]);
          
          return newProgress;
        });
      }, 100);
    };

    timeout = setTimeout(startProgress, 500);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-pink-100">
      <CardContent className="p-8 md:p-10">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-28 h-28 bg-gradient-to-r from-pink-100 to-blue-100 rounded-full flex items-center justify-center mb-6 pulse-animate shadow-md">
            <Heart className="text-pink-500 h-12 w-12 fill-pink-200" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-3 text-center bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Creating Your Personalized Plan
          </h2>
          
          <p className="text-neutral-600 text-center max-w-md mb-8">
            {loadingText}
          </p>
          
          <div className="w-full max-w-sm">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-blue-500 font-medium">Processing</span>
              <span className="text-xs text-pink-500 font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-3 p-0.5">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 transition-all duration-200" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-10 text-neutral-600 italic text-sm text-center px-6 py-4 bg-pink-50 rounded-lg border border-pink-100">
            "Understanding his emotional triggers is the key to creating a deeper connection..."
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingStep;
