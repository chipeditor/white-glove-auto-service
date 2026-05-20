'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Camera, ThumbsUp, ThumbsDown } from 'lucide-react';

type Finding = {
  id: string;
  label: string;
  status: 'pass' | 'flag' | 'fail';
  notes?: string;
  photos?: number;
  recommendation?: {
    description: string;
    cost: string;
    urgency: 'recommended' | 'urgent' | 'optional';
  };
};

type Section = {
  id: string;
  name: string;
  findings: Finding[];
};

const SECTIONS: Section[] = [
  {
    id: 's1',
    name: 'Exterior Front',
    findings: [
      { id: 'f1', label: 'Hood condition', status: 'pass' },
      {
        id: 'f2',
        label: 'Front bumper',
        status: 'flag',
        notes: 'Light scratches on lower front bumper — cosmetic only, no structural damage.',
        photos: 3,
        recommendation: {
          description: 'Paint touch-up and clear coat repair',
          cost: '$185',
          urgency: 'optional',
        },
      },
      { id: 'f3', label: 'Headlights', status: 'pass' },
      { id: 'f4', label: 'Grille', status: 'pass' },
      { id: 'f5', label: 'Windshield', status: 'pass' },
    ],
  },
  {
    id: 's2',
    name: 'Exterior Sides & Rear',
    findings: [
      { id: 'f6', label: 'Driver side panels', status: 'pass' },
      { id: 'f7', label: 'Passenger side panels', status: 'pass' },
      {
        id: 'f8',
        label: 'Rear bumper',
        status: 'flag',
        notes: 'Minor scuff marks near exhaust tips. Likely from road debris.',
        photos: 2,
        recommendation: {
          description: 'Buff and polish treatment',
          cost: '$75',
          urgency: 'optional',
        },
      },
      { id: 'f9', label: 'Taillights', status: 'pass' },
      { id: 'f10', label: 'Trunk/hatch', status: 'pass' },
    ],
  },
  {
    id: 's3',
    name: 'Interior',
    findings: [
      { id: 'f11', label: 'Seats condition', status: 'pass' },
      { id: 'f12', label: 'Dashboard', status: 'pass' },
      { id: 'f13', label: 'Steering wheel', status: 'pass' },
      { id: 'f14', label: 'Center console', status: 'pass' },
      { id: 'f15', label: 'Carpet and floor mats', status: 'pass' },
    ],
  },
  {
    id: 's4',
    name: 'Mechanical',
    findings: [
      { id: 'f16', label: 'Engine oil level', status: 'pass' },
      { id: 'f17', label: 'Belts and hoses', status: 'pass' },
      {
        id: 'f18',
        label: 'Brake pads (front)',
        status: 'flag',
        notes: 'Front brake pads at approximately 35% remaining life. Safe to drive now but should be replaced within 5,000 miles.',
        photos: 2,
        recommendation: {
          description: 'Front brake pad replacement (Brembo performance pads)',
          cost: '$420',
          urgency: 'recommended',
        },
      },
      { id: 'f19', label: 'Brake pads (rear)', status: 'pass' },
      { id: 'f20', label: 'Tire tread depth', status: 'pass', notes: 'All tires above 5/32" tread depth' },
      {
        id: 'f21',
        label: 'Air filter',
        status: 'fail',
        notes: 'Air filter is significantly dirty and restricting airflow. Replacement recommended before pickup.',
        photos: 1,
        recommendation: {
          description: 'K&N performance air filter replacement',
          cost: '$65',
          urgency: 'urgent',
        },
      },
    ],
  },
  {
    id: 's5',
    name: 'Tires & Wheels',
    findings: [
      { id: 'f22', label: 'Front left tire', status: 'pass' },
      { id: 'f23', label: 'Front right tire', status: 'pass' },
      { id: 'f24', label: 'Rear left tire', status: 'pass' },
      { id: 'f25', label: 'Rear right tire', status: 'pass' },
      { id: 'f26', label: 'Wheel condition', status: 'pass' },
    ],
  },
];

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Good' },
  flag: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Attention' },
  fail: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Needs Repair' },
};

const URGENCY_STYLES = {
  urgent: { bg: 'bg-red-400/10 border-red-400/20', text: 'text-red-400', label: 'Urgent' },
  recommended: { bg: 'bg-amber-400/10 border-amber-400/20', text: 'text-amber-400', label: 'Recommended' },
  optional: { bg: 'bg-wg-card border-wg-border', text: 'text-wg-text2', label: 'Optional' },
};

export default function CustomerInspectionPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ s1: true, s4: true });
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  const totalFindings = SECTIONS.flatMap((s) => s.findings).length;
  const passedFindings = SECTIONS.flatMap((s) => s.findings).filter((f) => f.status === 'pass').length;
  const flaggedFindings = SECTIONS.flatMap((s) => s.findings).filter((f) => f.status === 'flag').length;
  const failedFindings = SECTIONS.flatMap((s) => s.findings).filter((f) => f.status === 'fail').length;

  const recommendations = SECTIONS.flatMap((s) => s.findings).filter((f) => f.recommendation);
  const approvedCount = Object.values(approved).filter(Boolean).length;

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#c8a45c] font-medium tracking-wide mb-1">INSPECTION REPORT</p>
            <h2 className="text-lg font-semibold text-wg-text">2015 Chevrolet Corvette Z51</h2>
            <p className="text-xs text-wg-text2 mt-0.5">Inspected by James Taylor &middot; May 17, 2025</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-400/5 rounded-xl p-3 text-center border border-emerald-400/10">
            <p className="text-xl font-bold text-emerald-400">{passedFindings}</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">Passed</p>
          </div>
          <div className="bg-amber-400/5 rounded-xl p-3 text-center border border-amber-400/10">
            <p className="text-xl font-bold text-amber-400">{flaggedFindings}</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Attention</p>
          </div>
          <div className="bg-red-400/5 rounded-xl p-3 text-center border border-red-400/10">
            <p className="text-xl font-bold text-red-400">{failedFindings}</p>
            <p className="text-xs text-red-400/70 mt-0.5">Needs Repair</p>
          </div>
        </div>

        <p className="text-xs text-wg-text2 mt-3 text-center">
          {totalFindings} items inspected across {SECTIONS.length} areas
        </p>
      </div>

      {/* Recommendations requiring approval */}
      {recommendations.length > 0 && (
        <div className="bg-wg-card rounded-2xl border border-[#c8a45c]/20 p-5">
          <h3 className="text-sm font-semibold text-wg-text mb-1">Recommendations</h3>
          <p className="text-xs text-wg-text2 mb-4">
            Our technicians found {recommendations.length} items that need your attention. Approve or decline each below.
          </p>

          <div className="space-y-3">
            {recommendations.map((finding) => {
              const rec = finding.recommendation!;
              const urgency = URGENCY_STYLES[rec.urgency];
              const isApproved = approved[finding.id];
              const isDeclined = approved[finding.id] === false;
              const hasDecision = finding.id in approved;

              return (
                <div
                  key={finding.id}
                  className={`rounded-xl border p-4 ${hasDecision ? (isApproved ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-wg-border bg-wg-bg/50') : urgency.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded ${urgency.bg} ${urgency.text}`}>
                          {urgency.label.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-wg-text">{rec.description}</span>
                      </div>
                      {finding.notes && (
                        <p className="text-xs text-wg-text2 mt-1">{finding.notes}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-wg-text whitespace-nowrap">{rec.cost}</span>
                  </div>

                  {hasDecision ? (
                    <div className="mt-3 flex items-center gap-2">
                      {isApproved ? (
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={13} /> Approved
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-wg-muted flex items-center gap-1">
                          <XCircle size={13} /> Declined
                        </span>
                      )}
                      <button
                        onClick={() => setApproved((prev) => { const next = { ...prev }; delete next[finding.id]; return next; })}
                        className="text-xs text-wg-text2 hover:text-wg-text ml-auto"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setApproved((prev) => ({ ...prev, [finding.id]: true }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8a45c] text-[#1a1a2e] text-xs font-semibold hover:bg-[#b8944c] transition-colors"
                      >
                        <ThumbsUp size={12} /> Approve
                      </button>
                      <button
                        onClick={() => setApproved((prev) => ({ ...prev, [finding.id]: false }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wg-bg text-wg-text2 text-xs font-medium hover:bg-wg-card border border-wg-border transition-colors"
                      >
                        <ThumbsDown size={12} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {recommendations.length > 0 && approvedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-wg-border flex items-center justify-between">
              <p className="text-xs text-wg-text2">
                {approvedCount} of {recommendations.length} approved
              </p>
              <button className="px-4 py-2 rounded-lg bg-[#c8a45c] text-[#1a1a2e] text-xs font-semibold hover:bg-[#b8944c] transition-colors">
                Confirm Selections
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detailed inspection sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-wg-text">Detailed Results</h3>
        {SECTIONS.map((section) => {
          const isExpanded = expanded[section.id];
          const sectionFlags = section.findings.filter((f) => f.status !== 'pass').length;

          return (
            <div key={section.id} className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-wg-card-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-wg-text">{section.name}</span>
                  {sectionFlags > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400">
                      {sectionFlags} flagged
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-wg-muted">
                  <span className="text-xs">{section.findings.length} items</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-wg-border">
                  {section.findings.map((finding) => {
                    const config = STATUS_CONFIG[finding.status];
                    const Icon = config.icon;

                    return (
                      <div key={finding.id} className="px-4 py-2.5 flex items-start gap-3 border-b border-wg-border/50 last:border-0">
                        <div className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={12} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-wg-text">{finding.label}</span>
                            <span className={`text-xs ${config.color}`}>{config.label}</span>
                          </div>
                          {finding.notes && (
                            <p className="text-xs text-wg-text2 mt-0.5">{finding.notes}</p>
                          )}
                          {finding.photos && (
                            <span className="inline-flex items-center gap-1 text-xs text-wg-muted mt-1">
                              <Camera size={11} /> {finding.photos} photo{finding.photos > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
