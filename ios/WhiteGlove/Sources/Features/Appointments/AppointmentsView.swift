import SwiftUI

struct AppointmentsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var appointments: [Appointment] = []
    @State private var isLoading = true
    @State private var filter: FilterTab = .upcoming
    @State private var updatingId: UUID?

    enum FilterTab: String, CaseIterable {
        case upcoming = "Upcoming"
        case today = "Today"
        case past = "Past"
        case all = "All"
    }

    private var todayStr: String {
        let d = Date()
        let cal = Calendar.current
        let y = cal.component(.year, from: d)
        let m = cal.component(.month, from: d)
        let day = cal.component(.day, from: d)
        return String(format: "%04d-%02d-%02d", y, m, day)
    }

    private var filtered: [Appointment] {
        let today = todayStr
        switch filter {
        case .upcoming:
            return appointments.filter {
                $0.scheduledDate >= today && ![.cancelled, .noShow, .completed].contains($0.status)
            }
        case .today:
            return appointments.filter { $0.scheduledDate == today }
        case .past:
            return appointments.filter {
                $0.scheduledDate < today || [.completed, .cancelled, .noShow].contains($0.status)
            }
        case .all:
            return appointments
        }
    }

    private var todayCount: Int {
        let today = todayStr
        return appointments.filter {
            $0.scheduledDate == today && ![.cancelled, .noShow, .completed].contains($0.status)
        }.count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    filterBar
                    if isLoading {
                        LoadingView(message: "Loading appointments...")
                            .frame(maxWidth: .infinity, minHeight: 200)
                    } else if filtered.isEmpty {
                        emptyState
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(filtered) { appt in
                                appointmentCard(appt)
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color(hex: Theme.background))
            .navigationTitle("Appointments")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(FilterTab.allCases, id: \.self) { tab in
                    Button {
                        filter = tab
                    } label: {
                        HStack(spacing: 4) {
                            Text(tab.rawValue)
                            if tab == .today && todayCount > 0 {
                                Text("\(todayCount)")
                                    .font(.system(size: 10, weight: .bold))
                                    .padding(.horizontal, 5)
                                    .padding(.vertical, 2)
                                    .background(Color(hex: Theme.blue).opacity(0.2))
                                    .clipShape(Capsule())
                            }
                        }
                        .font(.system(size: 13, weight: .medium))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            filter == tab
                                ? Color(hex: Theme.blue).opacity(0.1)
                                : Color.clear
                        )
                        .foregroundColor(
                            filter == tab
                                ? Color(hex: Theme.blue)
                                : Color(hex: Theme.text2)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(filter == tab ? Color.clear : Color(hex: Theme.border), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.checkmark")
                .font(.system(size: 32))
                .foregroundColor(Color(hex: Theme.muted))
            Text("No appointments found")
                .font(.system(size: 14))
                .foregroundColor(Color(hex: Theme.muted))
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .background(Color(hex: Theme.card))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: Theme.border), lineWidth: 1))
    }

    private func appointmentCard(_ appt: Appointment) -> some View {
        let isToday = appt.scheduledDate == todayStr
        let actions = appt.status.nextActions

        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: Theme.text2))
                    Text(formatDate(appt.scheduledDate))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: Theme.text))
                }
                if isToday {
                    Text("TODAY")
                        .font(.system(size: 9, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: Theme.gold).opacity(0.1))
                        .foregroundColor(Color(hex: Theme.gold))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }
                HStack(spacing: 3) {
                    Image(systemName: "clock")
                        .font(.system(size: 11))
                    Text(formatTime(appt.scheduledTime))
                        .font(.system(size: 13))
                }
                .foregroundColor(Color(hex: Theme.text2))

                Spacer()

                Text(appt.status.displayName)
                    .font(.system(size: 11, weight: .medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color(hex: appt.status.statusColor).opacity(0.1))
                    .foregroundColor(Color(hex: appt.status.statusColor))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            Text(appt.serviceType)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Color(hex: Theme.text))

            if let desc = appt.description, !desc.isEmpty {
                Text(desc)
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: Theme.muted))
            }

            HStack(spacing: 12) {
                Label(appt.customerName, systemImage: "person")
                if let phone = appt.customerPhone {
                    Label(phone, systemImage: "phone")
                }
            }
            .font(.system(size: 12))
            .foregroundColor(Color(hex: Theme.text2))

            if !actions.isEmpty {
                HStack(spacing: 8) {
                    ForEach(actions, id: \.self) { action in
                        Button {
                            Task { await updateStatus(appt.id, to: action) }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: iconForAction(action))
                                    .font(.system(size: 11))
                                Text(action.displayName)
                                    .font(.system(size: 12, weight: .medium))
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .foregroundColor(Color(hex: action.statusColor))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color(hex: Theme.border), lineWidth: 1)
                            )
                        }
                        .disabled(updatingId == appt.id)
                        .opacity(updatingId == appt.id ? 0.5 : 1)
                    }
                }
                .padding(.top, 4)
            }
        }
        .padding(16)
        .background(Color(hex: Theme.card))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isToday ? Color(hex: Theme.gold).opacity(0.3) : Color(hex: Theme.border), lineWidth: 1)
        )
    }

    private func iconForAction(_ status: AppointmentStatus) -> String {
        switch status {
        case .confirmed, .checkedIn, .completed: return "checkmark.circle"
        case .cancelled: return "xmark.circle"
        case .noShow: return "exclamationmark.circle"
        default: return "arrow.right.circle"
        }
    }

    private func formatDate(_ dateStr: String) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        guard let date = fmt.date(from: dateStr) else { return dateStr }
        fmt.dateFormat = "EEE, MMM d"
        return fmt.string(from: date)
    }

    private func formatTime(_ timeStr: String) -> String {
        let parts = timeStr.split(separator: ":")
        guard parts.count >= 2, let hour = Int(parts[0]) else { return timeStr }
        let min = parts[1]
        let ampm = hour >= 12 ? "PM" : "AM"
        let h12 = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour)
        return "\(h12):\(min) \(ampm)"
    }

    private func load() async {
        guard let user = authService.currentUser else { return }
        isLoading = true
        do {
            let orgId = MockDataProvider.orgId
            appointments = try await authService.dataProvider.fetchAppointments(organizationId: orgId)
        } catch {
            print("Failed to load appointments: \(error)")
        }
        isLoading = false
    }

    private func updateStatus(_ id: UUID, to status: AppointmentStatus) async {
        updatingId = id
        do {
            try await authService.dataProvider.updateAppointmentStatus(id: id, status: status)
            if let idx = appointments.firstIndex(where: { $0.id == id }) {
                appointments[idx].status = status
            }
        } catch {
            print("Failed to update appointment: \(error)")
        }
        updatingId = nil
    }
}
