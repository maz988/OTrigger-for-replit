/**
 * Integration utilities for connecting the blog system with the quiz application
 */

import { z } from 'zod';

// Referral source tracking schema
export const referralSourceSchema = z.object({
  source: z.string(),
  campaign: z.string().optional(),
  content: z.string().optional(),
  keyword: z.string().optional(),
  blogPost: z.string().optional(),
});

export type ReferralSource = z.infer<typeof referralSourceSchema>;

// Function to generate tracking query parameters for blog-to-quiz links
export function generateBlogTrackingParams(blogData: {
  title: string;
  keyword: string;
  slug: string;
}): string {
  const params = new URLSearchParams();
  params.set('utm_source', 'blog');
  params.set('utm_medium', 'content');
  params.set('utm_campaign', 'relationship_advice');
  params.set('utm_content', blogData.slug);
  params.set('utm_term', blogData.keyword);
  
  return params.toString();
}

// Function to generate a fully qualified blog-to-quiz URL
export function getBlogToQuizUrl(
  quizBaseUrl: string = 'https://obsession-trigger.com/quiz',
  blogData?: {
    title: string;
    keyword: string;
    slug: string;
  }
): string {
  if (!blogData) {
    return quizBaseUrl;
  }
  
  const trackingParams = generateBlogTrackingParams(blogData);
  return `${quizBaseUrl}?${trackingParams}`;
}

// Function to parse incoming tracking params
export function parseTrackingParams(url: string): ReferralSource | null {
  try {
    const parsedUrl = new URL(url);
    const source = parsedUrl.searchParams.get('utm_source') || '';
    const campaign = parsedUrl.searchParams.get('utm_campaign') || undefined;
    const content = parsedUrl.searchParams.get('utm_content') || undefined;
    const keyword = parsedUrl.searchParams.get('utm_term') || undefined;
    
    const referral: ReferralSource = { source };
    
    if (campaign) referral.campaign = campaign;
    if (content) referral.content = content;
    if (keyword) referral.keyword = keyword;
    if (content && source === 'blog') referral.blogPost = content;
    
    return referralSourceSchema.parse(referral);
  } catch (error) {
    return null;
  }
}