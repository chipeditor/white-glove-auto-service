import { fetchEstimateReport } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/PrintButton';

const TYPE_LABELS: Record<string, string> = {
  labor: 'Labor', parts: 'Parts', sublet: 'Sublet', fee: 'Fee', discount: 'Discount',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default async function EstimateReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchEstimateReport(id);
  if (!data) notFound();

  const { serviceRequest: sr, lines, organization } = data;
  const vehicle = sr.vehicle as Record<string, unknown>;
  const customer = (vehicle?.customer ?? null) as Record<string, unknown> | null;
  const advisor = sr.advisor as Record<string, unknown> | null;

  const declinedLines = lines.filter((l: Record<string, unknown>) => l.status === 'declined');

  const lineTotal = (l: Record<string, unknown>) => ((l.quantity as number) ?? 1) * ((l.unit_price as number) ?? 0);
  const subtotal = lines.filter((l: Record<string, unknown>) => l.status !== 'declined').reduce((sum: number, l: Record<string, unknown>) => sum + lineTotal(l), 0);
  const taxRate = 0.0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        @page { margin: 0.5in; size: letter; }
      `}</style>

      <PrintButton backHref="/reports" />

      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{organization?.name ?? 'White Glove Auto Service'}</h1>
            {organization?.address && <p className="text-sm text-gray-600 mt-0.5">{organization.address as string}</p>}
            {organization?.phone && <p className="text-sm text-gray-600">{organization.phone as string}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900">ESTIMATE</h2>
            <p className="text-sm text-gray-600 mt-1">Date: {formatDate(sr.created_at as string)}</p>
            {sr.estimated_completion && (
              <p className="text-sm text-gray-600">Est. Completion: {formatDate(sr.estimated_completion as string)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle & Customer Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vehicle</h3>
          <p className="font-semibold">{`${vehicle?.year ?? ''} ${vehicle?.make} ${vehicle?.model}`.trim()}</p>
          {vehicle?.trim_level ? <p className="text-sm text-gray-600">{String(vehicle.trim_level)}</p> : null}
          {vehicle?.vin ? <p className="text-sm text-gray-600">VIN: {String(vehicle.vin)}</p> : null}
          {vehicle?.mileage ? <p className="text-sm text-gray-600">Mileage: {Number(vehicle.mileage).toLocaleString()}</p> : null}
        </div>
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
          {customer ? (
            <>
              <p className="font-semibold">{customer.full_name as string}</p>
              {customer.email && <p className="text-sm text-gray-600">{customer.email as string}</p>}
              {customer.phone && <p className="text-sm text-gray-600">{customer.phone as string}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-500">No customer assigned</p>
          )}
          {advisor && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Service Advisor</h3>
              <p className="text-sm font-medium">{advisor.full_name as string}</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Description */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider bg-gray-100 px-3 py-2 rounded">
          {sr.title as string}
        </h3>
        {sr.description && (
          <p className="text-sm text-gray-600 mt-2 px-3">{sr.description as string}</p>
        )}
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-20">Type</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-16">Qty</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-24">Unit Price</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-24">Total</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-20">Status</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line: Record<string, unknown>) => {
            const qty = (line.quantity as number) ?? 1;
            const price = (line.unit_price as number) ?? 0;
            const lineAmount = qty * price;
            const isDeclined = line.status === 'declined';
            return (
              <tr key={line.id as string} className={`border-b border-gray-100 ${isDeclined ? 'opacity-50' : ''}`}>
                <td className="py-2 px-3 text-sm">
                  <span className={isDeclined ? 'line-through' : ''}>{line.description as string}</span>
                </td>
                <td className="py-2 px-3 text-sm text-center text-gray-600">
                  {TYPE_LABELS[(line.line_type as string)] ?? (line.line_type as string)}
                </td>
                <td className="py-2 px-3 text-sm text-center">{qty}</td>
                <td className="py-2 px-3 text-sm text-right">{formatCurrency(price)}</td>
                <td className="py-2 px-3 text-sm text-right font-medium">{formatCurrency(lineAmount)}</td>
                <td className="py-2 px-3 text-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    line.status === 'approved' ? 'bg-green-100 text-green-700' :
                    line.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {(line.status as string)?.toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
          )}
          {declinedLines.length > 0 && (
            <div className="flex justify-between py-1.5 text-sm text-gray-400">
              <span>Declined items</span>
              <span className="line-through">
                {formatCurrency(declinedLines.reduce((sum: number, l: Record<string, unknown>) => sum + lineTotal(l), 0))}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 text-base font-bold border-t-2 border-gray-900 mt-1">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Signature area */}
      <div className="grid grid-cols-2 gap-8 mt-12 mb-8">
        <div>
          <div className="border-b border-gray-400 pb-8"></div>
          <p className="text-xs text-gray-500 mt-1">Customer Signature</p>
        </div>
        <div>
          <div className="border-b border-gray-400 pb-8"></div>
          <p className="text-xs text-gray-500 mt-1">Date</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-gray-900">
        <div className="flex justify-between text-xs text-gray-500">
          <p>Report generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>{organization?.name ?? 'White Glove Auto Service'} — Confidential</p>
        </div>
      </div>
    </div>
  );
}
