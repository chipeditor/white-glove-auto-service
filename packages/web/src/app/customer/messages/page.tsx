'use client';

import { Car, Wrench, CheckCircle, AlertTriangle, Sparkles, Bell } from 'lucide-react';

const UPDATES = [
  {
    id: '1',
    type: 'milestone',
    icon: Sparkles,
    iconColor: 'text-[#c8a45c]',
    iconBg: 'bg-[#c8a45c]/10',
    title: 'Service Progress Update',
    body: 'Great news — 7 of 12 service tasks are now complete. Your Corvette is running beautifully. We\'re finishing up the electrical diagnostics and will begin final detailing shortly.',
    from: 'Lisa Chen, Service Advisor',
    time: '25 minutes ago',
  },
  {
    id: '2',
    type: 'alert',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-400/10',
    title: 'Inspection Finding — Front Brake Pads',
    body: 'During our mechanical inspection, we noticed your front brake pads are at approximately 35% life remaining. They\'re safe to drive on now, but we recommend replacement within the next 5,000 miles. We can take care of this during your current visit if you\'d like — check the Inspection tab to approve.',
    from: 'James Taylor, Lead Technician',
    time: '2 hours ago',
  },
  {
    id: '3',
    type: 'progress',
    icon: Wrench,
    iconColor: 'text-wg-blue',
    iconBg: 'bg-wg-blue/10',
    title: 'Service Started',
    body: 'We\'ve begun working on your Corvette Z51. Today\'s plan includes oil and filter change, brake fluid flush, coolant inspection, and a full tire rotation. You\'ll receive updates as we complete each stage.',
    from: 'Lisa Chen, Service Advisor',
    time: '5 hours ago',
  },
  {
    id: '4',
    type: 'approval',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
    title: 'Service Plan Approved',
    body: 'Thank you for approving the service plan. We\'ll proceed with the performance inspection and delivery prep as discussed.',
    from: 'System',
    time: 'Yesterday, 2:00 PM',
  },
  {
    id: '5',
    type: 'inspection',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
    title: 'Intake Inspection Complete',
    body: 'Your vehicle intake inspection is finished. We documented the full condition of your Corvette — 22 of 26 items passed with flying colors. A few items need your attention. Head to the Inspection tab for full details and photos.',
    from: 'James Taylor, Lead Technician',
    time: 'Yesterday, 11:30 AM',
  },
  {
    id: '6',
    type: 'checkin',
    icon: Car,
    iconColor: 'text-[#c8a45c]',
    iconBg: 'bg-[#c8a45c]/10',
    title: 'Vehicle Received',
    body: 'Welcome to White Glove Auto Service. Your 2015 Chevrolet Corvette Z51 has been checked in and is now in our care. We\'ll keep you updated every step of the way.',
    from: 'Lisa Chen, Service Advisor',
    time: 'Yesterday, 10:15 AM',
  },
];

export default function CustomerMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#c8a45c] font-medium tracking-wide mb-1">SERVICE UPDATES</p>
          <h2 className="text-lg font-semibold text-wg-text">Activity Feed</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-wg-text2">
          <Bell size={13} />
          <span>{UPDATES.length} updates</span>
        </div>
      </div>

      <div className="space-y-0">
        {UPDATES.map((update, i) => {
          const Icon = update.icon;
          const isLast = i === UPDATES.length - 1;

          return (
            <div key={update.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${update.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={14} className={update.iconColor} />
                </div>
                {!isLast && <div className="w-px flex-1 min-h-[16px] bg-wg-border" />}
              </div>

              <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                <div className="bg-wg-card rounded-xl border border-wg-border p-4">
                  <h4 className="text-sm font-medium text-wg-text">{update.title}</h4>
                  <p className="text-xs text-wg-text2 mt-1.5 leading-relaxed">{update.body}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-wg-border/50">
                    <span className="text-[11px] text-wg-muted">{update.from}</span>
                    <span className="text-[11px] text-wg-muted">{update.time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
