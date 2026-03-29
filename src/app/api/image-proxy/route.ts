import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        
        // Comprehensive spoofing headers
        const getHeaders = (targetUrl: string) => {
            let referer = 'https://witanime.life/';
            try {
                const urlObj = new URL(targetUrl);
                referer = `${urlObj.protocol}//${urlObj.hostname}/`;
            } catch { }
            
            return {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': referer,
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
            };
        };

        const response = await fetch(decodedUrl, { headers: getHeaders(decodedUrl) });

        if (!response.ok) {
            // Secondary attempt with minimal headers
            const retry = await fetch(decodedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'image/*,*/*',
                },
            });

            if (!retry.ok) {
                return new NextResponse(null, { status: 404 });
            }

            const buffer = await retry.arrayBuffer();
            const contentType = retry.headers.get('content-type') || 'image/jpeg';
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new NextResponse(null, { status: 500 });
    }
}
