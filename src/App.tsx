import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowDownUp,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  Globe2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Language = 'en' | 'ar';
type Tab = 'all' | 'pending' | 'overdue' | 'received';
type SortKey = 'warehouse' | 'eta' | 'document' | 'amount';
type InvoiceType = 'Invoice' | 'Credit Note' | 'Proforma';
type CatalogKind = 'company' | 'item';

type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_name: string;
  quantity: number | null;
  received: boolean;
  note: string | null;
};

type Invoice = {
  id: string;
  invoice_type: InvoiceType;
  document_number: string;
  amount: number | null;
  document_date: string | null;
  awb_bl: string | null;
  company_name: string;
  eta_date: string | null;
  warehouse_arrival_date: string | null;
  link: string | null;
  remarks: string | null;
  received: boolean;
  items: InvoiceItem[];
};

type CatalogEntry = { id: string; kind: CatalogKind; name: string };
type FormItem = { id?: string; item_name: string; quantity: string; received: boolean; note: string };

const translations = {
  en: {
    app: 'Setra Industrial', subtitle: 'Invoices & shipment tracking', add: 'Add invoice', export: 'Export CSV', settings: 'Settings', pending: 'Pending', overdue: 'Overdue', received: 'Received', all: 'All invoices', search: 'Search invoices', company: 'Company', arrivalFrom: 'Warehouse arrival from', arrivalTo: 'to', sort: 'Sort by', reset: 'Clear filters', warehouse: 'Warehouse arrival', document: 'Document', type: 'Type', amount: 'Total amount', docDate: 'Document date', awb: 'AWB / BL', eta: 'Order ETA', link: 'Link', remarks: 'Remarks', open: 'Open', noData: 'No invoices match these filters.', save: 'Save invoice', cancel: 'Cancel', edit: 'Edit invoice', new: 'New invoice', delete: 'Delete invoice', deleteConfirm: 'Click again to confirm', details: 'Invoice details', items: 'Line items', addItem: 'Add item', itemName: 'Item name', quantity: 'Qty', note: 'Note', noItems: 'No items added yet', receivedInvoice: 'Invoice received', receivedItem: 'Received', companyRequired: 'Choose or add a company.', documentRequired: 'Document number is required.', loadError: 'We could not load the invoice workspace.', saveError: 'We could not save that invoice.', deleteError: 'We could not delete that invoice.', catalog: 'Lists', companies: 'Companies', itemNames: 'Item names', addName: 'Add name', emptyList: 'Nothing saved yet.', addCompany: 'Add a company', addItemName: 'Add an item name', remove: 'Remove', removeConfirm: 'Remove this name?', language: 'العربية', today: 'Today', inDays: (n: number) => `In ${n} days`, overdueBy: (n: number) => `${n} days overdue`, noDate: 'No date', summary: 'Summary', openItems: 'open items', quickView: 'Quick view', refresh: 'Refresh data', unsaved: 'Unsaved changes', close: 'Close', created: 'Created', total: 'Total', results: 'results', clearResults: 'Clear results', byWarehouse: 'By warehouse arrival', noShipments: 'No pending shipments', dark: 'Dark mode', light: 'Light mode', newest: 'Newest document date', soonest: 'Soonest warehouse arrival', earliestEta: 'Earliest order ETA', highestAmount: 'Highest amount',
  },
  ar: {
    app: 'Setra Industrial', subtitle: 'الفواتير ومتابعة الشحنات', add: 'إضافة فاتورة', export: 'تصدير CSV', settings: 'الإعدادات', pending: 'قيد الانتظار', overdue: 'متأخرة', received: 'مستلمة', all: 'كل الفواتير', search: 'بحث في الفواتير', company: 'الشركة', arrivalFrom: 'الوصول للمستودع من', arrivalTo: 'إلى', sort: 'الترتيب', reset: 'مسح الفلاتر', warehouse: 'الوصول للمستودع', document: 'المستند', type: 'النوع', amount: 'الإجمالي', docDate: 'تاريخ المستند', awb: 'AWB / BL', eta: 'تاريخ الطلب', link: 'الرابط', remarks: 'ملاحظات', open: 'فتح', noData: 'لا توجد فواتير مطابقة للفلاتر.', save: 'حفظ الفاتورة', cancel: 'إلغاء', edit: 'تعديل الفاتورة', new: 'فاتورة جديدة', delete: 'حذف الفاتورة', deleteConfirm: 'اضغط مرة أخرى للتأكيد', details: 'تفاصيل الفاتورة', items: 'الأصناف', addItem: 'إضافة صنف', itemName: 'اسم الصنف', quantity: 'الكمية', note: 'ملاحظة', noItems: 'لم تُضف أصناف بعد', receivedInvoice: 'تم استلام الفاتورة', receivedItem: 'تم الاستلام', companyRequired: 'اختر شركة أو أضف شركة جديدة.', documentRequired: 'رقم المستند مطلوب.', loadError: 'تعذر تحميل مساحة الفواتير.', saveError: 'تعذر حفظ الفاتورة.', deleteError: 'تعذر حذف الفاتورة.', catalog: 'القوائم', companies: 'الشركات', itemNames: 'أسماء الأصناف', addName: 'إضافة اسم', emptyList: 'لا توجد أسماء محفوظة.', addCompany: 'إضافة شركة', addItemName: 'إضافة اسم صنف', remove: 'حذف', removeConfirm: 'حذف هذا الاسم؟', language: 'English', today: 'اليوم', inDays: (n: number) => `بعد ${n} يوم`, overdueBy: (n: number) => `متأخرة ${n} يوم`, noDate: 'بلا تاريخ', summary: 'الملخص', openItems: 'أصناف مفتوحة', quickView: 'عرض سريع', refresh: 'تحديث البيانات', unsaved: 'تغييرات غير محفوظة', close: 'إغلاق', created: 'تاريخ الإنشاء', total: 'الإجمالي', results: 'نتيجة', clearResults: 'مسح النتائج', byWarehouse: 'حسب الوصول للمستودع', noShipments: 'لا توجد شحنات معلقة', dark: 'الوضع الداكن', light: 'الوضع الفاتح', newest: 'أحدث تاريخ مستند', soonest: 'أقرب وصول للمستودع', earliestEta: 'أقرب موعد طلب', highestAmount: 'أعلى إجمالي',
  },
} as const;

const initialFormItem = (): FormItem => ({ item_name: '', quantity: '', received: false, note: '' });
const todayString = () => new Date().toISOString().slice(0, 10);
const daysFromToday = (value: string | null) => value ? Math.round((new Date(`${value}T12:00:00`).getTime() - new Date(`${todayString()}T12:00:00`).getTime()) / 86400000) : null;
const isReceived = (invoice: Invoice) => invoice.items.length > 0 ? invoice.items.every((item) => item.received) : invoice.received;
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const formatDate = (value: string | null, language: Language) => value ? new Date(`${value}T12:00:00`).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatAmount = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortKey>('warehouse');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<'invoice' | 'settings' | null>(null);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [toast, setToast] = useState('');

  const t = translations[language];
  const companies = useMemo(() => [...new Set(catalog.filter((entry) => entry.kind === 'company').map((entry) => entry.name).concat(invoices.map((invoice) => invoice.company_name)))].filter(Boolean).sort(), [catalog, invoices]);
  const itemNames = useMemo(() => [...new Set(catalog.filter((entry) => entry.kind === 'item').map((entry) => entry.name).concat(invoices.flatMap((invoice) => invoice.items.map((item) => item.item_name))))].filter(Boolean).sort(), [catalog, invoices]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [invoiceResult, itemResult, catalogResult] = await Promise.all([
      supabase.from('invoice_records').select('id, invoice_type, document_number, amount, document_date, awb_bl, company_name, eta_date, warehouse_arrival_date, link, remarks, received').order('warehouse_arrival_date', { ascending: true, nullsFirst: false }),
      supabase.from('invoice_items').select('id, invoice_id, item_name, quantity, received, note').order('created_at'),
      supabase.from('invoice_catalog').select('id, kind, name').order('name'),
    ]);
    if (invoiceResult.error || itemResult.error || catalogResult.error) {
      setError(t.loadError);
      setIsLoading(false);
      return;
    }
    const items = (itemResult.data ?? []) as InvoiceItem[];
    setInvoices(((invoiceResult.data ?? []) as Omit<Invoice, 'items'>[]).map((invoice) => ({ ...invoice, items: items.filter((item) => item.invoice_id === invoice.id) })));
    setCatalog((catalogResult.data ?? []) as CatalogEntry[]);
    setIsLoading(false);
  }, [t.loadError]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = language; }, [language]);
  useEffect(() => { document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'; }, [darkMode]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timeout); }, [toast]);

  const filteredInvoices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = invoices.filter((invoice) => {
      const received = isReceived(invoice);
      const days = daysFromToday(invoice.warehouse_arrival_date);
      if (tab === 'pending' && received) return false;
      if (tab === 'received' && !received) return false;
      if (tab === 'overdue' && (received || days === null || days >= 0)) return false;
      if (companyFilter && invoice.company_name !== companyFilter) return false;
      if (fromDate && (!invoice.warehouse_arrival_date || invoice.warehouse_arrival_date < fromDate)) return false;
      if (toDate && (!invoice.warehouse_arrival_date || invoice.warehouse_arrival_date > toDate)) return false;
      if (needle && ![invoice.company_name, invoice.document_number, invoice.awb_bl, invoice.invoice_type, invoice.remarks, ...invoice.items.flatMap((item) => [item.item_name, item.note])].join(' ').toLowerCase().includes(needle)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === 'amount') return (b.amount ?? 0) - (a.amount ?? 0);
      if (sort === 'document') return (b.document_date ?? '').localeCompare(a.document_date ?? '');
      if (sort === 'eta') return (a.eta_date ?? '9999').localeCompare(b.eta_date ?? '9999');
      return (a.warehouse_arrival_date ?? '9999').localeCompare(b.warehouse_arrival_date ?? '9999');
    });
  }, [invoices, query, tab, companyFilter, fromDate, toDate, sort]);

  const pendingCount = invoices.filter((invoice) => !isReceived(invoice)).length;
  const overdueCount = invoices.filter((invoice) => !isReceived(invoice) && (daysFromToday(invoice.warehouse_arrival_date) ?? 1) < 0).length;
  const receivedCount = invoices.filter(isReceived).length;

  const showModalForNew = () => { setEditing(null); setModal('invoice'); };
  const showModalForEdit = (invoice: Invoice) => { setEditing(invoice); setModal('invoice'); };

  const saveInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const company = String(form.get('company_name') ?? '').trim();
    const documentNumber = String(form.get('document_number') ?? '').trim();
    if (!company) { setError(t.companyRequired); return; }
    if (!documentNumber) { setError(t.documentRequired); return; }
    const record = { invoice_type: String(form.get('invoice_type') ?? 'Invoice') as InvoiceType, document_number: documentNumber, amount: String(form.get('amount') ?? '') ? Number(form.get('amount')) : null, document_date: String(form.get('document_date') ?? '') || null, awb_bl: String(form.get('awb_bl') ?? '').trim() || null, company_name: company, eta_date: String(form.get('eta_date') ?? '') || null, warehouse_arrival_date: String(form.get('warehouse_arrival_date') ?? '') || null, link: String(form.get('link') ?? '').trim() || null, remarks: String(form.get('remarks') ?? '').trim() || null, received: form.get('received') === 'on', updated_at: new Date().toISOString() };
    const itemRows = [...event.currentTarget.querySelectorAll('[data-item-row]')].map((row) => ({ item_name: (row.querySelector('[name="item_name"]') as HTMLInputElement)?.value.trim(), quantity: (row.querySelector('[name="quantity"]') as HTMLInputElement)?.value, received: (row.querySelector('[name="item_received"]') as HTMLInputElement)?.checked ?? false, note: (row.querySelector('[name="item_note"]') as HTMLInputElement)?.value.trim() || null })).filter((item) => item.item_name).map((item) => ({ ...item, quantity: item.quantity ? Number(item.quantity) : null }));
    const invoiceResult = editing ? await supabase.from('invoice_records').update(record).eq('id', editing.id).select('id, invoice_type, document_number, amount, document_date, awb_bl, company_name, eta_date, warehouse_arrival_date, link, remarks, received').maybeSingle() : await supabase.from('invoice_records').insert(record).select('id, invoice_type, document_number, amount, document_date, awb_bl, company_name, eta_date, warehouse_arrival_date, link, remarks, received').maybeSingle();
    if (invoiceResult.error || !invoiceResult.data) { setError(t.saveError); return; }
    const invoiceId = invoiceResult.data.id as string;
    if (editing) {
      const { error: deleteItemsError } = await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      if (deleteItemsError) { setError(t.saveError); return; }
    }
    if (itemRows.length) {
      const { error: itemError } = await supabase.from('invoice_items').insert(itemRows.map((item) => ({ ...item, invoice_id: invoiceId })));
      if (itemError) { setError(t.saveError); return; }
    }
    setModal(null);
    setError('');
    setToast(editing ? 'Invoice updated' : 'Invoice added');
    await loadData();
  };

  const deleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`${t.delete}: ${invoice.document_number}?`)) return;
    const { error: deleteError } = await supabase.from('invoice_records').delete().eq('id', invoice.id);
    if (deleteError) { setError(t.deleteError); return; }
    setModal(null);
    setToast('Invoice deleted');
    await loadData();
  };

  const toggleItem = async (item: InvoiceItem) => {
    const { error: updateError } = await supabase.from('invoice_items').update({ received: !item.received }).eq('id', item.id);
    if (updateError) { setError(t.saveError); return; }
    setInvoices((current) => current.map((invoice) => invoice.id === item.invoice_id ? { ...invoice, items: invoice.items.map((row) => row.id === item.id ? { ...row, received: !row.received } : row) } : invoice));
  };

  const exportCsv = () => {
    const headers = [t.company, t.document, t.type, t.amount, t.docDate, t.awb, t.eta, t.warehouse, t.remarks];
    const lines = filteredInvoices.map((invoice) => [invoice.company_name, invoice.document_number, invoice.invoice_type, invoice.amount, invoice.document_date, invoice.awb_bl, invoice.eta_date, invoice.warehouse_arrival_date, invoice.remarks].map(csvCell).join(','));
    const blob = new Blob([[headers.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `setra-invoices-${todayString()}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const clearResults = async () => {
    if (!filteredInvoices.length) return;
    if (!window.confirm(language === 'en' ? `Delete all ${filteredInvoices.length} invoices in the current results? This cannot be undone.` : `حذف جميع الفواتير الـ ${filteredInvoices.length} في النتائج الحالية؟ لا يمكن التراجع عن هذا.`)) return;
    const ids = filteredInvoices.map((invoice) => invoice.id);
    const { error: deleteError } = await supabase.from('invoice_records').delete().in('id', ids);
    if (deleteError) { setError(t.deleteError); return; }
    setExpanded(new Set());
    setToast(language === 'en' ? `${ids.length} invoices deleted` : `تم حذف ${ids.length} فاتورة`);
    await loadData();
  };

  const addCatalogEntry = async (kind: CatalogKind, name: string) => {
    const cleanName = name.trim();
    if (!cleanName || catalog.some((entry) => entry.kind === kind && entry.name.toLowerCase() === cleanName.toLowerCase())) return;
    const { data, error: insertError } = await supabase.from('invoice_catalog').insert({ kind, name: cleanName }).select('id, kind, name').maybeSingle();
    if (insertError || !data) { setError(t.saveError); return; }
    setCatalog((current) => [...current, data as CatalogEntry]);
  };

  const removeCatalogEntry = async (entry: CatalogEntry) => {
    const { error: removeError } = await supabase.from('invoice_catalog').delete().eq('id', entry.id);
    if (removeError) { setError(t.saveError); return; }
    setCatalog((current) => current.filter((item) => item.id !== entry.id));
  };

  return <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)] transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 shadow-[0_1px_0_rgba(20,40,60,.03)] backdrop-blur">
      <div className="mx-auto flex min-h-[78px] max-w-[1600px] flex-wrap items-center gap-4 px-5 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-blue-200/30"><Truck size={23} strokeWidth={2.2} /></div><div className="min-w-0"><h1 className="truncate text-[18px] font-bold tracking-[-0.03em]">{t.app}</h1><p className="hidden text-xs text-[var(--muted)] sm:block">{t.subtitle}</p></div></div>
        <div className="order-3 flex w-full items-center gap-2 overflow-x-auto lg:order-2 lg:ml-8 lg:w-auto"><HeaderTab label={t.all} count={invoices.length} active={tab === 'all'} onClick={() => setTab('all')} /><HeaderTab label={t.pending} count={pendingCount} active={tab === 'pending'} onClick={() => setTab('pending')} /><HeaderTab label={t.overdue} count={overdueCount} active={tab === 'overdue'} onClick={() => setTab('overdue')} danger /><HeaderTab label={t.received} count={receivedCount} active={tab === 'received'} onClick={() => setTab('received')} /></div>
        <div className="ms-auto flex items-center gap-2"><button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="icon-button" title={t.language} aria-label={t.language}><Globe2 size={18} /><span className="hidden text-xs font-semibold sm:inline">{language === 'en' ? 'AR' : 'EN'}</span></button><button onClick={() => setDarkMode((value) => !value)} className="icon-button hidden sm:flex" title={darkMode ? t.light : t.dark} aria-label={darkMode ? t.light : t.dark}>{darkMode ? <span className="text-base">☼</span> : <span className="text-base">◐</span>}</button><button onClick={() => setModal('settings')} className="icon-button" title={t.settings} aria-label={t.settings}><Settings size={18} /></button></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8 lg:py-8">
      {(error || toast) && <div className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><div className="flex items-center gap-2">{error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}{error || toast}</div><button onClick={() => { setError(''); setToast(''); }} aria-label={t.close}><X size={17} /></button></div>}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--accent)]">{t.app}</p><h2 className="text-[clamp(1.7rem,3vw,2.6rem)] font-bold leading-tight tracking-[-.045em]">{t.subtitle}</h2><p className="mt-2 text-sm text-[var(--muted)]">{t.byWarehouse} · {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void loadData()} className="secondary-button" title={t.refresh}><RefreshCw size={16} /> <span className="hidden sm:inline">{t.refresh}</span></button><button onClick={exportCsv} className="secondary-button"><Download size={16} /> <span className="hidden sm:inline">{t.export}</span></button><button onClick={clearResults} disabled={!filteredInvoices.length} className="danger-button"><Trash2 size={16} /> <span className="hidden sm:inline">{t.clearResults}</span></button><button onClick={showModalForNew} className="add-button"><Plus size={20} /> {t.add}</button></div></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label={t.pending} value={pendingCount} detail={t.openItems} icon={ClipboardList} tone="blue" /><StatCard label={t.overdue} value={overdueCount} detail={t.byWarehouse} icon={AlertCircle} tone="red" /><StatCard label={t.received} value={receivedCount} detail={`${invoices.length ? Math.round((receivedCount / invoices.length) * 100) : 0}% ${t.total}`} icon={PackageCheck} tone="green" /></div>
      <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]"><div className="flex flex-wrap items-center gap-2"><label className="relative min-w-[230px] flex-1"><Search size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className="field w-full ps-10" /></label><button onClick={() => setMobileFilters((value) => !value)} className="secondary-button lg:hidden"><Filter size={16} /> {t.sort}</button><div className={`${mobileFilters ? 'flex' : 'hidden'} w-full flex-wrap gap-2 lg:flex lg:w-auto`}><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="field"><option value="">{t.company}: {t.all}</option>{companies.map((company) => <option key={company}>{company}</option>)}</select><label className="date-field"><span>{t.arrivalFrom}</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="date-field"><span>{t.arrivalTo}</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="field"><option value="warehouse">{t.soonest}</option><option value="eta">{t.earliestEta}</option><option value="document">{t.newest}</option><option value="amount">{t.highestAmount}</option></select><button onClick={() => { setQuery(''); setCompanyFilter(''); setFromDate(''); setToDate(''); setSort('warehouse'); setTab('all'); }} className="text-button">{t.reset}</button></div></div></div>

      <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]"><ShipmentSidebar invoices={invoices} language={language} expanded={expanded} onSelect={(id) => { setExpanded((current) => new Set(current).add(id)); document.getElementById(`invoice-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]"><div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-5"><div><h3 className="font-bold tracking-[-.02em]">{t.all}</h3><p className="mt-1 text-xs text-[var(--muted)]">{filteredInvoices.length} {t.results}</p></div><div className="hidden items-center gap-2 text-xs text-[var(--muted)] sm:flex"><ArrowDownUp size={14} /> {t.sort}</div></div><div className="overflow-x-auto"><table className="invoice-table"><thead><tr><th></th><th>{t.company}</th><th>{t.document}</th><th>{t.type}</th><th>{t.amount}</th><th>{t.docDate}</th><th>{t.awb}</th><th>{t.eta}</th><th>{t.warehouse}</th><th>{t.link}</th><th>{t.remarks}</th></tr></thead><tbody>{filteredInvoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} language={language} expanded={expanded.has(invoice.id)} onExpand={() => setExpanded((current) => { const next = new Set(current); if (next.has(invoice.id)) next.delete(invoice.id); else next.add(invoice.id); return next; })} onEdit={() => showModalForEdit(invoice)} onToggleItem={toggleItem} />)}{!isLoading && !filteredInvoices.length && <tr><td colSpan={11}><div className="empty-state"><Archive size={30} /><p>{t.noData}</p><button onClick={showModalForNew} className="text-button">{t.add}</button></div></td></tr>}</tbody></table></div></section>
      </div>
    </main>
    {isLoading && <div className="fixed inset-0 z-40 grid place-items-center bg-[var(--app-bg)]/70 backdrop-blur-sm"><div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm shadow-xl"><RefreshCw className="animate-spin text-[var(--accent)]" size={18} /> {t.refresh}...</div></div>}
    {modal === 'invoice' && <InvoiceModal invoice={editing} companies={companies} itemNames={itemNames} language={language} onClose={() => setModal(null)} onSave={saveInvoice} onDelete={deleteInvoice} />}
    {modal === 'settings' && <SettingsModal catalog={catalog} language={language} onClose={() => setModal(null)} onAdd={addCatalogEntry} onRemove={removeCatalogEntry} />}
  </div>;
}

function HeaderTab({ label, count, active, danger = false, onClick }: { label: string; count: number; active: boolean; danger?: boolean; onClick: () => void }) { return <button onClick={onClick} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:bg-[var(--app-bg)]'} ${danger && count ? 'text-red-600' : ''}`}>{label}<span className={`ms-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${danger && count ? 'bg-red-100 text-red-700' : 'bg-[var(--border-soft)] text-[var(--muted)]'}`}>{count}</span></button>; }
function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof ClipboardList; tone: 'blue' | 'red' | 'green' }) { const styles = { blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', green: 'bg-emerald-50 text-emerald-600' }; return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]"><div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${styles[tone]}`}><Icon size={18} /></span><ArrowUpRight size={16} className="text-[var(--muted-light)]" /></div><p className="mt-4 text-2xl font-bold tracking-[-.04em]">{value} <span className="text-sm font-semibold text-[var(--muted)]">{label}</span></p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></div>; }

function ShipmentSidebar({ invoices, language, expanded, onSelect }: { invoices: Invoice[]; language: Language; expanded: Set<string>; onSelect: (id: string) => void }) { const t = translations[language]; const groups = [{ title: t.overdue, filter: (invoice: Invoice) => !isReceived(invoice) && (daysFromToday(invoice.warehouse_arrival_date) ?? 1) < 0, tone: 'red' }, { title: language === 'en' ? 'Within 7 days' : 'خلال 7 أيام', filter: (invoice: Invoice) => { const days = daysFromToday(invoice.warehouse_arrival_date); return !isReceived(invoice) && days !== null && days >= 0 && days <= 7; }, tone: 'amber' }, { title: language === 'en' ? 'Within 30 days' : 'خلال 30 يوماً', filter: (invoice: Invoice) => { const days = daysFromToday(invoice.warehouse_arrival_date); return !isReceived(invoice) && days !== null && days > 7 && days <= 30; }, tone: 'blue' }, { title: language === 'en' ? 'Later' : 'لاحقاً', filter: (invoice: Invoice) => !isReceived(invoice) && (daysFromToday(invoice.warehouse_arrival_date) ?? 0) > 30, tone: 'green' }]; return <aside className="hidden h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] xl:block"><div className="mb-4 flex items-center gap-2"><CalendarDays size={17} className="text-[var(--accent)]" /><div><h3 className="text-sm font-bold">{t.byWarehouse}</h3><p className="text-[11px] text-[var(--muted)]">{t.noShipments}</p></div></div>{groups.map((group) => { const items = invoices.filter(group.filter).sort((a, b) => (a.warehouse_arrival_date ?? '').localeCompare(b.warehouse_arrival_date ?? '')); return <div key={group.title} className="mb-4 last:mb-0"><p className={`mb-2 border-b border-[var(--border)] pb-1.5 text-[11px] font-bold uppercase tracking-wider ${group.tone === 'red' ? 'text-red-600' : group.tone === 'amber' ? 'text-amber-600' : group.tone === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`}>{group.title} <span className="font-normal text-[var(--muted)]">({items.length})</span></p>{items.map((invoice) => <button key={invoice.id} onClick={() => onSelect(invoice.id)} className={`sidebar-invoice ${expanded.has(invoice.id) ? 'bg-[var(--accent-soft)]' : ''}`}><b>{invoice.company_name}</b><span>{invoice.document_number} · {formatDate(invoice.warehouse_arrival_date, language)}</span></button>)}</div>; })}</aside>; }

function InvoiceRow({ invoice, language, expanded, onExpand, onEdit, onToggleItem }: { invoice: Invoice; language: Language; expanded: boolean; onExpand: () => void; onEdit: () => void; onToggleItem: (item: InvoiceItem) => void }) { const t = translations[language]; const received = isReceived(invoice); const days = daysFromToday(invoice.warehouse_arrival_date); const status = received ? { label: t.received, cls: 'status-green' } : days !== null && days < 0 ? { label: t.overdueBy(Math.abs(days)), cls: 'status-red' } : days === 0 ? { label: t.today, cls: 'status-amber' } : days !== null ? { label: t.inDays(days), cls: 'status-blue' } : { label: t.noDate, cls: 'status-muted' }; return <><tr id={`invoice-${invoice.id}`} className="invoice-row" onClick={onExpand}><td><span className="grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span></td><td><button onClick={(event) => { event.stopPropagation(); onEdit(); }} className="group/company text-start"><b className="block max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text)] group-hover/company:text-[var(--accent)]">{invoice.company_name}</b></button></td><td className="font-semibold">{invoice.document_number}{invoice.items.length > 0 && <span className="ms-2 rounded-full bg-[var(--border-soft)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">{invoice.items.filter((item) => item.received).length}/{invoice.items.length}</span>}</td><td><span className="type-pill">{invoice.invoice_type}</span></td><td className="font-medium">{formatAmount(invoice.amount)}</td><td>{formatDate(invoice.document_date, language)}</td><td className="max-w-[150px] overflow-hidden text-ellipsis">{invoice.awb_bl || '—'}</td><td>{formatDate(invoice.eta_date, language)}</td><td><span className={`status-pill ${status.cls}`}>{status.label}</span><div className="mt-1 text-[11px] text-[var(--muted)]">{formatDate(invoice.warehouse_arrival_date, language)}</div></td><td>{invoice.link && /^https?:\/\//i.test(invoice.link) ? <a href={invoice.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="link-button" aria-label={t.open}><ExternalLink size={15} /></a> : '—'}</td><td className="max-w-[190px] overflow-hidden text-ellipsis" title={invoice.remarks ?? ''}>{invoice.remarks || '—'}</td></tr>{expanded && <tr className="items-row"><td colSpan={11}><div className="p-2 sm:p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t.items}</p><button onClick={onEdit} className="text-button"><Edit3 size={14} /> {t.edit}</button></div>{invoice.items.length ? <div className="space-y-2">{invoice.items.map((item) => <div key={item.id} className="item-line"><button onClick={() => onToggleItem(item)} className={`item-check ${item.received ? 'item-check-done' : ''}`} aria-label={t.receivedItem}>{item.received && <Check size={13} strokeWidth={3} />}</button><span className={`min-w-0 flex-1 text-sm font-semibold ${item.received ? 'line-through text-[var(--muted)]' : ''}`}>{item.item_name}</span><span className="text-xs text-[var(--muted)]">{item.quantity ?? '—'}</span>{item.note && <span className="hidden max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--muted)] sm:block">{item.note}</span>}<span className={`text-[11px] font-semibold ${item.received ? 'text-emerald-600' : 'text-[var(--muted)]'}`}>{item.received ? t.received : t.pending}</span></div>)}</div> : <p className="text-sm text-[var(--muted)]">{t.noItems}</p>}</div></td></tr>}</>; }

function InvoiceModal({ invoice, companies, itemNames, language, onClose, onSave, onDelete }: { invoice: Invoice | null; companies: string[]; itemNames: string[]; language: Language; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; onDelete: (invoice: Invoice) => void }) { const t = translations[language]; const [items, setItems] = useState<FormItem[]>(invoice?.items.map((item) => ({ id: item.id, item_name: item.item_name, quantity: item.quantity === null ? '' : String(item.quantity), received: item.received, note: item.note ?? '' })) ?? []); const [companyNew, setCompanyNew] = useState(false); return <Modal title={invoice ? t.edit : t.new} onClose={onClose}><form onSubmit={onSave} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="form-label">{t.company}<div className="mt-1.5 flex gap-2">{companyNew ? <input autoFocus name="company_name" defaultValue={invoice?.company_name} className="field w-full" placeholder={language === 'en' ? 'New company name' : 'اسم الشركة'} required /> : <select name="company_name" defaultValue={invoice?.company_name ?? ''} className="field w-full" required><option value="">—</option>{companies.map((company) => <option key={company}>{company}</option>)}</select>}<button type="button" className="secondary-button shrink-0 px-3" onClick={() => setCompanyNew((value) => !value)}>{companyNew ? '×' : '+'}</button></div></label><label className="form-label">{t.type}<select name="invoice_type" defaultValue={invoice?.invoice_type ?? 'Invoice'} className="field mt-1.5 w-full"><option>Invoice</option><option>Credit Note</option><option>Proforma</option></select></label><label className="form-label">{t.document}<input name="document_number" defaultValue={invoice?.document_number ?? ''} className="field mt-1.5 w-full" required /></label><label className="form-label">{t.amount}<input name="amount" defaultValue={invoice?.amount ?? ''} type="number" min="0" step="0.01" className="field mt-1.5 w-full" /></label><label className="form-label">{t.docDate}<input name="document_date" defaultValue={invoice?.document_date ?? ''} type="date" className="field mt-1.5 w-full" /></label><label className="form-label">{t.awb}<input name="awb_bl" defaultValue={invoice?.awb_bl ?? ''} className="field mt-1.5 w-full" /></label><label className="form-label">{t.eta}<input name="eta_date" defaultValue={invoice?.eta_date ?? ''} type="date" className="field mt-1.5 w-full" /></label><label className="form-label">{t.warehouse}<input name="warehouse_arrival_date" defaultValue={invoice?.warehouse_arrival_date ?? ''} type="date" className="field mt-1.5 w-full" /></label><label className="form-label sm:col-span-2">{t.link}<input name="link" defaultValue={invoice?.link ?? ''} type="url" placeholder="https://..." dir="ltr" className="field mt-1.5 w-full" /></label><label className="form-label sm:col-span-2">{t.remarks}<textarea name="remarks" defaultValue={invoice?.remarks ?? ''} rows={2} className="field mt-1.5 w-full resize-none" /></label></div><div className="border-t border-[var(--border)] pt-5"><div className="mb-3 flex items-center justify-between"><div><h3 className="font-bold">{t.items}</h3><p className="mt-1 text-xs text-[var(--muted)]">{t.quickView}</p></div><button type="button" onClick={() => setItems((current) => [...current, initialFormItem()])} className="secondary-button"><Plus size={15} /> {t.addItem}</button></div>{items.length ? <div className="space-y-2">{items.map((item, index) => <div key={item.id ?? index} data-item-row className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--app-bg)] p-3 sm:grid-cols-[minmax(0,1.7fr)_90px_auto_minmax(0,1.3fr)_32px] sm:items-center"><input name="item_name" list="item-names" defaultValue={item.item_name} placeholder={t.itemName} className="field" /><input name="quantity" defaultValue={item.quantity} type="number" min="0" step="any" placeholder={t.quantity} className="field" /><label className="flex items-center gap-2 text-xs text-[var(--muted)]"><input name="item_received" type="checkbox" defaultChecked={item.received} className="accent-[var(--accent)]" /> {t.receivedItem}</label><input name="item_note" defaultValue={item.note} placeholder={t.note} className="field" /><button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="icon-button text-red-500" aria-label={t.remove}><Trash2 size={15} /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">{t.noItems}</div>}<datalist id="item-names">{itemNames.map((name) => <option key={name} value={name} />)}</datalist></div><label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><input name="received" type="checkbox" defaultChecked={invoice?.received ?? false} className="accent-[var(--accent)]" /> {t.receivedInvoice}</label><div className="modal-actions"><button type="button" onClick={onClose} className="secondary-button">{t.cancel}</button><div className="flex gap-2">{invoice && <button type="button" onClick={() => onDelete(invoice)} className="secondary-button text-red-600"><Trash2 size={15} /> {t.delete}</button>}<button type="submit" className="primary-button"><Check size={16} /> {t.save}</button></div></div></form></Modal>; }

function SettingsModal({ catalog, language, onClose, onAdd, onRemove }: { catalog: CatalogEntry[]; language: Language; onClose: () => void; onAdd: (kind: CatalogKind, name: string) => void; onRemove: (entry: CatalogEntry) => void }) { const t = translations[language]; return <Modal title={t.settings} onClose={onClose}><div className="grid gap-6 sm:grid-cols-2"><CatalogList title={t.companies} kind="company" entries={catalog} placeholder={t.addCompany} removeLabel={t.remove} onAdd={onAdd} onRemove={onRemove} /><CatalogList title={t.itemNames} kind="item" entries={catalog} placeholder={t.addItemName} removeLabel={t.remove} onAdd={onAdd} onRemove={onRemove} /></div><div className="modal-actions"><span className="text-xs text-[var(--muted)]">{t.catalog}</span><button onClick={onClose} className="secondary-button">{t.close}</button></div></Modal>; }
function CatalogList({ title, kind, entries, placeholder, removeLabel, onAdd, onRemove }: { title: string; kind: CatalogKind; entries: CatalogEntry[]; placeholder: string; removeLabel: string; onAdd: (kind: CatalogKind, name: string) => void; onRemove: (entry: CatalogEntry) => void }) { const [name, setName] = useState(''); const values = entries.filter((entry) => entry.kind === kind); return <div><h3 className="mb-3 font-bold">{title}</h3><div className="mb-3 flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={placeholder} className="field min-w-0 flex-1" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd(kind, name); setName(''); } }} /><button onClick={() => { onAdd(kind, name); setName(''); }} className="primary-button px-3"><Plus size={15} /></button></div><div className="space-y-2">{values.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"><span className="truncate">{entry.name}</span><button onClick={() => onRemove(entry)} className="text-[var(--muted)] hover:text-red-600" aria-label={removeLabel}><Trash2 size={14} /></button></div>)}{!values.length && <p className="text-xs text-[var(--muted)]">—</p>}</div></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold tracking-[-.03em]">{title}</h2><button onClick={onClose} className="icon-button" aria-label="Close"><X size={18} /></button></div>{children}</div></div>; }

export default App;
