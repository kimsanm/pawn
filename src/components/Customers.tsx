/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Loan, LoanStatus } from '../types';
import { formatUSD, formatKhmerDate } from '../utils/sampleData';
import { Search, Plus, UserPlus, Phone, MapPin, CreditCard, ChevronRight, FileText, X, Edit2, AlertCircle, Trash2, Users } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  loans: Loan[];
  onAddCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void; // Optional additional capability
  onNavigate: (tab: string, arg?: any) => void;
  globalSearchQuery?: string;
  setGlobalSearchQuery?: (query: string) => void;
}

export default function Customers({ 
  customers, 
  loans, 
  onAddCustomer, 
  onEditCustomer, 
  onDeleteCustomer, 
  onNavigate,
  globalSearchQuery,
  setGlobalSearchQuery
}: CustomersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  const searchQuery = globalSearchQuery !== undefined ? globalSearchQuery : localSearchQuery;
  const setSearchQuery = setGlobalSearchQuery !== undefined ? setGlobalSearchQuery : setLocalSearchQuery;
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Modals status
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Customer input forms state
  const [formNameKh, setFormNameKh] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIdCard, setFormIdCard] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIdToEdit, setFormIdToEdit] = useState<string | null>(null);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase().trim();
    return customers.filter(c => 
      c.nameKh.toLowerCase().includes(query) ||
      c.nameEn.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.idCard.includes(query) ||
      c.address.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  // Selected Customer details & loan stats
  const customerDetail = useMemo(() => {
    if (!selectedCustomerId) return null;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return null;

    const customerLoans = loans.filter(l => l.customerId === selectedCustomerId);
    
    let totalBorrowed = 0;
    let totalSchedulesPaid = 0;
    let totalSchedulesOverdue = 0;
    let ongoingPrincipal = 0;

    customerLoans.forEach(l => {
      totalBorrowed += l.principal;
      
      let paidOnThisLoan = 0;
      l.schedules.forEach(s => {
        if (s.status === 'PAID') {
          totalSchedulesPaid++;
          paidOnThisLoan += s.principal;
        } else if (s.status === 'OVERDUE') {
          totalSchedulesOverdue++;
        }
      });

      if (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE) {
        ongoingPrincipal += (l.principal - paidOnThisLoan);
      }
    });

    return {
      customer,
      loans: customerLoans,
      totalBorrowed,
      ongoingPrincipal,
      totalSchedulesPaid,
      totalSchedulesOverdue,
      loansCount: customerLoans.length
    };
  }, [selectedCustomerId, customers, loans]);

  // Handle open add modal
  const openAddModal = () => {
    setFormNameKh('');
    setFormNameEn('');
    setFormPhone('');
    setFormIdCard('');
    setFormAddress('');
    setFormNotes('');
    setIsAddOpen(true);
  };

  // Handle open edit modal
  const openEditModal = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormIdToEdit(c.id);
    setFormNameKh(c.nameKh);
    setFormNameEn(c.nameEn);
    setFormPhone(c.phone);
    setFormIdCard(c.idCard);
    setFormAddress(c.address);
    setFormNotes(c.notes || '');
    setIsEditOpen(true);
  };

  // Handle submit add form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameKh || !formPhone) {
      alert('សូមបំពេញឈ្មោះខ្មែរ និងលេខទូរស័ព្ទ!');
      return;
    }

    const newId = `C-${String(customers.length + 1).padStart(3, '0')}`;
    const newCustomer: Customer = {
      id: newId,
      nameKh: formNameKh,
      nameEn: formNameEn || formNameKh,
      phone: formPhone,
      idCard: formIdCard || 'N/A',
      address: formAddress || 'Unknown',
      notes: formNotes,
      createdAt: new Date().toISOString()
    };

    onAddCustomer(newCustomer);
    setIsAddOpen(false);
    setSelectedCustomerId(newId); // auto select
  };

  // Handle submit edit form
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIdToEdit) return;

    const existing = customers.find(c => c.id === formIdToEdit);
    if (!existing) return;

    const updatedCustomer: Customer = {
      ...existing,
      nameKh: formNameKh,
      nameEn: formNameEn || formNameKh,
      phone: formPhone,
      idCard: formIdCard,
      address: formAddress,
      notes: formNotes
    };

    onEditCustomer(updatedCustomer);
    setIsEditOpen(false);
  };

  const handleRawDelete = (id: string, name: string) => {
    if (confirm(`តើអ្នកពិតជាចង់លុបអតិថិជន "${name}" មែនទេ? រាល់ព័ត៌មានទាក់ទងនឹងអតិថិជននេះនឹងត្រូវលុប។`)) {
      onDeleteCustomer(id);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
    }
  };

  return (
    <div className="space-y-6" id="customers_view_container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight moul-heading text-slate-900 leading-normal">
            បញ្ជីគ្រប់គ្រងអតិថិជន (Customers Directory)
          </h2>
          <p className="text-xs text-slate-500">ស្វែងរក បន្ថែម ឬកែប្រែប្រវត្តិព័ត៌មានលម្អិតរបស់អតិថិជនរបស់ហាង។</p>
        </div>
        <button
          onClick={openAddModal}
          className="self-start sm:self-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:translate-y-0.5 transition-all"
        >
          <UserPlus className="w-4 h-4" /> <b>បន្ថែមអតិថិជនថ្មី</b>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Customer List Area */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[750px] overflow-hidden">
          {/* List Search Bar */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ លេខទូរស័ព្ទ ឬអត្តសញ្ញាណប័ណ្ណ..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all text-slate-900 font-medium"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
              <span>បានស្វែងរកឃើញ: {filteredCustomers.length} នាក់</span>
              <span>សរុប: {customers.length} នាក់</span>
            </div>
          </div>

          {/* List content Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                មិនមានអតិថិជនត្រូវនឹងការស្វែងរកទេ!
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isActive = selectedCustomerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors group relative ${
                      isActive ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{c.nameKh}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({c.nameEn})</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Phone className="w-3.5 h-3.5 opacity-60 text-slate-400" />
                        {c.phone}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => openEditModal(c, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="កែសម្រួលព័ត៌មាន"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRawDelete(c.id, c.nameKh);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="លុបអតិថិជន"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'translate-x-1 text-indigo-600' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Customer Detail View */}
        <div className="lg:col-span-2 space-y-6">
          {customerDetail ? (
            <div className="space-y-6 animate-fadeIn" id="customer_detail_area">
              
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xl shadow-inner">
                      {customerDetail.customer.nameKh.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{customerDetail.customer.nameKh}</h3>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-md font-semibold">{customerDetail.customer.id}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-mono">{customerDetail.customer.nameEn}</p>
                      <p className="text-[11px] text-slate-400">បានចុះឈ្មោះ៖ {formatKhmerDate(customerDetail.customer.createdAt.split('T')[0])}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => openEditModal(customerDetail.customer, e)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> កែប្រែព័ត៌មាន
                    </button>
                    <button
                      onClick={() => onNavigate('loans_new', { customerId: customerDetail.customer.id })}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-medium shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> <b>បង្កើតកិច្ចសន្យាខ្ចី</b>
                    </button>
                  </div>
                </div>

                {/* Info Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                  {/* Phone */}
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
                    <div className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> លេខទូរស័ព្ទ
                    </div>
                    <div className="text-slate-800 text-sm font-mono">{customerDetail.customer.phone}</div>
                  </div>
                  
                  {/* ID Card */}
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
                    <div className="text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> អត្តសញ្ញាណប័ណ្ណ / លិខិតឆ្លងដែន
                    </div>
                    <div className="text-slate-800 text-sm font-mono">{customerDetail.customer.idCard}</div>
                  </div>

                  {/* Address */}
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1 md:col-span-1">
                    <div className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> អាសយដ្ឋានបច្ចុប្បន្ន
                    </div>
                    <div className="text-slate-800 leading-relaxed text-[11px] truncate" title={customerDetail.customer.address}>
                      {customerDetail.customer.address}
                    </div>
                  </div>
                </div>

                {/* Notes box */}
                {customerDetail.customer.notes && (
                  <div className="p-3 bg-amber-50/40 border border-amber-100/50 rounded-xl text-xs space-y-1">
                    <div className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> សម្គាល់បន្ថែមក្រៅផ្លូវការ (Staff Internal Notes)
                    </div>
                    <p className="text-slate-600">{customerDetail.customer.notes}</p>
                  </div>
                )}
              </div>

              {/* Statistics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
                <div className="text-center p-3 border-r border-slate-100 last:border-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">ចំនួនកិច្ចសន្យា</div>
                  <div className="text-lg font-bold text-slate-900">{customerDetail.loansCount} ដង</div>
                </div>
                <div className="text-center p-3 border-r border-slate-100 last:border-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">ខ្ចីសរុប (Borrowed)</div>
                  <div className="text-lg font-bold text-slate-900">{formatUSD(customerDetail.totalBorrowed)}</div>
                </div>
                <div className="text-center p-3 border-r border-slate-100 last:border-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">ជំពាក់បច្ចុប្បន្ន</div>
                  <div className="text-lg font-bold text-indigo-600">{formatUSD(customerDetail.ongoingPrincipal)}</div>
                </div>
                <div className="text-center p-3 last:border-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">ការយឺតយ៉ាវ</div>
                  <div className={`text-lg font-bold ${customerDetail.totalSchedulesOverdue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {customerDetail.totalSchedulesOverdue} លើក
                  </div>
                </div>
              </div>

              {/* Loans List under Customer */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-indigo-500" /> ប្រវត្តិកិច្ចសន្យាទាំងអស់របស់អតិថិជននេះ
                </h4>
                
                {customerDetail.loans.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    អតិថិជននេះពុំទាន់មានប្រវត្តិកិច្ចសន្យាជាមួយហាងនៅឡើយទេ។
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-medium">
                          <th className="py-2.5 px-3">លេខកូដកិច្ចសន្យា</th>
                          <th className="py-2.5 px-3">ប្រភេទ</th>
                          <th className="py-2.5 px-3 text-right">ប្រាក់ដើម</th>
                          <th className="py-2.5 px-3 text-center">រយៈពេល</th>
                          <th className="py-2.5 px-3">ថ្ងៃចាប់ផ្តើម</th>
                          <th className="py-2.5 px-3 text-center">ស្ថានភាព</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 leading-relaxed text-slate-700">
                        {customerDetail.loans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                            <td 
                              onClick={() => onNavigate('loans', loan.id)}
                              className="py-3 px-3 font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              {loan.id}
                            </td>
                            <td className="py-3 px-3">
                              {loan.type === 'PAWN' ? 'បញ្ចាំ' : loan.type === 'STANDARD' ? 'កម្ចី' : 'រំលស់' }
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900">{formatUSD(loan.principal)}</td>
                            <td className="py-3 px-3 text-center">
                              {loan.termCount} {loan.termUnit === 'MONTHLY' ? 'ខែ' : loan.termUnit === 'WEEKLY' ? 'សប្តាហ៍' : 'ថ្ងៃ'}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px]">{loan.startDate}</td>
                            <td className="py-3 px-3 text-center">
                              {loan.status === 'ACTIVE' && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-250">ដំណើរការ</span>}
                              {loan.status === 'PAID' && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">រួចរាល់</span>}
                              {loan.status === 'OVERDUE' && <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-semibold border border-red-200">យឺតយ៉ាវ</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <Users className="w-12 h-12 text-slate-350 opacity-50" />
              សូមជ្រើសរើសអតិថិជនណាម្នាក់ពីបញ្ជីខាងឆ្វេង ដើម្បីមើលប្រវត្តិលម្អិត និងកិច្ចសន្យាទាំងអស់។
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold moul-heading text-yellow-500 text-sm">ចុះឈ្មោះអតិថិជនថ្មី</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white hover:text-slate-200 transition-colors p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ឈ្មោះអតិថិជន (Khmer) *</label>
                  <input
                    type="text"
                    required
                    value={formNameKh}
                    onChange={(e) => setFormNameKh(e.target.value)}
                    placeholder="ឈ្មោះសរសេរជាភាសាខ្មែរ"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ឈ្មោះឡាតាំង (Latin) *</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. SOK CHANTHA"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 uppercase focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">លេខទូរស័ព្ទទំនាក់ទំនង *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 012 345 678"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">លេខអត្តសញ្ញាណប័ណ្ណ (ID Card / Passport)</label>
                  <input
                    type="text"
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="លេខអត្តសញ្ញាណប័ណ្ណ៩ខ្ទង់ ឬ១២ខ្ទង់"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">អាសយដ្ឋានបច្ចុប្បន្ន</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="លំនៅដ្ឋានបច្ចុប្បន្ន ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ ខេត្ត..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 text-[11px] text-amber-800">កំណត់ចំណាំផ្ទៃក្នុង (Staff Internal Note)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ព័ត៌មានបន្ថែមអំពីលក្ខណៈសម្បត្តិ ប្រភពចំណូល ឬការធានា..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded-lg transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  រក្សាទុកអតិថិជន
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-bold moul-heading text-yellow-500 text-sm">កែប្រែព័ត៌មានអតិថិជន</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-white hover:text-slate-200 transition-colors p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ឈ្មោះអតិថិជន (Khmer) *</label>
                  <input
                    type="text"
                    required
                    value={formNameKh}
                    onChange={(e) => setFormNameKh(e.target.value)}
                    placeholder="ឈ្មោះខ្មែរ"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">ឈ្មោះឡាតាំង (Latin) *</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="Latin English Name"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 uppercase focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">លេខទូរស័ព្ទ *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">អត្តសញ្ញាណប័ណ្ណ (ID Card)</label>
                  <input
                    type="text"
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="National ID Card Number"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">អាសយដ្ឋានបច្ចុប្បន្ន</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="លំនៅដ្ឋាន"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 text-[11px]">កំណត់ចំណាំបន្ថែម</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ព័ត៌មានបន្ថែម..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded-lg transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
