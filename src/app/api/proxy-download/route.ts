import { NextRequest } from 'next/server';

/**
 * Premium Internal Download Proxy
 * Bypasses CORS restrictions by streaming content through an Edge Runtime handler.
 * Enables the progress bar to function locally on the site.
 */

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'WegooAnime-Video.mp4';

  console.log('[DownloadProxy] Request received:', { targetUrl: targetUrl?.substring(0, 100) + '...', filename });

  if (!targetUrl) {
    console.error('[DownloadProxy] Missing target URL');
    return new Response('Missing target URL', { status: 400 });
  }

  try {
    // Decode target URL if necessary
    const decodedUrl = decodeURIComponent(targetUrl);
    const parsedUrl = new URL(decodedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();
    const isMediafireDirectFile =
      (hostname.includes('mediafire.com') || hostname.includes('mediafireusercontent.com')) &&
      (hostname.startsWith('download') || pathname.endsWith('.mp4') || pathname.endsWith('.mkv'));

    const resolveContentLength = async (url: string, headers?: HeadersInit): Promise<string | null> => {
      try {
        const headResponse = await fetch(url, {
          method: 'HEAD',
          headers,
          redirect: 'follow'
        });
        const headLength = headResponse.headers.get('Content-Length');
        if (headLength && /^\d+$/.test(headLength)) {
          return headLength;
        }
      } catch {
        // Continue to range-based fallback
      }

      // Some hosts (including MediaFire variants) don't return content length on HEAD.
      // Request a 1-byte range and parse total size from Content-Range: bytes 0-0/123456789
      try {
        const rangeResponse = await fetch(url, {
          method: 'GET',
          headers: {
            ...(headers || {}),
            Range: 'bytes=0-0'
          },
          redirect: 'follow'
        });
        const contentRange = rangeResponse.headers.get('Content-Range');
        const totalFromRange = contentRange?.match(/\/(\d+)$/)?.[1] || null;
        if (totalFromRange && /^\d+$/.test(totalFromRange)) {
          return totalFromRange;
        }
      } catch {
        return null;
      }
      return null;
    };

    console.log('[DownloadProxy] Decoded URL:', decodedUrl.substring(0, 100) + '...');
    
    // For direct video URLs (including direct MediaFire file hosts), stream directly.
    if ((decodedUrl.includes('.mp4') && !decodedUrl.includes('mediafire.com')) || isMediafireDirectFile) {
      console.log('[DownloadProxy] Direct MP4 URL detected, streaming directly...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          ...(req.headers.get('Range') ? { Range: req.headers.get('Range') as string } : {})
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('[DownloadProxy] Direct response status:', response.status);
      
      if (!response.ok) {
        console.error('[DownloadProxy] Direct fetch failed:', response.status);
        return new Response(`Failed to fetch video: ${response.status}`, { status: response.status });
      }
      
      const headers = new Headers();
      const contentType = response.headers.get('Content-Type') || 'video/mp4';
      headers.set('Content-Type', contentType);
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        headers.set('Content-Range', contentRange);
      }
      const acceptRanges = response.headers.get('Accept-Ranges') || 'bytes';
      headers.set('Accept-Ranges', acceptRanges);
      
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
        headers.set('X-File-Size', contentLength);
      }
      
      const safeFilename = filename.replace(/[^a-zA-Z0-9\-_.\u0600-\u06FF]/g, '_');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
      headers.set('Cache-Control', 'no-store, max-age=0');

      return new Response(response.body, {
        status: response.status,
        headers
      });
    }
    
    // For MediaFire page links, extract the actual download URL
    if (decodedUrl.includes('mediafire.com')) {
      console.log('[DownloadProxy] MediaFire URL detected, extracting download link...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('[DownloadProxy] MediaFire page fetch failed:', response.status);
        return new Response('Failed to fetch MediaFire page', { status: response.status });
      }
      
      const html = await response.text();
      console.log('[DownloadProxy] MediaFire HTML length:', html.length);
      
      // Limit the HTML size to prevent memory issues
      const limitedHtml = html.length > 1000000 ? html.substring(0, 1000000) : html;
      
      // Look for the actual download link
      const patterns = [
        /href="([^"]+\.mp4[^"]*)"/i,
        /"([^"]+\.mp4[^"]*)"/i,
        /href="(https:\/\/download[^"]+)"/i,
        /location\.href\s*=\s*["']([^"']+)["']/i,
        /window\.open\(["']([^"']+)["']/i,
        /id="downloadButton"\s+href="([^"]+)"/i
      ];
      
      let downloadUrl: string | null = null;
      for (const pattern of patterns) {
        const match = limitedHtml.match(pattern);
        if (match && match[1]) {
          downloadUrl = match[1] || match[0];
          console.log('[DownloadProxy] Found download link:', downloadUrl.substring(0, 100));
          break;
        }
      }
      
      if (!downloadUrl) {
        console.error('[DownloadProxy] No download link found in MediaFire page');
        return new Response('No download link found', { status: 400 });
      }
      
      // Some extracted links are relative; normalize against original page URL.
      const normalizedDownloadUrl = new URL(downloadUrl, decodedUrl).toString();

      // Fetch the actual video file
      console.log('[DownloadProxy] Fetching actual video file...');
      const videoResponse = await fetch(normalizedDownloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Referer': decodedUrl
        }
      });
      
      if (!videoResponse.ok) {
        console.error('[DownloadProxy] Video fetch failed:', videoResponse.status);
        return new Response('Failed to fetch video file', { status: videoResponse.status });
      }
      
      const headers = new Headers();
      const contentType = videoResponse.headers.get('Content-Type') || 'video/mp4';
      headers.set('Content-Type', contentType);
      const contentRange = videoResponse.headers.get('Content-Range');
      if (contentRange) {
        headers.set('Content-Range', contentRange);
      }
      const acceptRanges = videoResponse.headers.get('Accept-Ranges') || 'bytes';
      headers.set('Accept-Ranges', acceptRanges);
      
      const contentLength = videoResponse.headers.get('Content-Length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
        headers.set('X-File-Size', contentLength);
      }
      
      const safeFilename = filename.replace(/[^a-zA-Z0-9\-_.\u0600-\u06FF]/g, '_');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
      headers.set('Cache-Control', 'no-store, max-age=0');

      return new Response(videoResponse.body, {
        status: videoResponse.status,
        headers
      });
    }
    
    // For other URLs, try to fetch directly
    console.log('[DownloadProxy] Attempting direct fetch...');
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    });
    
    if (!response.ok) {
      console.error('[DownloadProxy] Direct fetch failed:', response.status);
      return new Response('Failed to fetch content', { status: response.status });
    }
    
    const headers = new Headers();
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      headers.set('Content-Range', contentRange);
    }
    const acceptRanges = response.headers.get('Accept-Ranges') || 'bytes';
    headers.set('Accept-Ranges', acceptRanges);
    
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
      headers.set('X-File-Size', contentLength);
    }
    
    const safeFilename = filename.replace(/[^a-zA-Z0-9\-_.\u0600-\u06FF]/g, '_');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    headers.set('Cache-Control', 'no-store, max-age=0');

    return new Response(response.body, {
      status: response.status,
      headers
    });
    
  } catch (err: any) {
    console.error('[DownloadProxy] Critical Error:', err);
    if (err.name === 'AbortError') {
      return new Response('Download timeout - please try again', { status: 408 });
    }
    return new Response(`Download error: ${err.message}`, { status: 500 });
  }
}
