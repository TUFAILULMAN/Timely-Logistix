/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'DISPATCHER' | 'SALES';

export interface SeatPermissions {
  canAccessDashboard?: boolean;
  canAccessInvoicing?: boolean;
  canAccessDriverPayout?: boolean;
  canAccessTransactionVault?: boolean;
  canAccessCarrierCRM?: boolean;
  canAccessCorporateReports?: boolean;
  canAccessDailyAssignment?: boolean;
  canAccessDriverIndex?: boolean;
  onlyAssignedDrivers?: boolean;
  canAccessLoadBoard?: boolean;
  onlyAssignedLoads?: boolean; // When true, only his loads show on Load Board
  canAccessTimeClock?: boolean;
  canAccessTools?: boolean;
  canAccessSalesCRM?: boolean;
  canAccessTeamSeats?: boolean;
  canAccessTeamChat?: boolean;
  canAccessBrokers?: boolean;
  canAccessTraining?: boolean;
  isFullAccess?: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  dispatcherId?: string; // Links to profile if DISPATCHER or SALES
  password?: string; // Centralized password for app verification
  profilePhoto?: string; // Custom Base64 profile photo
  companyId?: string; // Company tenant identifier
  targetUSD?: number;
  dailyTargetUSD?: number;
  weeklyTargetUSD?: number;
  monthlyTargetUSD?: number;
  baseSalaryPKR?: number;
  bonusPercent?: number;
  permissions?: SeatPermissions;
}

export interface Dispatcher {
  id: string;
  name: string;
  username: string;
  password?: string; // Offline & centralized password
  phone: string;
  assignedDriverIds: string[]; // List of driver IDs
  commissionPercent: number; // e.g., 8
  notes?: string;
  profilePhoto?: string; // Custom Base64 profile photo
  companyId?: string; // Company tenant identifier
  targetUSD?: number;
  dailyTargetUSD?: number;
  weeklyTargetUSD?: number;
  monthlyTargetUSD?: number;
  baseSalaryPKR?: number;
  bonusPercent?: number;
  sortOrder?: number;
}

export interface DriverDocumentInfo {
  name: string;
  base64: string;
  expirationDate?: string;
  uploadedAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  truckNum: string;
  truckType: string; // e.g. Dry Van, Reefer, Flatbed, Power Only, 26ft Box truck, 53ft dry van
  defaultPayoutPercent: number; // Flexible fee percent (e.g. 8%, 10%, 18% or 22%)
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  assignedDispatcherId?: string; // Dispatcher ID who manages them
  carrierId?: string; // Optional Owner Operator or Carrier ID link
  driverType: 'OWNER_OPERATOR' | 'COMPANY_DRIVER'; // e.g. owner-operator or company driver
  workingUnderName: string; // e.g., working under Frederick or under E & G
  notes?: string;
  profilePhoto?: string; // Custom Base64 profile photo
  companyId?: string; // Company tenant identifier
  sortOrder?: number;

  // Equipment & Truck Specifications
  truckSpecCategory?: 'REGULAR' | 'BUSINESS' | 'COMMERCIAL'; // Regular vs Business / Commercial Truck Spec
  insideHeight?: string; // e.g., '102"' or '96"'
  insideLength?: string; // e.g., '26 ft' or '24 ft' or '53 ft'
  insideWidth?: string; // e.g., '102"' or '96"'
  doorClearanceHeight?: string; // e.g., '98"'
  doorClearanceWidth?: string; // e.g., '92"'
  floorMaterial?: 'WOOD_FLOOR' | 'ALUMINUM_FLOOR' | 'STEEL_FLOOR' | 'COMPOSITE';

  // Necessary Tools & Equipment
  hasLiftgate?: boolean;
  liftgateType?: string; // e.g., 'Tuckaway', 'Railgate', 'Cantilever', 'Hydraulic'
  hasPalletJack?: boolean;
  palletJackType?: 'MANUAL' | 'ELECTRIC' | 'BOTH' | 'NONE';
  hasETracks?: boolean;
  eTrackDetails?: string; // e.g., '2 Rows Full Length'
  hasRatchetStraps?: boolean;
  ratchetStrapsCount?: number;
  hasLoadBars?: boolean;
  loadBarsCount?: number;
  hasMovingBlankets?: boolean;
  movingBlanketsCount?: number;

  // Vehicle Identification & Ownership
  vinNumber?: string;
  licensePlate?: string; // Plate # & State
  ownershipType?: 'OWNED' | 'RENTAL_LEASED';
  rentalCompany?: string; // e.g., Ryder, Penske, Enterprise
  rentalLeaseDoc?: DriverDocumentInfo;
  registrationDoc?: DriverDocumentInfo;

  // Performance Goals
  dailyTargetUSD?: number;
  weeklyTargetUSD?: number;
  monthlyTargetUSD?: number;
  targetRPM?: number; // Target Rate Per Mile
  maxWeight?: string;
  maxPallets?: number;
  currentLocation?: string;
  driverPayoutPercent?: number;

  // Audit Trail (Team Attribution)
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;
}

export interface LoadDocument {
  id: string;
  name: string;
  type: string; // 'POD' | 'RateCon' | 'LumperReceipt' | 'ScaleTicket' | 'Image' | 'Other'
  base64: string;
  uploadedAt: string;
}

export interface BrokerContact {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  mcNumber?: string;
  dotNumber?: string;
  address?: string;
  paymentTerms?: string; // e.g. QuickPay 2%, Net 30, Direct Factoring
  rating?: number; // 1-5
  notes?: string;
  companyId?: string;
  createdAt?: string;
}

export interface Load {
  id: string;
  loadNum: string;
  rateConNum: string;
  dispatcherId?: string;
  driverId: string;
  carrierId?: string; // Carrier company ID link
  carrierName?: string; // Carrier company name
  broker: string;
  brokerContactPerson?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  loadAmount: number; // Gross load amount e.g. 3000
  feePercent: number; // Driver fee % (can write any percentage dispatch fee)
  advanceFuel: number; // Deduction
  cashAdvance: number; // Deduction
  repairDeduction: number; // Deduction
  tollDeduction: number; // Deduction
  notes?: string;
  factoringStatus: 'Factored' | 'Non-Factored';
  paymentStatus: 'Paid' | 'Unpaid';
  status?: 'Pending' | 'In Transit' | 'Delivered' | 'UNLOADED' | 'PAID';
  brokerContact?: string;
  brokerMC?: string;
  brokerPaymentTerms?: string;
  rate?: number;
  podUploaded: boolean;
  podFileName?: string;
  podBase64?: string;
  rateConUploaded: boolean;
  rateConFileName?: string;
  rateConBase64?: string;
  loadDocuments?: LoadDocument[];
  companyId?: string; // Company tenant identifier

  // Audit Trail (Team Attribution)
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;
}

export interface ShortLeaveRecord {
  id: string;
  reason: string; // e.g., 'Prayer / Namaz', 'Urgent Call', 'Personal Errand'
  startedAt: string; // HH:MM AM/PM
  startedAtTimestamp?: number; // Exact epoch milliseconds for second-accurate tracking
  completedAt?: string; // HH:MM AM/PM
  completedAtTimestamp?: number; // Exact epoch milliseconds when completed
  durationMinutes?: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface BreakRecord {
  id: string;
  presetKey?: 'REST_1' | 'REST_2' | 'MEAL' | 'REST_3' | 'REST_4' | 'REST_5' | 'REFRESHMENT_1' | 'REFRESHMENT_2' | 'REFRESHMENT_3' | 'REFRESHMENT_4' | 'CUSTOM';
  type: 'DINNER' | 'MEAL' | 'REST' | 'REFRESHMENT_1' | 'REFRESHMENT_2' | 'REFRESHMENT_3' | 'REFRESHMENT_4' | 'SHORT_REST' | 'CUSTOM' | string;
  label: string;
  durationMinutes: number;
  allocatedMinutes?: number; // e.g. 10 or 20
  overBreakMinutes?: number; // durationMinutes - allocatedMinutes (if > 0)
  takenAt: string; // HH:MM AM/PM
  startedAtTimestamp?: number; // Exact epoch milliseconds for second-accurate tracking
  completedAt?: string; // HH:MM AM/PM
  completedAtTimestamp?: number; // Exact epoch milliseconds when completed
  status: 'ACTIVE' | 'COMPLETED';
}

export interface ClockRecord {
  id: string;
  dispatcherId: string; // Representing user profile ID (can be dispatcher or sales agent user ID)
  dispatcherName?: string; // Optional cached display name
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM AM/PM
  clockInTimestamp?: number; // Exact epoch milliseconds for second-accurate tracking
  clockOut?: string; // HH:MM AM/PM
  clockOutTimestamp?: number; // Exact epoch milliseconds when clocked out
  workMinutes?: number;
  isLate: boolean; // e.g., after 5:00 PM PKT / 9:00 AM EST
  lateMinutes?: number; // minutes late past shift start
  notes?: string;
  breaksTaken?: BreakRecord[];
  shortLeavesTaken?: ShortLeaveRecord[];
  totalShortLeaveMinutes?: number;
  totalOverBreakMinutes?: number;
  timeZone?: string; // 'Asia/Karachi' | 'America/New_York' etc.
  companyId?: string; // Company tenant identifier
}

export interface CarrierDocument {
  id: string;
  name: string;
  type: string; // 'Insurance' | 'W-9' | 'Authority' | 'MC Certificate' | 'Notice of Assignment' | 'Voided Check' | 'Other'
  base64: string;
  uploadedAt: string;
}

export interface CarrierOrOwner {
  id: string;
  name: string;
  type: 'OWNER_OPERATOR' | 'CARRIER';
  contactName: string;
  phone: string;
  payoutRatePercent: 8 | 18 | 22 | number;
  defaultDispatchRatePercent?: number; // Custom agreement rate: 8%, 7%, 5%, 4%, etc. based on truck type & contract
  truckType?: string; // e.g. 53ft Dry Van, Reefer, Flatbed, Power Only, Box Truck
  address?: string;
  dotNumber?: string;
  mcNumber?: string;
  email?: string;
  notes?: string;
  companyDocs?: CarrierDocument[];
  companyId?: string; // Company tenant identifier

  // Factoring Details
  hasFactoring?: boolean;
  factoringCompanyName?: string;
  noticeOfAssignmentDoc?: {
    name: string;
    base64: string;
    uploadedAt: string;
  };

  // Insurance Details
  insuranceCompanyName?: string;
  liabilityLimit?: string | number;
  cargoLimit?: string | number;
  certificateOfInsuranceDoc?: {
    name: string;
    base64: string;
    uploadedAt: string;
  };

  // Compliance Paperwork Uploads (JPG or PDF)
  voidedCheckDoc?: {
    name: string;
    base64: string;
    uploadedAt: string;
  };
  w9FormDoc?: {
    name: string;
    base64: string;
    uploadedAt: string;
  };
  mcAuthorityLetterDoc?: {
    name: string;
    base64: string;
    uploadedAt: string;
  };
}

export type SalesPipelineStatus = 
  | 'NEW_LEAD'
  | 'CALLED'
  | 'INTERESTED'
  | 'DOCUMENTS_REQUESTED'
  | 'DOCUMENTS_RECEIVED'
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'LOST'
  // Legacy status support to guarantee 0 data loss / 100% backward compatibility
  | 'RESPONDED'
  | 'IN_CONTACT'
  | 'ONBOARDED_WORKING'
  | 'FOLLOW_UP_LATER'
  | 'NOT_INTERESTED'
  | 'NEW'
  | 'CONTACTED'
  | 'SIGNED_UP';

export interface CallHistoryItem {
  id: string;
  date: string; // ISO String or YYYY-MM-DD HH:mm
  salesperson: string;
  salespersonId?: string;
  durationMinutes?: number;
  outcome: 'Connected' | 'Left Voicemail' | 'Busy / No Answer' | 'Interested' | 'Agreed & Requested Docs' | 'Not Interested' | 'Call Back Later' | 'Other';
  notes: string;
  phoneCalled?: string;
}

export interface EmailHistoryItem {
  id: string;
  date: string; // ISO String or YYYY-MM-DD HH:mm
  salesperson: string;
  salespersonId?: string;
  subject: string;
  body: string;
  status?: 'SENT' | 'OPENED' | 'REPLIED' | 'BOUNCED';
  recipientEmail?: string;
}

export interface Lead {
  id: string;
  // Core Requested Fields
  company?: string; // Company name (alias / primary)
  carrierName: string; // Backward-compatible carrierName
  mcNumber?: string; // MC Number (e.g. MC-1482105)
  dotNumber?: string; // DOT Number (e.g. 3928174)
  contact?: string; // Primary Contact (alias / primary)
  ownerName: string; // Backward-compatible ownerName
  contactName?: string; // Backward-compatible contactName
  phone: string; // Phone number
  email?: string; // Email address
  equipment?: string; // Equipment type (e.g. 53ft Dry Van, 53ft Reefer, Flatbed, Step Deck, 26ft Box Truck, Hotshot, Power Only)
  truckType?: string; // Backward-compatible truckType
  numberOfTrucks?: number; // Number of trucks (e.g. 3)
  truckCount?: number; // Backward-compatible truckCount
  preferredLanes?: string; // Preferred lanes (e.g. Midwest to Texas)
  currentLocation?: string; // Current location (e.g. Dallas, TX)
  dispatcherStatus?: 'Looking for Dispatcher' | 'Self-Dispatched' | 'Has In-House Dispatcher' | 'Assigned to Dispatcher' | 'Unassigned' | 'Under Contract' | string; // Dispatcher status
  leadSource?: 'Outreach / Cold Call' | 'DAT Board' | 'Truckstop' | 'FMCSA Directory' | 'Website Form' | 'Cold Email' | 'Referral' | 'LinkedIn' | string; // Lead source
  assignedSalesperson?: string; // Assigned salesperson name (alias / primary)
  assignedAgentName?: string; // Backward-compatible
  assignedAgentId?: string; // User ID / Salesperson ID
  lastContact?: string; // Last contact date (alias / primary)
  lastContactDate?: string; // Backward-compatible
  nextFollowUp?: string; // Next follow-up date (alias / primary)
  nextFollowUpDate?: string; // Backward-compatible
  notes?: string; // Notes
  callHistory?: CallHistoryItem[]; // Call history
  emailHistory?: EmailHistoryItem[]; // Email history

  // Pipeline status & metadata
  status: SalesPipelineStatus;
  dispatchFeeOffered?: number; // e.g. 8%
  createdAt: string; // YYYY-MM-DD
  updatedAt?: string;
  companyId?: string; // Company tenant identifier
}

export interface SalesDailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  agentId: string; // User ID
  agentName: string;
  agentUsername?: string;
  emailsSent: number;
  mcRangeStart: string; // e.g. "1492000" or "MC# 1492000"
  mcRangeEnd: string; // e.g. "1492650"
  mcRangeNote?: string;
  callsMade: number;
  callsConnected?: number;
  newLeadsHunted: number;
  followUpsDone: number;
  targetEmails: number;
  targetCalls: number;
  targetConversions: number;
  conversionsAchieved: number;
  attendanceStatus: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | 'WORK_FROM_HOME';
  notes?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderPhoto?: string;
  content: string;
  createdAt: string; // ISO String
  companyId?: string; // Company tenant identifier
  reactions?: Record<string, string[]>; // emoji -> array of user names or IDs
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

export type NoticeCategory = 'HIRING' | 'FIRING' | 'NEWS' | 'PERFORMANCE' | 'SAFETY' | 'GENERAL';

export interface CompanyNotice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: 'NORMAL' | 'URGENT' | 'PINNED';
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string; // ISO date string
  pinned?: boolean;
  acknowledgedBy?: string[]; // user IDs
  effectiveDate?: string;
  department?: string;
  tags?: string[];
  companyId?: string;
}

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string; // Base64 custom uploaded logo
  defaultDispatchFeePercent?: number; // e.g. 8
  companyId?: string; // Company tenant identifier
}

export interface DriverSettlement {
  id: string;
  driverId: string;
  driverName: string;
  settlementDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  grossEarnings: number; // Driver's gross share
  deductions: number;
  netPayout: number;
  paymentStatus: 'Paid' | 'Unpaid';
  loadIds: string[]; // Included loads
  notes?: string;
  isManual: boolean;
  payoutRate?: number; // Driver share % (e.g. 78)
  companyFeePercent?: number; // Company share % (e.g. 22)
  totalGrossLoads?: number; // Total gross load amount before split (e.g. 10000)
  manualDetails?: {
    grossAmount: number;
    deductionsAmount: number;
    description: string;
  };
  companyId?: string; // Company tenant identifier
}

export interface InvoiceLineItem {
  id: string;
  description?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  loadNum?: string;
  rateConNum?: string;
  broker?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupDate?: string;
  deliveryDate?: string;
  loadAmount?: number;
  driverName?: string;
  truckNum?: string;
  feePercent?: number; // for dispatch fees
}

export interface Invoice {
  id: string;
  invoiceNum: string;
  invoiceDate: string;
  dueDate?: string;
  invoiceMode: 'DISPATCH_FEE' | 'CARRIER_FREIGHT' | 'CUSTOM_CARRIER' | 'CUSTOM_DISPATCH';
  logoUrl?: string;

  // Biller / Dispatcher Company
  billerName: string;
  billerAddress: string;
  billerPhone: string;
  billerEmail: string;

  // Recipient / Carrier Company
  carrierId?: string;
  carrierName: string;
  sendToContact?: string;
  carrierAddress: string;
  carrierDot?: string;
  carrierMc?: string;
  carrierEmail?: string;
  factoringNote?: string;

  // Broker Payer Info (for Carrier Freight / Custom Carrier)
  brokerName?: string;
  brokerAddress?: string;
  brokerPhone?: string;
  brokerEmail?: string;

  paymentTerms: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Accessorials
  fuelSurcharge?: number;
  detentionCharge?: number;
  layoverCharge?: number;
  lumperCharge?: number;
  otherCharge?: number;
  otherChargeLabel?: string;
  fuelAdvanceDeducted?: number;

  // Totals
  grossAmount: number;
  netAmount: number;
  
  notes?: string;
  companyId?: string;

  // Invoice Payment Status & Proof tracking
  paymentStatus?: 'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  paymentDate?: string;
  paymentProofFileName?: string;
  paymentProofFileType?: 'image' | 'pdf' | 'other';
  paymentProofBase64?: string;
  dispatchRatePercent?: number; // Configured carrier dispatch rate e.g. 8%, 7%, 5%, 4%

  // Partial Payment tracking for Carrier/Owner Invoices
  partialPayments?: PartialPaymentEntry[];
  totalAmountPaid?: number;
  remainingBalance?: number;
}

export interface FinancialTransaction {
  id: string;
  transactionNum: string; // e.g. "TXN-1001"
  date: string; // YYYY-MM-DD
  category: 'DRIVER_ADVANCE' | 'DRIVER_LOAD_PAYMENT' | 'CARRIER_DISPATCH_FEE' | 'MISC_TRANSFER';
  amount: number;
  senderName: string; // e.g. "E & G Express", "Broker TQL", "Company Account"
  senderType: 'OWNER' | 'BROKER' | 'CARRIER' | 'COMPANY';
  receiverName: string; // e.g. "Chris Owens", "Frederick Vance", "Timely Logistix"
  receiverRole?: string; // e.g. "Driver", "Carrier", "Company"
  loadId?: string;
  loadNum?: string; // e.g. "160884"
  invoiceId?: string;
  invoiceNum?: string; // e.g. "INV-1001"
  paymentMethod: 'ZELLE' | 'WIRE' | 'CASH' | 'CHECK' | 'EFS' | 'COMCHECK' | 'DIRECT_DEPOSIT' | 'QUICKPAY';
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  notes?: string;
  proofFileName?: string;
  proofFileType?: 'image' | 'pdf' | 'other';
  proofBase64?: string;
  createdAt: string;
  companyId?: string;
}

export interface CompanyBroadcast {
  id: string;
  title: string;
  message: string;
  senderName: string;
  createdAt: string; // ISO String
  type: 'INFO' | 'WARNING' | 'ALERT';
  companyId?: string;
  active: boolean;
}

export type HREmployeeStatus = 'TRAINING' | 'HIRED' | 'ACTIVE' | 'PROBATION' | 'TERMINATED';
export type HRDepartmentType = 'Sales Department' | 'Dispatch Department' | 'Management' | 'Admin' | string;

export interface HRCompanyLetter {
  id: string;
  title: string;
  letterType: 'JOINING_LETTER' | 'OFFER_LETTER' | 'INCREMENT_LETTER' | 'WARNING_LETTER' | 'PROMOTION_LETTER' | 'OTHER';
  fileName: string;
  base64: string;
  issuedDate: string; // YYYY-MM-DD
  uploadedAt: string;
  notes?: string;
}

export interface HRDocumentItem {
  id: string;
  name: string;
  type: 'ID_CARD' | 'RESUME' | 'DEGREE' | 'CERTIFICATE' | 'TRANSCRIPT' | 'PASSPORT' | 'CONTRACT' | 'OTHER';
  base64: string;
  uploadedAt: string;
  notes?: string;
}

export interface SalaryStructure {
  grossSalaryPKR: number; // Gross salary in PKR
  bonusPercent: number; // Commission or performance bonus %
  targetUSD?: number; // Target in USD
  monthlyGrossUSD?: number;
  allowancesPKR?: number;
  notes?: string;
  effectiveDate?: string;
}

export interface HRStaffProfile {
  id: string; // matches user.id or dispatcherId or custom
  userId?: string; // linked to User id
  name: string;
  role: string;
  email: string;
  phone: string;
  address?: string;
  profilePhoto?: string; // Profile picture Base64
  joiningDate: string; // YYYY-MM-DD
  department: string; // e.g. "Sales Department", "Dispatch Department", "Management"
  status: HREmployeeStatus; // "TRAINING", "HIRED", "PROBATION", "ACTIVE", "TERMINATED"
  managerName: string; // under manager name
  managerId?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bio?: string;

  // ID Card Copy
  idCardNumber?: string;
  idCardDoc?: {
    name: string;
    base64: string;
    uploadedAt: string;
    frontBase64?: string;
    backBase64?: string;
  };

  // Educational Docs & Resumes (multiple uploads)
  resumeName?: string;
  resumeBase64?: string;
  resumeFileName?: string;
  educationalDocs?: HRDocumentItem[];

  // Official Company Letters (Offer, Joining, Increment, Warning)
  companyLetters?: HRCompanyLetter[];

  // Salary Structure (Gross + Bonus) synced with Seats & Profiles
  salaryStructure?: SalaryStructure;
  baseSalaryPKR?: number;
  bonusPercent?: number;
  targetUSD?: number;

  // Bank Account Details for every team member
  bankDetails?: {
    bankName: string;
    accountTitle: string; // Account Holder / Beneficiary Name
    accountNumber: string;
    ibanOrRouting?: string;
    branchCodeOrSwift?: string;
  };

  // Legacy fields
  hrDocuments?: { id: string; name: string; type: string; base64: string; uploadedAt: string }[];
  hrDocs?: { id: string; name: string; type: string; base64: string; uploadedAt: string }[];
  companyId?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string; // matches HRStaffProfile id or user.id
  employeeName: string;
  employeeEmail?: string;
  department: string;
  leaveType: 'VACATION' | 'MEDICAL'; // 27 total standard international labour law
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  attachmentBase64?: string; // Medical certificate / proof
  attachmentName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  joiningDateAtApplication?: string;
  isEligibleTenure?: boolean; // 1-year tenure protocol check (>=365 days from joining date)
  tenureDays?: number;
  companyId?: string;
}

export interface SalarySlip {
  id: string;
  slipNumber: string; // e.g. "SLIP-2026-08-01"
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  managerName?: string;
  month: string; // e.g. "2026-08"
  monthLabel: string; // e.g. "August 2026"
  joiningDate: string;
  grossSalary: number; // Gross salary
  bonusAmount: number; // Bonus earned
  allowances: number;
  deductions: number; // Tax, unpaid leaves, deductions
  netPayable: number; // Gross + Bonus + Allowances - Deductions
  currency: string; // "PKR" or "USD"
  paymentStatus: 'PAID' | 'PENDING';
  paymentDate?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'WIRE' | 'OTHER';
  bankName?: string;
  accountNumber?: string;
  notes?: string;
  generatedBy?: string;
  createdAt: string;
  companyId?: string;
}

export interface DriverAdvance {
  id: string;
  driverId: string;
  driverName: string;
  senderName: string; // Sender e.g. "E & G", "Owner", "Broker - GlobalTranz"
  senderType: 'OWNER' | 'BROKER' | 'COMPANY';
  receiverName: string; // Receiver e.g. "Frederick Lemont"
  loadId?: string; // Linked Load ID
  loadNum?: string; // Reference Load # e.g. "160884"
  brokerName?: string; // Reference Broker e.g. "828 Logistics"
  amount: number; // Advance amount e.g. 700
  advanceType: 'CASH' | 'FUEL' | 'WIRE' | 'ZELLE' | 'CHECK' | 'EFS' | 'COMCHECK';
  date: string; // YYYY-MM-DD
  notes?: string;
  proofFileName?: string;
  proofFileType?: 'image' | 'pdf' | 'other';
  proofBase64?: string; // Base64 data URL string
  createdAt: string; // ISO string or date
  companyId?: string;
}

export interface PartialPaymentEntry {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'ZELLE' | 'WIRE' | 'CASH' | 'CHECK' | 'EFS' | 'COMCHECK' | 'DIRECT_DEPOSIT' | 'QUICKPAY';
  notes?: string;
  proofFileName?: string;
  proofFileType?: 'image' | 'pdf' | 'other';
  proofBase64?: string;
}

export interface PendingDriverPayment {
  id: string;
  paymentNum: string; // e.g. "PEND-1001"
  driverId: string;
  driverName: string;
  loadIds: string[];
  loadNums: string[];
  totalGrossAmount: number;
  driverPayoutPercent: number; // e.g. 78% or 80%
  totalDriverPayoutOwed: number;
  totalPartialPaid: number;
  remainingBalanceOwed: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  partialHistory: PartialPaymentEntry[];
  notes?: string;
  createdAt: string;
  companyId?: string;
}

export interface DataSnapshot {
  id: string;
  timestamp: string;
  label: string;
  data: SystemState;
  itemCounts: {
    loads: number;
    drivers: number;
    dispatchers: number;
    invoices: number;
    transactions: number;
    driverAdvances: number;
    pendingDriverPayments: number;
  };
}

export interface SystemState {
  users: User[];
  dispatchers: Dispatcher[];
  drivers: Driver[];
  carriers: CarrierOrOwner[];
  loads: Load[];
  attendance: ClockRecord[];
  leads: Lead[];
  salesDailyLogs?: SalesDailyLog[];
  currentUser: User | null;
  currentClockRecord: ClockRecord | null;
  factoringRatePercent: number; // Default 3.25
  messages: ChatMessage[];
  companySettings: CompanySettings;
  driverSettlements: DriverSettlement[];
  invoices: Invoice[];
  broadcasts: CompanyBroadcast[];
  hrProfiles: HRStaffProfile[];
  leaveRequests?: LeaveRequest[];
  salarySlips?: SalarySlip[];
  driverAdvances?: DriverAdvance[];
  financialTransactions?: FinancialTransaction[];
  pendingDriverPayments?: PendingDriverPayment[];
  brokers?: BrokerContact[];
  driverPostings?: DriverDailyPosting[];
  notices?: CompanyNotice[];
  trainingScripts?: TrainingScriptConfig;
}

export interface ObjectionHandler {
  id: string;
  objection: string;
  response: string;
  category?: string;
}

export interface TrainingScriptConfig {
  coldCallScript: string;
  coldCallTitle?: string;
  emailScriptSubject: string;
  emailScriptBody: string;
  emailSubject?: string;
  emailScript?: string;
  dispatchPitchScript?: string;
  objectionHandlers: ObjectionHandler[];
}

export type DriverPostingStatus = 'NEEDS_LOAD' | 'PARTIAL' | 'ACCEPTED' | 'ASSIGNED' | 'BOOKED' | 'EMPTY';
export type CapacityStatus = 'EMPTY' | 'PARTIAL' | 'BOOKED';
export type DispatcherAction = 'ASSIGNED' | 'ACCEPTED' | 'NONE';

export interface DriverDailyPosting {
  id: string;
  driverId: string;
  driverName: string;
  dispatcherId?: string;
  dispatcherName?: string;
  assignedDispatcherId?: string;
  assignedDispatcherName?: string;
  truckNum: string;
  truckType: string;
  phone?: string;
  driverPhone?: string;
  status: DriverPostingStatus; // Legacy & combined status
  
  // Independent Status & Dispatcher Action
  capacityStatus?: CapacityStatus; // 'EMPTY' | 'PARTIAL' | 'BOOKED'
  dispatcherAction?: DispatcherAction; // 'ASSIGNED' | 'ACCEPTED' | 'NONE'
  assignedTime?: string; // Time when driver posting was assigned by admin
  assignedBy?: string; // Name/ID of admin who assigned
  acceptedTime?: string; // Time when dispatcher accepted the assigned posting
  acceptedBy?: string; // Name/ID of dispatcher who accepted

  currentLocation?: string; // e.g. "Dallas, TX" or "Chicago, IL"
  origin?: string;
  emptyLocation?: string;
  emptyDate: string; // e.g. "2026-08-18" or "Today, 02:00 PM"
  emptyTime?: string; // e.g. "14:00"
  destinationPreference: string; // e.g. "Dallas, TX -> Atlanta, GA", "OTR / Any", "Local only"
  routeType: 'OTR' | 'LOCAL' | 'REGIONAL' | 'DEDICATED';
  availableCapacity?: string; // e.g. "Full 26ft / 10,000 lbs" or "12ft Space Remaining"
  weightAvailable?: string; // e.g. "9,500 lbs"
  maxWeight?: string | number;
  maxPallets?: number;
  minRPM?: number; // e.g. 2.40 $/mile
  desiredGross?: number; // e.g. 800
  currentLoadId?: string; // linked load if booked
  currentLoadNum?: string; // load # if covered
  notes?: string;
  updatedAt: string;
  companyId?: string;

  // Audit Trail (Team Attribution)
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;
}
