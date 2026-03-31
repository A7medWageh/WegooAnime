import { NextRequest } from 'next/server';

/**
 * Premium Internal Download Proxy
 * Bypasses CORS restrictions by streaming content through an Edge Runtime handler.
 * Enables the progress bar to function locally on the site.
 */

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'WegooAnime-Video.mp4';

  if (!targetUrl) {
    return new Response('Missing target URL', { status: 400 });
  }

  try {
    // Decode target URL if necessary
    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Fetch external content with appropriate headers
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      return new Response(`Failed to fetch from source: ${response.status} ${response.statusText}`, { status: response.status });
    }

    // Build fresh headers for the local client
    const headers = new Headers();
    
    // Core headers for download
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // Set attachment header with safe filename
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    // Allow the local browser to track progress (CORS)
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Cache-Control', 'no-store, max-age=0');

    // Stream the body directly back to the client
    return new Response(response.body, {
      status: 200,
      headers
    });
    
  } catch (err: any) {
    console.error('[DownloadProxy] Critical Error:', err);
    return new Response(`Internal Download Proxy Error: ${err.message}`, { status: 500 });
  }
}
