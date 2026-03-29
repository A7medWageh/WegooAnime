import { animeService } from './UnifiedAnimeService';
import prisma from './prisma';
import { logger } from './logger';

export interface HealthReport {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    timestamp: string;
}

export class SelfHealingService {
    private static instance: SelfHealingService;

    private constructor() {}

    public static getInstance(): SelfHealingService {
        if (!SelfHealingService.instance) {
            SelfHealingService.instance = new SelfHealingService();
        }
        return SelfHealingService.instance;
    }

    /**
     * Perform a deep health check of the system
     */
    public async performCheck(): Promise<HealthReport> {
        const issues: string[] = [];
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        try {
            // 1. Check Database
            const animeCount = await prisma.anime.count();
            if (animeCount === 0) {
                issues.push('Database is empty (0 anime records)');
                status = 'unhealthy';
            }
        } catch (err: any) {
            issues.push(`Database connection failed: ${err.message}`);
            status = 'unhealthy';
        }

        try {
            // 2. Check AniCli Connectivity
            const latest = await animeService.getLatest(1);
            if (latest.length === 0) {
                issues.push('AniCli returned 0 results for latest anime');
                if (status === 'healthy') status = 'degraded';
            }
        } catch (err: any) {
            issues.push(`External API (AniCli) failed: ${err.message}`);
            if (status === 'healthy') status = 'degraded';
        }

        return {
            status,
            issues,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Attempt to heal the system based on detected issues
     */
    public async heal(report: HealthReport): Promise<{ success: boolean; actions: string[] }> {
        const actions: string[] = [];
        let overallSuccess = true;

        if (report.status === 'healthy') {
            return { success: true, actions: ['System already healthy'] };
        }

        logger.info('SelfHealing', `Starting recovery for issues: ${report.issues.join(', ')}`);

        // Action 1: Re-populate Database if empty
        if (report.issues.some(i => i.includes('Database is empty'))) {
            try {
                actions.push('Triggering data re-sync (getLatest)...');
                const recovered = await animeService.getLatest(40);
                if (recovered.length > 0) {
                    actions.push(`Successfully recovered ${recovered.length} anime records.`);
                } else {
                    throw new Error('No data returned during recovery');
                }
            } catch (err: any) {
                actions.push(`Data recovery failed: ${err.message}`);
                overallSuccess = false;
            }
        }

        // Action 2: Deep Cache Warmup
        if (report.status === 'degraded') {
            try {
                actions.push('Warming up top-rated and airing cache...');
                await Promise.all([
                    animeService.getTopRated(20),
                    animeService.getAiring(15)
                ]);
                actions.push('Cache warmup completed.');
            } catch (err: any) {
                actions.push(`Cache warmup failed: ${err.message}`);
                // Not critical enough to fail overall success if at least latest works
            }
        }

        // Action 3: AI Analysis (Placeholder)
        const aiDecision = await this.analyzeWithAI(report);
        if (aiDecision) {
            actions.push(`AI Recommendation: ${aiDecision}`);
            // In a real scenario, we could execute AI-suggested scripts here
        }

        // Action 4: Reporting to GitHub
        if (!overallSuccess || report.status === 'unhealthy') {
            await this.reportToGitHub(report, { success: overallSuccess, actions });
        }

        // Log the recovery attempt
        await prisma.log.create({
            data: {
                level: overallSuccess ? 'INFO' : 'ERROR',
                service: 'SelfHealing',
                message: `Recovery Attempt: ${overallSuccess ? 'SUCCESS' : 'FAILURE'}. Actions: ${actions.join(' | ')}`,
                timestamp: new Date()
            }
        });

        return { success: overallSuccess, actions };
    }

    /**
     * Report critical issues to GitHub
     */
    private async reportToGitHub(report: HealthReport, recoveryResult: { success: boolean, actions: string[] }): Promise<void> {
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPOSITORY; // Format: owner/repo

        if (!token || !repo) {
            logger.warn('SelfHealing', 'GitHub reporting skipped: GITHUB_TOKEN or GITHUB_REPOSITORY not set.');
            return;
        }

        try {
            const title = `[Self-Heal] ${report.status.toUpperCase()}: ${report.issues[0] || 'Unknown issue'}`;
            const body = `
### ⚠️ System Health Report
- **Status**: ${report.status}
- **Timestamp**: ${report.timestamp}
- **Issues Detected**:
${report.issues.map(i => `  - ${i}`).join('\n')}

### 🛠️ Recovery Attempt
- **Success**: ${recoveryResult.success}
- **Actions Taken**:
${recoveryResult.actions.map(a => `  - ${a}`).join('\n')}

### 📄 Recent Logs
${await this.getRecentLogs()}

---
_Auto-generated by Autonomous Self-Healing System_
            `;

            const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, body, labels: ['bug', 'automated-report'] })
            });

            if (res.ok) {
                logger.info('SelfHealing', 'Created GitHub Issue for critical health state.');
            } else {
                const errData = await res.json();
                logger.error('SelfHealing', 'Failed to create GitHub Issue', errData);
            }
        } catch (err) {
            logger.error('SelfHealing', 'Error reporting to GitHub', err);
        }
    }

    /**
     * AI Decision Layer
     */
    private async analyzeWithAI(report: HealthReport): Promise<string | null> {
        const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) return "AI Layer skipped (No API Key)";

        try {
            // Simplified AI prompt - in production this would be a real call
            const prompt = `System Health Report: ${JSON.stringify(report)}. 
            Recent Logs: ${await this.getRecentLogs()}. 
            Decide the best course of action. Return a JSON-like string with "action" and "reason".`;
            
            // For now, returning a simulated decision
            return "AI Analysis suggests refreshing external source credentials if failures persist.";
        } catch (err) {
            return null;
        }
    }

    private async getRecentLogs(): Promise<string> {
        try {
            const logs = await prisma.log.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' }
            });
            return logs.map(l => `[${l.level}] ${l.message}`).join('; ');
        } catch {
            return "Could not fetch logs";
        }
    }
}

export const selfHealing = SelfHealingService.getInstance();
