import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export interface SystemSettings {
  pdfGuideImageUrl: string;
  // Add other settings as needed
}

const defaultSettings: SystemSettings = {
  pdfGuideImageUrl: '/images/pdf-guide-icon.svg'
};

export function useSettings() {
  const { data: settingsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: getQueryFn(),
    // Refresh settings more frequently to ensure UI is updated
    staleTime: 10 * 1000, // 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const settings = settingsResponse?.data || [];
  let parsedSettings = { ...defaultSettings };

  // Parse settings from response
  if (settings.length > 0) {
    const pdfGuideImage = settings.find(s => 
      s.name === 'pdfGuideImageUrl' || 
      s.name === 'PDF_GUIDE_IMAGE_URL'
    );

    if (pdfGuideImage && pdfGuideImage.value) {
      parsedSettings.pdfGuideImageUrl = pdfGuideImage.value;
    }
  }

  return {
    settings: parsedSettings,
    isLoading,
    refetch
  };
}