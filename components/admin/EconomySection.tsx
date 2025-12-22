
import React, { useState, useEffect, useMemo } from 'react';
import { Coins, Banknote, User, TrendingUp, Trophy, ArrowUpRight, ArrowDownLeft, ShoppingBag, Gamepad2, Search, RefreshCw, Calendar, Clock, AlertCircle, Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const EconomySection: React.FC<{ profiles: any[] }> = ({ profiles }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableMissing, setTableMissing] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'EARN' | 'PURCHASE'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setLoading(true);
        setTableMissing(false);
        try {
            const data = await DB.getTransactions();
            // Si data est vide mais que profiles ne l'est pas, ou si l'API a retourné une structure spécifique
            // On peut supposer que la table n'est pas là si la requête a échoué silencieusement (cas du fallback interne)
            if (isSupabaseConfigured && (!data || data.length === 0)) {
                // Double vérification : on tente de voir si le fallback a été utilisé car table absente
                setTableMissing(true);
            }
            setTransactions(data || []);
        } catch (err) {
            console.error("Failed to load transactions", err);
            setTableMissing(true);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const sqlCode = `CREATE TABLE public.transactions (
    id bigint primary key generated always as identity,
    username text not null,
    type text not null,
    amount integer not null,
    description text,
    game_id text,
    timestamp timestamptz default now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.transactions FOR ALL USING (true);`;

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalCoins = profiles.reduce((acc, p) => acc + (p.data?.coins || 0), 0);
    
    const stats = useMemo(() => {
        const earned = transactions.filter(t => t.type === 'EARN').reduce((acc, t) => acc + (t.amount || 0), 0);
        const spent = transactions.filter(t => t.type === 'PURCHASE').reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
        return { earned, spent };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = filter === 'ALL' || t.type === filter;
            const searchLower = searchTerm.toLowerCase();
            const username = (t.username || "").toLowerCase();
            const description = (t.description || "").toLowerCase();
            const matchesSearch = username.includes(searchLower) || description.includes(searchLower);
            return matchesType && matchesSearch;
        });
    }, [transactions, filter, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 shadow-lg group">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">TRÉSORERIE GLOBALE</p>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all">
                            <Coins size={24}/>
                        </div>
                        <span className="text-3xl font-black text-white">{totalCoins.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 shadow-lg group">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">TOTAL INJECTÉ (Gains)</p>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all">
                            <ArrowUpRight size={24}/>
                        </div>
                        <span className="text-3xl font-black text-green-400">+{stats.earned.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 shadow-lg group">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">TOTAL CONSOMMÉ (Shop)</p>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/20 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all">
                            <ArrowDownLeft size={24}/>
                        </div>
                        <span className="text-3xl font-black text-pink-400">-{stats.spent.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Warning Table Missing */}
            {tableMissing && isSupabaseConfigured && (
                <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-2xl p-6 mb-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Terminal size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-black text-white italic mb-1 flex items-center gap-2">
                                <AlertCircle size={18} className="text-blue-400" />
                                CONFIGURATION SQL REQUISE
                            </h4>
                            <p className="text-sm text-blue-100/70 mb-4 leading-relaxed">
                                La table <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-400 font-mono text-xs">transactions</code> n'a pas été détectée dans votre Supabase. 
                                Pour activer l'historique détaillé, copiez ce code dans votre <strong>SQL Editor</strong> :
                            </p>
                            
                            <div className="relative group/code">
                                <pre className="bg-black/60 p-4 rounded-xl text-[10px] font-mono text-blue-300 overflow-x-auto border border-white/10 max-h-40">
                                    {sqlCode}
                                </pre>
                                <button 
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-white hover:text-black rounded-lg transition-all border border-white/10 flex items-center gap-2 text-[10px] font-black"
                                >
                                    {copied ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
                                    {copied ? 'COPIÉ' : 'COPIER'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-gray-900 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par joueur ou action..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none" 
                    />
                </div>
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['ALL', 'EARN', 'PURCHASE'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {f === 'ALL' ? 'TOUT' : f === 'EARN' ? 'GAINS' : 'ACHATS'}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={loadTransactions}
                    disabled={loading}
                    className="p-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Transaction Log Table */}
            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 shadow-2xl">
                <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800/80 text-gray-400 font-black uppercase text-[10px] sticky top-0 z-20 backdrop-blur-md border-b border-white/5">
                            <tr>
                                <th className="p-4">Horodatage</th>
                                <th className="p-4">Joueur</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTransactions.map((t, i) => {
                                const isPositive = (t.amount || 0) > 0;
                                const date = t.timestamp ? new Date(t.timestamp) : new Date();
                                return (
                                    <tr key={t.id || i} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 font-mono text-[11px]">{date.toLocaleDateString()}</span>
                                                <span className="text-gray-500 font-mono text-[10px]">{date.toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">{(t.username || "??").substring(0,2)}</div>
                                                <span className="font-bold text-white">{t.username || "Inconnu"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black border flex items-center gap-1 w-fit ${
                                                t.type === 'EARN' ? 'bg-green-950/40 text-green-400 border-green-500/30' : 
                                                t.type === 'PURCHASE' ? 'bg-pink-950/40 text-pink-400 border-pink-500/30' :
                                                'bg-yellow-950/40 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                                {t.type === 'EARN' ? <Gamepad2 size={10}/> : t.type === 'PURCHASE' ? <ShoppingBag size={10}/> : <RefreshCw size={10}/>}
                                                {t.type || 'ADJUST'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-xs italic max-w-[200px] truncate">{t.description || "Aucune description"}</td>
                                        <td className={`p-4 text-right font-black font-mono text-lg ${isPositive ? 'text-green-400' : 'text-pink-500'}`}>
                                            {isPositive ? '+' : ''}{t.amount || 0}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTransactions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-600 italic">
                                        {tableMissing ? 'Table manquante - Suivez les instructions ci-dessus.' : 'Aucune transaction enregistrée.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
