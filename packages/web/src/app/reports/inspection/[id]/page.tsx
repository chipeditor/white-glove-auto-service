import { fetchInspectionReport } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/PrintButton';

const CONDITION_COLORS: Record<string, string> = {
  good: '#34c759',
  fair: '#ffb340',
  poor: '#e94560',
  na: '#6b7280',
};

const CONDITION_LABELS: Record<string, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  needs_attention: 'Needs Attention',
  na: 'N/A',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

interface ReportItem {
  id: string;
  label: string;
  passed: boolean | null;
  condition?: string | null;
  notes: string | null;
  flagged: boolean;
}

function getCondition(item: ReportItem): string {
  if (item.condition) return item.condition;
  if (item.passed === true) return 'good';
  if (item.passed === false) return 'poor';
  return 'na';
}

export default async function InspectionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchInspectionReport(id);
  if (!data) notFound();

  const { inspection, sections, organization } = data;
  const vehicle = inspection.vehicle as Record<string, unknown>;
  const customer = (vehicle?.customer ?? null) as Record<string, unknown> | null;
  const tech = inspection.technician as Record<string, unknown> | null;

  const allItems = sections.flatMap((s: Record<string, unknown>) => ((s.items as ReportItem[]) ?? []));
  const totalItems = allItems.length;
  const goodItems = allItems.filter((i) => getCondition(i) === 'good').length;
  const poorItems = allItems.filter((i) => {
    const c = getCondition(i);
    return c === 'poor' || c === 'needs_attention';
  }).length;

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        @page { margin: 0.5in; size: letter; }
      `}</style>

      <PrintButton backHref="/reports" />

      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{String(organization?.name ?? 'White Glove Auto Service')}</h1>
            {organization?.address ? <p className="text-sm text-gray-600 mt-0.5">{String(organization.address)}</p> : null}
            {organization?.phone ? <p className="text-sm text-gray-600">{String(organization.phone)}</p> : null}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900">INSPECTION REPORT</h2>
            <p className="text-sm text-gray-600">
              {String(inspection.inspection_type ?? '').replace('_', ' ').toUpperCase()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Date: {formatDate(String(inspection.created_at))}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle & Customer Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vehicle Information</h3>
          <p className="font-semibold">{`${vehicle?.year ?? ''} ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`.trim()}</p>
          {vehicle?.trim_level ? <p className="text-sm text-gray-600">{String(vehicle.trim_level)}</p> : null}
          {vehicle?.vin ? <p className="text-sm text-gray-600">VIN: {String(vehicle.vin)}</p> : null}
          {vehicle?.mileage ? <p className="text-sm text-gray-600">Mileage: {Number(vehicle.mileage).toLocaleString()}</p> : null}
          {vehicle?.exterior_color ? <p className="text-sm text-gray-600">Color: {String(vehicle.exterior_color)}</p> : null}
        </div>
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Information</h3>
          {customer ? (
            <>
              <p className="font-semibold">{String(customer.full_name)}</p>
              {customer.email ? <p className="text-sm text-gray-600">{String(customer.email)}</p> : null}
              {customer.phone ? <p className="text-sm text-gray-600">{String(customer.phone)}</p> : null}
            </>
          ) : (
            <p className="text-sm text-gray-500">No customer assigned</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Inspector</h3>
            <p className="text-sm font-medium">{String(tech?.full_name ?? 'Unassigned')}</p>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-xs text-gray-500 uppercase">Total Items</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{goodItems}</p>
          <p className="text-xs text-green-600 uppercase">Passed</p>
        </div>
        <div className={`${poorItems > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 text-center`}>
          <p className={`text-2xl font-bold ${poorItems > 0 ? 'text-red-700' : 'text-gray-700'}`}>{poorItems}</p>
          <p className={`text-xs uppercase ${poorItems > 0 ? 'text-red-600' : 'text-gray-500'}`}>Needs Attention</p>
        </div>
      </div>

      {/* Inspection Sections */}
      {sections.map((section: Record<string, unknown>, idx: number) => {
        const items = (section.items as ReportItem[]) ?? [];
        return (
          <div key={String(section.id)} className={idx > 0 && idx % 3 === 0 ? 'page-break' : ''}>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider bg-gray-100 px-3 py-2 rounded">
                {String(section.title)}
              </h3>
              <table className="w-full mt-1">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left py-1.5 px-3 font-medium">Item</th>
                    <th className="text-center py-1.5 px-3 font-medium w-24">Condition</th>
                    <th className="text-left py-1.5 px-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const cond = getCondition(item);
                    return (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-1.5 px-3 text-sm">{item.label}</td>
                        <td className="py-1.5 px-3 text-center">
                          <span
                            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: CONDITION_COLORS[cond] ?? '#6b7280' }}
                          >
                            {CONDITION_LABELS[cond] ?? cond}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-sm text-gray-600">{item.notes ?? ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-gray-900">
        <div className="flex justify-between text-xs text-gray-500">
          <p>Report generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>{String(organization?.name ?? 'White Glove Auto Service')} — Confidential</p>
        </div>
      </div>
    </div>
  );
}
