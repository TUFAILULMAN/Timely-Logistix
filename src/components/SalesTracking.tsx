/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatcher, Load, Driver } from '../types';
import { Award, Target, TrendingUp, Users, DollarSign, ArrowUpRight } from 'lucide-react';

interface SalesTrackingProps {
  dispatchers: Dispatcher[];
  loads: Load[];
  drivers: Driver[];
}

export default function SalesTracking({ dispatchers, loads, drivers }: SalesTrackingProps) {
  
  // Assemble dynamic sales analytics for each dispatcher
  const dispatchersStats = dispatchers.map(disp => {
    const dispLoads = loads.filter(l => l.dispatcherId === disp.id);
    const grossLoads = dispLoads.reduce((sum, l) => sum + l.loadAmount, 0);
    const assignedDrivers = drivers.filter(dr => dr.assignedDispatcherId === disp.id).length;

    // Calculate dispatch revenue based on they commission or default 8%
    const dispatchRevenue = dispLoads.reduce((sum, l) => {
      return sum + (l.loadAmount * disp.commissionPercent) / 100;
    }, 0);

    return {
      id: disp.id,
      name: disp.name,
      username: disp.username,
      bookedLoads: dispLoads.length,
      grossLoads,
      dispatchRevenue,
      assignedDrivers
    };
  });

  // Sort by Dispatch Revenue generated to make the Leaderboard!
  const leaderboard = [...dispatchersStats].sort((a, b) => b.dispatchRevenue - a.dispatchRevenue);

  // Totals
  const totalBookings = dispatchersStats.reduce((sum, s) => sum + s.bookedLoads, 0);
  const totalGrossValue = dispatchersStats.reduce((sum, s) => sum + s.grossLoads, 0);
  const totalDispatchRevenue = dispatchersStats.reduce((sum, s) => sum + s.dispatchRevenue, 0);

  return (
    <div id="sales_tracking" className="space-y-6">

      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm col-span-full">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
          Dispatcher Sales &amp; booking leaderboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics evaluating dispatcher bookings, carrier carriage, and sales conversions.
        </p>
      </div>

      {/* Overall Sales Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Booked Loads</span>
          <div className="mt-2.5 flex justify-between items-baseline">
            <h2 className="text-2xl font-bold text-slate-800 font-mono">{totalBookings} runs</h2>
            <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Full active status</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Fleet Carriage Booked</span>
          <div className="mt-2.5 flex justify-between items-baseline">
            <h2 className="text-2xl font-bold text-slate-800 font-mono">
              ${totalGrossValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h2>
            <span className="text-xs text-slate-400 font-mono">Gross ledger</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Dispatch Agency commission</span>
          <div className="mt-2.5 flex justify-between items-baseline">
            <h2 className="text-2xl font-bold text-blue-600 font-mono">
              ${totalDispatchRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h2>
            <span className="text-xs text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded">8% average</span>
          </div>
        </div>
      </div>

      {/* Leaderboard and Dispatcher performance comparative Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Card (Owner favorite) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold tracking-tight text-white font-display flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400 animate-pulse" />
              <span>Performance Leaderboard</span>
            </h2>
            <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-mono">Remit standings</span>
          </div>

          <div className="space-y-4">
            {leaderboard.map((disp, idx) => {
              const trophies = ['🏆', '🥈', '🥉'];
              return (
                <div
                  key={disp.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    idx === 0
                      ? 'bg-white/10 border-amber-400/30'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{trophies[idx] || '⭐'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-normal">{disp.name}</h4>
                      <div className="text-[10px] text-indigo-200 mt-0.5 font-sans font-medium">
                        {disp.bookedLoads} Booked Loads &bull; {disp.assignedDrivers} Drivers
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-indigo-300 font-mono uppercase block">Dispatch Rev</span>
                    <strong className="text-sm font-mono text-emerald-400">
                      ${disp.dispatchRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Dispatcher Metrics Comparative Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Comparative Revenue Matrix
            </h2>
            <span className="text-xs text-slate-400 font-semibold font-mono uppercase">Full breakdown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider pb-3">
                  <th className="pb-3 px-3">Dispatcher Full Name</th>
                  <th className="pb-3 px-3 text-center">Booked Runs</th>
                  <th className="pb-3 px-3 text-right">Gross load Bookings</th>
                  <th className="pb-3 px-3 text-right">Dispatch Revenue</th>
                  <th className="pb-3 px-3 text-center">Assigned Drivers</th>
                  <th className="pb-3 px-3 text-right">Average Book rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {dispatchersStats.map(s => {
                  const averageBookValue = s.bookedLoads ? Math.round(s.grossLoads / s.bookedLoads) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-4 px-3 text-center font-mono font-medium text-slate-700">{s.bookedLoads}</td>
                      <td className="py-4 px-3 text-right font-mono text-slate-750 font-bold">${s.grossLoads.toLocaleString()}</td>
                      <td className="py-4 px-3 text-right font-mono font-bold text-emerald-600">${s.dispatchRevenue.toLocaleString()}</td>
                      <td className="py-4 px-3 text-center text-slate-500 font-medium">🏷️ {s.assignedDrivers} active</td>
                      <td className="py-4 px-3 text-right font-mono text-blue-600 font-semibold">${averageBookValue.toLocaleString()} / run</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
