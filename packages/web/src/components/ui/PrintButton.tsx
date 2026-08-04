'use client';

export function PrintButton({ backHref }: { backHref: string }) {
  return (
    <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg"
      >
        Print / Save PDF
      </button>
      <a
        href={backHref}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 shadow-lg"
      >
        Back
      </a>
    </div>
  );
}
