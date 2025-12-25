import { NextResponse } from 'next/server';

// Type definitions
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export async function GET() {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;

    // If no API key, return fallback news
    if (!NEWS_API_KEY) {
      return NextResponse.json({
        articles: getFallbackNews(),
        source: 'fallback'
      });
    }

    // Search terms relevant to Bafuputsi Trading's industry
    const searchQuery = 'labour law OR CCMA OR workplace discipline OR employment law OR HR South Africa';

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=publishedAt&pageSize=6&apiKey=${NEWS_API_KEY}`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('News API request failed');
    }

    const data: NewsAPIResponse = await response.json();

    // Filter and map articles
    const articles = data.articles
      .filter((article: NewsArticle) =>
        article.title &&
        article.description &&
        article.urlToImage &&
        !article.title.includes('[Removed]')
      )
      .slice(0, 3)
      .map((article: NewsArticle) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        date: new Date(article.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        source: article.source.name,
        category: categorizeArticle(article.title + ' ' + article.description)
      }));

    // If we got articles, return them, otherwise use fallback
    if (articles.length > 0) {
      return NextResponse.json({
        articles,
        source: 'newsapi'
      });
    }

    return NextResponse.json({
      articles: getFallbackNews(),
      source: 'fallback'
    });

  } catch (error) {
    console.error('News API error:', error);

    // Return fallback news on error
    return NextResponse.json({
      articles: getFallbackNews(),
      source: 'fallback'
    });
  }
}

// Categorize articles based on content
function categorizeArticle(text: string): string[] {
  const categories: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('labour') || lowerText.includes('labor') || lowerText.includes('employment')) {
    categories.push('Labour Law');
  }
  if (lowerText.includes('ccma') || lowerText.includes('dispute')) {
    categories.push('CCMA');
  }
  if (lowerText.includes('hr') || lowerText.includes('human resource')) {
    categories.push('HR');
  }
  if (lowerText.includes('discipline') || lowerText.includes('misconduct')) {
    categories.push('Discipline');
  }
  if (lowerText.includes('training') || lowerText.includes('seta')) {
    categories.push('Training');
  }
  if (categories.length === 0) {
    categories.push('Law');
  }

  return categories.slice(0, 2); // Max 2 categories
}

// Fallback news when API is unavailable
function getFallbackNews() {
  return [
    {
      title: "Labour Law Updates: New Regulations for South African Workplaces",
      description: "Recent changes to South African labour law affect how employers handle discipline, dismissals, and workplace disputes...",
      url: "https://bafuputsitrading.com/blog/",
      image: "https://ext.same-assets.com/950676793/3918153644.webp",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      source: "Bafuputsi Trading",
      category: ["Labour Law", "HR"]
    },
    {
      title: "CCMA Guidelines: Understanding Workplace Discipline Procedures",
      description: "The CCMA provides essential guidance on fair discipline processes, ensuring employers comply with South African labour regulations...",
      url: "https://bafuputsitrading.com/blog/",
      image: "https://ext.same-assets.com/950676793/3147220074.webp",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      source: "Bafuputsi Trading",
      category: ["CCMA", "Discipline"]
    },
    {
      title: "HR Compliance in 2025: What South African Businesses Need to Know",
      description: "Stay compliant with the latest HR regulations, from employment equity to skills development levies and workplace policies...",
      url: "https://bafuputsitrading.com/blog/",
      image: "https://ext.same-assets.com/950676793/2403638506.webp",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      source: "Bafuputsi Trading",
      category: ["HR", "Compliance"]
    }
  ];
}
