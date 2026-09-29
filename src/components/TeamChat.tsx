/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, Dispatcher, ChatMessage } from '../types';
import { 
  Send, 
  Camera, 
  Upload, 
  UserCheck, 
  ShieldCheck, 
  MessageSquare, 
  Plus, 
  Phone, 
  Clock, 
  Smile,
  Copy,
  Check,
  Trash2,
  Users,
  Bell,
  BellOff,
  Reply,
  X,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { playNotificationChime, requestNotificationPermission } from '../utils/notifications';

interface TeamChatProps {
  currentUser: User;
  dispatchers: Dispatcher[];
  messages: ChatMessage[];
  onSendMessage: (content: string, replyTo?: { id: string; senderName: string; content: string }) => void;
  onUpdateProfilePhoto: (userId: string, photoBase64: string) => void;
  users: User[];
  onAddTeamMember: (name: string, email: string, pass: string, role: string, phone: string, joinCompanyId?: string, newCompanyName?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onRemoveTeamMember: (userId: string) => Promise<void> | void;
  onSendBroadcast?: (title: string, message: string, type: 'INFO' | 'WARNING' | 'ALERT') => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
}

const EMOJI_PALETTE = ['👍', '❤️', '🔥', '👏', '✅', '😂', '🚚', '⭐'];

export default function TeamChat({
  currentUser,
  dispatchers,
  messages,
  onSendMessage,
  onUpdateProfilePhoto,
  users,
  onAddTeamMember,
  onRemoveTeamMember,
  onSendBroadcast,
  onReactToMessage
}: TeamChatProps) {
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const [activeEmojiPickerMsgId, setActiveEmojiPickerMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef<number>(messages.length);

  // Notification and Sound Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tl_chat_sound_enabled') !== 'false';
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  
  // Tab for sidebar list: ROSTER (Dispatchers) or TEAM (Users Directory / Join Codes)
  const [sidebarTab, setSidebarTab] = useState<'ROSTER' | 'TEAM'>('ROSTER');
  const [copiedLink, setCopiedLink] = useState(false);

  // Form for adding team members directly (Admins only)
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'DISPATCHER' | 'SALES'>('DISPATCHER');
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // States for company broad alert casting
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'INFO' | 'WARNING' | 'ALERT'>('INFO');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Synthesize pleasant notification bell chime using Web Audio API
  const playNotificationChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;

      // Primary chime tone (High crystal bell - 880Hz / A5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Harmonizing overtone (1318.5Hz / E6)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.08);
      gain2.gain.setValueAtTime(0.22, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.65);
    } catch {
      // Audio not permitted or locked by autoplay
    }
  };

  // Request browser notification permission
  const requestNotificationAccess = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
  };

  // Monitor incoming messages to trigger chime and browser notification
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg && latestMsg.senderId !== currentUser.id) {
        // Play notification bell chime
        playNotificationChime();

        // Display browser/mobile notification if authorized
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`💬 ${latestMsg.senderName} (${latestMsg.senderRole === 'ADMIN' ? 'Owner' : 'Dispatch'})`, {
              body: latestMsg.content,
              tag: `tl_chat_${latestMsg.id}`
            });
          } catch {
            // Notification display fallback
          }
        }
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, currentUser.id, soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('tl_chat_sound_enabled', String(next));
      if (next) {
        // brief preview chime
        setTimeout(playNotificationChime, 50);
      }
      return next;
    });
  };

  const handleSendBroadcastSubmit = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    if (onSendBroadcast) {
      onSendBroadcast(broadcastTitle.trim(), broadcastMessage.trim(), broadcastType);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastType('INFO');
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 3000);
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}?inviteCode=${currentUser.companyId || 'DEFAULT_COMPANY'}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFeedback(null);

    if (!addName.trim() || !addEmail.trim() || !addPhone.trim() || !addPassword) {
      setAddFeedback({ type: 'err', text: 'All fields are required.' });
      return;
    }

    try {
      const res = await onAddTeamMember(
        addName.trim(),
        addEmail.toLowerCase().trim(),
        addPassword,
        addRole,
        addPhone.trim(),
        currentUser.companyId || 'DEFAULT_COMPANY',
        undefined
      );

      if (res.success) {
        setAddFeedback({ type: 'success', text: `Registered ${addName} successfully!` });
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddPassword('');
        setTimeout(() => setAddFeedback(null), 3000);
      } else {
        setAddFeedback({ type: 'err', text: res.error || 'Failed to add member' });
      }
    } catch (err: any) {
      setAddFeedback({ type: 'err', text: err.message || 'Operation failed' });
    }
  };
  
  // Quick pre-selected messages for fast dispatch coordination
  const fastReplies = [
    "Load is booked! 👍",
    "Driver is on-site.",
    "Checking with the broker now.",
    "POD has been received.",
    "Driver needs fuel advance support."
  ];

  // Auto-scroll to the bottom of the chat stream
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content.trim(), replyingTo || undefined);
    setContent('');
    setReplyingTo(null);
  };

  const handleQuickSend = (text: string) => {
    onSendMessage(text, replyingTo || undefined);
    setReplyingTo(null);
  };

  // Staff photo reader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfilePhoto(currentUser.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (messageId: string, emoji: string) => {
    if (onReactToMessage) {
      onReactToMessage(messageId, emoji);
    }
    setActiveEmojiPickerMsgId(null);
  };

  return (
    <div id="team_chat_workspace" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8.5rem)] min-h-[520px] max-h-[calc(100vh-8.5rem)]">
      
      {/* LEFT COLUMN: STAFF PROFILE & DISPATCH ROSTER */}
      <div className="lg:col-span-1 space-y-4 flex flex-col h-full min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        
        {/* Active User Staff Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">My Staff Profile</h3>
          </div>
          
          <div className="flex flex-col items-center text-center p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
            {/* Avatar with dynamic photo upload overlay */}
            <div className="relative group mb-3">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  className="h-20 w-20 rounded-full object-cover border-2 border-white ring-4 ring-blue-500/10 shadow-md"
                  alt={currentUser.name}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-white ring-4 ring-blue-500/10 text-white font-extrabold text-2xl flex items-center justify-center shadow-md font-display">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                id="staff_photo_upload_btn"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <label
                htmlFor="staff_photo_upload_btn"
                className="absolute inset-0 bg-slate-900/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold backdrop-blur-xs"
              >
                <Camera className="h-5 w-5 mb-1" />
                <span className="text-[10px]">Change</span>
              </label>
            </div>

            <h4 className="font-bold text-slate-850 text-sm">{currentUser.name}</h4>
            <p className="text-xs text-slate-500 font-mono mb-2">{currentUser.username}</p>
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-2xs font-extrabold uppercase tracking-wide border border-blue-200/60">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{currentUser.role === 'ADMIN' ? 'Owner / SuperAdmin' : currentUser.role}</span>
            </div>
          </div>
        </div>

        {/* Company Broadcast Card (Admin Only) */}
        {currentUser.role === 'ADMIN' && (
          <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 rounded-2xl border border-indigo-150 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Flash Broadcast Alert
              </span>
              <span className="text-[9px] font-bold text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                All Devices
              </span>
            </div>

            {broadcastSuccess && (
              <div className="p-2 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg text-center animate-fade-in">
                Broadcast popped on all screens!
              </div>
            )}

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Alert Headline (e.g. Urgent Meeting)"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
              />
              <textarea
                rows={2}
                placeholder="Write announcement message that will pop up on all screens..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <select
                  value={broadcastType}
                  onChange={e => setBroadcastType(e.target.value as any)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none"
                >
                  <option value="INFO">Standard Notice</option>
                  <option value="WARNING">Important Warning</option>
                  <option value="ALERT">Urgent Emergency</option>
                </select>
                <button
                  type="button"
                  onClick={handleSendBroadcastSubmit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Flash Alert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Staff Directory Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSidebarTab('ROSTER')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sidebarTab === 'ROSTER' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Roster ({dispatchers.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('TEAM')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sidebarTab === 'TEAM' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Team ({users.length})
              </button>
            </div>

            {currentUser.role === 'ADMIN' && sidebarTab === 'TEAM' && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Add New Member"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Invite Link Generator */}
          {sidebarTab === 'TEAM' && (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl mb-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">Invite Code:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-extrabold">
                  {currentUser.companyId || 'DEFAULT_COMPANY'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Direct Invite Link'}</span>
              </button>
            </div>
          )}

          {/* Admin Member Registration Form Dropdown */}
          {showAddForm && sidebarTab === 'TEAM' && (
            <form onSubmit={handleAddMemberSubmit} className="p-3 bg-blue-50/50 border border-blue-150 rounded-xl mb-3 space-y-2 text-xs">
              <div className="font-bold text-blue-900 flex items-center justify-between">
                <span>Create Seat Account</span>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>

              {addFeedback && (
                <div className={`p-1.5 rounded text-[11px] font-semibold ${addFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {addFeedback.text}
                </div>
              )}

              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                value={addName}
                onChange={e => setAddName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Login Username / Email"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Phone"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  value={addPassword}
                  onChange={e => setAddPassword(e.target.value)}
                />
              </div>
              <select
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                value={addRole}
                onChange={e => setAddRole(e.target.value as any)}
              >
                <option value="DISPATCHER">Dispatcher</option>
                <option value="SALES">Sales Agent</option>
              </select>
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Create Account
              </button>
            </form>
          )}

          {/* List items */}
          <div className="space-y-2 overflow-y-auto max-h-[350px] scrollbar-thin pr-1">
            {sidebarTab === 'ROSTER' ? (
              dispatchers.map(disp => (
                <div
                  key={disp.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {disp.profilePhoto ? (
                        <img
                          src={disp.profilePhoto}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          alt={disp.name}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center uppercase font-mono">
                          {disp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400/20" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{disp.name}</h5>
                      <p className="text-[10px] text-slate-400 truncate">{disp.phone || disp.username}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                      {disp.assignedDriverIds?.length || 0} Drvs
                    </span>
                  </div>
                </div>
              ))
            ) : (
              users.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {u.profilePhoto ? (
                        <img
                          src={u.profilePhoto}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          alt={u.name}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center uppercase font-mono">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{u.name}</h5>
                      <p className="text-[10px] text-slate-400 truncate">{u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase font-mono ${
                      u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role === 'ADMIN' ? 'Owner' : u.role}
                    </span>
                    {currentUser.role === 'ADMIN' && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${u.name} permanently from the team?`)) {
                            onRemoveTeamMember(u.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: MAIN CHAT FEED & MESSAGE BOX */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
        
        {/* Chat Room Header */}
        <div className="shrink-0 p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shadow-2xs">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">Inside Dispatcher Chat Room</h3>
              <p className="text-[10px] text-slate-400">Team channels synced securely across all dispatch devices</p>
            </div>
          </div>
          
          {/* Audio Chime and Browser Notification Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundEnabled ? 'Bell chime enabled (Click to mute)' : 'Bell chime muted (Click to enable)'}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-blue-600" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
              <span className="text-[11px] font-mono">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={requestNotificationAccess}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Browser & Mobile Notification Center"
            >
              {notificationPermission === 'granted' ? (
                <Bell className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <BellOff className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              )}
              <span className="text-[11px] font-mono">
                {notificationPermission === 'granted' ? 'Alerts Active' : 'Enable Push Alerts'}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full font-mono scale-90">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYNCED</span>
            </div>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 space-y-4 bg-slate-50/35 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="p-3.5 bg-slate-100 rounded-full text-slate-400 animate-bounce">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No dispatch chats yet</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Start typing below to communicate instantly with E &amp; G, Frederick, or other coordinators on duty.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              const reactions = msg.reactions || {};
              const hasReactions = Object.keys(reactions).length > 0;

              return (
                <div
                  key={msg.id}
                  className={`group relative flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Sender Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {(() => {
                      const userPhoto = msg.senderPhoto ||
                        users.find(u => u.id === msg.senderId || u.username?.toLowerCase() === msg.senderName?.toLowerCase())?.profilePhoto ||
                        dispatchers.find(dp => dp.id === msg.senderId || dp.username?.toLowerCase() === msg.senderName?.toLowerCase())?.profilePhoto;
                      
                      if (userPhoto) {
                        return (
                          <img
                            src={userPhoto}
                            className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 shadow-xs"
                            alt={msg.senderName}
                          />
                        );
                      }
                      return (
                        <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase font-mono shadow-sm">
                          {msg.senderName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Message body */}
                  <div className={`max-w-[75%] space-y-1.5 ${isMe ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="font-bold text-slate-500 truncate">{msg.senderName}</span>
                      <span className="bg-slate-200/80 text-slate-600 text-[8px] font-extrabold px-1.5 rounded uppercase font-mono tracking-wider scale-95">
                        {msg.senderRole === 'ADMIN' ? 'Owner' : 'Dispatch'}
                      </span>
                      <span>•</span>
                      <span>{formattedTime}</span>
                    </div>

                    {/* Quoted Reply Banner */}
                    {msg.replyTo && (
                      <div className={`px-3 py-1.5 rounded-xl text-2xs border text-left mb-1 ${
                        isMe
                          ? 'bg-blue-700/80 border-blue-500 text-blue-100'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        <div className="font-bold flex items-center gap-1 opacity-90">
                          <Reply className="h-2.5 w-2.5" />
                          <span>Replying to {msg.replyTo.senderName}</span>
                        </div>
                        <p className="truncate opacity-80 italic mt-0.5">{msg.replyTo.content}</p>
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`relative px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs break-words ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-850 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Emoji Reactions List Display */}
                    {hasReactions && (
                      <div className={`flex flex-wrap gap-1 items-center mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(reactions).map(([emoji, usersList]) => {
                          const reactedByMe = usersList.includes(currentUser.name);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiClick(msg.id, emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                                reactedByMe
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold scale-105'
                                  : 'bg-white text-slate-750 border-slate-200 hover:border-slate-300'
                              }`}
                              title={`Reacted by: ${usersList.join(', ')}`}
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] font-mono">{usersList.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Bar (Reply & Quick React Trigger) */}
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}>
                      {/* Quick Reply Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo({
                            id: msg.id,
                            senderName: msg.senderName,
                            content: msg.content
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-2xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reply to message"
                      >
                        <Reply className="h-3 w-3" />
                        <span>Reply</span>
                      </button>

                      {/* Emoji Trigger Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveEmojiPickerMsgId(activeEmojiPickerMsgId === msg.id ? null : msg.id)}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-2xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Add reaction emoji"
                        >
                          <Smile className="h-3 w-3" />
                          <span>React</span>
                        </button>

                        {/* Floating Emoji Picker Palette */}
                        {activeEmojiPickerMsgId === msg.id && (
                          <div className="absolute bottom-full mb-1 z-30 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-lg flex items-center gap-1 animate-scale-in">
                            {EMOJI_PALETTE.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiClick(msg.id, emoji)}
                                className="p-1 hover:bg-slate-100 rounded-lg text-sm transition-transform hover:scale-125 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fast Coordination Replies */}
        <div className="shrink-0 px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5 items-center">
          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wide mr-1.5">
            Quick Replies:
          </span>
          {fastReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleQuickSend(reply)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 text-slate-650 hover:text-blue-600 rounded-lg text-2xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Replying Banner Above Composer */}
        {replyingTo && (
          <div className="shrink-0 px-4 py-2 bg-blue-50 border-t border-blue-200/70 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2 truncate">
              <Reply className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold">Replying to {replyingTo.senderName}:</span>
              <span className="truncate italic text-blue-700/80">"{replyingTo.content}"</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
              title="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSubmit} className="shrink-0 p-3.5 border-t border-slate-100 flex gap-2 bg-white">
          <input
            type="text"
            placeholder={replyingTo ? `Replying to ${replyingTo.senderName}...` : "Write team message... (supports Shift+Enter)"}
            className="flex-grow px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none focus:bg-white focus:border-blue-500"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow shadow-blue-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

      </div>

    </div>
  );
}
