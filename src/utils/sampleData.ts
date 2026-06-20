/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Loan, LoanType, InterestType, PaymentTerm, LoanStatus, Transaction } from '../types';

// Format currency beautifully ($ USD and KHR Riel)
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatKHR = (amount: number): string => {
  return new Intl.NumberFormat('km-KH', {
    style: 'currency',
    currency: 'KHR',
    minimumFractionDigits: 0,
  }).format(amount).replace('KHR', '៛');
};

// Simple Khmer date formatter
export const formatKhmerDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const monthsKh = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];
  
  const day = date.getDate();
  const month = monthsKh[date.getMonth()];
  const year = date.getFullYear();
  
  return `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
};

// Generate Installment Schedule automatically
export function generateSchedule(
  principal: number,
  interestRate: number, // % per month
  interestType: InterestType,
  termCount: number,
  termUnit: PaymentTerm,
  startDateStr: string
): any[] {
  const schedules = [];
  const start = new Date(startDateStr);
  let remainingPrincipal = principal;
  
  // Calculate raw installment values based on flat or decreasing
  const monthlyInterestRateDecimal = interestRate / 100;
  
  for (let i = 1; i <= termCount; i++) {
    // Generate next due date based on payment frequency
    const dueDate = new Date(start);
    if (termUnit === PaymentTerm.DAILY) {
      dueDate.setDate(start.getDate() + i);
    } else if (termUnit === PaymentTerm.WEEKLY) {
      dueDate.setDate(start.getDate() + (i * 7));
    } else { // MONTHLY
      dueDate.setMonth(start.getMonth() + i);
    }
    
    let principalDue = 0;
    let interestDue = 0;
    
    if (interestType === InterestType.FLAT) {
      // Flat Rate: Principal and interest are split evenly throughout the terms
      principalDue = principal / termCount;
      interestDue = principal * monthlyInterestRateDecimal;
    } else {
      // Decreasing Rate: Equal principal payments, interest calculated on outstanding balance
      // Note: Interest is calculated for the period on the remaining principal
      principalDue = principal / termCount;
      interestDue = remainingPrincipal * monthlyInterestRateDecimal;
    }
    
    // Round to 2 decimals for precision
    principalDue = Math.round(principalDue * 100) / 100;
    interestDue = Math.round(interestDue * 100) / 100;
    const totalDue = principalDue + interestDue;
    
    schedules.push({
      id: i,
      dueDate: dueDate.toISOString().split('T')[0],
      principal: principalDue,
      interest: interestDue,
      total: totalDue,
      paidAmount: 0,
      status: 'PENDING' as const
    });
    
    remainingPrincipal -= principalDue;
    if (remainingPrincipal < 0) remainingPrincipal = 0;
  }
  
  return schedules;
}

// Sample initial data to populate if dry
export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'C-001',
    nameKh: 'ចាន់ ផល្លា',
    nameEn: 'Chan Phalla',
    phone: '012 345 678',
    idCard: '020489372',
    address: 'ផ្ទះលេខ ១២អា, ផ្លូវ ២៧១, សង្កាត់បឹងទំពុន, ខណ្ឌមានជ័យ, ភ្នំពេញ',
    photo: '',
    notes: 'អតិថិជនល្អ បង់ប្រាក់ទៀងទាត់ និងមានទំនួលខុសត្រូវខ្ពស់',
    createdAt: '2026-01-10T08:30:00Z'
  },
  {
    id: 'C-002',
    nameKh: 'សឿន តុលា',
    nameEn: 'Soeun Tola',
    phone: '098 765 432',
    idCard: '010298374',
    address: 'ភូមិព្រៃធំ, សង្កាត់ព្រៃញី, ក្រុងពោធិ៍សាត់, ខេត្តពោធិ៍សាត់',
    photo: '',
    notes: 'ម្ចាស់ហាងលក់ទូរស័ព្ទដៃ មានអាជីវកម្មផ្ទាល់ខ្លួនច្បាស់លាស់',
    createdAt: '2026-01-15T09:12:00Z'
  },
  {
    id: 'C-003',
    nameKh: 'សុខ ម៉ារី',
    nameEn: 'Sok Mary',
    phone: '077 112 233',
    idCard: '180293847',
    address: 'បូរីពិភពថ្មីចំការដូង, ផ្ទះលេខ ៨៨, ផ្លូវលេខ ៣, ខណ្ឌដង្កោ, ភ្នំពេញ',
    photo: '',
    notes: 'បុគ្គលិកក្រុមហ៊ុនឯកជន ខ្ចីទិញម៉ូតូបង់រំលស់',
    createdAt: '2026-02-01T14:20:00Z'
  },
  {
    id: 'C-004',
    nameKh: 'គឹម ហេង',
    nameEn: 'Kim Heng',
    phone: '085 445 566',
    idCard: '098736452',
    address: 'ភូមិគោកចក, សង្កាត់គោកចក, ក្រុងសៀមរាប, ខេត្តសៀមរាប',
    photo: '',
    notes: 'អាជីវករលក់គ្រឿងអលង្ការ បញ្ចាំមាសអាសន្ន',
    createdAt: '2026-02-18T10:05:00Z'
  },
  {
    id: 'C-005',
    nameKh: 'សេង ស្រីពៅ',
    nameEn: 'Seng Sreypov',
    phone: '010 889 900',
    idCard: '034981765',
    address: 'ភូមិទី៣, សង្កាត់កំពង់ចាម, ក្រុងកំពង់ចាម, ខេត្តកំពង់ចាម',
    photo: '',
    notes: 'ខ្ចីទុនបង្វិលលក់ផ្លែឈើខ្នាតតូច បាលតារាងបង់ជាប្រចាំសប្តាហ៍',
    createdAt: '2026-03-05T16:45:00Z'
  }
];

export const SAMPLE_LOANS: Loan[] = [
  {
    id: 'TX-2601',
    customerId: 'C-001',
    customerName: 'ចាន់ ផល្លា',
    type: LoanType.PAWN,
    principal: 1500,
    interestRate: 2.5,
    interestType: InterestType.FLAT,
    termCount: 4,
    termUnit: PaymentTerm.MONTHLY,
    startDate: '2026-02-15',
    endDate: '2026-06-15',
    collateral: {
      name: 'ម៉ូតូ Honda Dream C125 ឆ្នាំ ២០២៤',
      serialNumber: 'NC125-9837482',
      condition: 'ល្អណាស់ ៩៥%',
      estimatedValue: 2200,
      storageLocation: 'ឃ្លាំងសាខាទី១ (ភ្នំពេញ)',
      notes: 'មានកាតគ្រីច្បាស់លាស់ សោ២គ្រាប់ គ្មានស្បែកកង់ដាច់'
    },
    status: LoanStatus.ACTIVE,
    schedules: [
      { id: 1, dueDate: '2026-03-15', principal: 375, interest: 37.5, total: 412.5, paidAmount: 412.5, paidDate: '2026-03-14', status: 'PAID' },
      { id: 2, dueDate: '2026-04-15', principal: 375, interest: 37.5, total: 412.5, paidAmount: 412.5, paidDate: '2026-04-15', status: 'PAID' },
      { id: 3, dueDate: '2026-05-15', principal: 375, interest: 37.5, total: 412.5, paidAmount: 412.5, paidDate: '2026-05-13', status: 'PAID' },
      { id: 4, dueDate: '2026-06-15', principal: 375, interest: 37.5, total: 412.5, paidAmount: 0, status: 'PENDING' }
    ],
    notes: 'កុងត្រាបញ្ចាំម៉ូតូល្អ បង់ទៀងទាត់ រង់ចាំថ្ងៃផ្តាច់ចុងក្រោយ',
    createdAt: '2026-02-15T09:00:00Z'
  },
  {
    id: 'TX-2602',
    customerId: 'C-002',
    customerName: 'សឿន តុលា',
    type: LoanType.STANDARD,
    principal: 5000,
    interestRate: 1.8,
    interestType: InterestType.DECREASING,
    termCount: 6,
    termUnit: PaymentTerm.MONTHLY,
    startDate: '2026-01-20',
    endDate: '2026-07-20',
    collateral: {
      name: 'ប្លង់ដីធ្លីលំនៅដ្ឋាន (ប្លង់រឹង)',
      serialNumber: 'SR-10293-8472',
      condition: 'ប្លង់រឹងផ្លូវការ ចេញដោយស្រុក',
      estimatedValue: 12000,
      storageLocation: 'ទូដែកសុវត្ថិភាពការិយាល័យធំ',
      notes: 'ជួបសម្ភាសស៊ើបប្រវត្តិគ្រួសាររួចរាល់ ទីតាំងល្អ'
    },
    status: LoanStatus.ACTIVE,
    schedules: [
      { id: 1, dueDate: '2026-02-20', principal: 833.33, interest: 90.00, total: 923.33, paidAmount: 923.33, paidDate: '2026-02-20', status: 'PAID' },
      { id: 2, dueDate: '2026-03-20', principal: 833.33, interest: 75.00, total: 908.33, paidAmount: 908.33, paidDate: '2026-03-19', status: 'PAID' },
      { id: 3, dueDate: '2026-04-20', principal: 833.33, interest: 60.00, total: 893.33, paidAmount: 893.33, paidDate: '2026-04-20', status: 'PAID' },
      { id: 4, dueDate: '2026-05-20', principal: 833.33, interest: 45.00, total: 878.33, paidAmount: 878.33, paidDate: '2026-05-20', status: 'PAID' },
      { id: 5, dueDate: '2026-06-20', principal: 833.33, interest: 30.00, total: 863.33, paidAmount: 0, status: 'PENDING' },
      { id: 6, dueDate: '2026-07-20', principal: 833.35, interest: 15.00, total: 848.35, paidAmount: 0, status: 'PENDING' }
    ],
    notes: 'កម្ចីខ្នាតតូចពង្រីកអាជីវកម្មលក់ទូរស័ព្ទ',
    createdAt: '2026-01-20T10:30:00Z'
  },
  {
    id: 'TX-2603',
    customerId: 'C-003',
    customerName: 'សុខ ម៉ារី',
    type: LoanType.INSTALLMENT,
    principal: 1200,
    interestRate: 1.5,
    interestType: InterestType.FLAT,
    termCount: 12,
    termUnit: PaymentTerm.MONTHLY,
    startDate: '2026-02-05',
    endDate: '2027-02-05',
    collateral: {
      name: 'iPhone 15 Pro Max 256GB Gray',
      serialNumber: 'IMEI: 359283749283741',
      condition: 'ថ្មី ១០០% ប្រអប់ត្រឹមត្រូវ',
      estimatedValue: 1350,
      storageLocation: 'លក់រំលស់ជូនអតិថិជនប្រើប្រាស់ផ្ទាល់ខ្លួន',
      notes: 'កិច្ចសន្យាបង់រំលស់ទូរស័ព្ទដៃ ដោយបង់ប្រាក់កក់ ២០%'
    },
    status: LoanStatus.ACTIVE,
    schedules: [
      { id: 1, dueDate: '2026-03-05', principal: 100, interest: 18, total: 118, paidAmount: 118, paidDate: '2026-03-04', status: 'PAID' },
      { id: 2, dueDate: '2026-04-05', principal: 100, interest: 18, total: 118, paidAmount: 118, paidDate: '2026-04-05', status: 'PAID' },
      { id: 3, dueDate: '2026-05-05', principal: 100, interest: 18, total: 118, paidAmount: 118, paidDate: '2026-05-05', status: 'PAID' },
      { id: 4, dueDate: '2026-06-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'OVERDUE' }, // Mark as overdue since it's June 20, 2026 now!
      { id: 5, dueDate: '2026-07-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 6, dueDate: '2026-08-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 7, dueDate: '2026-09-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 8, dueDate: '2026-10-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 9, dueDate: '2026-11-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 10, dueDate: '2026-12-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 11, dueDate: '2027-01-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' },
      { id: 12, dueDate: '2027-02-05', principal: 100, interest: 18, total: 118, paidAmount: 0, status: 'PENDING' }
    ],
    notes: 'អតិថិជនរំលស់ទូរស័ព្ទ យឺតយ៉ាវការបង់ប្រាក់លើកទីសប្តាហ៍ទី៤ កំពុងទាក់ទងដេញដោល',
    createdAt: '2026-02-05T14:30:00Z'
  },
  {
    id: 'TX-2604',
    customerId: 'C-004',
    customerName: 'គឹម ហេង',
    type: LoanType.PAWN,
    principal: 800,
    interestRate: 3.0,
    interestType: InterestType.FLAT,
    termCount: 3,
    termUnit: PaymentTerm.MONTHLY,
    startDate: '2026-03-10',
    endDate: '2026-06-10',
    collateral: {
      name: 'ខ្សែដៃមាស គីឡូ ២តម្លឹង',
      serialNumber: 'GOLD-09837',
      condition: 'ទឹកមាស ៩៩% ទម្ងន់ ២ទឹកពេញ',
      estimatedValue: 1200,
      storageLocation: 'ទូដែកកណ្តាល សាខាទី២',
      notes: 'មានបង្កាន់ដៃទិញពីហាងលក់មាសសហគ្រាសដំបូង'
    },
    status: LoanStatus.PAID,
    schedules: [
      { id: 1, dueDate: '2026-04-10', principal: 266.66, interest: 24.00, total: 290.66, paidAmount: 290.66, paidDate: '2026-04-09', status: 'PAID' },
      { id: 2, dueDate: '2026-05-10', principal: 266.66, interest: 24.00, total: 290.66, paidAmount: 290.66, paidDate: '2026-05-10', status: 'PAID' },
      { id: 3, dueDate: '2026-06-10', principal: 266.68, interest: 24.00, total: 290.68, paidAmount: 290.68, paidDate: '2026-06-08', status: 'PAID' }
    ],
    notes: 'បញ្ចាំមាសរយៈពេលខ្លី បានផ្តាច់កុងត្រាយកទ្រព្យសម្បត្តិទៅវិញហើយ ដោយជោគជ័យ',
    createdAt: '2026-03-10T11:00:00Z'
  },
  {
    id: 'TX-2605',
    customerId: 'C-005',
    customerName: 'សេង ស្រីពៅ',
    type: LoanType.STANDARD,
    principal: 300,
    interestRate: 2.0,
    interestType: InterestType.FLAT,
    termCount: 12,
    termUnit: PaymentTerm.WEEKLY,
    startDate: '2026-04-01',
    endDate: '2026-06-24',
    collateral: {
      name: 'ទំនុកចិត្ត/អត់ទ្រព្យសម្បត្តិបញ្ចាំ (Micro-unsecured)',
      condition: 'ធានាដោយសមាជិកគ្រួសារ',
      estimatedValue: 0,
      notes: 'កម្ចីសប្តាហ៍ខ្នាតតូច សម្រាប់លក់ផ្លែឈើបង្វិលប្រចាំសប្តាហ៍'
    },
    status: LoanStatus.ACTIVE,
    schedules: [
      { id: 1, dueDate: '2026-04-08', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-04-08', status: 'PAID' },
      { id: 2, dueDate: '2026-04-15', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-04-14', status: 'PAID' },
      { id: 3, dueDate: '2026-04-22', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-04-22', status: 'PAID' },
      { id: 4, dueDate: '2026-04-29', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-04-29', status: 'PAID' },
      { id: 5, dueDate: '2026-05-06', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-05-05', status: 'PAID' },
      { id: 6, dueDate: '2026-05-13', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-05-13', status: 'PAID' },
      { id: 7, dueDate: '2026-05-20', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-05-20', status: 'PAID' },
      { id: 8, dueDate: '2026-05-27', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-05-27', status: 'PAID' },
      { id: 9, dueDate: '2026-06-03', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-06-02', status: 'PAID' },
      { id: 10, dueDate: '2026-06-10', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-06-09', status: 'PAID' },
      { id: 11, dueDate: '2026-06-17', principal: 25, interest: 6, total: 31, paidAmount: 31, paidDate: '2026-06-17', status: 'PAID' },
      { id: 12, dueDate: '2026-06-24', principal: 25, interest: 6, total: 31, paidAmount: 0, status: 'PENDING' }
    ],
    notes: 'កូនខ្ចីចរន្តល្អណាស់ បង់លុយសប្តាហ៍ខ្លីមិនដែលរំលងឡើយ',
    createdAt: '2026-04-01T15:00:00Z'
  }
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'REC-26101',
    loanId: 'TX-2601',
    customerName: 'ចាន់ ផល្លា',
    date: '2026-03-14T09:15:00Z',
    scheduleId: 1,
    paidPrincipal: 375,
    paidInterest: 37.5,
    penaltyFee: 0,
    totalAmount: 412.5,
    paymentMethod: 'ABA Mobile (Bank Transfer)',
    receiver: 'ម្ចាស់ហាង (Admin)',
    notes: 'បង់គម្រប់លើកទី១'
  },
  {
    id: 'REC-26102',
    loanId: 'TX-2601',
    customerName: 'ចាន់ ផល្លា',
    date: '2026-04-15T10:30:00Z',
    scheduleId: 2,
    paidPrincipal: 375,
    paidInterest: 37.5,
    penaltyFee: 0,
    totalAmount: 412.5,
    paymentMethod: 'Cash',
    receiver: 'ម្ចាស់ហាង (Admin)',
    notes: 'បង់ផ្ទាល់នៅការិយាល័យ'
  },
  {
    id: 'REC-26103',
    loanId: 'TX-2602',
    customerName: 'សឿន តុលា',
    date: '2026-02-20T08:45:00Z',
    scheduleId: 1,
    paidPrincipal: 833.33,
    paidInterest: 90.00,
    penaltyFee: 0,
    totalAmount: 923.33,
    paymentMethod: 'ABA Mobile (Bank Transfer)',
    receiver: 'គន្ធា (Staff)',
    notes: 'បង់ខែទី១'
  },
  {
    id: 'REC-26104',
    loanId: 'TX-2602',
    customerName: 'សឿន តុលា',
    date: '2026-03-19T13:20:00Z',
    scheduleId: 2,
    paidPrincipal: 833.33,
    paidInterest: 75.00,
    penaltyFee: 0,
    totalAmount: 908.33,
    paymentMethod: 'ABA Mobile (Bank Transfer)',
    receiver: 'គន្ធា (Staff)',
    notes: 'បង់មុន១ថ្ងៃ ល្អណាស់'
  },
  {
    id: 'REC-26105',
    loanId: 'TX-2603',
    customerName: 'សុខ ម៉ារី',
    date: '2026-03-04T15:00:00Z',
    scheduleId: 1,
    paidPrincipal: 100,
    paidInterest: 18,
    penaltyFee: 0,
    totalAmount: 118,
    paymentMethod: 'Wing Cash',
    receiver: 'គន្ធា (Staff)',
    notes: 'បង់ទូរស័ព្ទរំលស់'
  },
  {
    id: 'REC-26106',
    loanId: 'TX-2603',
    customerName: 'សុខ ម៉ារី',
    date: '2026-04-05T10:11:00Z',
    scheduleId: 2,
    paidPrincipal: 100,
    paidInterest: 18,
    penaltyFee: 0,
    totalAmount: 118,
    paymentMethod: 'Wing Cash',
    receiver: 'ម្ចាស់ហាង (Admin)',
    notes: 'បង់លើកទី២'
  },
  {
    id: 'REC-26107',
    loanId: 'TX-2604',
    customerName: 'គឹម ហេង',
    date: '2026-04-09T09:00:00Z',
    scheduleId: 1,
    paidPrincipal: 266.66,
    paidInterest: 24.00,
    penaltyFee: 0,
    totalAmount: 290.66,
    paymentMethod: 'Cash',
    receiver: 'គន្ធា (Staff)',
    notes: 'បង់លិខិតបញ្ចាំដំបូង'
  },
  {
    id: 'REC-26108',
    loanId: 'TX-2604',
    customerName: 'គឹម ហេង',
    date: '2026-05-10T11:00:00Z',
    scheduleId: 2,
    paidPrincipal: 266.66,
    paidInterest: 24.00,
    penaltyFee: 0,
    totalAmount: 290.66,
    paymentMethod: 'Cash',
    receiver: 'គន្ធា (Staff)',
    notes: 'បង់លិខិតបញ្ចាំទី២'
  },
  {
    id: 'REC-26109',
    loanId: 'TX-2604',
    customerName: 'គឹម ហេង',
    date: '2026-06-08T16:20:00Z',
    scheduleId: 3,
    paidPrincipal: 266.68,
    paidInterest: 24.00,
    penaltyFee: 0,
    totalAmount: 290.68,
    paymentMethod: 'Cash',
    receiver: 'ម្ចាស់ហាង (Admin)',
    notes: 'រំលោះផ្ដាច់យកមាសត្រឡប់ទៅវិញ'
  },
  {
    id: 'REC-26110',
    loanId: 'TX-2601',
    customerName: 'ចាន់ ផល្លា',
    date: '2026-05-13T10:50:00Z',
    scheduleId: 3,
    paidPrincipal: 375,
    paidInterest: 37.5,
    penaltyFee: 0,
    totalAmount: 412.5,
    paymentMethod: 'ABA Mobile (Bank Transfer)',
    receiver: 'ម្ចាស់ហាង (Admin)',
    notes: 'បង់លើកទី៣ ទៀងទាត់'
  }
];
