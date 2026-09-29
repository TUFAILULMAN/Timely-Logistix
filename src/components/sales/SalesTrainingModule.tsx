/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Wrench,
  HelpCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Info,
  Phone,
  Mail,
  Award,
  Sparkles,
  Zap,
  RotateCcw,
  Edit2,
  Plus,
  Trash2,
  Save,
  X,
  MessageSquare
} from 'lucide-react';
import { User, TrainingScriptConfig, ObjectionHandler } from '../../types';
import { INITIAL_TRAINING_SCRIPTS } from '../../initialData';

// USA States database
interface USStateInfo {
  code: string;
  name: string;
  capital: string;
  timeZone: string;
  region: 'Northeast' | 'Midwest' | 'Southeast' | 'South Central' | 'Mountain' | 'West Coast';
  freightRole: 'Headhaul (Outbound Rich)' | 'Backhaul (Inbound Heavy)' | 'Balanced Hub';
  keyLanes: string;
}

const US_STATES_DATABASE: USStateInfo[] = [
  { code: 'AL', name: 'Alabama', capital: 'Montgomery', timeZone: 'Central (CST)', region: 'Southeast', freightRole: 'Balanced Hub', keyLanes: 'Birmingham -> Atlanta, GA / Nashville, TN' },
  { code: 'AK', name: 'Alaska', capital: 'Juneau', timeZone: 'Alaska (AKST)', region: 'West Coast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Seattle, WA barge / Alcan Highway' },
  { code: 'AZ', name: 'Arizona', capital: 'Phoenix', timeZone: 'Mountain (MST / No DST)', region: 'Mountain', freightRole: 'Balanced Hub', keyLanes: 'Phoenix -> Los Angeles, CA / Dallas, TX' },
  { code: 'AR', name: 'Arkansas', capital: 'Little Rock', timeZone: 'Central (CST)', region: 'Southeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Springdale (Poultry/Tyson) -> Nationwide' },
  { code: 'CA', name: 'California', capital: 'Sacramento', timeZone: 'Pacific (PST)', region: 'West Coast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'LA Ports -> Dallas / Chicago / Atlanta (Top Rates)' },
  { code: 'CO', name: 'Colorado', capital: 'Denver', timeZone: 'Mountain (MST)', region: 'Mountain', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Denver -> Kansas City, MO / Salt Lake City, UT' },
  { code: 'CT', name: 'Connecticut', capital: 'Hartford', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Hartford -> Boston, MA / NYC Metro' },
  { code: 'DE', name: 'Delaware', capital: 'Dover', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Balanced Hub', keyLanes: 'Wilmington -> Philadelphia, PA / Baltimore, MD' },
  { code: 'FL', name: 'Florida', capital: 'Tallahassee', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Miami/Orlando -> Atlanta (Produce seasonal headhaul)' },
  { code: 'GA', name: 'Georgia', capital: 'Atlanta', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Atlanta Freight Capital -> Midwest / Northeast / Florida' },
  { code: 'HI', name: 'Hawaii', capital: 'Honolulu', timeZone: 'Hawaii (HST)', region: 'West Coast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Ocean Container Freight' },
  { code: 'ID', name: 'Idaho', capital: 'Boise', timeZone: 'Mountain (MST)', region: 'Mountain', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Boise (Potatoes/Agriculture) -> West Coast / Midwest' },
  { code: 'IL', name: 'Illinois', capital: 'Springfield', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Chicago Logistics Capital -> All 48 Lower States' },
  { code: 'IN', name: 'Indiana', capital: 'Indianapolis', timeZone: 'Eastern (EST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Crossroads of America -> Midwest / Northeast / South' },
  { code: 'IA', name: 'Iowa', capital: 'Des Moines', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Cedar Rapids / Des Moines (Ag/Meat) -> Nationwide' },
  { code: 'KS', name: 'Kansas', capital: 'Topeka', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Kansas City / Wichita (Beef/Grain) -> East & South' },
  { code: 'KY', name: 'Kentucky', capital: 'Frankfort', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Balanced Hub', keyLanes: 'Louisville (UPS Worldport) -> Cincinnati / Nashville' },
  { code: 'LA', name: 'Louisiana', capital: 'Baton Rouge', timeZone: 'Central (CST)', region: 'South Central', freightRole: 'Balanced Hub', keyLanes: 'New Orleans Port / Baton Rouge -> Houston / Atlanta' },
  { code: 'ME', name: 'Maine', capital: 'Augusta', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Portland (Paper/Lumber) -> Boston / NYC' },
  { code: 'MD', name: 'Maryland', capital: 'Annapolis', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Balanced Hub', keyLanes: 'Baltimore Port -> I-95 Corridor / Midwest' },
  { code: 'MA', name: 'Massachusetts', capital: 'Boston', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Boston Metro -> New York / Philadelphia' },
  { code: 'MI', name: 'Michigan', capital: 'Lansing', timeZone: 'Eastern (EST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Detroit (Automotive/Parts) -> Ohio / Kentucky / Mexico' },
  { code: 'MN', name: 'Minnesota', capital: 'St. Paul', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Minneapolis / Twin Cities -> Chicago / Dallas' },
  { code: 'MS', name: 'Mississippi', capital: 'Jackson', timeZone: 'Central (CST)', region: 'Southeast', freightRole: 'Balanced Hub', keyLanes: 'Jackson -> Memphis, TN / New Orleans, LA' },
  { code: 'MO', name: 'Missouri', capital: 'Jefferson City', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'St. Louis / Kansas City -> Chicago / Dallas / Atlanta' },
  { code: 'MT', name: 'Montana', capital: 'Helena', timeZone: 'Mountain (MST)', region: 'Mountain', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Billings -> Seattle, WA / Minneapolis, MN' },
  { code: 'NE', name: 'Nebraska', capital: 'Lincoln', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Omaha / Grand Island (Beef Packing) -> Chicago / East' },
  { code: 'NV', name: 'Nevada', capital: 'Carson City', timeZone: 'Pacific (PST)', region: 'West Coast', freightRole: 'Balanced Hub', keyLanes: 'Reno / Las Vegas -> California / Salt Lake City' },
  { code: 'NH', name: 'New Hampshire', capital: 'Concord', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Manchester -> Boston, MA' },
  { code: 'NJ', name: 'New Jersey', capital: 'Trenton', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Port Elizabeth / Newark -> Philadelphia / Baltimore' },
  { code: 'NM', name: 'New Mexico', capital: 'Santa Fe', timeZone: 'Mountain (MST)', region: 'Mountain', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Albuquerque -> Phoenix, AZ / El Paso, TX' },
  { code: 'NY', name: 'New York', capital: 'Albany', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'NYC (High Inbound Tolls) / Buffalo -> Midwest' },
  { code: 'NC', name: 'North Carolina', capital: 'Raleigh', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Charlotte / Greensboro -> Atlanta / Virginia / Northeast' },
  { code: 'ND', name: 'North Dakota', capital: 'Bismarck', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Bakken Oilfield / Fargo -> Minneapolis' },
  { code: 'OH', name: 'Ohio', capital: 'Columbus', timeZone: 'Eastern (EST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Columbus / Cleveland / Cincinnati -> Chicago / East Coast' },
  { code: 'OK', name: 'Oklahoma', capital: 'Oklahoma City', timeZone: 'Central (CST)', region: 'South Central', freightRole: 'Balanced Hub', keyLanes: 'OKC / Tulsa -> Dallas, TX / Kansas City, MO' },
  { code: 'OR', name: 'Oregon', capital: 'Salem', timeZone: 'Pacific (PST)', region: 'West Coast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Portland (Lumber/Agriculture) -> California / Idaho' },
  { code: 'PA', name: 'Pennsylvania', capital: 'Harrisburg', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Harrisburg/Allentown Mega Logistics Hub -> Northeast' },
  { code: 'RI', name: 'Rhode Island', capital: 'Providence', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Providence -> Boston / NYC' },
  { code: 'SC', name: 'South Carolina', capital: 'Columbia', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Charleston Port / Greenville (BMW) -> Atlanta / Midwest' },
  { code: 'SD', name: 'South Dakota', capital: 'Pierre', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Balanced Hub', keyLanes: 'Sioux Falls -> Minneapolis / Omaha' },
  { code: 'TN', name: 'Tennessee', capital: 'Nashville', timeZone: 'Central / Eastern', region: 'Southeast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Memphis (FedEx Hub) / Nashville -> Midwest / South' },
  { code: 'TX', name: 'Texas', capital: 'Austin', timeZone: 'Central (CST)', region: 'South Central', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Dallas / Houston / Laredo Border -> Nationwide' },
  { code: 'UT', name: 'Utah', capital: 'Salt Lake City', timeZone: 'Mountain (MST)', region: 'Mountain', freightRole: 'Balanced Hub', keyLanes: 'Salt Lake City -> Las Vegas / Denver / Pacific NW' },
  { code: 'VT', name: 'Vermont', capital: 'Montpelier', timeZone: 'Eastern (EST)', region: 'Northeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Burlington -> Boston, MA / Montreal Canada' },
  { code: 'VA', name: 'Virginia', capital: 'Richmond', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Balanced Hub', keyLanes: 'Norfolk Ports / Richmond -> I-95 Corridor / Midwest' },
  { code: 'WA', name: 'Washington', capital: 'Olympia', timeZone: 'Pacific (PST)', region: 'West Coast', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Seattle/Tacoma Ports / Yakima (Apples/Reefer) -> Midwest' },
  { code: 'WV', name: 'West Virginia', capital: 'Charleston', timeZone: 'Eastern (EST)', region: 'Southeast', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Charleston -> Pittsburgh, PA / Columbus, OH' },
  { code: 'WI', name: 'Wisconsin', capital: 'Madison', timeZone: 'Central (CST)', region: 'Midwest', freightRole: 'Headhaul (Outbound Rich)', keyLanes: 'Milwaukee / Green Bay (Dairy/Paper) -> Chicago / South' },
  { code: 'WY', name: 'Wyoming', capital: 'Cheyenne', timeZone: 'Mountain (MST)', region: 'Mountain', freightRole: 'Backhaul (Inbound Heavy)', keyLanes: 'Cheyenne -> Denver, CO / Salt Lake City, UT' }
];

interface SalesTrainingModuleProps {
  currentUser?: User | null;
  trainingScripts?: TrainingScriptConfig;
  onUpdateTrainingScripts?: (scripts: TrainingScriptConfig) => Promise<{ success: boolean; error?: string }> | void;
}

export default function SalesTrainingModule({
  currentUser,
  trainingScripts,
  onUpdateTrainingScripts
}: SalesTrainingModuleProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<'intro' | 'states' | 'timezones' | 'fmcsa' | 'equipment' | 'tools' | 'quiz'>('intro');
  const [stateSearch, setStateSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const effectiveScripts: TrainingScriptConfig = trainingScripts || INITIAL_TRAINING_SCRIPTS;
  const isAdmin = currentUser?.role === 'ADMIN';

  // Admin Editing Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<TrainingScriptConfig>(effectiveScripts);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (trainingScripts) {
      setEditForm(trainingScripts);
    }
  }, [trainingScripts]);

  const handleOpenEditModal = () => {
    setEditForm(effectiveScripts);
    setSaveStatus(null);
    setIsEditModalOpen(true);
  };

  const handleAddObjection = () => {
    const newObj: ObjectionHandler = {
      id: `obj_${Date.now()}`,
      objection: "New carrier objection / counter question",
      response: "Professional closing response and value pitch",
      category: "General"
    };
    setEditForm(prev => ({
      ...prev,
      objectionHandlers: [...(prev.objectionHandlers || []), newObj]
    }));
  };

  const handleUpdateObjection = (index: number, field: keyof ObjectionHandler, value: string) => {
    setEditForm(prev => {
      const updated = [...(prev.objectionHandlers || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, objectionHandlers: updated };
    });
  };

  const handleDeleteObjection = (index: number) => {
    setEditForm(prev => {
      const updated = [...(prev.objectionHandlers || [])];
      updated.splice(index, 1);
      return { ...prev, objectionHandlers: updated };
    });
  };

  const handleSaveScripts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTrainingScripts) {
      try {
        await onUpdateTrainingScripts(editForm);
        setSaveStatus("Training scripts and counter questions saved successfully!");
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSaveStatus(null);
        }, 1200);
      } catch (err: any) {
        setSaveStatus(`Failed to save: ${err.message || 'Error'}`);
      }
    }
  };

  // Time Clocks State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatZoneTime = (timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(currentTime);
    } catch {
      return 'N/A';
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered States
  const filteredStates = useMemo(() => {
    return US_STATES_DATABASE.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                            s.code.toLowerCase().includes(stateSearch.toLowerCase()) ||
                            s.capital.toLowerCase().includes(stateSearch.toLowerCase());
      const matchesRegion = selectedRegion === 'ALL' || s.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [stateSearch, selectedRegion]);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const QUIZ_QUESTIONS = [
    {
      question: "What is the maximum legal payload weight for a standard 53ft Dry Van without overweight permits?",
      options: [
        "Around 35,000 lbs",
        "Around 45,000 lbs (up to ~45,500 lbs depending on tractor tare weight)",
        "Around 60,000 lbs",
        "Unlimited as long as pallets fit"
      ],
      correct: 1,
      explanation: "A standard 53ft dry van payload tops out at ~45,000 lbs to keep total gross vehicle weight (GVW) under the federal 80,000 lbs limit across 5 axles."
    },
    {
      question: "What is the standard minimum Commercial Auto Liability insurance required by freight brokers before booking loads?",
      options: [
        "$100,000 USD",
        "$500,000 USD",
        "$1,000,000 USD ($1M Auto Liability)",
        "$5,000,000 USD"
      ],
      correct: 2,
      explanation: "Virtually all top brokers (C.H. Robinson, TQL, Echo, Landstar) mandate a minimum $1,000,000 Commercial Auto Liability policy."
    },
    {
      question: "If your dispatch office is operating in Pakistan (PKT, UTC+5) and it is 6:00 PM PKT, what time is it in Chicago, IL (Central Time CST)?",
      options: [
        "08:00 AM Central (Morning freight hunting peak)",
        "12:00 PM Noon",
        "03:00 PM Afternoon",
        "11:00 PM Night"
      ],
      correct: 0,
      explanation: "Pakistan is 10 hours ahead of US Central Time (in Standard Time) or 11 hours ahead of CDT. 6:00 PM PKT corresponds to 7:00 AM–8:00 AM Central morning peak."
    },
    {
      question: "Which of the following US states is famously a major 'Headhaul' freight state where outbound loads pay premium rates?",
      options: [
        "Florida (FL)",
        "California (CA) & Texas (TX)",
        "Maine (ME)",
        "Colorado (CO)"
      ],
      correct: 1,
      explanation: "California (major maritime import ports) and Texas (massive industrial manufacturing & border commerce) produce high freight volumes and premium headhaul outbound RPM."
    },
    {
      question: "What tool is strictly required for a 26ft Box Truck driver delivering to retail stores without loading docks?",
      options: [
        "Coil racks and 4ft lumber tarps",
        "Hydraulic liftgate and manual or electric pallet jack",
        "Reefer temperature pulp probe",
        "Pneumatic air horn"
      ],
      correct: 1,
      explanation: "Ground-level deliveries require a liftgate to lower pallets from the 48-inch bed height to pavement, plus a pallet jack to move pallets inside the box."
    },
    {
      question: "What is the difference between a Truck Dispatcher and a Freight Broker?",
      options: [
        "They are the exact same thing.",
        "A Freight Broker represents the shipper and brokers cargo; a Dispatcher represents the motor carrier/truck driver under a service agreement to secure loads.",
        "A Dispatcher pays the carrier; a broker drives the truck.",
        "A Dispatcher requires a $75,000 BMC-84 broker bond, while a carrier doesn't."
      ],
      correct: 1,
      explanation: "Dispatchers act on behalf of the carrier under a dispatch agreement/power of attorney to find top-paying loads and handle administrative coordination. Brokers represent shippers."
    }
  ];

  const calculateQuizScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) score++;
    });
    return score;
  };

  return (
    <div id="sales_training_academy" className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Timely Logistix Sales &amp; Dispatcher Academy</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
              Carrier Outreach &amp; Dispatch Mastery Course
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Complete operational handbook for sales reps &amp; dispatchers. Master truck specifications, US geographical market dynamics, FMCSA regulations, cold calling pitches, and loading tools.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl text-center shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Course Modules</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono">6 Core + Quiz</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl text-center shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Standard Fee Model</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">5% - 8%</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-2">
          {[
            { key: 'intro', label: '1. Dispatch Intro & Scripts', icon: BookOpen },
            { key: 'states', label: '2. USA States & Abbreviations', icon: MapPin },
            { key: 'timezones', label: '3. USA Time Zones & Clocks', icon: Clock },
            { key: 'fmcsa', label: '4. FMCSA & Compliance', icon: ShieldCheck },
            { key: 'equipment', label: '5. Truck Equipment Specs', icon: Truck },
            { key: 'tools', label: '6. Loading Tools & Gear', icon: Wrench },
            { key: 'quiz', label: '7. Trainee Knowledge Quiz', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold scale-105'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE 1: DISPATCH INTRO & CARRIER PITCH SCRIPTS */}
      {activeSubTab === 'intro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* What is Dispatching */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  Truck Dispatching Fundamentals &amp; Fee Structure
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Truck dispatchers serve as the logistics nerve center for independent owner-operators and fleet carriers. Dispatchers book freight, negotiate rate per mile (RPM), handle broker setup packets, plan profitable lane routes, check driver hours of service (HOS), and facilitate factoring/payment processing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Commission Model (Most Popular)
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    We charge <strong className="text-emerald-600 dark:text-emerald-400">5% to 8%</strong> of the gross load value. If a dispatcher books a $3,500 load, the agency dispatch fee is $280 (at 8%).
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Flat Weekly Fee Model
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fixed <strong className="text-blue-600 dark:text-blue-400">$250 - $350 / week</strong> per truck regardless of gross volume. Ideal for high-turnover dedicated lanes.
                  </p>
                </div>
              </div>

              {/* 8-Step Dispatch Lifecycle */}
              <div className="pt-3 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  The 8-Step Daily Dispatch Lifecycle
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    { step: '1', title: 'Carrier Check-In', desc: 'Confirm location, empty time & trailer specs' },
                    { step: '2', title: 'Load Searching', desc: 'Scan DAT One & Truckstop for high RPM freight' },
                    { step: '3', title: 'Rate Negotiation', desc: 'Call broker, negotiate detention & highest rate' },
                    { step: '4', title: 'RateCon Check', desc: 'Audit addresses, weight, dates & accessorials' },
                    { step: '5', title: 'Driver Dispatch', desc: 'Send pickup address, PU#, and appointment times' },
                    { step: '6', title: 'Tracking / Check Calls', desc: 'Verify driver arrival, loading & departure' },
                    { step: '7', title: 'POD & Delivery', desc: 'Collect signed Proof of Delivery & lumper receipts' },
                    { step: '8', title: 'Invoice & Factoring', desc: 'Submit paperwork for immediate funding' }
                  ].map(s => (
                    <div key={s.step} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1">
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                        Step {s.step}
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">{s.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Crucial Industry Terms Dictionary */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Must-Know Dispatch Terms
                </h2>
              </div>
              <div className="space-y-3 text-xs overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
                {[
                  { term: 'RPM (Rate Per Mile)', def: 'Total gross pay divided by total trip miles (Loaded + Deadhead). Target: $2.50+ for Dry Van, $3.00+ for Reefer, $3.20+ for Flatbed.' },
                  { term: 'Deadhead (DH)', def: 'Empty miles driven with no cargo to reach a shipper. Lower deadhead maximizes net profits.' },
                  { term: 'Layover', def: 'Daily detention compensation ($150–$300) when a shipper/receiver delays a driver overnight.' },
                  { term: 'Detention', def: 'Hourly pay ($50–$75/hr) for delays at shipper or receiver past the standard 2 free hours.' },
                  { term: 'TONU (Truck Order Not Used)', def: 'Fee ($150–$250) paid to carrier if broker cancels a booked load after the truck was dispatched.' },
                  { term: 'Lumper Fee', def: 'Third-party laborer charge ($50–$500) to unload freight at grocery warehouses. Reimbursed by broker with receipt.' },
                  { term: 'Factoring / QuickPay', def: 'Selling the freight invoice to a financial factoring company to receive money within 24 hours (fee: 1.5%–4%).' },
                  { term: 'RateCon (Rate Confirmation)', def: 'The binding legal contract between broker and carrier detailing rate, commodity, weight, and rules.' },
                  { term: 'BOL (Bill of Lading)', def: 'Shipping receipt given at pickup detailing piece count, pallet count, and seal numbers.' },
                  { term: 'POD (Proof of Delivery)', def: 'The stamped and signed BOL received at destination proving cargo was delivered intact.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white block font-mono text-[11px] text-indigo-600 dark:text-indigo-300">
                      {item.term}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed mt-0.5 block">
                      {item.def}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Proven Carrier Cold Call & Email Scripts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-500" />
                  <span>Carrier Outreach Scripts &amp; Objection Handling</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-converting pitch scripts used by top dispatch sales reps to sign new MC authority carriers.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={handleOpenEditModal}
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Admin: Edit Scripts &amp; Objections</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Cold Call Script */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {effectiveScripts.coldCallTitle || 'Cold Call Phone Pitch (60 Seconds)'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(effectiveScripts.coldCallScript, 'call_script')}
                    className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'call_script' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'call_script' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-line">
                  {effectiveScripts.coldCallScript}
                </div>
              </div>

              {/* Email Outreach Template */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Cold Email / Blast Template
                  </span>
                  <button
                    onClick={() => copyToClipboard(`Subject: ${effectiveScripts.emailSubject}\n\n${effectiveScripts.emailScript}`, 'email_script')}
                    className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'email_script' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'email_script' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed space-y-2">
                  <p><strong>Subject:</strong> {effectiveScripts.emailSubject}</p>
                  <p className="whitespace-pre-line text-slate-600 dark:text-slate-300">
                    {effectiveScripts.emailScript}
                  </p>
                </div>
              </div>
            </div>

            {/* Dispatch / Rate Negotiation Script (if available) */}
            {effectiveScripts.dispatchPitchScript && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Broker Rate Negotiation &amp; Dispatch Pitch
                  </span>
                  <button
                    onClick={() => copyToClipboard(effectiveScripts.dispatchPitchScript || '', 'dispatch_script')}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'dispatch_script' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'dispatch_script' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-line">
                  {effectiveScripts.dispatchPitchScript}
                </div>
              </div>
            )}

            {/* Objection Handling Cheat Sheet */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <span>Carrier Objections &amp; Counter Questions ({effectiveScripts.objectionHandlers?.length || 0})</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {(effectiveScripts.objectionHandlers || []).map((obj, idx) => {
                  const colors = [
                    'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300',
                    'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
                    'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300',
                    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
                    'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300'
                  ];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <div key={obj.id || idx} className={`p-3.5 rounded-xl border space-y-1.5 ${colorClass.split(' text-')[0]}`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold block ${colorClass.split(' ')[2]}`}>
                          {idx + 1}. "{obj.objection}"
                        </span>
                        {obj.category && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/40 font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {obj.category}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        <strong>Counter Response:</strong> "{obj.response}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Admin Edit Training Scripts & Counter Questions Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                      <Edit2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Admin: Edit Sales Scripts &amp; Counter Questions
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Update the cold pitch scripts, email templates, and counter objections for all sales reps and trainees.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveScripts} className="space-y-6">
                  {/* Cold Call Script Section */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      1. Cold Call Pitch Script
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Script Header / Title
                      </label>
                      <input
                        type="text"
                        value={editForm.coldCallTitle}
                        onChange={(e) => setEditForm(prev => ({ ...prev, coldCallTitle: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        placeholder="Cold Call Phone Pitch (60 Seconds)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cold Call Dialogue Script
                      </label>
                      <textarea
                        rows={5}
                        value={editForm.coldCallScript}
                        onChange={(e) => setEditForm(prev => ({ ...prev, coldCallScript: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                        placeholder="Enter the full cold call script..."
                        required
                      />
                    </div>
                  </div>

                  {/* Cold Email Blast Section */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      2. Cold Email Template
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Subject Line
                      </label>
                      <input
                        type="text"
                        value={editForm.emailSubject}
                        onChange={(e) => setEditForm(prev => ({ ...prev, emailSubject: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        placeholder="Subject: High-Paying Loads for MC# [MC#]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Body Text
                      </label>
                      <textarea
                        rows={6}
                        value={editForm.emailScript}
                        onChange={(e) => setEditForm(prev => ({ ...prev, emailScript: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                        placeholder="Enter the full email template..."
                        required
                      />
                    </div>
                  </div>

                  {/* Dispatch / Rate Negotiation Script Section */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      3. Dispatch &amp; Broker Negotiation Script
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Negotiation / Rate Pitch Script
                      </label>
                      <textarea
                        rows={4}
                        value={editForm.dispatchPitchScript || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dispatchPitchScript: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                        placeholder="Enter broker negotiation dialogue..."
                      />
                    </div>
                  </div>

                  {/* Objection Handlers / Counter Questions Section */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5" />
                        4. Carrier Objections &amp; Counter Questions
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddObjection}
                        className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Objection</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editForm.objectionHandlers || []).map((obj, idx) => (
                        <div key={obj.id || idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-500 font-mono">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={obj.category || ''}
                                onChange={(e) => handleUpdateObjection(idx, 'category', e.target.value)}
                                placeholder="Category (e.g. Rate, Competitor, Market)"
                                className="w-44 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                              />
                            </div>
                            {(editForm.objectionHandlers?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteObjection(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                                title="Delete objection"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              Carrier Objection / Question:
                            </label>
                            <input
                              type="text"
                              value={obj.objection}
                              onChange={(e) => handleUpdateObjection(idx, 'objection', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                              placeholder="e.g. Your 8% fee is too high"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              Counter Answer / Closing Response:
                            </label>
                            <textarea
                              rows={2}
                              value={obj.response}
                              onChange={(e) => handleUpdateObjection(idx, 'response', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                              placeholder="e.g. A cheaper 5% dispatcher booking $2.00/mile freight leaves you with less net profit..."
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {saveStatus && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{saveStatus}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Training Content</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODULE 2: USA STATES CODES & ABBREVIATIONS */}
      {activeSubTab === 'states' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>All 50 US States, Postal Abbreviations &amp; Freight Dynamics</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Search states, view capitals, identify Headhaul (High outbound demand) vs Backhaul freight markets.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search state or code (e.g. TX, Ohio)..."
                  value={stateSearch}
                  onChange={e => setStateSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
              >
                <option value="ALL">All Regions (50 States)</option>
                <option value="Midwest">Midwest (IL, IN, OH, MI...)</option>
                <option value="Southeast">Southeast (GA, FL, NC, SC...)</option>
                <option value="South Central">South Central (TX, LA, OK...)</option>
                <option value="Northeast">Northeast (PA, NJ, NY, MA...)</option>
                <option value="Mountain">Mountain (CO, AZ, UT...)</option>
                <option value="West Coast">West Coast (CA, WA, OR...)</option>
              </select>
            </div>
          </div>

          {/* States Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredStates.map(st => {
              const isHeadhaul = st.freightRole.includes('Headhaul');
              const isBackhaul = st.freightRole.includes('Backhaul');
              return (
                <div
                  key={st.code}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      {st.code}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border font-mono ${
                      isHeadhaul 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : isBackhaul
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    }`}>
                      {isHeadhaul ? '🔥 Headhaul' : isBackhaul ? '📉 Backhaul' : '⚖️ Balanced'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {st.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Capital: <strong className="text-slate-700 dark:text-slate-300">{st.capital}</strong>
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/50 text-[10.5px] space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Time Zone:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{st.timeZone}</strong>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 truncate" title={st.keyLanes}>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Lanes: </span>
                      {st.keyLanes}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 3: USA TIME ZONES & LIVE CLOCKS */}
      {activeSubTab === 'timezones' && (
        <div className="space-y-6">
          
          {/* Live US Clocks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { zone: 'Eastern (EST/EDT)', iana: 'America/New_York', abbr: 'EST', offset: 'UTC-5', states: 'NY, FL, GA, NC, PA, OH' },
              { zone: 'Central (CST/CDT)', iana: 'America/Chicago', abbr: 'CST', offset: 'UTC-6', states: 'IL, TX, TN, MN, MO, AL' },
              { zone: 'Mountain (MST/MDT)', iana: 'America/Denver', abbr: 'MST', offset: 'UTC-7', states: 'CO, AZ, UT, NM, WY, MT' },
              { zone: 'Pacific (PST/PDT)', iana: 'America/Los_Angeles', abbr: 'PST', offset: 'UTC-8', states: 'CA, WA, OR, NV' },
              { zone: 'Alaska (AKST)', iana: 'America/Anchorage', abbr: 'AKST', offset: 'UTC-9', states: 'AK' },
              { zone: 'Hawaii (HST)', iana: 'Pacific/Honolulu', abbr: 'HST', offset: 'UTC-10', states: 'HI' }
            ].map(tz => (
              <div key={tz.abbr} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1.5">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                  {tz.abbr} ({tz.offset})
                </span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatZoneTime(tz.iana)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={tz.states}>
                  {tz.states}
                </p>
              </div>
            ))}
          </div>

          {/* Calling Strategy & Shift Windows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-5 w-5" />
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Peak Carrier Calling Windows (US Local Time)
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Reaching owner-operators at the right moment makes or breaks your conversion rate. Call them when they are awake and actively needing freight.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Window 1: 07:00 AM – 11:00 AM (Prime Load Booking Rush)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Drivers are currently unloading or delivering morning freight and desperately need their next load booked before noon so they aren't stuck empty.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-1">
                  <span className="font-bold text-blue-800 dark:text-blue-300">
                    Window 2: 03:00 PM – 05:30 PM (Next-Day Planning)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Drivers who didn't find good freight are planning tomorrow's dispatch. Excellent time for pitch calls and onboarding agreements.
                  </p>
                </div>

                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 space-y-1">
                  <span className="font-bold text-rose-800 dark:text-rose-300">
                    ❌ Avoid: 12:00 AM – 06:00 AM (Driver Sleeping / Rest Period)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Never disturb drivers during mandatory 10-hour sleeper berth breaks. Always check their local state time zone before dialing.
                  </p>
                </div>
              </div>
            </div>

            {/* Overseas Shift Mapping (Pakistan Standard Time to US) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Zap className="h-5 w-5" />
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Overseas Operations Shift (PKT to USA Timing)
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                For international dispatch branches operating in Pakistan (PKT, UTC+5), standard night shift hours perfectly align with the US business day:
              </p>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">05:00 PM PKT (Shift Clock-In)</span>
                  <span className="font-bold text-amber-500">08:00 AM EST / 07:00 AM CST</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">08:00 PM PKT (Peak Freight Rush)</span>
                  <span className="font-bold text-emerald-500">11:00 AM EST / 10:00 AM CST</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">11:00 PM PKT (West Coast Midday)</span>
                  <span className="font-bold text-blue-500">02:00 PM EST / 11:00 AM PST</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">02:00 AM PKT (Shift Wrap-Up)</span>
                  <span className="font-bold text-purple-500">05:00 PM EST / 02:00 PM PST</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODULE 4: FMCSA REGULATIONS & SAFETY BASICS */}
      {activeSubTab === 'fmcsa' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                FMCSA Compliance &amp; Verification Protocols
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              The Federal Motor Carrier Safety Administration (FMCSA) regulates all interstate commercial motor vehicles in the United States. Before pitching or onboarding any carrier, sales reps and dispatchers must verify their authority and insurance on the public <strong>FMCSA SAFER Web System</strong> (Company Snapshot).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  USDOT Number vs MC Number
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>USDOT#:</strong> Identifies the commercial company and safety records.<br />
                  <strong>MC# (Motor Carrier):</strong> The federal operating authority license allowing for-hire freight transport across state lines.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Insurance Requirements
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Auto Liability:</strong> $1,000,000 USD (Mandatory)<br />
                  <strong>Cargo Insurance:</strong> $100,000 USD (With Reefer Breakdown endorsement for refrigerated freight)<br />
                  <strong>General Liability:</strong> $1,000,000 USD (Recommended)
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Hours of Service (HOS) ELD Rules
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>11-Hour Rule:</strong> Max 11 driving hours after 10 consecutive hours off-duty.<br />
                  <strong>14-Hour Shift:</strong> Cannot drive past 14th hour of on-duty shift.<br />
                  <strong>70-Hour Rule:</strong> Max 70 on-duty hours in any 8-day rolling period.
                </p>
              </div>
            </div>

            {/* Carrier Onboarding Document Packet Checklist */}
            <div className="pt-2 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                Mandatory Carrier Onboarding Documents Packet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { title: '1. W-9 Tax Form', desc: 'Signed by carrier owner with EIN / Tax ID number' },
                  { title: '2. Certificate of Insurance (COI)', desc: 'Must list Timely Logistix as Certificate Holder' },
                  { title: '3. MC Authority Certificate', desc: 'Official FMCSA letter granting active motor carrier status' },
                  { title: '4. Dispatcher Agreement & POA', desc: 'Limited Power of Attorney authorizing us to sign RateCons' },
                  { title: '5. Notice of Assignment (NOA)', desc: 'Factoring company banking info and voided check' },
                  { title: '6. Driver & Truck Profile', desc: 'Trailer dimensions, max payload & equipment photos' },
                  { title: '7. Medical Card & CDL', desc: 'Valid Commercial Drivers License copy for primary driver' },
                  { title: '8. Safety History Check', desc: 'Zero unaddressed OOS (Out-of-Service) safety violations' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/50 dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white text-[11px] block">{doc.title}</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">{doc.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODULE 5: EQUIPMENT TYPES WITH TRUCK & TRAILER SPECIFICATIONS & REALISTIC IMAGES */}
      {activeSubTab === 'equipment' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Commercial Freight Equipment Types &amp; Payload Specifications</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Technical dimensions, payload capacities, deck heights, photo references, and dispatch strategies for every North American truck &amp; trailer configuration.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
              <span>8 Core Equipment Classes</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. 53ft Dry Van */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80"
                  alt="53ft Dry Van Enclosed Semi-Trailer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-400/40 shadow-xs backdrop-blur-xs">
                      Highest Freight Volume
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-indigo-300 backdrop-blur-xs">
                      53' x 102" x 110"
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">53ft Dry Van (Enclosed Box)</h3>
                    <p className="text-[11px] text-slate-300">Standard enclosed box trailer for palletized non-perishables</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Payload</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">~45,000 lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Pallet Count</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">26 Standard</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Inside Height</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">110 Inches</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> Retail consumer goods (CPG), electronics, packaged food, paper products, automotive parts.</p>
                  <p><strong>Required Gear:</strong> E-Track straps, 2–4 telescoping load bars, pallet jack (optional).</p>
                  <p><strong>Dispatch Strategy:</strong> Keep deadhead under 50 miles. Focus on massive triangle lanes (Chicago &rarr; Dallas &rarr; Atlanta &rarr; Midwest).</p>
                </div>
              </div>
            </div>

            {/* 2. 53ft Reefer (Refrigerated) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
                  alt="53ft Refrigerated Reefer Semi-Trailer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-cyan-400/40 shadow-xs backdrop-blur-xs">
                      High Rate Per Mile (RPM)
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-cyan-300 backdrop-blur-xs">
                      -20°F to 70°F
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">53ft Reefer (Refrigerated)</h3>
                    <p className="text-[11px] text-blue-200">Insulated trailer with Thermo King or Carrier diesel unit</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Payload</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">43,500 lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Pallet Count</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">26 Standard</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Fuel Tank</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">50 Gal Diesel</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> Fresh produce, berries, frozen meat/poultry, pharmaceuticals, dairy, ice cream (-10°F).</p>
                  <p><strong>Crucial Rules:</strong> Pre-cool trailer to set point prior to arrival. Pulp temperature probe required upon pickup. Set continuous mode.</p>
                  <p><strong>Dispatch Strategy:</strong> Book high-RPM produce out of Salinas/Fresno/Yuma/Florida, backhaul dry loads at standard rates.</p>
                </div>
              </div>
            </div>

            {/* 3. 48ft / 53ft Standard Flatbed */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&w=800&q=80"
                  alt="48ft / 53ft Standard Flatbed Trailer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-400/40 shadow-xs backdrop-blur-xs">
                      Industrial &amp; Building Material
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-amber-300 backdrop-blur-xs">
                      48,000 lbs
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">48ft / 53ft Standard Flatbed</h3>
                    <p className="text-[11px] text-amber-200">Open deck for side loading and overhead crane operations</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Deck Length</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">48ft / 53ft</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Deck Height</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">60 Inches</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Cargo Ht</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">8ft 6in Max</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> Steel coils, lumber bundles, rebar, structural steel, pipe, building materials, crated machinery.</p>
                  <p><strong>Required Gear:</strong> 4ft/6ft/8ft drop lumber tarps, steel tarps, 4" ratchet straps, Grade 70 chains &amp; binders, coil racks, dunnage timbers.</p>
                  <p><strong>Dispatch Strategy:</strong> Always negotiate tarp fees ($75–$150 extra) and coil rack premiums directly into the initial RateCon.</p>
                </div>
              </div>
            </div>

            {/* 4. 40ft / 35ft Flatbed Hotshot */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80"
                  alt="40ft / 35ft Flatbed Hotshot Dually Truck"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-rose-400/40 shadow-xs backdrop-blur-xs">
                      Expedited &amp; Oilfield Hotshot
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-rose-300 backdrop-blur-xs">
                      35ft - 40ft Gooseneck
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">40ft / 35ft Flatbed Hotshot</h3>
                    <p className="text-[11px] text-rose-200">Class 3–5 Dually pickup (F-350/F-450/Ram 3500) + Gooseneck flatbed trailer with mega ramps</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Payload</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">10k – 16.5k lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Deck Length</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">35ft – 40ft</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Deck Height</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">34" - 36" (Low)</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> Oilfield pipes/tools (Permian/Bakken), farm implements, partial flatbed loads, construction machinery, vehicles.</p>
                  <p><strong>Required Gear:</strong> Fold-over mega ramps, 4" and 2" ratchet straps, Grade 70 transport chains, 6ft drop tarps, 12,000 lbs electric winch.</p>
                  <p><strong>Dispatch Strategy:</strong> Combine 2 to 3 LTL partial shipments (stacking loads along the 40ft deck) to achieve $3.50+ combined RPM.</p>
                </div>
              </div>
            </div>

            {/* 5. Step Deck Trailer (Drop Deck) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=800&q=80"
                  alt="Step Deck Single Drop Freight Trailer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-emerald-400/40 shadow-xs backdrop-blur-xs">
                      Tall Cargo Specialist
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-emerald-300 backdrop-blur-xs">
                      10ft Cargo Clearance
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">Step Deck Trailer (Single Drop)</h3>
                    <p className="text-[11px] text-emerald-200">Two-level open deck trailer: 10ft-11ft upper deck + 37ft-43ft lower main deck</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Payload</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">~46,000 lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Lower Deck Ht</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">38" - 40" Low</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Cargo Ht</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">10ft 2in Max</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> Tall industrial machinery, agricultural tractors, forklifts, precast concrete structures, oversized crated items.</p>
                  <p><strong>Why Brokers Love It:</strong> Carries cargo up to 10ft tall legal without needing expensive oversize/over-height state DOT permits.</p>
                  <p><strong>Dispatch Strategy:</strong> Utilize the upper deck (10ft-11ft) for palletized freight/generators, and the lower deck for heavy equipment.</p>
                </div>
              </div>
            </div>

            {/* 6. Power Only (Tractor / Semi-Truck Only) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=800&q=80"
                  alt="Power Only Class 8 Semi-Tractor Truck"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-purple-400/40 shadow-xs backdrop-blur-xs">
                      Zero Trailer Maintenance
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-purple-300 backdrop-blur-xs">
                      Tractor / Hook &amp; Haul
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">Power Only (Tractor Only)</h3>
                    <p className="text-[11px] text-purple-200">Class 8 Semi-Truck providing driver &amp; 5th-wheel horsepower to pull third-party trailers</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">GCWR Capacity</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">80,000 lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Hitch Coupling</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">Standard 5th Wheel</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Trailer Types</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">All Commercial</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Operations:</strong> Drop-and-hook dry vans, pre-loaded reefers, intermodal ocean chassis, newly manufactured trailer delivery, auction relocations.</p>
                  <p><strong>Required Gear:</strong> Universal trailer interchange agreement, glad-hand air hoses, 7-way electric pigtails, load securement locks.</p>
                  <p><strong>Dispatch Strategy:</strong> Lock in round-trip drop-and-hook contracts (Amazon Relay, J.B. Hunt 360, Schneider) with zero loading/unloading detention wait times.</p>
                </div>
              </div>
            </div>

            {/* 7. Gooseneck / RGN Trailer (Removable Gooseneck / Lowboy) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1580901368919-7738efb0f87e?auto=format&fit=crop&w=800&q=80"
                  alt="Removable Gooseneck RGN Lowboy Heavy Haul Trailer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-yellow-400/40 shadow-xs backdrop-blur-xs">
                      Heavy Haul &amp; Drive-On
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-yellow-300 backdrop-blur-xs">
                      Up to 150k+ lbs
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">Gooseneck / RGN (Removable Gooseneck Lowboy)</h3>
                    <p className="text-[11px] text-yellow-200">Hydraulic detachable gooseneck drops to ground for drive-on loading of heavy machinery</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Payload Range</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">45k–150k+ lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Well Deck Ht</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">18" - 24" Low</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Cargo Ht</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">11ft 6in Max</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> Excavators, tracked bulldozers, heavy cranes, mining equipment, massive transformers, military combat vehicles.</p>
                  <p><strong>Required Gear:</strong> Heavy 1/2" Grade 100 transport chains, ratchet chain binders, oversized load warning banners, revolving amber beacon lights, outriggers.</p>
                  <p><strong>Dispatch Strategy:</strong> Highest rates in the freight industry ($5.00–$12.00+ RPM). Require state DOT oversized permits and pilot escort cars for superloads.</p>
                </div>
              </div>
            </div>

            {/* 8. 26ft Box Truck (Commercial Straight Truck) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80"
                  alt="26ft Commercial Straight Box Truck with Liftgate"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-teal-400/40 shadow-xs backdrop-blur-xs">
                      Expedited &amp; Final Mile
                    </span>
                    <span className="h-7 px-3 bg-slate-900/90 rounded-lg border border-slate-700 flex items-center font-mono font-bold text-xs text-teal-300 backdrop-blur-xs">
                      12 Pallets
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-display text-white">26ft Box Truck (Straight Truck)</h3>
                    <p className="text-[11px] text-teal-200">Dock-high commercial straight truck with hydraulic liftgate (Class B / Non-CDL)</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Max Payload</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">8,000–10,000 lbs</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Pallet Count</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">12 Pallets</strong>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Door Opening</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">96" - 102" H</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <p><strong>Primary Freight:</strong> LTL partials, retail store fixture deliveries, Amazon Relay, medical equipment, residential liftgate delivery.</p>
                  <p><strong>Required Gear:</strong> Hydraulic Tuckaway liftgate (2,500+ lbs capacity), manual/electric pallet jack, 8+ ratchet straps, moving blankets.</p>
                  <p><strong>Dispatch Strategy:</strong> Combine multiple LTL partial pickups in metro areas or run regional dedicated routes at $2.50+ RPM.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODULE 6: LOADING & UNLOADING TOOLS & GEAR */}
      {activeSubTab === 'tools' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Essential Cargo Handling Tools &amp; Loading/Unloading Equipment</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Knowledge of physical truck accessories required for shipper check-in, load securement, and dock handling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {[
              {
                title: 'Hydraulic Pallet Jack',
                category: 'Material Handling',
                desc: '5,500 lbs capacity manual hydraulic or electric pump walkie jack. Allows drivers to move standard 48x40 wooden pallets inside the box and onto liftgates.'
              },
              {
                title: 'Hydraulic Liftgate',
                category: 'Dock Access',
                desc: 'Mechanical platform (Tuckaway or Railgate, 2,500–3,300 lbs capacity) mounted to the rear frame to lower cargo from trailer floor to ground level.'
              },
              {
                title: 'Telescoping Cargo Load Bars',
                category: 'Load Securement',
                desc: 'Steel or aluminum tension bars that lock into trailer walls to prevent freight from tipping forward or sliding backwards during emergency braking.'
              },
              {
                title: 'E-Track Ratchet Straps',
                category: 'Load Securement',
                desc: '2-inch heavy-duty polyester webbing straps with spring-loaded E-track clips. 1,000–1,500 lbs working load limit (WLL) per strap.'
              },
              {
                title: '4" Heavy Ratchet Straps',
                category: 'Flatbed Rigging',
                desc: '4-inch wide webbing with heavy ratchet winches and flat hooks for securing steel, lumber, and heavy machinery to flatbed rub rails (5,400 lbs WLL).'
              },
              {
                title: 'Corner Protectors / VeeBoards',
                category: 'Freight Protection',
                desc: 'Molded plastic or high-density rubber V-guards placed under tension straps to prevent strap abrasion from cutting into cardboard boxes, drywall, or lumber.'
              },
              {
                title: 'Lumber & Steel Tarps',
                category: 'Weather Protection',
                desc: '18oz heavy waterproof vinyl tarps (4ft, 6ft, or 8ft drop) with multiple rows of stainless steel D-rings and heavy rubber bungees for flatbed loads.'
              },
              {
                title: 'Coil Racks & Dunnage Beams',
                category: 'Steel Coil Hauling',
                desc: 'Steel coil saddles and 4x4 treated hardwood timbers used to cradle 10,000–45,000 lbs cylindrical steel coils securely in suicide or shotgun positions.'
              },
              {
                title: 'Digital Pulp Thermometer',
                category: 'Food Safety (Reefer)',
                desc: 'Stainless steel temperature probe used to measure internal core temperature of meat, poultry, and produce before signing Bill of Lading (BOL).'
              },
              {
                title: 'Personal Protective Equipment (PPE)',
                category: 'Shipper Safety Compliance',
                desc: 'High-visibility safety vest (Class 2), OSHA-approved steel-toe safety boots, hard hat, safety glasses, and cut-resistant gloves required at all industrial docks.'
              }
            ].map((tool, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-mono">
                    {tool.category}
                  </span>
                  <Wrench className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {tool.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 7: INTERACTIVE TRAINEE KNOWLEDGE QUIZ */}
      {activeSubTab === 'quiz' && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-500" />
                <span>Sales Rep &amp; Dispatcher Knowledge Examination</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Answer all questions to test your proficiency in equipment, US states, time zones, and outreach pitches.
              </p>
            </div>

            {quizSubmitted && (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-center">
                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Your Score</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {calculateQuizScore()} / {QUIZ_QUESTIONS.length} ({Math.round((calculateQuizScore() / QUIZ_QUESTIONS.length) * 100)}%)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            )}
          </div>

          {/* Quiz Questions List */}
          <div className="space-y-6">
            {QUIZ_QUESTIONS.map((q, qIdx) => {
              const isAnswered = quizAnswers[qIdx] !== undefined;
              const isCorrect = quizAnswers[qIdx] === q.correct;

              return (
                <div
                  key={qIdx}
                  className={`p-5 rounded-2xl border transition-all ${
                    quizSubmitted
                      ? isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {q.question}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = quizAnswers[qIdx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                              className={`p-3 rounded-xl text-xs text-left transition-all border flex items-center gap-2.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                              } ${quizSubmitted && optIdx === q.correct ? 'ring-2 ring-emerald-500 font-bold' : ''}`}
                            >
                              <span className={`h-4 w-4 rounded-full border text-[10px] flex items-center justify-center font-mono shrink-0 ${
                                isSelected ? 'border-white text-white' : 'border-slate-400 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className={`p-3 rounded-xl text-xs font-medium ${
                          isCorrect ? 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100/60 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                        }`}>
                          <p><strong>{isCorrect ? '✓ Correct!' : '✗ Incorrect.'}</strong> {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          {!quizSubmitted && (
            <div className="flex justify-end pt-4">
              <button
                disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                onClick={() => setQuizSubmitted(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm shadow-md cursor-pointer flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit Final Exam Answers ({Object.keys(quizAnswers).length}/{QUIZ_QUESTIONS.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
