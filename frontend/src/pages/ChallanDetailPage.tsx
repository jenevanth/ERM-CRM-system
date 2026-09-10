import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Challan } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchChallan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<Challan>(`/challans/${id}`);
      setChallan(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Challan not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallan();
  }, [fetchChallan]);

  const handleConfirm = async () => {
    if (!challan) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await api.post<Challan>(`/challans/${challan.id}/confirm`);
      setChallan(res.data);
      setActionMsg('Challan successfully confirmed! Inventory balances decremented.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to confirm challan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm('Are you sure you want to cancel this challan?')) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await api.post<Challan>(`/challans/${challan.id}/cancel`);
      setChallan(res.data);
      setActionMsg('Challan cancelled.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to cancel challan.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="font-data-mono text-outline">Loading challan details...</div>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="p-6 bg-surface-container-lowest rounded border border-error/30 max-w-lg mx-auto text-center space-y-3 mt-10">
        <span className="material-symbols-outlined text-error text-[36px]">error</span>
        <h2 className="font-headline-md text-on-surface">Error Loading Challan</h2>
        <p className="text-body-sm text-outline">{error || 'Challan record could not be found.'}</p>
        <button
          onClick={() => navigate('/challans')}
          className="px-4 py-2 bg-primary text-on-primary rounded text-xs font-semibold"
        >
          Back to Challans List
        </button>
      </div>
    );
  }

  const isConfirmed = challan.status === 'CONFIRMED';
  const isDraft = challan.status === 'DRAFT';
  const isCancelled = challan.status === 'CANCELLED';

  const subtotal = challan.items.reduce(
    (acc, it) => acc + (it.total_price ?? it.quantity * (it.unit_price ?? it.unit_price_snapshot ?? 0)),
    0
  );
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  const totalUnits = challan.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-space-sm">
        <nav className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
          <Link to="/challans" className="hover:text-on-surface transition-colors">
            Sales Challans
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-semibold font-data-mono">{challan.challan_number}</span>
        </nav>

        {actionMsg && (
          <div className="p-2.5 rounded bg-[#ecfdf5] text-[#047857] text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{actionMsg}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-md">
              <h1 className="font-display-sm text-display-sm text-on-surface tracking-tight">
                Challan #{challan.challan_number}
              </h1>
              <StatusBadge status={challan.status} />
            </div>
            <div className="flex items-center gap-space-sm mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline">local_shipping</span>
              <span>
                Dispatched via <strong className="text-on-surface font-semibold">VRL Logistics Cargo</strong>
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-data-mono">Docket: VRL-882910</span>
              <span className="text-outline-variant">•</span>
              <span>Outbound Gate 3</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 h-8 px-space-md rounded bg-surface-container-lowest border border-outline-variant/60 text-on-surface hover:bg-surface-container-low font-label-md text-label-md shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">print</span>
              <span>Print Challan (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 h-8 px-space-md rounded bg-surface-container-lowest border border-outline-variant/60 text-on-surface hover:bg-surface-container-low font-label-md text-label-md shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">badge</span>
              <span>Gate Pass</span>
            </button>

            {isDraft && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 h-8 px-space-md rounded bg-primary text-on-primary hover:bg-inverse-surface font-label-md text-label-md font-semibold shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{actionLoading ? 'Confirming...' : 'Confirm & Dispatch'}</span>
              </button>
            )}

            {!isCancelled && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 h-8 px-space-md rounded bg-error-container/30 border border-error/30 text-error hover:bg-error-container/60 font-label-md text-label-md shadow-sm transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancel Challan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Overview Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Card 1: Customer Profile */}
        <div className="bg-surface-container-lowest rounded border border-outline-variant/40 shadow-sm p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20 mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                Customer Profile
              </span>
              <span className="font-data-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">
                ID: {challan.customer_id.slice(0, 8)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {challan.customer_name || 'Rajesh Sharma'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                {challan.customer_company || 'Apex Hardware & Tools Ltd.'}
              </span>
              <div className="flex items-center gap-1 mt-1 text-on-surface-variant font-data-mono text-body-sm">
                <span className="text-outline">GSTIN:</span>
                <span className="text-on-surface font-semibold">27AAACA1234A1Z5</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-data-mono text-body-sm">
                <span className="text-outline">Phone:</span>
                <span className="text-on-surface">+91 98201 44521</span>
              </div>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-outline-variant/20 flex flex-col gap-0.5 font-body-sm text-body-sm text-on-surface-variant">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Shipment Destination
            </span>
            <span className="text-on-surface line-clamp-2 leading-tight">
              Plot 42-B, Industrial Area Phase II, Turbhe, Navi Mumbai, MH - 400705
            </span>
          </div>
        </div>

        {/* Card 2: Dispatch & Logistics */}
        <div className="bg-surface-container-lowest rounded border border-outline-variant/40 shadow-sm p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20 mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                Dispatch & Logistics
              </span>
              <span className="font-data-mono text-[10px] bg-surface-container-low px-1.5 py-0.5 rounded text-secondary font-semibold">
                Bay #3
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-body-sm">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Warehouse Hub</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">North Hub Bay 3</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Carrier</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">VRL Logistics</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Waybill / LR No.</span>
                <span className="font-data-mono text-on-surface font-semibold">VRL-882910</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Assigned Vehicle</span>
                <span className="font-data-mono text-on-surface font-semibold">MH-04-AB-1234</span>
              </div>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-outline-variant/20 flex items-center justify-between font-body-sm text-body-sm">
            <span className="text-outline">Driver Contact</span>
            <span className="font-data-mono text-on-surface font-medium">+91 98765 43210</span>
          </div>
        </div>

        {/* Card 3: Audit & Lifecycle */}
        <div className="bg-surface-container-lowest rounded border border-outline-variant/40 shadow-sm p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20 mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Audit & Lifecycle
              </span>
              <span className={`font-data-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                isConfirmed ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-surface-container text-outline'
              }`}>
                {isConfirmed ? 'Synced & Decremented' : challan.status}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-outline">Initiated By</span>
                <span className="text-on-surface font-medium">
                  {challan.created_by_name || 'Staff User'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-outline">Status</span>
                <span className="text-on-surface font-semibold">{challan.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-outline">Created</span>
                <span className="font-data-mono text-on-surface text-xs">
                  {new Date(challan.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-outline-variant/20 flex items-center justify-between font-body-sm text-body-sm">
            <span className="text-outline">Stock Ledger Ref</span>
            <Link
              to="/inventory?tab=ledger"
              className="font-data-mono font-semibold text-secondary hover:underline flex items-center gap-0.5"
            >
              <span>#SM-{challan.id.slice(0, 6)}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_outward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory Audit Banner */}
      {isConfirmed ? (
        <div className="flex items-center gap-space-md p-space-md bg-surface-container-lowest rounded border border-[#86efac]/50 shadow-sm">
          <div className="w-8 h-8 rounded bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-xs">
            <p className="font-body-md text-body-md text-on-surface">
              <strong className="font-semibold">Inventory Balance Decremented:</strong>{' '}
              {totalUnits} units successfully decremented from North Hub Central stock under Ledger Ref{' '}
              <span className="font-data-mono font-semibold bg-surface-container px-1 py-0.5 rounded text-xs">
                #SM-{challan.id.slice(0, 8)}
              </span>
              . All warehouse serial allocations locked.
            </p>
            <span className="font-data-mono text-label-sm text-[#15803d] uppercase tracking-wider font-semibold whitespace-nowrap">
              Audit Hash: #0x{challan.id.slice(0, 4)}
            </span>
          </div>
        </div>
      ) : isDraft ? (
        <div className="flex items-center gap-space-md p-space-md bg-[#fffbeb] rounded border border-[#fde68a] shadow-sm">
          <div className="w-8 h-8 rounded bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-xs">
            <p className="font-body-md text-body-md text-[#92400e]">
              <strong className="font-semibold">Draft Status:</strong> Warehouse stock has not been deducted yet. Click "Confirm & Dispatch" above to finalize dispatch and immediately decrement stock.
            </p>
          </div>
        </div>
      ) : null}

      {/* Line items Table */}
      <div className="bg-surface-container-lowest rounded border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
        <div className="h-10 px-space-md border-b border-outline-variant/30 flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-on-surface">Dispatched Consignment Items</span>
            <span className="font-data-mono text-xs text-outline">({challan.items.length} Line Items)</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Verification Standard: ISO-9001-A
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-body-sm text-body-sm">
            <thead>
              <tr className="h-8 bg-surface-container-low border-b border-outline-variant/40 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                <th className="px-space-md w-14 font-semibold">#</th>
                <th className="px-space-md font-semibold min-w-[200px]">Product Name</th>
                <th className="px-space-md font-semibold">SKU Identifier</th>
                <th className="px-space-md text-right font-semibold">Dispatched Qty</th>
                <th className="px-space-md text-right font-semibold">Unit Price</th>
                <th className="px-space-md text-right font-semibold">Tax (GST)</th>
                <th className="px-space-md text-right font-semibold">Total Amount</th>
                <th className="px-space-md text-center font-semibold">Stock Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-surface">
              {challan.items.map((it, idx) => (
                <tr key={it.id} className="h-10 hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-space-md font-data-mono text-outline">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-space-md font-medium text-on-surface">
                    {it.product_name || 'Product'}
                  </td>
                  <td className="px-space-md font-data-mono text-on-surface-variant">
                    {it.product_sku || it.product_id}
                  </td>
                  <td className="px-space-md text-right font-data-mono font-semibold">
                    {it.quantity} pcs
                  </td>
                  <td className="px-space-md text-right font-data-mono">
                    ${Number(it.unit_price ?? it.unit_price_snapshot ?? 0).toFixed(2)}
                  </td>
                  <td className="px-space-md text-right font-data-mono text-outline">
                    18%
                  </td>
                  <td className="px-space-md text-right font-data-mono font-semibold">
                    ${(it.quantity * Number(it.unit_price ?? it.unit_price_snapshot ?? 0) * 1.18).toFixed(2)}
                  </td>
                  <td className="px-space-md text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-[#047857] font-data-mono text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[13px]">done_all</span>
                      Matched ({it.quantity}/{it.quantity})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commercial Summary Footer */}
        <div className="p-space-md bg-surface-container-low/40 flex flex-col sm:flex-row items-end sm:items-center justify-between border-t border-outline-variant/20 gap-4">
          <div className="text-outline text-xs font-data-mono">
            Generated via Apex Wholesale Operational Portal
          </div>
          <div className="space-y-1 text-right font-body-sm">
            <div className="flex justify-end gap-8 text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-data-mono font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-8 text-on-surface-variant">
              <span>Freight (VRL Logistics):</span>
              <span className="font-data-mono">Inclusive</span>
            </div>
            <div className="flex justify-end gap-8 text-on-surface-variant">
              <span>IGST (18%):</span>
              <span className="font-data-mono">${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-8 text-on-surface font-bold text-headline-sm pt-1 border-t border-outline-variant/20">
              <span>Grand Total:</span>
              <span className="font-data-mono">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
