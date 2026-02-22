import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, DollarSign, TrendingUp, History, AlertTriangle, ArrowUpRight, ArrowDownLeft, FileText, Download, Upload, Swords, Home, BookOpen, BarChart2, Menu, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Wallet() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('All');
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [overviewRes, transactionsRes] = await Promise.all([
                api.get('/wallet/overview'),
                api.get('/wallet/transactions?limit=20')
            ]);
            
            if (overviewRes.data && overviewRes.data.success) {
                setWalletData(overviewRes.data.data);
            }
            
            if (transactionsRes.data && transactionsRes.data.success) {
                setTransactions(transactionsRes.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch wallet data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleDeposit = async () => {
        const amount = prompt("Enter deposit amount ($):", "10");
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        try {
            const res = await api.post('/wallet/deposit', {
                amount: parseFloat(amount),
                currency: 'USD'
            });
            if (res.data.success) {
                alert(`Successfully deposited $${amount}`);
                refreshData();
            }
        } catch (error) {
            console.error("Deposit failed:", error);
            alert("Deposit failed. Please try again.");
        }
    };

    const handleWithdraw = async () => {
        if (!isVerified) {
            alert("Please verify your account to enable withdrawals.");
            return;
        }

        const amount = prompt("Enter withdrawal amount ($):", "10");
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        if (parseFloat(amount) > balance) {
            alert("Insufficient balance.");
            return;
        }

        try {
            const res = await api.post('/wallet/withdraw', {
                amount: parseFloat(amount),
                currency: 'USD'
            });
            if (res.data.success) {
                alert(`Withdrawal request for $${amount} submitted!`);
                refreshData();
            }
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert(error.response?.data?.message || "Withdrawal failed. Please try again.");
        }
    };

    const isVerified = user?.is_verified || user?.isVerified || false; // Check both naming conventions
    const balance = Number(walletData?.balance || 0);
    const totalDeposits = Number(walletData?.totalEarnings || walletData?.total_deposits || 0);
    const totalWithdrawals = Number(walletData?.totalSpent || walletData?.total_withdrawals || 0);
    const pvpWinnings = Number(walletData?.netProfit || walletData?.pvp_winnings || 0);

    const filteredTransactions = transactions.filter(tx => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Deposits') return tx.reason === 'deposit';
        if (activeTab === 'Withdrawals') return tx.reason === 'withdrawal';
        if (activeTab === 'PvP') return tx.reason === 'match_fee' || tx.reason === 'match_win' || tx.reason === 'tournament_win';
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-gray-50/50 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
             {/* Header */}
             <div className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-gray-100">
                <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-[#6C5DD3] rounded-lg flex items-center justify-center">
                        <Swords className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <h1 className="text-sm font-bold text-gray-900">SkillArena</h1>
                        <p className="text-[10px] text-gray-500">Learn. Compete. Win.</p>
                     </div>
                     <div className="ml-auto flex gap-2">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search" className="pl-10 pr-4 py-1.5 bg-gray-50 rounded-full text-xs font-medium w-32 focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]" />
                        </div>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                        </button>
                     </div>
                </div>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">Wallet</h2>
                        <p className="text-xs text-gray-500">Manage your funds and view transaction history</p>
                    </div>
                </div>

                {/* Balance Card - Dark Blue */}
                <div className="bg-[#1C2331] rounded-[24px] p-6 text-white shadow-xl shadow-gray-200/50 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">Available Balance</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {isVerified ? 'Verified' : 'Unverified'}
                        </span>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-4xl font-bold mb-1">${typeof balance === 'number' ? balance.toFixed(2) : balance}</h2>
                        <div className="flex items-center gap-2 text-xs font-medium text-green-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>Total earned: ${pvpWinnings.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleDeposit}
                            className="py-3 px-4 bg-[#D1FADF] hover:bg-[#A6F4C5] active:bg-[#D1FADF]/80 transition-colors rounded-xl text-[#039855] text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                        >
                            <ArrowDownLeft className="w-4 h-4" /> Deposit
                        </button>
                        <button 
                            onClick={handleWithdraw}
                            className={`py-3 px-4 transition-colors rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${
                                isVerified ? 'bg-white hover:bg-gray-50 text-gray-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <ArrowUpRight className={`w-4 h-4 ${isVerified ? 'text-red-500' : 'text-gray-400'}`} /> Withdraw
                        </button>
                    </div>

                    {!isVerified && (
                         <div className="mt-4 text-center">
                             <span className="text-[10px] text-yellow-500/80 font-medium">Complete verification to enable withdrawals</span>
                         </div>
                    )}
                </div>

                {/* Verification Warning */}
                {!isVerified && (
                    <div className="bg-[#FFFAEB] border border-[#FEF3F2] rounded-[24px] p-4 flex gap-3 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-[#B54708] shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-[#B54708] mb-1">Account not verified. <span className="font-normal text-[#B54708]/80">Complete verification to enable withdrawals and access higher stake limits.</span></h4>
                            <button className="text-[10px] font-bold text-[#B54708] hover:underline flex items-center gap-1 mt-1">
                                Verify Now <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#FFD700] rounded-[20px] p-4 border border-yellow-400/20 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                         <div className="relative z-10">
                            <p className="text-[10px] font-medium text-yellow-900/80 mb-1">Total Deposits</p>
                            <p className="text-lg font-bold text-white">${totalDeposits.toFixed(2)}</p>
                         </div>
                         <ArrowDownLeft className="absolute bottom-2 right-2 w-8 h-8 text-yellow-900/10 rotate-12" />
                    </div>
                    <div className="bg-[#FF6B6B] rounded-[20px] p-4 border border-red-400/20 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                         <div className="relative z-10">
                            <p className="text-[10px] font-medium text-white/90 mb-1">Total Withdrawals</p>
                            <p className="text-lg font-bold text-white">${totalWithdrawals.toFixed(2)}</p>
                         </div>
                         <ArrowUpRight className="absolute bottom-2 right-2 w-8 h-8 text-white/20 rotate-12" />
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                         <div className="relative z-10">
                            <p className="text-[10px] font-medium text-gray-500 mb-1">PvP Winnings</p>
                            <p className="text-lg font-bold text-[#039855]">${pvpWinnings.toFixed(2)}</p>
                         </div>
                         <Trophy className="absolute bottom-2 right-2 w-8 h-8 text-green-500/10 rotate-12" />
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm min-h-[300px] flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-sm">Transaction History</h3>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            <Download className="w-3 h-3" /> Export
                        </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="p-4 pb-0">
                        <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
                            {['All', 'Deposits', 'Withdrawals', 'PvP'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                        activeTab === tab 
                                        ? 'bg-[#6C5DD3] text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
                        {loading ? (
                             <div className="py-8 text-gray-400 text-xs">Loading...</div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="py-8">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-3">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <p className="text-xs font-medium text-gray-400">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-3">
                                {filteredTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                tx.transaction_type === 'credit' ? 'bg-green-100 text-green-600' :
                                                tx.reason === 'withdrawal' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {tx.reason === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> :
                                                 tx.reason === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> :
                                                 <Swords className="w-5 h-5" />}
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-xs text-gray-900 capitalize">{(tx.reason || tx.transaction_type || 'Transaction').replace('_', ' ')}</h4>
                                                <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${
                                            tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {tx.transaction_type === 'credit' ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
                <NavItem icon={Home} label="Home" path="/dashboard" />
                <NavItem icon={BookOpen} label="Learn" path="/dashboard/learn" />
                <NavItem icon={Swords} label="Arena" path="/dashboard/arena" />
                <NavItem icon={BarChart2} label="Leaderboard" path="/dashboard/leaderboard" />
                <NavItem icon={Menu} label="More" path="/dashboard/more" active />
            </div>
        </div>
    );
}

// Icon for Trophy helper
function Trophy(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}

function NavItem({ icon: Icon, label, path, active }) {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${active ? 'text-[#6C5DD3]' : 'text-gray-400'}`}>
            <Icon className="w-6 h-6" strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}
