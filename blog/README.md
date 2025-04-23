# Obsession Trigger Blog - Automated Content Generation System

An automated blog system that generates and publishes relationship advice articles using AI. The system automatically creates SEO-optimized blog posts with images, internal links, and proper formatting.

## Features

- **Automated Content Generation**: Generates a new blog post every day using AI
- **SEO Optimization**: Creates SEO-friendly titles, descriptions, and content
- **Image Integration**: Automatically fetches relevant images from Pexels
- **Responsive Design**: Mobile-friendly blog layout 
- **Internal Linking**: Links to the Obsession Trigger quiz in every post
- **Content Scheduling**: Uses cron jobs to publish on a set schedule

## Tech Stack

- **Backend**: Node.js + Express
- **Content Generation**: OpenAI API
- **Image Source**: Pexels API
- **Markdown Processing**: Showdown + Markdown-it
- **Scheduling**: Node-cron
- **Logging**: Winston

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd blog
   npm install
   ```
3. Create a `.env` file with the required API keys (see `.env.example`)
4. Start the server:
   ```
   npm start
   ```

## Environment Variables

Create a `.env` file in the blog directory with the following variables:

```
# API Keys
OPENAI_API_KEY=your_openai_api_key
PEXELS_API_KEY=your_pexels_api_key

# Blog Configuration
BLOG_TITLE=Obsession Trigger Blog
BLOG_DESCRIPTION=Insights and advice on love, attraction, and relationships
BLOG_AUTHOR=Relationship Expert
BLOG_URL=https://your-blog-url.com
QUIZ_URL=https://your-quiz-url.com

# Publishing Schedule (cron format)
PUBLISH_SCHEDULE="0 8 * * *"  # Every day at 8 AM
```

## Usage

### Starting the Blog Server

```
npm start
```

This will start the Express server and initialize the blog post scheduler.

### Manually Generating Posts

```
npm run generate
```

You can also specify a keyword:

```
npm run generate "how to make him miss you"
```

## Directory Structure

- **/content**: JSON files of generated blog posts
- **/public**: Static files for the blog (HTML, CSS, JS)
- **/utils**: Utility functions for OpenAI, image fetching, etc.
- **/scripts**: Helper scripts for manual operations
- **/logs**: Application logs

## Deployment

This system is designed to be deployed to various hosting platforms:

- **Firebase Hosting**
- **Netlify**
- **Vercel**
- **Any Node.js hosting environment**

## Internal Linking

Each generated blog post automatically includes internal links to the Obsession Trigger quiz application, helping drive traffic to the main product.

## License

MIT