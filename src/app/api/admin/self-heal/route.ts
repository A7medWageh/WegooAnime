import { NextRequest, NextResponse } from 'next/server';
import { selfHealing } from '@/lib/selfHeal';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.SELF_HEAL_SECRET || 'fallback_secret_change_me';
    
    // Simple secret check for external automation (GitHub Actions)
    if (authHeader !== `Bearer ${secret}`) {
        if (secret === 'fallback_secret_change_me') {
            console.warn('⚠️ [API/SelfHeal] Warning: System is using a fallback secret. Please set SELF_HEAL_SECRET in Vercel.');
        }
        return NextResponse.json({ 
            success: false, 
            error: 'Unauthorized. Please check your admin secret or set SELF_HEAL_SECRET in Vercel.' 
        }, { status: 401 });
    }

    try {
        logger.info('API/SelfHeal', 'Manual self-heal trigger received.');

        // 1. Perform Check
        const report = await selfHealing.performCheck();
        
        if (report.status !== 'healthy') {
            // 2. Trigger Healing
            const recoveryResult = await selfHealing.heal(report);
            
            // 3. Verify Fix
            const finalReport = await selfHealing.performCheck();
            
            return NextResponse.json({
                success: true,
                message: recoveryResult.success ? 'System fixed successfully' : 'Healing attempted but system remains unhealthy',
                initial_status: report.status,
                final_status: finalReport.status,
                actions: recoveryResult.actions,
                issues_detected: report.issues
            });
        }

        return NextResponse.json({
            success: true,
            message: 'System is already healthy',
            status: report.status,
            timestamp: report.timestamp
        });

    } catch (err: any) {
        logger.error('API/SelfHeal', 'Self-heal route failed', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
