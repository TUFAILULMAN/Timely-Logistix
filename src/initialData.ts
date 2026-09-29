/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Dispatcher, Driver, Load, ClockRecord, CarrierOrOwner, Lead, SalesDailyLog, DriverAdvance, FinancialTransaction, PendingDriverPayment, Invoice, BrokerContact, DriverDailyPosting, TrainingScriptConfig, HRStaffProfile, LeaveRequest, SalarySlip } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'Jack Rehan', role: 'ADMIN', password: 'admin123' }
];

export const INITIAL_CARRIERS: CarrierOrOwner[] = [];

export const INITIAL_DISPATCHERS: Dispatcher[] = [];

export const INITIAL_DRIVERS: Driver[] = [];

export const INITIAL_LOADS: Load[] = [];

const getIsoDateStr = (daysAgo: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_ATTENDANCE: ClockRecord[] = [];

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_SALES_LOGS: SalesDailyLog[] = [];

export const INITIAL_ADVANCES: DriverAdvance[] = [];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];

export const INITIAL_PENDING_PAYMENTS: PendingDriverPayment[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_BROKERS: BrokerContact[] = [];

export const INITIAL_DRIVER_POSTINGS: DriverDailyPosting[] = [];

export const INITIAL_TRAINING_SCRIPTS: TrainingScriptConfig = {
  coldCallTitle: "Carrier Cold Call Pitch (60 Seconds)",
  coldCallScript: `"Hello, is this [Owner Name]? Hi [Owner Name], my name is [Your Name] with Timely Logistix. I noticed your active MC# [MC Number] and saw you operate [Dry Van/Reefer/Flatbed] equipment.

We have dedicated direct freight shippers in your key lanes offering $2.80 - $3.40 RPM with zero forced dispatch. We handle all rate negotiations, detention claims, and paperwork for a flat 7-8% commission so you stay driving and profitable.

Do you currently have an open truck available in the Midwest/South this week?"`,
  emailScriptSubject: "High-Paying Loads for MC# [MC Number] - [Equipment Type]",
  emailScriptBody: `Dear [Owner / Carrier Name],

I hope you're having a safe week on the road!

My name is [Your Name] from Timely Logistix Dispatch Services. We partner with independent owner-operators and small fleets running [Dry Van / Reefer / Flatbed / Box Truck] to secure top-dollar market rates.

Why carriers choose Timely Logistix:
✓ Premium Gross Rates: Average $6,500 - $9,000+ weekly gross per truck
✓ No Forced Dispatch: You approve every load, rate, and lane before booking
✓ 24/7 Back-Office Support: We handle broker setup, rate confirmations, check calls, and detention recovery
✓ Fair 7-8% Commission (No contract lock-in, cancel anytime)

Do you have any trucks empty today or looking for dedicated outbound lanes? Reply with your current location and desired rate, and I'll send over available options immediately.

Best regards,
[Your Name]
Timely Logistix Fleet Dispatch
Phone: (555) 123-4567 | Email: dispatch@timelylogistix.com`,
  dispatchPitchScript: `Broker Rate Negotiation Script:
"Hi [Broker Name], this is [Your Name] dispatching for [Carrier Name], MC# [MC Number]. I'm looking at your load posted from [Origin City, ST] to [Destination City, ST] for [Equipment Type].

Our truck is empty right now at [Location] with clean trailer, load locks, and perfect safety rating. The posted rate is $[Posted Rate], but with current diesel prices and deadhead, we need $[Target Rate] to lock this in and dispatch our driver immediately. Can you meet us at $[Target Rate]?"`,
  objectionHandlers: [
    {
      id: 'obj_1',
      objection: "I already have a dispatcher / I dispatch myself.",
      response: "That's great! Are they keeping your gross consistently above $7,000/week? If you ever have a slow day, get stuck with a bad rate, or need a high-paying backhaul load, keep our number on file with zero obligation or contracts.",
      category: "Dispatcher"
    },
    {
      id: 'obj_2',
      objection: "Your 8% commission fee is too high.",
      response: "A cheaper 5% dispatcher booking cheap $2.00/mile freight leaves you with less profit than an aggressive dispatcher booking $3.20/mile freight. We make you more money net in your pocket every single week after our fee.",
      category: "Pricing"
    },
    {
      id: 'obj_3',
      objection: "The freight market is too slow / rates are down right now.",
      response: "That's exactly why you need dedicated dispatchers with direct broker relationships across all major load boards fighting for top rates and detention compensation while you focus 100% on driving safely.",
      category: "Market"
    },
    {
      id: 'obj_4',
      objection: "I don't want to sign any long-term contracts.",
      response: "We have zero long-term contracts! We work load-by-load. You approve every single load, rate confirmation, and lane before we book it. If you're not 100% satisfied, you can walk away anytime.",
      category: "Contract"
    },
    {
      id: 'obj_5',
      objection: "How do I know I will get paid on time?",
      response: "You get paid directly by the broker or your factoring company on every load. We never hold your freight money. We simply invoice our 7-8% dispatch fee after you are paid.",
      category: "Payment"
    }
  ]
};

export const INITIAL_HR_PROFILES: HRStaffProfile[] = [];

export const INITIAL_LEAVES: LeaveRequest[] = [];

export const INITIAL_SALARY_SLIPS: SalarySlip[] = [];






