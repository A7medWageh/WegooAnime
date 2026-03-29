'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Activity, 
    RefreshCcw, 
    Database, 
    Globe, 
    Server,
    ShieldAlert,
    Wand2,
    Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface ServiceStatus {
    status: 'healthy' | 'unhealthy' | 'unknown';
    error?: string;
}

interface HealthData {
    timestamp: string;
    services: {
        anicli: ServiceStatus;
        jikan: ServiceStatus;
        database: ServiceStatus;
    };
    overall: 'healthy' | 'degraded' | 'unhealthy';
}

export default function HealthPage() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [healing, setHealing] = useState(false);
    const [healResult, setHealResult] = useState<any>(null);
    const [lastHealTime, setLastHealTime] = useState<string>('');

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/health');
            const result = await res.json();
            setData(result);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch health status:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerHeal = async () => {
        if (!adminSecret) {
            alert('أدخل الرمز السري للمسؤول أولاً');
            return;
        }

        setHealing(true);
        setHealResult(null);
        try {
            const res = await fetch('/api/admin/self-heal', {
                headers: { 'Authorization': `Bearer ${adminSecret}` }
            });
            const result = await res.json();
            
            if (result && result.success) {
                setHealResult(result);
                setLastHealTime(new Date().toLocaleTimeString());
                alert(result.message || 'تمت العملية بنجاح');
                fetchHealth();
            } else {
                alert(result?.error || 'فشلت عملية الإصلاح');
            }
        } catch (error) {
            alert('خطأ في الاتصال بالنظام');
        } finally {
            setHealing(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'unhealthy': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'degraded': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <RefreshCcw className="w-5 h-5 text-slate-400 animate-spin" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'unhealthy': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'degraded': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
            <Header />
            
            <div className="pt-24 pb-12 px-6 md:px-12">
                <main className="max-w-6xl mx-auto">
                    <motion.header 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <Activity className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                    مراقب حالة النظام الذكي
                                </h1>
                            </div>
                            <p className="text-slate-400 text-lg">متابعة حالة الخدمات التلقائية وقاعدة البيانات في الوقت الفعلي.</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 text-right">
                            <Badge variant="outline" className={`px-4 py-1.5 text-md font-medium capitalize border-2 transition-all duration-500 ${getStatusColor(data?.overall || 'unknown')}`}>
                                <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${data?.overall === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : (data?.overall === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 animate-pulse')}`} />
                                    حالة النظام: {data?.overall === 'healthy' ? 'ممتازة' : (data?.overall === 'degraded' ? 'ضعيفة' : 'غير معروفة')}
                                </span>
                            </Badge>
                            <span className="text-xs text-slate-500 tabular-nums">
                                آخر تحديث: {mounted && lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
                            </span>
                        </div>
                    </motion.header>

                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Services Grid */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Server className="w-4 h-4 text-slate-400" />
                                            <CardTitle className="text-lg">AniCli API</CardTitle>
                                        </div>
                                    </div>
                                    {getStatusIcon(data?.services.anicli.status || 'unknown')}
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <span className="text-slate-400">الحالة</span>
                                        <span className={data?.services.anicli.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}>
                                            {data?.services.anicli.status === 'healthy' ? 'متصل' : 'فشل الاتصال'}
                                        </span>
                                    </div>
                                    <Progress value={data?.services.anicli.status === 'healthy' ? 100 : 30} className="h-1" />
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-slate-400" />
                                            <CardTitle className="text-lg">Jikan API</CardTitle>
                                        </div>
                                    </div>
                                    {getStatusIcon(data?.services.jikan.status || 'unknown')}
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <span className="text-slate-400">الحالة</span>
                                        <span className={data?.services.jikan.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}>
                                            {data?.services.jikan.status === 'healthy' ? 'متصل' : 'فشل'}
                                        </span>
                                    </div>
                                    <Progress value={data?.services.jikan.status === 'healthy' ? 100 : 0} className="h-1" />
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-4 h-4 text-slate-400" />
                                            <CardTitle className="text-lg">قاعدة البيانات</CardTitle>
                                        </div>
                                    </div>
                                    {getStatusIcon(data?.services.database.status || 'unknown')}
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <span className="text-slate-400">الحالة</span>
                                        <span className={data?.services.database.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}>
                                            {data?.services.database.status === 'healthy' ? 'نشطة' : 'فشل'}
                                        </span>
                                    </div>
                                    <Progress value={data?.services.database.status === 'healthy' ? 100 : 0} className="h-1" />
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Self-Healing Panel */}
                        <motion.div variants={itemVariants} className="md:col-span-3 mt-4">
                            <Card className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border-indigo-500/20 backdrop-blur-xl overflow-hidden relative">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <Wand2 className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-indigo-100">الإصلاح التلقائي المستقل (Self-Healing)</CardTitle>
                                            <CardDescription className="text-slate-400">نظام ذكاء اصطناعي لاستعادة البيانات وحل مشاكل الـ API تلقائياً.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="flex-1 space-y-2 w-full">
                                            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> رمز المسؤول السري
                                            </label>
                                            <Input 
                                                type="password" 
                                                placeholder="أدخل الرمز السري للمسؤول..." 
                                                value={adminSecret}
                                                onChange={(e) => setAdminSecret(e.target.value)}
                                                className="bg-black/40 border-slate-700 focus:border-indigo-500"
                                            />
                                        </div>
                                        <Button 
                                            onClick={triggerHeal}
                                            disabled={healing}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 px-8 min-w-[150px]"
                                        >
                                            {healing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                            تشغيل الإصلاح اليدوي
                                        </Button>
                                    </div>

                                    {healResult && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-black/60 border border-slate-700 rounded-lg p-4 font-mono text-xs overflow-auto max-h-60"
                                        >
                                            <div className="text-emerald-400 mb-2 font-bold flex justify-between">
                                                <span>نتائج العملية الأكيدة:</span>
                                                <span className="text-slate-500">{lastHealTime}</span>
                                            </div>
                                            <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(healResult, null, 2)}</pre>
                                        </motion.div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-white/5 py-3 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span>نظام المراقبة يعمل باستمرار كل 30 دقيقة عبر GitHub Actions.</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    </motion.div>

                    <div className="mt-12 flex justify-center">
                        <Button 
                            variant="ghost" 
                            onClick={fetchHealth} 
                            className="text-slate-500 hover:text-white hover:bg-white/5 gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            تحديث الحالة يدوياً
                        </Button>
                    </div>
                </main>
            </div>
            
            <Footer />
        </div>
    );
}
