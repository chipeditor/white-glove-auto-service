import { fetchEstimateReport } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/PrintButton';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchEstimateReport(id);
  if (!data) notFound();

  const { serviceRequest: sr, lines, organization: org } = data;
  const vehicle = sr.vehicle as Record<string, unknown>;
  const customer = (vehicle?.customer ?? null) as Record<string, unknown> | null;

  const approvedLines = lines.filter((l: Record<string, unknown>) => l.status === 'approved' || l.status === 'completed');
  const subtotal = approvedLines.reduce((sum: number, l: Record<string, unknown>) => sum + Number(l.total ?? 0), 0);
  const taxRate = Number(sr.tax_rate ?? 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white max-w-[500px] mx-auto">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        @page { margin: 0.4in; size: 80mm auto; }
      `}</style>

      <PrintButton backHref={`/service-requests/${id}`} />

      {/* Receipt Header */}
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
        <h1 className="text-xl font-bold tracking-tight">{String(org?.name ?? 'KSB Performance')}</h1>
        {org?.address_line1 ? <p className="text-xs text-gray-600 mt-1">{String(org.address_line1)}{org.city ? `, ${String(org.city)}, ${String(org.state ?? '')} ${String(org.zip ?? '')}` : ''}</p> : null}
        {org?.phone ? <p className="text-xs text-gray-600">{String(org.phone)}</p> : null}
        <p className="text-sm font-semibold mt-3">RECEIPT</p>
        <p className="text-xs text-gray-500">#{id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs text-gray-500">{formatDate(String(sr.created_at))}</p>
      </div>

      {/* Customer & Vehicle */}
      <div className="mb-4 text-sm">
        {customer ? (
          <div className="mb-2">
            <p className="font-medium">{String(customer.full_name)}</p>
            {customer.phone ? <p className="text-xs text-gray-600">{String(customer.phone)}</p> : null}
            {customer.email ? <p className="text-xs text-gray-600">{String(customer.email)}</p> : null}
          </div>
        ) : null}
        <p className="text-gray-700">
          {`${vehicle?.year ?? ''} ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`.trim()}
        </p>
        {vehicle?.vin ? <p className="text-xs text-gray-500">VIN: {String(vehicle.vin)}</p> : null}
        {vehicle?.license_plate ? <p className="text-xs text-gray-500">Plate: {String(vehicle.license_plate)}</p> : null}
      </div>

      {/* Service Description */}
      <div className="mb-4">
        <p className="text-sm font-medium">{String(sr.title)}</p>
        {sr.description ? <p className="text-xs text-gray-600 mt-0.5">{String(sr.description)}</p> : null}
      </div>

      {/* Line Items */}
      <div className="border-t border-gray-300 pt-3 mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left py-1 font-medium">Item</th>
              <th className="text-right py-1 font-medium w-14">Qty</th>
              <th className="text-right py-1 font-medium w-20">Price</th>
              <th className="text-right py-1 font-medium w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {approvedLines.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-center text-xs text-gray-400">No line items</td>
              </tr>
            ) : (
              approvedLines.map((line: Record<string, unknown>) => (
                <tr key={String(line.id)} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <p className="text-sm">{String(line.description)}</p>
                    {line.type === 'labor' && <span className="text-[10px] text-gray-400">Labor</span>}
                    {line.type === 'part' && <span className="text-[10px] text-gray-400">Part</span>}
                  </td>
                  <td className="py-1.5 text-right text-xs">{Number(line.quantity ?? 1)}</td>
                  <td className="py-1.5 text-right text-xs">{formatCurrency(Number(line.unit_price ?? 0))}</td>
                  <td className="py-1.5 text-right text-xs font-medium">{formatCurrency(Number(line.total ?? 0))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t-2 border-gray-400 pt-3 mb-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold mt-1 pt-1 border-t border-gray-300">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment Status */}
      <div className="text-center border-t-2 border-dashed border-gray-400 pt-4 mb-4">
        <p className="text-xs text-gray-500 uppercase font-medium">
          {sr.status === 'completed' ? 'Paid — Thank You!' : 'Payment Due'}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pb-4">
        <p>Thank you for choosing {String(org?.name ?? 'KSB Performance')}</p>
        <p className="mt-1">Questions? Call {String(org?.phone ?? 'the shop')}</p>
      </div>
    </div>
  );
}
