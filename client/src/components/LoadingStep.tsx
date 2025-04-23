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
    <Card className="bg-white rounded-xl shadow-md">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-20 h-20 bg-[#fde8ef] rounded-full flex items-center justify-center mb-6 pulse-animate">
            <Heart className="text-[#f24b7c] h-10 w-10" fill="#fbb5c8" />
          </div>
          
          <h2 className="text-xl font-medium mb-2 text-center text-[#f24b7c]">
            Creating Your Personalized Plan
          </h2>
          
          <p className="text-gray-600 text-center text-sm max-w-md mb-6">
            {loadingText}
          </p>
          
          <div className="w-full max-w-sm">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">Processing</span>
              <span className="text-xs text-[#f24b7c] font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-[#f24b7c] transition-all duration-200" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-8 text-gray-600 italic text-sm text-center px-5 py-3 bg-[#fde8ef] rounded-md">
            "Understanding his emotional triggers is the key to creating a deeper connection..."
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingStep;
