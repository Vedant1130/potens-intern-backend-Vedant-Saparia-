import { useState, useEffect, FormEvent } from 'react';
import { 
  Briefcase, 
  HelpCircle, 
  ShieldCheck, 
  Database, 
  PlusCircle, 
  Trash2, 
  Settings, 
  Sparkles, 
  RefreshCw, 
  Info, 
  Lock, 
  DollarSign, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

interface Recommendation {
  product_id: number;
  name: string;
  type: string;
  score: number;
  reason: string;
}

interface Product {
  id: number;
  name: string;
  type: string;
  min_age: number;
  max_age: number;
  min_income: number;
  min_credit_score: number;
  allowed_employment_types: string[];
  interest_rate: number;
  description: string;
  eligibility_summary: string;
}

interface ExplanationPayload {
  product_id: number;
  name: string;
  type: string;
  eligibility_summary: string;
  dynamic_checks: {
    age: string;
    credit_score: string;
    monthly_income: string;
    employment_type: string;
  };
}

export default function App() {
  // Core Profile Form State
  const [profile, setProfile] = useState({
    age: 30,
    monthly_income: 45000,
    credit_score: 720,
    employment_type: 'salaried',
    existing_loans: 1,
    preferred_product_type: ''
  });

  // Client States
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recNote, setRecNote] = useState<string>('');
  const [recMessage, setRecMessage] = useState<string>('');
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  // Admin / Catalog States
  const [adminToken, setAdminToken] = useState('elite_admin_secret_999');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [adminError, setAdminError] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // New Item State (Admin Modal / Drawer input)
  const [newItem, setNewItem] = useState({
    name: 'Standard Gold Business Loan',
    type: 'loan',
    min_age: 25,
    max_age: 65,
    min_income: 60000,
    min_credit_score: 680,
    allowed_employment_types: 'salaried,self_employed',
    interest_rate: 12.5,
    description: 'A flexible revolving line of credit optimized to fund workspace expansions & active vendor invoices.',
    eligibility_summary: 'Age 25 to 65, minimal self-employed or salaried cash flow of ₹60,000, credit limits above 680 points.'
  });

  // Explain State
  const [explainId, setExplainId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<ExplanationPayload | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // UI Tabs / Screens
  const [activeTab, setActiveTab] = useState<'scorer' | 'catalog' | 'explain'>('scorer');

  // Trigger Recommendations POST Fetch
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    setRecMessage('');
    setRecNote('');
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          preferred_product_type: profile.preferred_product_type || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations || []);
        if (data.note) setRecNote(data.note);
        if (data.message) setRecMessage(data.message);
      } else {
        setRecMessage(data.error || 'Failed to analyze user parameters.');
        setRecommendations([]);
      }
    } catch (e: any) {
      setRecMessage(`Server Connection Failure: ${e.message}`);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Retrieve Full Catalogue (Requires Admin auth state)
  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    setAdminError('');
    try {
      const res = await fetch('/api/items', {
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (res.ok) {
        setCatalog(data);
      } else {
        setAdminError(data.error || 'Unauthorized access. Verify admin credentials.');
        setCatalog([]);
      }
    } catch (e: any) {
      setAdminError(`Database Service Offline: ${e.message}`);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Submit Admin Product Add
  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({
          ...newItem,
          min_age: Number(newItem.min_age),
          max_age: Number(newItem.max_age),
          min_income: Number(newItem.min_income),
          min_credit_score: Number(newItem.min_credit_score),
          interest_rate: Number(newItem.interest_rate),
          allowed_employment_types: newItem.allowed_employment_types.split(',').map(s => s.trim())
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchCatalog(); 
        alert('Awesome! Product added to Catalog successfully.');
      } else {
        setAdminError(data.error || 'Failed to submit product.');
      }
    } catch (e: any) {
      setAdminError(e.message);
    }
  };

  // Submit Admin Product Delete
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to delete this product?')) return;
    setAdminError('');
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (res.ok) {
        fetchCatalog();
      } else {
        setAdminError(data.error || 'Failed to delete selected product.');
      }
    } catch (e: any) {
      setAdminError(e.message);
    }
  };

  // Retrieve Dynamic explanations mapping checks
  const fetchExplanation = async (id: number) => {
    setLoadingExplain(true);
    setExplanation(null);
    try {
      const res = await fetch(`/api/explain/${id}`);
      const data = await res.json();
      if (res.ok) {
        setExplanation(data);
      } else {
        alert(data.error || 'Error retrieving detail.');
      }
    } catch (e: any) {
      alert(`Connection failed: ${e.message}`);
    } finally {
      setLoadingExplain(false);
    }
  };

  // Auto-fetch recommendations on first load to make page alive instantly
  useEffect(() => {
    fetchRecommendations();
    fetchCatalog();
  }, []);

  return (
    <div id="recommendation-engine-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Visual Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Financial Recommend Engine
              </h1>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                REST API v1.0.0 • Embedded DB Fallback Active
              </span>
            </div>
          </div>
          <nav className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('scorer')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'scorer' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Briefcase className="w-4 h-4" /> Recommendation Playground
            </button>
            <button
              onClick={() => { setActiveTab('catalog'); fetchCatalog(); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'catalog' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Database className="w-4 h-4" /> Catalog Admin
            </button>
            <button
              onClick={() => { setActiveTab('explain'); if (catalog.length > 0 && !explainId) { setExplainId(catalog[0].id); fetchExplanation(catalog[0].id); } }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'explain' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <HelpCircle className="w-4 h-4" /> Explain Probe
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-8 grid grid-cols-1 gap-8">
        
        {/* TAB 1: Recommendation Scorer Panel */}
        {activeTab === 'scorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Profile Input Column */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" /> User Financial Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust parameter boundaries below to simulate profile calculations deterministically.
                </p>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-xs font-semibold text-slate-600">Age (years)</label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 hover:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-xs font-semibold text-slate-600">Credit Score (300-900)</label>
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={profile.credit_score}
                    onChange={(e) => setProfile({ ...profile, credit_score: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 hover:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Monthly Net Income (INR ₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={profile.monthly_income}
                      onChange={(e) => setProfile({ ...profile, monthly_income: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 hover:bg-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-xs font-semibold text-slate-600">Employment Type</label>
                  <select
                    value={profile.employment_type}
                    onChange={(e) => setProfile({ ...profile, employment_type: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 hover:bg-white"
                  >
                    <option value="salaried">Salaried</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-xs font-semibold text-slate-600">Active Debt (Loans)</label>
                  <input
                    type="number"
                    min="0"
                    value={profile.existing_loans}
                    onChange={(e) => setProfile({ ...profile, existing_loans: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 hover:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Preferred Product Type (Optional Filter)</label>
                  <select
                    value={profile.preferred_product_type}
                    onChange={(e) => setProfile({ ...profile, preferred_product_type: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 hover:bg-white"
                  >
                    <option value="">No Filter (Evaluate Full Portfolio)</option>
                    <option value="loan">Personal Loans Only</option>
                    <option value="credit_card">Credit Cards Only</option>
                    <option value="savings">Savings Accounts Only</option>
                    <option value="insurance">Insurance Plans Only</option>
                    <option value="fixed_deposit">Fixed Deposits Only</option>
                  </select>
                </div>
              </div>

              <button
                onClick={fetchRecommendations}
                disabled={loadingRecs}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-blue-100 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {loadingRecs ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Evaluate Match Recommendations
              </button>
            </div>

            {/* Recommendations Results Column */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-950">Matched Recommendations Results</h3>
                  <p className="text-xs text-slate-500">Structured analysis mapping matches in real time.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                  Target Match Constraint: max 3
                </div>
              </div>

              {recNote && (
                <div className="bg-amber-50 text-amber-800 text-xs px-4 py-2.5 rounded-xl border border-amber-200/60 leading-relaxed flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" /> {recNote}
                </div>
              )}

              {recMessage && recommendations.length === 0 && (
                <div className="bg-amber-55 lg:p-12 p-8 text-center rounded-2xl border border-slate-200/80 bg-white flex flex-col items-center gap-3">
                  <HelpCircle className="w-10 h-10 text-amber-500" />
                  <h4 className="font-bold text-slate-900">Catalogue Filter Holdout</h4>
                  <p className="text-slate-600 text-sm max-w-sm leading-relaxed">{recMessage}</p>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="flex flex-col gap-4">
                  {recommendations.map((item, idx) => {
                    const badgeStyles = {
                      loan: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      credit_card: 'bg-violet-50 text-violet-800 border-violet-200',
                      savings: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                      insurance: 'bg-pink-50 text-pink-800 border-pink-200',
                      fixed_deposit: 'bg-amber-50 text-amber-800 border-amber-200'
                    }[item.type as 'loan' | 'credit_card' | 'savings' | 'insurance' | 'fixed_deposit'] || 'bg-slate-100 text-slate-800 border-slate-200';

                    return (
                      <div 
                        key={item.product_id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition duration-150 flex flex-col gap-3 shadow-xs relative overflow-hidden"
                      >
                        {/* Match Rank Marker */}
                        <div className="absolute top-0 left-0 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-br-lg">
                          RANK #{idx + 1}
                        </div>

                        <div className="flex flex-wrap justify-between items-start gap-2 pt-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PRODUCT ID: {item.product_id}</span>
                            <h4 className="font-extrabold text-slate-950 text-md">{item.name}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badgeStyles}`}>
                              {item.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-slate-400">MATCH QUALITY</span>
                              <span className="text-sm font-black text-blue-600">{item.score} pts</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-600 font-medium">
                          {item.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Catalogue Admin CRUD */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Product Addition Admin Form */}
            <form onSubmit={handleCreateProduct} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" /> Insert New Financial Product
                </h3>
                <p className="text-xs text-slate-500 mt-1">Admin authorized actions require standard header tokens.</p>
              </div>

              {adminError && (
                <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-200">
                  {adminError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">x-admin-token check</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
                    placeholder="Enter admin key..."
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 my-1"></div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-slate-600 font-semibold">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs text-slate-600 font-semibold">Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800"
                  >
                    <option value="loan">Loan</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="savings">Savings</option>
                    <option value="insurance">Insurance</option>
                    <option value="fixed_deposit">Fixed Deposit</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs text-slate-600 font-semibold">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.interest_rate}
                    onChange={(e) => setNewItem({ ...newItem, interest_rate: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs text-slate-600 font-semibold">Age Bounds (min)</label>
                  <input
                    type="number"
                    required
                    value={newItem.min_age}
                    onChange={(e) => setNewItem({ ...newItem, min_age: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs text-slate-600 font-semibold">Age Bounds (max)</label>
                  <input
                    type="number"
                    required
                    value={newItem.max_age}
                    onChange={(e) => setNewItem({ ...newItem, max_age: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs text-slate-600 font-semibold">Min income (INR)</label>
                  <input
                    type="number"
                    required
                    value={newItem.min_income}
                    onChange={(e) => setNewItem({ ...newItem, min_income: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs text-slate-600 font-semibold">Min Credit Rating</label>
                  <input
                    type="number"
                    required
                    value={newItem.min_credit_score}
                    onChange={(e) => setNewItem({ ...newItem, min_credit_score: Number(e.target.value) })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-slate-600 font-semibold">Allowed Careers (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={newItem.allowed_employment_types}
                    onChange={(e) => setNewItem({ ...newItem, allowed_employment_types: e.target.value })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 font-mono text-xs"
                    placeholder="salaried, self_employed, retired, student"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-slate-600 font-semibold">Item Description</label>
                  <textarea
                    required
                    rows={2}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 resize-none font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-slate-600 font-semibold">Plain English Eligibility Summary</label>
                  <textarea
                    required
                    rows={2}
                    value={newItem.eligibility_summary}
                    onChange={(e) => setNewItem({ ...newItem, eligibility_summary: e.target.value })}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 resize-none font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white text-sm font-bold py-2.5 px-4 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 mt-2"
              >
                <PlusCircle className="w-4 h-4" /> Register Product Item
              </button>
            </form>

            {/* Right: Active Catalog List Table */}
            <div className="lg:col-span-7 flex flex-col gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 leading-tight">Catalogs Management Database</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Active entries pulled from pool layer ({catalog.length} items).</p>
                </div>
                <button
                  onClick={fetchCatalog}
                  disabled={loadingCatalog}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg cursor-pointer transition border border-blue-100"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCatalog ? 'animate-spin' : ''}`} /> Refresh Lists
                </button>
              </div>

              {adminError && <p className="text-xs text-red-600">{adminError}</p>}

              <div className="border-t border-slate-100 my-1"></div>

              {catalog.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <Database className="w-8 h-8 text-slate-300" />
                  No database entries matched. Please authenticate your Admin Token and refresh.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {catalog.map((p) => (
                    <div 
                      key={p.id}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 transition duration-150 flex justify-between items-start gap-4 text-xs"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="bg-slate-200/85 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                            ID: {p.id}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-sans">{p.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                          <span>🎯 Min Credit: <strong>{p.min_credit_score}</strong></span>
                          <span>💰 Min Income: <strong>₹{p.min_income?.toLocaleString()}</strong></span>
                          <span>⏳ Age bracket: <strong>{p.min_age}-{p.max_age}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition duration-150 shrink-0 self-center border border-transparent hover:border-red-650 cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Explanation Engine Probe */}
        {activeTab === 'explain' && (
          <div className="max-w-3xl mx-auto w-full bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5.5 h-5.5 text-blue-600" /> Public Explanation Engine Probe
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Trigger <code>GET /api/explain/:item_id</code> dynamically to investigate the dynamic eligibility rules configured.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-sm font-semibold text-slate-700 shrink-0">Select Product to Probe:</label>
              <select
                className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 bg-white"
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setExplainId(id);
                  fetchExplanation(id);
                }}
                value={explainId || ''}
              >
                <option value="" disabled>-- Choose Product --</option>
                {catalog.map(item => (
                  <option key={item.id} value={item.id}>[{item.type.toUpperCase()}] {item.name}</option>
                ))}
              </select>
            </div>

            {loadingExplain && (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs font-mono">Querying explanation parameters...</span>
              </div>
            )}

            {explanation && (
              <div className="flex flex-col gap-5 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">PRODUCT ID {explanation.product_id} • TYPE {explanation.type}</span>
                  <h4 className="text-md font-extrabold text-slate-950 mt-0.5">{explanation.name}</h4>
                </div>

                <div className="flex flex-col gap-2">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-blue-500" /> English Eligibility Summary</h5>
                  <div className="bg-white px-4 py-3 rounded-lg border border-slate-150 text-xs text-slate-600 leading-relaxed font-sans font-medium">
                    {explanation.eligibility_summary}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1"><Info className="w-3.5 h-3.5 text-violet-500" /> Dynamic Field Checks & Rationales</h5>
                  <div className="grid grid-cols-1 gap-3">
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-500" /> 1. AGE CHECK
                      </span>
                      <p className="text-slate-600 leading-relaxed">{explanation.dynamic_checks.age}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-500" /> 2. CREDIT SCORE CHECK
                      </span>
                      <p className="text-slate-600 leading-relaxed">{explanation.dynamic_checks.credit_score}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-violet-500" /> 3. MONTHLY INCOME CHECK
                      </span>
                      <p className="text-slate-600 leading-relaxed">{explanation.dynamic_checks.monthly_income}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-amber-500" /> 4. EMPLOYMENT TYPE CHECK
                      </span>
                      <p className="text-slate-600 leading-relaxed">{explanation.dynamic_checks.employment_type}</p>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern, Minimalistic Footer */}
      <footer className="bg-white border-t border-slate-100 text-slate-400 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>Financial Product Recommendation Engine © 2026</p>
          <p className="text-slate-500">Crafted with modern Node, Express, PG, & React in Sandbox</p>
        </div>
      </footer>
    </div>
  );
}
