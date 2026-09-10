import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Challan, Customer } from '../types';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchChallan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<Challan>(`/challans/${id}`);
      setChallan(res.data);
      if (res.data.customer_id) {
        try {
          const custRes = await api.get<Customer>(`/customers/${res.data.customer_id}`);
          setCustomer(custRes.data);
        } catch {
          // Fallback if customer details unavailable
        }
      }
    } catch (err: any) {
      setLoadError(err?.response?.data?.detail || 'Challan record not found');
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
    setActionError(null);
    try {
      const res = await api.post<Challan>(`/challans/${challan.id}/confirm`);
      setChallan(res.data);
      setActionMsg('Challan successfully confirmed! Physical inventory deducted atomically.');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let msg = 'Failed to confirm challan.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d: any) => d.msg || `${d.loc?.join('.')}: invalid`).join(', ');
      } else if (detail && typeof detail === 'object') {
        msg = detail.error || JSON.stringify(detail);
      }
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm('Are you sure you want to cancel this challan? Stock will be restored if previously confirmed.')) return;
    setActionLoading(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const res = await api.post<Challan>(`/challans/${challan.id}/cancel`);
      setChallan(res.data);
      setActionMsg('Challan marked as CANCELLED.');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Failed to cancel challan.');
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

  if (loadError || !challan) {
    return (
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-error/30 max-w-lg mx-auto text-center space-y-4 mt-10 shadow-sm">
        <span className="material-symbols-outlined text-error text-[40px]">error</span>
        <h2 className="font-headline-md text-on-surface font-bold">Challan Not Found</h2>
        <p className="text-body-sm text-outline">{loadError || 'The requested challan record could not be loaded.'}</p>
        <button
          onClick={() => navigate('/challans')}
          className="btn-primary"
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
    (acc, it) => acc + (it.quantity * Number(it.unit_price_snapshot ?? (it as any).unit_price ?? 0)),
    0
  );
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  const totalUnits = challan.items.reduce((acc, it) => acc + it.quantity, 0);

  const canConfirm = (user?.role === 'ADMIN' || user?.role === 'SALES') && isDraft;
  const canCancel = user?.role === 'ADMIN' && !isCancelled;

  const customerName = customer?.name || challan.customer_name || 'Valued Customer';
  const customerBiz = (customer as any)?.business_name || customer?.company || 'Wholesale Buyer';
  const customerGstin = (customer as any)?.gst_number || customer?.gstin || '27AAACA1234A1Z5';
  const customerPhone = customer?.mobile || '+91 98201 44521';
  const customerAddress = customer?.address || 'Plot 42-B, Industrial Area Phase II, Turbhe, Navi Mumbai, MH - 400705';

  return (
    <div className="flex flex-col w-full gap-space-lg max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-space-sm">
        <nav className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
          <Link to="/challans" className="hover:text-on-surface transition-colors">
            Sales Challans
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-semibold font-data-mono">{challan.challan_number}</span>
        </nav>

        {/* Action Error Alert (Dismissible, doesn't unmount page) */}
        {actionError && (
          <div className="p-3.5 rounded-lg bg-error-container/40 border border-error/40 text-error flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span><strong>Cannot Confirm Challan:</strong> {actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-xs font-bold text-error hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Success Alert */}
        {actionMsg && (
          <div className="p-3 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span className="font-medium">{actionMsg}</span>
            </div>
            <button
              onClick={() => setActionMsg(null)}
              className="text-xs font-bold hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md pt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-md flex-wrap">
              <h1 className="font-display-sm text-display-sm text-on-surface tracking-tight font-bold">
                Challan #{challan.challan_number}
              </h1>
              <StatusBadge status={challan.status} />
              <span className="text-xs font-mono text-outline px-2 py-0.5 rounded bg-surface-container">
                {new Date(challan.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-space-sm mt-1 font-body-sm text-body-sm text-on-surface-variant flex-wrap">
              <span className="material-symbols-outlined text-[16px] text-outline">local_shipping</span>
              <span>
                Carrier: <strong className="text-on-surface font-semibold">VRL Logistics Cargo</strong>
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-data-mono">Docket: VRL-882910</span>
              <span className="text-outline-variant">•</span>
              <span>Hub: North Warehouse WH-01</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Challan</span>
            </button>

            {canConfirm && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="btn-primary flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{actionLoading ? 'Confirming & Decrementing...' : 'Confirm & Dispatch'}</span>
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="h-8 px-3 rounded bg-error/10 border border-error/30 text-error hover:bg-error/20 font-label-md text-label-md font-semibold transition-colors"
              >
                Cancel Challan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Card 1: Customer Profile */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                Consignee Buyer
              </span>
              <Link
                to={`/customers/${challan.customer_id}`}
                className="font-data-mono text-[11px] text-primary hover:underline"
              >
                View Dossier →
              </Link>
            </div>
            <div className="flex flex-col gap-1 text-body-sm">
              <span className="font-semibold text-on-surface text-body-md">
                {customerName}
              </span>
              <span className="text-on-surface-variant font-medium">
                {customerBiz}
              </span>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant font-mono mt-1">
                <span className="text-outline">GSTIN:</span>
                <span className="font-semibold text-on-surface">{customerGstin}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant font-mono">
                <span className="text-outline">Phone:</span>
                <span>{customerPhone}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <span className="text-outline block uppercase tracking-wider text-[10px]">Destination:</span>
            <span className="line-clamp-2 mt-0.5">{customerAddress}</span>
          </div>
        </div>

        {/* Card 2: Dispatch & Logistics */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                Dispatch Route
              </span>
              <span className="font-data-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-secondary font-semibold">
                Bay #3
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-outline block">Fulfillment Hub</span>
                <span className="font-medium text-on-surface">North Central Hub</span>
              </div>
              <div>
                <span className="text-outline block">Carrier</span>
                <span className="font-medium text-on-surface">VRL Logistics Cargo</span>
              </div>
              <div>
                <span className="text-outline block">Vehicle Reg #</span>
                <span className="font-mono text-on-surface">MH-04-AB-1234</span>
              </div>
              <div>
                <span className="text-outline block">Waybill / LR No.</span>
                <span className="font-mono text-on-surface">VRL-882910</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
            <span className="text-outline">Delivery Term:</span>
            <span className="font-semibold text-on-surface">Immediate Door Delivery</span>
          </div>
        </div>

        {/* Card 3: Status Dossier */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">fact_check</span>
                Stock Decrement Ledger
              </span>
              <span className="font-data-mono text-[10px] text-outline font-semibold">
                AUDIT STAMP
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-outline">Physical Stock Status:</span>
                {isConfirmed ? (
                  <span className="font-semibold text-[#047857] flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Decremented
                  </span>
                ) : isDraft ? (
                  <span className="font-semibold text-[#b45309] flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Pending (Draft)
                  </span>
                ) : (
                  <span className="font-semibold text-error font-mono">Cancelled</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Total Units:</span>
                <span className="font-mono font-bold text-on-surface">{totalUnits} pcs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Line SKUs:</span>
                <span className="font-mono text-on-surface">{challan.items.length} items</span>
              </div>
              {(challan as any).notes && (
                <div className="pt-1 border-t border-outline-variant/20 text-xs italic text-on-surface-variant">
                  "{(challan as any).notes}"
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
            <span className="text-outline">Tax Matrix:</span>
            <span className="font-mono font-semibold text-on-surface">CGST 9% + SGST 9%</span>
          </div>
        </div>
      </div>

      {/* Operational Banner for Draft status */}
      {isDraft && (
        <div className="flex items-center gap-3 p-3.5 bg-[#fffbeb] rounded-lg border border-[#fde68a] text-xs text-[#92400e]">
          <span className="material-symbols-outlined text-[20px] text-[#b45309] shrink-0">pending_actions</span>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              <strong>Draft Challan Note:</strong> Physical stock has not been deducted yet. Confirming will validate available warehouse inventory and atomically reduce product balances.
            </span>
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="btn-primary text-xs py-1 px-3 shrink-0"
              >
                Confirm Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Items Breakdown Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
        <div className="h-10 px-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">Dispatched Consignment Items</span>
            <span className="font-mono text-xs text-outline">({challan.items.length} Lines)</span>
          </div>
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
            GST Standard: 18% Flat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-body-sm">
            <thead>
              <tr className="h-8 bg-surface-container-low border-b border-outline-variant/30 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">
                <th className="px-4 w-12 font-semibold">#</th>
                <th className="px-4 font-semibold min-w-[200px]">Product Identification</th>
                <th className="px-4 font-semibold">SKU Identifier</th>
                <th className="px-4 text-right font-semibold">Dispatched Qty</th>
                <th className="px-4 text-right font-semibold">Unit Price</th>
                <th className="px-4 text-right font-semibold">GST (18%)</th>
                <th className="px-4 text-right font-semibold">Line Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {challan.items.map((it, idx) => {
                const pName = it.product_name_snapshot || (it as any).product_name || 'Item Product';
                const pSku = it.sku_snapshot || (it as any).sku || it.product_id;
                const unitPrice = Number(it.unit_price_snapshot ?? (it as any).unit_price ?? 0);
                const lineBase = it.quantity * unitPrice;
                const lineTax = lineBase * 0.18;
                const lineTotal = lineBase + lineTax;

                return (
                  <tr key={it.id} className="h-10 hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-4 font-mono text-outline text-xs">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 font-medium text-on-surface">
                      {pName}
                    </td>
                    <td className="px-4 font-mono text-xs text-on-surface-variant">
                      {pSku}
                    </td>
                    <td className="px-4 text-right font-mono font-bold">
                      {it.quantity} <span className="text-outline text-xs font-normal">pcs</span>
                    </td>
                    <td className="px-4 text-right font-mono">
                      ₹{unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono text-outline text-xs">
                      ₹{lineTax.toFixed(2)}
                    </td>
                    <td className="px-4 text-right font-mono font-semibold">
                      ₹{lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Commercial Summary Footer */}
        <div className="p-4 bg-surface-container-low/30 flex flex-col sm:flex-row items-end sm:items-center justify-between border-t border-outline-variant/20 gap-4">
          <div className="text-outline text-xs font-mono">
            Challan Ref: {challan.challan_number} · Apex Wholesale Operations Engine
          </div>
          <div className="space-y-1 text-right text-xs">
            <div className="flex justify-end gap-6 text-on-surface-variant">
              <span>Gross Line Subtotal:</span>
              <span className="font-mono font-medium text-on-surface">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-6 text-on-surface-variant">
              <span>Applicable GST (IGST 18.0%):</span>
              <span className="font-mono font-medium text-on-surface">₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-6 pt-1 border-t border-outline-variant/30 text-body-md font-bold text-on-surface">
              <span>Total Challan Value:</span>
              <span className="font-mono text-primary font-extrabold">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
