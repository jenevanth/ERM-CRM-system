import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import type { Customer, Product, Paginated } from '../types';

interface ChallanLineDraft {
  product_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
}

export default function CreateChallanPage() {
  const navigate = useNavigate();

  // Master data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [warehouseHub] = useState<string>('North Hub Central (WH-NH-01)');
  const [transporter, setTransporter] = useState<string>('VRL Logistics Cargo');
  const [vehicleNo, setVehicleNo] = useState<string>('MH-04-AB-1234');
  const [challanDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');

  // Line items
  const [lines, setLines] = useState<ChallanLineDraft[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get<Paginated<Customer>>('/customers', { params: { page: 1, limit: 100 } }),
          api.get<Paginated<Product>>('/products', { params: { page: 1, limit: 100 } }),
        ]);
        const custList = custRes.data.data || custRes.data.items || [];
        setCustomers(custList);
        if (custList.length > 0) {
          setSelectedCustomerId(custList[0].id);
        }
        const prodList = prodRes.data.data || prodRes.data.items || [];
        setAllProducts(prodList);
        if (prodList.length > 0) {
          setSelectedProductToAdd(prodList[0].id);
          // Pre-populate with first 2 products for quick testing
          const defaultItems: ChallanLineDraft[] = prodList.slice(0, 2).map((p) => ({
            product_id: p.id,
            product: p,
            quantity: Math.min(5, Math.max(1, Math.floor(p.current_stock / 2))),
            unit_price: p.unit_price,
          }));
          setLines(defaultItems);
        }
      } catch (err) {
        console.error('Failed to load customers/products:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Line calculations & inventory check
  const evaluatedLines = useMemo(() => {
    return lines.map((line) => {
      const available = line.product.current_stock;
      const deficit = line.quantity > available ? line.quantity - available : 0;
      const balance = available - line.quantity;
      const lineTotal = line.quantity * line.unit_price;
      const isDeficit = deficit > 0;
      const isLow = !isDeficit && balance <= (line.product.minimum_stock ?? line.product.min_stock_level ?? 0);

      return {
        ...line,
        available,
        deficit,
        balance,
        lineTotal,
        isDeficit,
        isLow,
      };
    });
  }, [lines]);

  const hasStockConflict = evaluatedLines.some((l) => l.isDeficit);
  const conflictCount = evaluatedLines.filter((l) => l.isDeficit).length;

  const grossSubtotal = evaluatedLines.reduce((acc, l) => acc + l.lineTotal, 0);
  const gstAmount = grossSubtotal * 0.18;
  const totalValue = grossSubtotal + gstAmount;
  const totalUnits = evaluatedLines.reduce((acc, l) => acc + l.quantity, 0);

  const handleAddLine = () => {
    if (!selectedProductToAdd) return;
    const prod = allProducts.find((p) => p.id === selectedProductToAdd);
    if (!prod) return;

    if (lines.some((l) => l.product_id === prod.id)) {
      // Increase qty of existing line
      setLines((prev) =>
        prev.map((l) => (l.product_id === prod.id ? { ...l, quantity: l.quantity + 1 } : l))
      );
    } else {
      setLines((prev) => [
        ...prev,
        {
          product_id: prod.id,
          product: prod,
          quantity: 1,
          unit_price: prod.unit_price,
        },
      ]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQtyChange = (idx: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, quantity: qty } : l))
    );
  };

  const handleAutoFitDeficits = () => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.quantity > l.product.current_stock) {
          return { ...l, quantity: Math.max(1, l.product.current_stock) };
        }
        return l;
      })
    );
  };

  // Submit as DRAFT or CONFIRM
  const handleSubmit = async (confirmImmediately: boolean) => {
    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer.');
      return;
    }
    if (lines.length === 0) {
      setErrorMsg('Please add at least one line item.');
      return;
    }
    if (confirmImmediately && hasStockConflict) {
      setErrorMsg('Cannot confirm challan with stock shortages.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create challan in DRAFT status
      const payload = {
        customer_id: selectedCustomerId,
        notes: notes || undefined,
        items: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      };

      const res = await api.post('/challans', payload);
      const createdChallan = res.data;

      // 2. If confirm was clicked, confirm now (safe transactional decrement)
      if (confirmImmediately) {
        await api.post(`/challans/${createdChallan.id}/confirm`);
      }

      setShowConfirmModal(false);
      navigate(`/challans/${createdChallan.id}`);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to process challan. Please check stock balances.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-outline font-data-mono">Loading form parameters...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto space-y-space-md">
        {/* Stepper & Context Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md pb-space-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase">
              <Link to="/challans" className="hover:text-on-surface">Sales Challans</Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">New Challan</span>
              <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-container font-data-mono text-[10px] text-secondary font-semibold">
                DRAFT REF: #CH-NEW
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Create Sales Challan
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Prepare delivery challan. Confirming will validate available warehouse balance and immediately decrement stock.
            </p>
          </div>

          {/* Minimalist Precision Stepper */}
          <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-lg self-start lg:self-center border border-outline-variant/30">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-lowest rounded shadow-sm">
              <span className="w-4 h-4 rounded-full bg-primary text-on-primary font-data-mono text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              <span className="font-label-md text-label-md text-on-surface">Customer & Dispatch</span>
            </div>
            <span className="w-4 h-px bg-outline-variant"></span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest rounded">
              <span className="w-4 h-4 rounded-full bg-secondary text-on-secondary font-data-mono text-[10px] flex items-center justify-center font-bold">
                2
              </span>
              <span className="font-label-md text-label-md text-on-secondary-container font-semibold">
                Stock Validation
              </span>
            </div>
            <span className="w-4 h-px bg-outline-variant"></span>
            <div className="flex items-center gap-1.5 px-2 py-1 opacity-60">
              <span className="w-4 h-4 rounded-full bg-surface-container text-outline font-data-mono text-[10px] flex items-center justify-center">
                3
              </span>
              <span className="font-label-md text-label-md text-outline">Issue & Dispatch</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-error-container text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Customer & Order Configuration */}
        <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-space-md border border-outline-variant/20">
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Customer & Dispatch Parameters</h2>
            </div>
            <span className="font-data-mono text-[11px] text-outline">LEDGER STAMP: AUTO-VERIFIED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Customer Select */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block">
                Customer Account
              </label>
              <div className="bg-surface-container-low p-2 rounded flex flex-col justify-between min-h-[64px]">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="font-label-md text-label-md text-on-surface font-semibold bg-transparent border-0 focus:outline-none w-full"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name ? `${c.company_name} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-outline text-[11px] font-data-mono mt-1">
                  <span className="text-[#059669] font-medium">
                    ${selectedCustomer?.outstanding_balance?.toLocaleString() || '0.00'} Bal
                  </span>
                  <span>GST: {selectedCustomer?.gstin || '27AAACA1234A1Z5'}</span>
                </div>
              </div>
            </div>

            {/* Warehouse */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block">
                Fulfillment Hub
              </label>
              <div className="bg-surface-container-low p-2 rounded flex flex-col justify-between min-h-[64px]">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> {warehouseHub}
                  </span>
                  <span className="font-data-mono text-[10px] text-secondary font-semibold">WH-NH-01</span>
                </div>
                <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  Zone A/B/C Available · Automated Dock 4
                </span>
              </div>
            </div>

            {/* Transporter */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block">
                Transporter / Vehicle
              </label>
              <div className="bg-surface-container-low p-2 rounded flex flex-col justify-between min-h-[64px]">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="font-label-md text-label-md text-on-surface font-semibold bg-transparent border-0 focus:outline-none"
                    placeholder="Carrier Name"
                  />
                  <span className="font-data-mono text-[10px] text-outline">LR-REQ</span>
                </div>
                <div className="flex items-center justify-between font-data-mono text-[11px] text-on-surface-variant">
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="bg-transparent border-0 focus:outline-none w-24"
                    placeholder="Vehicle #"
                  />
                  <span className="text-secondary font-medium">Driver Assigned</span>
                </div>
              </div>
            </div>

            {/* Terms & Date */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block">
                Challan Date & Terms
              </label>
              <div className="bg-surface-container-low p-2 rounded flex flex-col justify-between min-h-[64px]">
                <div className="flex items-center justify-between">
                  <span className="font-data-mono text-[12px] text-on-surface font-semibold">
                    {challanDate} (T-0)
                  </span>
                  <span className="font-label-sm text-label-sm px-1 rounded bg-surface-container text-on-surface">
                    Net 30
                  </span>
                </div>
                <span className="font-body-sm text-[11px] text-outline truncate">
                  Delivery: {selectedCustomer?.address || 'Plot 42, Ind. Area Ph 2, Mumbai'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Product Line Items & Live Stock Validation Table */}
        <section className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
          <div className="p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-bright">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface text-[20px]">table_rows</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Product Line Items & Inventory Allocation
              </h2>
              {hasStockConflict ? (
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-data-mono text-[10px] font-semibold tracking-wide uppercase">
                  {conflictCount} Stock Conflict{conflictCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#047857] font-data-mono text-[10px] font-semibold tracking-wide uppercase">
                  All Items In Stock
                </span>
              )}
            </div>

            {/* Add product bar */}
            <div className="flex items-center gap-space-sm">
              <div className="relative flex items-center">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="h-8 pl-2 pr-6 rounded bg-surface-container-low font-data-mono text-body-sm text-on-surface focus:outline-none w-56 lg:w-72 border-0"
                >
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} (Stock: {p.current_stock})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddLine}
                className="h-8 px-3 rounded bg-primary text-on-primary hover:bg-on-surface-variant font-label-md text-label-md flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Line</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm select-text">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-3 w-8 text-center font-data-mono text-outline">#</th>
                  <th className="py-2 px-3 min-w-[220px]">Product Identification</th>
                  <th className="py-2 px-3 min-w-[110px] font-data-mono">SKU Code</th>
                  <th className="py-2 px-3 min-w-[130px]">Hub Location</th>
                  <th className="py-2 px-3 text-right min-w-[100px] font-data-mono">Available</th>
                  <th className="py-2 px-3 text-right min-w-[100px] font-data-mono">Unit Rate</th>
                  <th className="py-2 px-3 w-28 text-right font-data-mono">Challan Qty</th>
                  <th className="py-2 px-3 text-right min-w-[110px] font-data-mono">Line Total</th>
                  <th className="py-2 px-3 min-w-[240px]">Live Inventory State</th>
                  <th className="py-2 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                {evaluatedLines.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-outline">
                      No items added to this challan yet. Use "Add Line" above.
                    </td>
                  </tr>
                ) : (
                  evaluatedLines.map((row, idx) => (
                    <tr
                      key={row.product_id}
                      className={`transition-colors ${
                        row.isDeficit
                          ? 'bg-error-container/20 hover:bg-error-container/30'
                          : row.isLow
                          ? 'bg-surface-container-low/20 hover:bg-surface-container-low/40'
                          : 'hover:bg-surface-container-low/40'
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-data-mono text-outline text-[11px]">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1">
                            {row.product.name}
                            {row.isDeficit && (
                              <span className="material-symbols-outlined text-error text-[16px]">priority_high</span>
                            )}
                          </span>
                          <span className={`font-body-sm text-body-sm ${row.isDeficit ? 'text-error' : 'text-outline'}`}>
                            {row.product.category || 'Standard Specification'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-data-mono text-body-sm text-on-surface font-medium">
                        {row.product.sku}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container font-data-mono text-[11px] text-on-surface-variant">
                          Rack A-04
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-data-mono text-body-sm font-semibold ${
                          row.isDeficit ? 'text-error font-bold' : row.isLow ? 'text-[#b45309]' : 'text-on-surface'
                        }`}
                      >
                        {row.available} <span className="text-outline font-normal text-[11px]">pcs</span>
                      </td>
                      <td className="py-3 px-3 text-right font-data-mono text-body-sm text-on-surface">
                        ${row.unit_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                          className={`w-20 h-8 px-2 text-right rounded shadow-sm font-data-mono text-body-sm focus:outline-none ${
                            row.isDeficit
                              ? 'bg-surface-container-lowest text-error font-bold ring-2 ring-error'
                              : 'bg-surface-container-lowest text-on-surface focus:bg-surface-container-high'
                          }`}
                        />
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-data-mono font-semibold ${
                          row.isDeficit ? 'text-error font-bold' : 'text-on-surface'
                        }`}
                      >
                        ${row.lineTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        {row.isDeficit ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error text-on-error font-data-mono text-[10px] font-bold w-fit tracking-wide uppercase">
                              <span className="material-symbols-outlined text-[12px]">error</span>
                              <span>Shortage: Deficit {row.deficit} pcs</span>
                            </div>
                            <span className="font-body-sm text-[11px] text-error font-medium leading-tight">
                              Max North Hub balance: {row.available} units. Reduce quantity to confirm.
                            </span>
                          </div>
                        ) : row.isLow ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#fffbeb] text-[#b45309] font-data-mono text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            <span>Stock Low ({row.balance} balance)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#ecfdf5] text-[#047857] font-data-mono text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>Stock OK ({row.balance} balance)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 rounded text-outline hover:text-error hover:bg-surface-container-low transition-colors"
                          title="Remove line item"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-space-sm bg-surface-container-low/40 flex items-center justify-between border-t border-outline-variant/20">
            <span className="font-data-mono text-[11px] text-outline">
              Total Active Allocations: {lines.length} Line Items
            </span>
          </div>
        </section>

        {/* Section 3: Summary Cards & Operational Validation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          {/* Left Column: Inventory Warning Callout */}
          <div className="lg:col-span-7 space-y-space-md">
            {hasStockConflict && (
              <div className="bg-error-container/40 rounded-lg p-space-md shadow-sm space-y-2 border border-error/30">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-error text-[22px] shrink-0 mt-0.5">report</span>
                  <div className="space-y-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-error-container font-semibold">
                      Immediate Stock Decrement Blocked
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      One or more lines exceed available inventory balance at North Hub. The system strictly forbids negative ledger entries. You may adjust requested quantities to available stock, or store as an uncommitted Draft.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-7 pt-1">
                  <button
                    type="button"
                    onClick={handleAutoFitDeficits}
                    className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-sm hover:bg-surface-container transition-colors"
                  >
                    Auto-Fit to Max Available
                  </button>
                </div>
              </div>
            )}

            {/* Notes input */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-2 border border-outline-variant/20">
              <label className="font-headline-sm text-headline-sm text-on-surface block">
                Dispatch / Challan Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add gate pass instructions, delivery milestones, or PO references..."
                rows={2}
                className="w-full p-2.5 rounded bg-surface-container-low font-body-sm text-on-surface placeholder:text-outline focus:outline-none resize-none"
              />
            </div>

            {/* Audit trace */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex items-center justify-between font-data-mono text-body-sm text-outline border border-outline-variant/20">
              <div className="flex items-center gap-4">
                <span>Operator: ADMIN</span>
                <span>·</span>
                <span>Pricing Rule: WHOLESALE-TIER-1</span>
                <span>·</span>
                <span>E-Way Bill: AUTO-GEN</span>
              </div>
              <span className="text-[#059669] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span> ERP Sync Nominal
              </span>
            </div>
          </div>

          {/* Right Column: Financial Totals & Execution Panel */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Commercial Summary</h3>
              <span className="font-data-mono text-[11px] text-outline">
                {lines.length} LINES / {totalUnits} UNITS
              </span>
            </div>

            {/* Calculation Matrix */}
            <div className="space-y-2 font-body-sm text-body-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Gross Line Subtotal</span>
                <span className="font-data-mono font-medium text-on-surface">${grossSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Estimated Freight ({transporter})</span>
                <span className="font-data-mono text-on-surface">Inclusive</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Applicable GST (IGST 18.0%)</span>
                <span className="font-data-mono text-on-surface font-medium">${gstAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 flex items-baseline justify-between border-t border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Challan Total Value</span>
                <span className="font-display-sm text-display-sm font-data-mono font-bold text-on-surface">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {hasStockConflict ? (
                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="w-full h-10 px-4 rounded bg-surface-container-highest text-outline font-headline-sm text-headline-sm flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>Validate & Confirm Challan (Reduces Stock)</span>
                  </button>
                  <div className="p-2 text-center text-xs text-error font-medium">
                    Resolve stock deficits to unlock physical warehouse reduction
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={lines.length === 0 || submitting}
                  className="w-full h-10 px-4 rounded bg-primary text-on-primary hover:bg-inverse-surface font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Validate & Confirm Challan (Reduces Stock)</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={lines.length === 0 || submitting}
                  className="h-8 px-3 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/challans')}
                  className="h-8 px-3 rounded bg-surface-container-low text-outline hover:text-error hover:bg-error-container/40 font-label-md text-label-md flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Discard Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Intercept Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-w-xl w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-xl space-y-space-md border border-outline-variant/30">
            <div className="flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-headline-md text-headline-md text-on-surface">
                  Confirm & Dispatch Challan?
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
                  This action will permanently deduct <strong className="text-on-surface font-semibold">{totalUnits} units</strong> from North Hub warehouse inventory and issue a legal dispatch document to {transporter}. This action cannot be reversed without an approved Return Material Authorization (RMA).
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low p-space-sm rounded font-data-mono text-body-sm space-y-1 text-on-surface-variant">
              <div className="flex justify-between">
                <span>Customer: {selectedCustomer?.name || 'Customer'}</span>
                <span>Inv Deduct: {lines.length} SKUs</span>
              </div>
              <div className="flex justify-between">
                <span>Hub Ref: NORTH-CENTRAL-01</span>
                <span className="text-on-surface font-semibold">Net Total: ${totalValue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-8 px-space-md rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors"
              >
                Keep in Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="h-8 px-space-md rounded bg-primary text-on-primary hover:bg-on-surface-variant font-label-md text-label-md font-semibold flex items-center gap-1 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{submitting ? 'Confirming & Decrementing...' : 'Confirm & Issue Challan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
