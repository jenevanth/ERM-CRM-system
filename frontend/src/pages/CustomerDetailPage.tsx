import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import type { Customer, Followup, Challan, Paginated } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Follow-up state
  const [newNote, setNewNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submittingFollowup, setSubmittingFollowup] = useState(false);
  const [followupError, setFollowupError] = useState<string | null>(null);

  // Edit Customer Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    business_name: '',
    mobile: '',
    email: '',
    gst_number: '',
    customer_type: 'WHOLESALE',
    address: '',
    status: 'ACTIVE',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [custRes, fUpRes, chalRes] = await Promise.all([
        api.get<Customer>(`/customers/${id}`),
        api.get<Followup[]>(`/customers/${id}/followups`),
        api.get<Paginated<Challan>>(`/challans`, { params: { customer_id: id, limit: 10 } }),
      ]);
      setCustomer(custRes.data);
      setFollowups(fUpRes.data || []);
      setChallans(chalRes.data?.data || []);

      // Populate edit form defaults
      const c = custRes.data;
      setEditFormData({
        name: c.name || '',
        business_name: (c as any).business_name || c.company || '',
        mobile: c.mobile || '',
        email: c.email || '',
        gst_number: (c as any).gst_number || c.gstin || '',
        customer_type: (c as any).customer_type || 'WHOLESALE',
        address: c.address || '',
        status: c.status || 'ACTIVE',
        notes: (c as any).notes || '',
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    setSubmittingFollowup(true);
    setFollowupError(null);
    try {
      await api.post(`/customers/${id}/followups`, {
        note: newNote.trim(),
        follow_up_date: nextDate ? new Date(nextDate).toISOString() : undefined,
      });
      setNewNote('');
      setNextDate('');
      // Reload followups and customer
      const [fUpRes, custRes] = await Promise.all([
        api.get<Followup[]>(`/customers/${id}/followups`),
        api.get<Customer>(`/customers/${id}`),
      ]);
      setFollowups(fUpRes.data || []);
      setCustomer(custRes.data);
    } catch (err: any) {
      setFollowupError(err?.response?.data?.detail || 'Failed to log follow-up');
    } finally {
      setSubmittingFollowup(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await api.put<Customer>(`/customers/${id}`, editFormData);
      setCustomer(res.data);
      setIsEditOpen(false);
    } catch (err: any) {
      setEditError(err?.response?.data?.detail || 'Failed to update customer details');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-outline font-data-mono">Loading customer records...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 rounded-lg bg-surface-container border border-error/20 text-center space-y-4">
        <span className="material-symbols-outlined text-error text-4xl">error</span>
        <h2 className="text-title-lg font-bold text-on-surface">Customer Not Found</h2>
        <p className="text-body-md text-on-surface-variant">{error || 'The requested customer does not exist.'}</p>
        <button onClick={() => navigate('/customers')} className="btn-primary">
          Back to Customers
        </button>
      </div>
    );
  }

  const businessName = (customer as any).business_name || customer.company || customer.name;
  const gstNumber = (customer as any).gst_number || customer.gstin || 'Unregistered / None';
  const customerType = (customer as any).customer_type || 'WHOLESALE';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 text-label-sm text-outline uppercase tracking-wider">
            <Link to="/customers" className="hover:text-on-surface transition-colors">Customers</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">{businessName}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-headline-lg font-bold text-on-surface">{customer.name}</h1>
            <StatusBadge status={customer.status} />
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-surface-container-high text-secondary">
              {customerType}
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            {businessName !== customer.name ? businessName : 'Wholesale Client Account'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsEditOpen(true)}
            className="btn-secondary flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => navigate(`/challans/new?customer_id=${customer.id}`)}
            className="btn-primary flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span>Create Challan</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Identity Card */}
          <div className="rounded-xl p-5 shadow-sm space-y-4 border border-outline-variant/20" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/20">
              <span className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                Account Dossier
              </span>
              <span className="material-symbols-outlined text-outline text-lg">badge</span>
            </div>

            <div className="space-y-3.5 text-body-sm">
              <div>
                <span className="text-outline text-xs block">Contact Person</span>
                <span className="font-semibold text-on-surface">{customer.name}</span>
              </div>
              <div>
                <span className="text-outline text-xs block">Business Entity</span>
                <span className="font-medium text-on-surface">{businessName}</span>
              </div>
              <div>
                <span className="text-outline text-xs block">Mobile Number</span>
                <span className="font-mono text-on-surface font-semibold">{customer.mobile}</span>
              </div>
              <div>
                <span className="text-outline text-xs block">Email</span>
                <span className="text-on-surface">{customer.email || '—'}</span>
              </div>
              <div>
                <span className="text-outline text-xs block">GSTIN / Tax ID</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant inline-block mt-0.5">
                  {gstNumber}
                </span>
              </div>
              <div>
                <span className="text-outline text-xs block">Billing / Dispatch Address</span>
                <span className="text-on-surface whitespace-pre-wrap">{customer.address || '—'}</span>
              </div>
              <div>
                <span className="text-outline text-xs block">Internal Notes</span>
                <span className="text-on-surface text-xs italic">{(customer as any).notes || 'No notes added.'}</span>
              </div>
            </div>
          </div>

          {/* Follow-up Status Card */}
          <div className="rounded-xl p-5 shadow-sm space-y-3 border border-outline-variant/20" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between">
              <span className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                Next Follow-up
              </span>
              <span className="material-symbols-outlined text-secondary text-lg">event</span>
            </div>
            {customer.follow_up_date ? (
              <div className="p-3 rounded-lg bg-surface-container flex items-center justify-between">
                <div>
                  <div className="text-title-md font-bold text-on-surface font-mono">
                    {new Date(customer.follow_up_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-outline">Scheduled CRM interaction</div>
                </div>
                <span className="material-symbols-outlined text-primary">alarm</span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-surface-container text-xs text-outline italic">
                No active follow-up scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-up Timeline & Challans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-up Timeline & Logging */}
          <div className="rounded-xl p-5 shadow-sm space-y-5 border border-outline-variant/20" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">forum</span>
                <h3 className="text-title-md font-semibold text-on-surface">CRM Follow-ups & Notes</h3>
              </div>
              <span className="badge badge-active font-mono text-xs">{followups.length} Logged</span>
            </div>

            {/* Quick Log Form */}
            <form onSubmit={handleAddFollowup} className="p-4 rounded-lg bg-surface-container-low space-y-3 border border-outline-variant/20">
              <span className="text-label-md font-semibold text-on-surface block">Record New Interaction / Task</span>
              <textarea
                className="form-input w-full"
                rows={2}
                placeholder="Log notes about phone call, price negotiation, payment follow-up, or requirements..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-on-surface-variant shrink-0">Next Follow-up:</label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingFollowup || !newNote.trim()}
                  className="btn-primary text-xs py-1.5 px-4 self-end sm:self-auto"
                >
                  {submittingFollowup ? 'Logging...' : 'Save Follow-up'}
                </button>
              </div>
              {followupError && (
                <div className="text-xs text-error mt-1">{followupError}</div>
              )}
            </form>

            {/* Timeline List */}
            <div className="space-y-4 pt-2">
              {followups.length === 0 ? (
                <div className="text-center py-6 text-sm text-outline">
                  No interaction history recorded yet for this client.
                </div>
              ) : (
                followups.map((f) => (
                  <div key={f.id} className="relative pl-6 pb-4 border-l-2 border-outline-variant last:pb-0">
                    <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" />
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="text-xs font-data-mono text-outline">
                        {new Date(f.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {f.follow_up_date && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          Target: {new Date(f.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface mt-1.5 whitespace-pre-wrap">{f.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Challans Table */}
          <div className="rounded-xl p-5 shadow-sm space-y-4 border border-outline-variant/20" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">inventory_2</span>
                <h3 className="text-title-md font-semibold text-on-surface">Sales Challans</h3>
              </div>
              <button
                onClick={() => navigate(`/challans/new?customer_id=${customer.id}`)}
                className="btn-secondary text-xs py-1"
              >
                + New Challan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="text-label-md uppercase tracking-wider text-outline border-b border-outline-variant/20">
                    <th className="py-2 px-3">Challan #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Total Qty</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-outline text-xs">
                        No challans created for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    challans.map((ch) => (
                      <tr key={ch.id} className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-on-surface">{ch.challan_number}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-outline">
                          {new Date(ch.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge status={ch.status} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-on-surface">
                          {ch.total_quantity}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Link
                            to={`/challans/${ch.id}`}
                            className="p-1 rounded text-primary hover:bg-surface-container inline-block"
                            title="View Challan Details"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 border border-outline-variant/30" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/20">
              <h3 className="text-title-lg font-bold text-on-surface">Edit Customer Profile</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded hover:bg-surface-container text-outline"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-body-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input w-full"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Business Name</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={editFormData.business_name}
                    onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input w-full font-mono"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Email</label>
                  <input
                    type="email"
                    className="form-input w-full"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">GSTIN</label>
                  <input
                    type="text"
                    className="form-input w-full font-mono uppercase"
                    value={editFormData.gst_number}
                    onChange={(e) => setEditFormData({ ...editFormData, gst_number: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Customer Type</label>
                  <select
                    className="form-input w-full"
                    value={editFormData.customer_type}
                    onChange={(e) => setEditFormData({ ...editFormData, customer_type: e.target.value })}
                  >
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="RETAIL">Retail</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Status</label>
                  <select
                    className="form-input w-full"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="LEAD">Lead</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Address</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  className="form-input w-full"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>

              {editError && (
                <div className="text-xs text-error font-medium">{editError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn-secondary"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
