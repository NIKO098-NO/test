import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Shield, 
  User, 
  CreditCard, 
  LayoutDashboard, 
  ArrowRightLeft, 
  ShoppingBag, 
  History, 
  Settings, 
  Lock, 
  Unlock, 
  PlusCircle, 
  MinusCircle, 
  Search, 
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Receipt,
  TrendingUp,
  Landmark,
  Bell,
  Wallet,
  Clock,
  Sparkles,
  UserPlus,
  FileText,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Trophy,
  Zap,
  Target,
  X,
  Maximize
} from 'lucide-react';

// --- Deployment Config for Render.com ---
// Note: When running on Render, the 'apiKey' is typically handled via Environment Variables.
const apiKey = ""; 
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'atlanta-peoples-bank-v2';

const STATUS = {
  ACTIVE: 'Active',
  PENDING_SIGNATURE: 'Pending Terms',
  TEMP_BLACKLISTED: 'Temp-Blacklisted',
  PERM_BLACKLISTED: 'Perm-Blacklisted'
};

const STORE_ITEMS = [
  { id: 'item1', name: 'VIP Status', price: 1500, description: 'Gold border around your profile.', icon: <Trophy className="text-yellow-400" /> },
  { id: 'item2', name: 'Priority Support', price: 500, description: 'Skip the line for clerk support.', icon: <Zap className="text-blue-400" /> },
  { id: 'item3', name: 'Private Banker', price: 2500, description: 'Unlock the high-yield vault.', icon: <Briefcase className="text-purple-400" /> },
  { id: 'item4', name: 'Digital Yacht', price: 50000, description: 'The ultimate status symbol.', icon: <Target className="text-rose-400" /> },
];

// --- Audio Utility ---
function pcmToWav(pcmData, sampleRate) {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 32 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  for (let i = 0; i < pcmData.length; i++) view.setInt16(44 + i * 2, pcmData[i], true);
  return new Blob([buffer], { type: 'audio/wav' });
}

export default function App() {
  // --- State ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [notification, setNotification] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Simulated DB
  const [users, setUsers] = useState([
    {
      id: 'admin1',
      username: 'clerk_admin',
      password: 'admin',
      role: 'admin',
      staffRole: 'Head Clerk',
      name: 'Alpha One',
      accountNumber: 'ADMIN-001',
      balance: 9999999,
      savingsBalance: 0,
      status: STATUS.ACTIVE,
      inventory: [],
      loan: 0
    },
    {
      id: 'u1',
      username: 'user1',
      password: 'password',
      role: 'user',
      staffRole: 'N/A',
      name: 'John Doe',
      accountNumber: '1234567890',
      balance: 1250,
      savingsBalance: 500,
      status: STATUS.ACTIVE,
      card: { number: '4242 8812 9901 2341', cvv: '123', expiry: '12/29' },
      inventory: [],
      loan: 0
    }
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, type: 'Deposit', amount: 1250, sender: 'System', receiver: 'John Doe', timestamp: new Date().toLocaleString() }
  ]);

  // --- Fullscreen Toggle Logic ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        showNotification(`Error entering fullscreen: ${err.message}`, "error");
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // --- TTS Feature ---
  const speak = async (text) => {
    if (!apiKey) return; // Prevent calls if no key is set
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
          }
        })
      });
      const data = await response.json();
      const audioBase64 = data.candidates[0].content.parts[0].inlineData.data;
      const sampleRate = parseInt(data.candidates[0].content.parts[0].inlineData.mimeType.split('rate=')[1]);
      const binaryString = atob(audioBase64);
      const pcmData = new Int16Array(binaryString.length / 2);
      for (let i = 0; i < pcmData.length; i++) {
        pcmData[i] = (binaryString.charCodeAt(i * 2 + 1) << 8) | binaryString.charCodeAt(i * 2);
      }
      const wavBlob = pcmToWav(pcmData, sampleRate);
      const audio = new Audio(URL.createObjectURL(wavBlob));
      audio.play();
    } catch (e) {
      console.error("TTS failed", e);
    }
  };

  // --- Handlers ---
  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const u = users.find(x => x.username === e.target.username.value && x.password === e.target.password.value);
    if(u) { 
      setUser(u); 
      setView(u.role === 'admin' ? 'admin' : 'dashboard');
      speak(`Authorized. Welcome, ${u.name}.`);
    } else {
      showNotification("Invalid credentials", "error");
    }
  };

  const logTransaction = (type, amount, sender, receiver, note = '') => {
    const newTx = {
      id: Date.now(),
      type,
      amount,
      sender,
      receiver,
      timestamp: new Date().toLocaleString(),
      note
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleBuyItem = (item) => {
    if (user.balance < item.price) return showNotification("Insufficient liquidity.", "error");
    
    setUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        return { ...u, balance: u.balance - item.price, inventory: [...(u.inventory || []), item.name] };
      }
      return u;
    }));
    
    setUser(prev => ({ 
      ...prev, 
      balance: prev.balance - item.price, 
      inventory: [...(prev.inventory || []), item.name] 
    }));

    logTransaction('Market Purchase', item.price, user.name, 'APB Store', `Item: ${item.name}`);
    showNotification(`Purchased ${item.name}!`, "success");
    speak(`Purchase confirmed.`);
  };

  const handleLoanRequest = (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    if (amount > 5000) return showNotification("Max loan limit is $5,000", "error");
    
    setUsers(prev => prev.map(u => {
      if (u.id === user.id) return { ...u, balance: u.balance + amount, loan: (u.loan || 0) + amount };
      return u;
    }));
    setUser(prev => ({ ...prev, balance: prev.balance + amount, loan: (prev.loan || 0) + amount }));
    logTransaction('Loan Credit', amount, 'APB System', user.name);
    showNotification(`Loan of $${amount} approved.`, "success");
    e.target.reset();
  };

  const handleRepayLoan = () => {
    const loanAmt = user.loan || 0;
    if (loanAmt <= 0) return showNotification("No active loans.", "info");
    if (user.balance < loanAmt) return showNotification("Insufficient balance to repay.", "error");

    setUsers(prev => prev.map(u => {
      if (u.id === user.id) return { ...u, balance: u.balance - loanAmt, loan: 0 };
      return u;
    }));
    setUser(prev => ({ ...prev, balance: prev.balance - loanAmt, loan: 0 }));
    logTransaction('Loan Repayment', loanAmt, user.name, 'APB System');
    showNotification("Loan fully repaid.", "success");
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const targetAcc = e.target.targetAccount.value;
    const amount = parseFloat(e.target.amount.value);
    
    if (amount > user.balance) return showNotification("Insufficient funds", "error");
    const recipient = users.find(u => u.accountNumber === targetAcc);
    if (!recipient) return showNotification("Account not found", "error");
    if (recipient.id === user.id) return showNotification("Cannot transfer to self.", "error");

    setUsers(prev => prev.map(u => {
      if (u.id === user.id) return { ...u, balance: u.balance - amount };
      if (u.id === recipient.id) return { ...u, balance: u.balance + amount };
      return u;
    }));
    setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    logTransaction('Transfer', amount, user.name, recipient.name);
    showNotification(`Sent $${amount} to ${recipient.name}`, "success");
    e.target.reset();
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: `u${Date.now()}`,
      username: e.target.username.value,
      password: e.target.password.value,
      name: e.target.name.value,
      balance: parseFloat(e.target.balance.value),
      accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      role: 'user',
      staffRole: 'N/A',
      status: STATUS.ACTIVE,
      inventory: [],
      loan: 0
    };
    setUsers(prev => [...prev, newUser]);
    showNotification(`Entity ${newUser.name} created.`, "success");
    setView('admin');
    e.target.reset();
  };

  const stats = useMemo(() => {
    const totalLiquidity = users.reduce((acc, u) => acc + u.balance, 0);
    const totalLoans = users.reduce((acc, u) => acc + (u.loan || 0), 0);
    return { totalLiquidity, totalLoans, userCount: users.length };
  }, [users]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Landmark className="text-white" size={20} />
          </div>
          <div className="leading-tight">
            <span className="font-black tracking-tighter text-xl block">APB BANK</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Atlanta Financial</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleFullscreen} 
            className="hidden sm:flex items-center gap-2 p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
            title="Toggle Fullscreen"
          >
            <Maximize size={18} />
          </button>

          {user && (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Balance</p>
                <p className="text-emerald-400 font-black text-lg leading-none">${user.balance.toLocaleString()}</p>
              </div>
              <button onClick={() => { setUser(null); setView('login'); }} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {user && (
          <aside className="w-64 border-r border-slate-800 h-[calc(100vh-64px)] p-6 hidden lg:block overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
                  <User size={20} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-black truncate">{user.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{user.role}</p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-2 px-4">Menu</p>
              <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 text-slate-400'}`}>
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button onClick={() => setView('transfer')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'transfer' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 text-slate-400'}`}>
                <ArrowRightLeft size={18} /> Payments
              </button>
              <button onClick={() => setView('market')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'market' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 text-slate-400'}`}>
                <ShoppingBag size={18} /> APB Store
              </button>
              
              {user.role === 'admin' && (
                <>
                  <div className="pt-6 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4">System</div>
                  <button onClick={() => setView('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'admin' ? 'bg-purple-600 text-white' : 'hover:bg-slate-900 text-slate-400'}`}>
                    <Settings size={18} /> Clerk Admin
                  </button>
                  <button onClick={() => setView('staff')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'staff' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-900 text-slate-400'}`}>
                    <Briefcase size={18} /> Staff Roster
                  </button>
                </>
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 p-6 lg:p-10 max-h-[calc(100vh-64px)] overflow-y-auto">
          {/* Login Screen */}
          {view === 'login' && !user && (
            <div className="max-w-md mx-auto mt-20">
               <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden p-8">
                  <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center border border-indigo-500/20">
                        <Shield className="text-indigo-500" size={40} />
                    </div>
                  </div>
                  <h1 className="text-3xl font-black mb-2 text-center tracking-tight">Access Portal</h1>
                  <p className="text-center text-slate-500 text-sm mb-10 px-4">Identity verification required for network access.</p>
                  
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Username</label>
                      <input required name="username" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:ring-2 ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Security Key</label>
                      <input required name="password" type="password" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:ring-2 ring-indigo-500 outline-none transition-all" />
                    </div>
                    <button className="w-full bg-indigo-600 p-5 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                      Initialize <ChevronRight size={18} />
                    </button>
                  </form>
               </div>
            </div>
          )}

          {/* Views for Logged In User */}
          {user && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {view === 'dashboard' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] relative overflow-hidden shadow-2xl border border-white/10">
                      <div className="absolute -top-10 -right-10 opacity-10">
                         <Landmark size={240} />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Liquid Assets</p>
                          <h2 className="text-6xl font-black tracking-tighter tabular-nums">${user.balance.toLocaleString()}</h2>
                        </div>
                        <div className="mt-12 flex justify-between items-end border-t border-white/10 pt-8">
                          <div>
                            <p className="text-white/40 text-[10px] font-mono tracking-widest">ACCOUNT IDENTIFIER</p>
                            <div className="font-mono text-lg tracking-[0.3em] font-medium text-white/80">
                               {user.accountNumber.match(/.{1,4}/g)?.join(' ')}
                            </div>
                          </div>
                          <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Status</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Inventory Perks</p>
                        <div className="flex flex-wrap gap-2">
                          {user.inventory && user.inventory.length > 0 ? user.inventory.map((item, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700">{item}</span>
                          )) : (
                            <p className="text-xs text-slate-600 italic">No items owned.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Outstanding Loan</p>
                            {user.loan > 0 && (
                                <button onClick={handleRepayLoan} className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300">Repay All</button>
                            )}
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">${(user.loan || 0).toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold italic">Due on next billing cycle</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                      <h4 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <Clock size={20} className="text-indigo-400" /> Transaction Log
                      </h4>
                      <div className="space-y-4">
                        {transactions.filter(tx => tx.sender === user.name || tx.receiver === user.name).slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-950 border border-slate-800/50">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.receiver === user.name ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {tx.receiver === user.name ? <PlusCircle size={18} /> : <MinusCircle size={18} />}
                              </div>
                              <div>
                                <p className="font-black text-sm">{tx.type}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">{tx.timestamp}</p>
                              </div>
                            </div>
                            <div className={`text-right font-black text-lg ${tx.receiver === user.name ? 'text-emerald-400' : 'text-slate-100'}`}>
                              {tx.receiver === user.name ? '+' : '-'}${tx.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                      <h4 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <CreditCard size={20} className="text-amber-400" /> Loan Application
                      </h4>
                      <form onSubmit={handleLoanRequest} className="space-y-4">
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">Request instant liquidity. Max limit: $5,000.</p>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase ml-2">Loan Amount</label>
                          <input required name="amount" type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-amber-500 transition-all font-black" />
                        </div>
                        <button className="w-full bg-slate-800 text-amber-500 font-black p-4 rounded-2xl border border-amber-500/20 hover:bg-slate-750 transition-all">Request Credit</button>
                      </form>
                    </div>
                  </div>
                </>
              )}

              {view === 'market' && (
                <div className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3">
                      <ShoppingBag size={32} className="text-indigo-500" /> APB Marketplace
                    </h2>
                    <p className="text-slate-500 text-sm italic">Invest your liquid cash into profile enhancements.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STORE_ITEMS.map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-all group flex flex-col justify-between">
                        <div>
                          <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 border border-slate-800">
                             {item.icon}
                          </div>
                          <h4 className="font-black text-lg mb-2">{item.name}</h4>
                          <p className="text-xs text-slate-500 mb-6 leading-relaxed">{item.description}</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-indigo-400 mb-4 tracking-tighter">${item.price.toLocaleString()}</p>
                          <button 
                            onClick={() => handleBuyItem(item)}
                            disabled={user.inventory.includes(item.name)}
                            className={`w-full py-4 border rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${user.inventory.includes(item.name) ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' : 'bg-slate-950 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                          >
                            {user.inventory.includes(item.name) ? 'Already Owned' : 'Acquire Item'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Liquidity</p>
                         <p className="text-2xl font-black text-indigo-400 tabular-nums">${stats.totalLiquidity.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Outstanding Debt</p>
                         <p className="text-2xl font-black text-rose-500 tabular-nums">${stats.totalLoans.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Entities</p>
                         <p className="text-2xl font-black text-slate-100 tabular-nums">{stats.userCount}</p>
                      </div>
                   </div>

                   <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
                      <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                         <h4 className="text-xl font-black uppercase tracking-tight">Account Directory</h4>
                         <button onClick={() => setView('onboarding')} className="bg-indigo-600 px-6 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                           <UserPlus size={16} /> Create Entity
                         </button>
                      </div>
                      <table className="w-full">
                        <thead className="bg-slate-800/30 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                           <tr>
                             <th className="p-6 text-left">Entity Name</th>
                             <th className="p-6 text-left">Balance</th>
                             <th className="p-6 text-left">Account Number</th>
                             <th className="p-6 text-right">Adjust Balance</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                               <td className="p-6">
                                  <p className="font-black text-sm">{u.name}</p>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-500'}`}>{u.role.toUpperCase()}</span>
                               </td>
                               <td className="p-6 font-black text-indigo-400">${u.balance.toLocaleString()}</td>
                               <td className="p-6 font-mono text-xs text-slate-500">{u.accountNumber}</td>
                               <td className="p-6 text-right space-x-2">
                                  <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? {...x, balance: x.balance + 500} : x))} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg border border-emerald-500/20"><PlusCircle size={16} /></button>
                                  <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? {...x, balance: x.balance - 500} : x))} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg border border-rose-500/20"><MinusCircle size={16} /></button>
                               </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}

              {view === 'onboarding' && (
                <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Create Entity</h2>
                        <button onClick={() => setView('admin')} className="text-slate-500 hover:text-white"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Display Name</label>
                                <input required name="name" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Initial Balance</label>
                                <input required name="balance" type="number" defaultValue="1000" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Auth Identifier (Username)</label>
                            <input required name="username" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Auth Secret (Password)</label>
                            <input required name="password" type="password" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30">Activate Entity</button>
                    </form>
                </div>
              )}

              {view === 'staff' && (
                <div className="space-y-8">
                  <div className="bg-emerald-950/20 border border-emerald-500/20 p-10 rounded-[3rem] relative overflow-hidden">
                    <h2 className="text-3xl font-black mb-2 flex items-center gap-2"><Briefcase className="text-emerald-500" /> Staff Management</h2>
                    <p className="text-slate-500 text-sm">Assign internal roles within the organization.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {users.map(u => (
                      <div key={u.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative group">
                        <div className={`absolute top-0 right-0 p-4 ${u.role === 'admin' ? 'text-purple-500' : 'text-slate-700'}`}>
                           {u.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Legal Name</p>
                        <h4 className="text-xl font-black mb-4 truncate pr-8">{u.name}</h4>
                        
                        <div className="space-y-4">
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                             <p className="text-[9px] font-black uppercase text-slate-600 mb-1">Company Designation</p>
                             <select 
                               value={u.staffRole || 'N/A'} 
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setUsers(prev => prev.map(x => x.id === u.id ? {...x, staffRole: val} : x));
                               }}
                               className="bg-transparent border-none text-emerald-400 font-black text-xs outline-none w-full cursor-pointer"
                             >
                               <option className="bg-slate-900 text-white" value="N/A">N/A</option>
                               <option className="bg-slate-900 text-white" value="Clerk">Clerk</option>
                               <option className="bg-slate-900 text-white" value="Senior Clerk">Senior Clerk</option>
                               <option className="bg-slate-900 text-white" value="Security Officer">Security Officer</option>
                               <option className="bg-slate-900 text-white" value="Branch Manager">Branch Manager</option>
                             </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'transfer' && (
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-2 tracking-tight"><ArrowRightLeft size={24} className="text-indigo-400" /> Send Funds</h3>
                    <form onSubmit={handleTransfer} className="space-y-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Destination ID</label>
                        <input required name="targetAccount" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none ring-indigo-500 focus:ring-2 font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Amount (ATL)</label>
                        <input required name="amount" type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none ring-indigo-500 focus:ring-2 text-xl font-black" />
                      </div>
                      <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 mt-4">
                        Initialize Transfer
                      </button>
                    </form>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Receipt size={64} /></div>
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-2 tracking-tight">External Wires</h3>
                    <div className="space-y-6">
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                          <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Routing Identifier</p>
                          <p className="text-sm font-mono text-slate-300">APB-ATL-9921-X</p>
                       </div>
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                          <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Internal Swift Code</p>
                          <p className="text-sm font-mono text-slate-300">ATL_PEOPLES_BK</p>
                       </div>
                       <p className="text-[11px] text-slate-600 italic leading-relaxed">Transactions within the Atlanta network are processed instantly. Use your 10-digit account number for internal wires.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-3xl shadow-2xl border-2 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 duration-300 ${notification.type === 'error' ? 'bg-rose-950 border-rose-500 text-rose-100' : 'bg-indigo-950 border-indigo-500 text-indigo-100'}`}>
           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'error' ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}>
             {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
           </div>
           <div>
             <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{notification.type === 'error' ? 'System Alert' : 'Network Notification'}</div>
             <span className="font-black text-sm">{notification.msg}</span>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Render.com Server-side wrapper (Optional if deploying as Node service) ---
// If you're using Render's Static Site hosting, this part isn't needed. 
// If using Render's Web Service, ensure you have a simple entry point.
/* const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Atlanta Bank Portal running on port ${PORT}`));
*/
