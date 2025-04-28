import fs from 'fs';
import path from 'path';
import { BlogPost, InsertBlogPost } from '@shared/schema';

const BLOG_POSTS_FILE = path.join(process.cwd(), 'data', 'blog_posts.json');

interface PersistedBlogPosts {
  blogPosts: Record<number, BlogPost>;
  lastUpdated: string;
  currentId: number;
}

/**
 * Ensure the data directory exists
 */
function ensureDataDirectoryExists() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load blog posts from the persistence file
 * If file doesn't exist, returns an empty object and currentId = 1
 */
export function loadBlogPosts(): { blogPosts: Map<number, BlogPost>, currentId: number } {
  ensureDataDirectoryExists();
  
  const blogPostsMap = new Map<number, BlogPost>();
  let currentId = 1;

  try {
    if (fs.existsSync(BLOG_POSTS_FILE)) {
      const data = fs.readFileSync(BLOG_POSTS_FILE, 'utf8');
      const persistedData: PersistedBlogPosts = JSON.parse(data);
      
      // Convert Record to Map
      for (const [id, post] of Object.entries(persistedData.blogPosts)) {
        // Convert string dates back to Date objects
        const fixedPost = {
          ...post,
          publishedAt: new Date(post.publishedAt),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : null
        };
        blogPostsMap.set(Number(id), fixedPost);
      }
      
      currentId = persistedData.currentId;
      console.log(`Loaded ${blogPostsMap.size} blog posts from persistence file`);
    } else {
      console.log('No blog posts persistence file found, starting with empty collection');
    }
  } catch (error) {
    console.error('Error loading blog posts from persistence file:', error);
  }

  return { blogPostsMap, currentId };
}

/**
 * Save blog posts to the persistence file
 */
export function saveBlogPosts(blogPosts: Map<number, BlogPost>, currentId: number): void {
  ensureDataDirectoryExists();
  
  try {
    // Convert Map to Record for JSON serialization
    const blogPostsRecord: Record<number, BlogPost> = {};
    for (const [id, post] of blogPosts.entries()) {
      blogPostsRecord[id] = post;
    }
    
    const persistedData: PersistedBlogPosts = {
      blogPosts: blogPostsRecord,
      lastUpdated: new Date().toISOString(),
      currentId
    };
    
    fs.writeFileSync(BLOG_POSTS_FILE, JSON.stringify(persistedData, null, 2));
    console.log(`Saved ${blogPosts.size} blog posts to persistence file`);
  } catch (error) {
    console.error('Error saving blog posts to persistence file:', error);
  }
}