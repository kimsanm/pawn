/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LoanType {
  STANDARD = 'STANDARD',       // កម្ចីទូទៅ (General Loan)
  PAWN = 'PAWN',               // បញ្ចាំ (Pawn/Collateral)
  INSTALLMENT = 'INSTALLMENT'   // បង់រំលស់ (Installment/Lease-to-own)
}

export enum InterestType {
  DECREASING = 'DECREASING',   // ការប្រាក់ថយចុះ (Declining Balance)
  FLAT = 'FLAT'                // ការប្រាក់ថេរ (Flat Rate)
}

export enum PaymentTerm {
  DAILY = 'DAILY',             // រាល់ថ្ងៃ (Daily)
  WEEKLY = 'WEEKLY',           // រាល់សប្តាហ៍ (Weekly)
  MONTHLY = 'MONTHLY'          // រាល់ខែ (Monthly)
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',           // កំពុងដំណើរការ (Active)
  PAID = 'PAID',               // បានទូទាត់រួច (Fully Paid)
  OVERDUE = 'OVERDUE',         // យឺតយ៉ាវ (Overdue)
  DEFAULTED = 'DEFAULTED'      // ករណីខូច/បាត់បង់ (Defaulted)
}

export interface Collateral {
  name: string;                // ឈ្មោះទ្រព្យបញ្ចាំ/ទំនិញ (Item Name/Type)
  serialNumber?: string;       // លេខស៊េរី/លេខតួ/លេខម៉ាស៊ីន (Serial Number/IMEI)
  condition: string;          // ស្ថានភាពទ្រព្យ (Condition)
  estimatedValue: number;      // តម្លៃប៉ាន់ស្មាន (Estimated Market Value)
  storageLocation?: string;    // ទីកន្លែងរក្សាទុក (Storage & Safe Location)
  notes?: string;              // កំណត់សម្គាល់បន្ថែម
}

export interface Customer {
  id: string;                  // អត្តសញ្ញាណ (ID)
  nameKh: string;              // ឈ្មោះខ្មែរ (Name in Khmer)
  nameEn: string;              // ឈ្មោះឡាតាំង (Name in English)
  phone: string;               // លេខទូរស័ព្ទ (Phone Number)
  idCard: string;              // លេខអត្តសញ្ញាណប័ណ្ណ (National ID / Passport)
  address: string;             // អាសយដ្ឋានបច្ចុប្បន្ន (Current Address)
  photo?: string;              // រូបថត (Profile Photo URL or Base64)
  notes?: string;              // កំណត់សម្គាល់ (Notes)
  createdAt: string;
}

export interface InstallmentSchedule {
  id: number;                  // លេខរៀងដង
  dueDate: string;             // កាលបរិច្ឆេទត្រូវបង់
  principal: number;           // ប្រាក់ដើមត្រូវបង់
  interest: number;            // ការប្រាក់ត្រូវបង់
  total: number;               // ទឹកប្រាក់សរុប (ដើម + ការ)
  paidAmount: number;          // ទឹកប្រាក់បានបង់រួច
  paidDate?: string;           // ថ្ងៃបានបង់រួច
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'; // ស្ថានភាពបង់ប្រាក់
}

export interface Loan {
  id: string;                  // លេខកូដកិច្ចសន្យា (Contract ID)
  customerId: string;          // អត្តសញ្ញាណអតិថិជន
  customerName: string;        // ឈ្មោះអតិថិជន (Khmer)
  type: LoanType;              // ប្រភេទ៖ កម្ចី បញ្ចាំ ឬរំលស់
  principal: number;           // ទំហំទឹកប្រាក់ដើម
  interestRate: number;        // អត្រាការប្រាក់ (ភាគរយក្នុងមួយខែ/ឆ្នាំ)
  interestType: InterestType;  // ប្រភេទគណនាការប្រាក់ (ថេរ ឬថយ)
  termCount: number;           // រយៈពេល (ឧ. ៦ ខែ, ២៤ សប្តាហ៍)
  termUnit: PaymentTerm;       // ឯកតារយៈពេល (ថ្ងៃ សប្តាហ៍ ខែ)
  startDate: string;           // ថ្ងៃចាប់ផ្តើម
  endDate: string;             // ថ្ងៃបញ្ចប់កិច្ចសន្យា
  collateral?: Collateral;     // ពត៌មានទ្រព្យបញ្ចាំ (សម្រាប់ បញ្ចាំ ឫបង់រំលស់)
  status: LoanStatus;          // ស្ថានភាព
  schedules: InstallmentSchedule[]; // តារាងកាលវិភាគបង់ប្រាក់
  notes?: string;              // កំណត់សម្គាល់
  createdAt: string;
}

export interface Transaction {
  id: string;                  // លេខវិក្កយបត្រ (Receipt ID)
  loanId: string;              // លេខកិច្ចសន្យា
  customerName: string;        // ឈ្មោះអតិថិជន
  date: string;                // ថ្ងៃទទួលប្រាក់
  scheduleId: number;          // លេខរៀងដងដែលបានបង់ (e.g. installment #3)
  paidPrincipal: number;       // ប្រាក់ដើមបានបង់
  paidInterest: number;        // ការប្រាក់បានបង់
  penaltyFee: number;          // ផាកពិន័យ/យឺតយ៉ាវ (បើមាន)
  totalAmount: number;         // សរុបទឹកប្រាក់បានទទួល
  paymentMethod: string;       // វិធីសាស្រ្តទូទាត់ (សាច់ប្រាក់, វីង, ធនាគារ អេស៊ីលីដា, ABA...)
  receiver: string;            // អ្នកទទួលប្រាក់/បុគ្គលិក
  notes?: string;
}

export interface PawnshopSettings {
  businessName: string;
  businessSlogan: string;
  businessPhone: string;
  businessAddress: string;
  defaultInterestRate: number;      // % per month
  defaultPenaltyRate: number;       // $ per day
  defaultAdminFee: number;          // $ per contract
  defaultPaymentTerm: PaymentTerm;  // DAILY, WEEKLY, MONTHLY
  accentColor: string;              // hex or tailwind class name like 'yellow' | 'indigo' | 'emerald' etc.
  language: 'kh' | 'en';
}

