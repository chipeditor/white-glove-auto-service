import SwiftUI

struct ScheduleView: View {
    @EnvironmentObject var authService: AuthService
    @State private var serviceRequests: [ServiceRequest] = []
    @State private var staff: [User] = []
    @State private var selectedDate = Date()
    @State private var isLoading = true
    @State private var showIntake = false

    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        return f
    }()

    var weekDates: [Date] {
        let start = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate))!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    var filteredRequests: [ServiceRequest] {
        serviceRequests.filter { sr in
            guard sr.status != .completed && sr.status != .declined else { return false }
            return true
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()

                VStack(spacing: 0) {
                    weekStrip

                    if isLoading {
                        Spacer()
                        ProgressView().tint(Theme.goldColor)
                        Spacer()
                    } else if filteredRequests.isEmpty {
                        Spacer()
                        EmptyStateView(
                            icon: "calendar",
                            title: "No Active Jobs",
                            message: "No service requests are currently scheduled."
                        )
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 14) {
                                ForEach(groupedByTechnician.sorted(by: { $0.key < $1.key }), id: \.key) { techName, requests in
                                    techSection(name: techName, requests: requests)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showIntake = true
                    } label: {
                        Label("New Intake", systemImage: "plus.circle.fill")
                            .foregroundColor(Theme.goldColor)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        selectedDate = Date()
                    } label: {
                        Text("Today")
                            .font(.subheadline.weight(.medium))
                            .foregroundColor(Theme.goldColor)
                    }
                }
            }
            .sheet(isPresented: $showIntake) {
                IntakeWizardView()
                    .environmentObject(authService)
            }
            .task { await loadData() }
            .refreshable { await loadData() }
        }
    }

    var weekStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(weekDates, id: \.self) { date in
                    let isSelected = calendar.isDate(date, inSameDayAs: selectedDate)
                    let isToday = calendar.isDateInToday(date)

                    Button {
                        selectedDate = date
                    } label: {
                        VStack(spacing: 4) {
                            Text(dayOfWeek(date))
                                .font(.caption2.weight(.medium))
                                .foregroundColor(.white.opacity(0.5))
                            Text("\(calendar.component(.day, from: date))")
                                .font(.title3.weight(isSelected ? .bold : .regular))
                                .foregroundColor(isSelected ? Theme.goldColor : .white.opacity(0.85))
                        }
                        .frame(width: 46, height: 58)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(isSelected ? Theme.goldColor.opacity(0.12) : Color.clear)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(isToday && !isSelected ? Theme.goldColor.opacity(0.25) : Color.clear, lineWidth: 1)
                        )
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
        .background(.ultraThinMaterial)
        .background(Color.white.opacity(0.02))
    }

    var groupedByTechnician: [String: [ServiceRequest]] {
        Dictionary(grouping: filteredRequests) { sr in
            staff.first(where: { $0.id == sr.technicianId })?.fullName ?? "Unassigned"
        }
    }

    func techSection(name: String, requests: [ServiceRequest]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "person.fill")
                    .foregroundColor(Theme.goldColor)
                Text(name)
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.9))
                Spacer()
                Text("\(requests.count) jobs")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.35))
            }
            .padding(.horizontal, 4)

            ForEach(requests) { sr in
                NavigationLink {
                    ServiceRequestDetailView(serviceRequestId: sr.id)
                } label: {
                    scheduleCard(sr)
                }
                .buttonStyle(.plain)
            }
        }
    }

    func scheduleCard(_ sr: ServiceRequest) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(sr.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(1)
                Spacer()
                if let phase = sr.phase {
                    Text(phase.displayName)
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color(hex: phase.color).opacity(0.2))
                        .foregroundColor(Color(hex: phase.color))
                        .clipShape(Capsule())
                }
            }

            HStack(spacing: 12) {
                Label(sr.status.displayName, systemImage: "circle.fill")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))

                if let health = sr.healthStatus {
                    Label {
                        Text(health == .onTrack ? "On Track" : health == .tight ? "Tight" : health == .atRisk ? "At Risk" : health == .blocked ? "Blocked" : "Overdue")
                    } icon: {
                        Circle().fill(Color(hex: health.color)).frame(width: 6, height: 6)
                    }
                    .font(.caption)
                    .foregroundColor(Color(hex: health.color))
                }
            }
        }
        .glassCard(padding: 12)
    }

    func dayOfWeek(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: date).uppercased()
    }

    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let srs = authService.dataProvider.fetchServiceRequests(organizationId: authService.organizationId)
            async let st = authService.dataProvider.fetchStaff(organizationId: authService.organizationId)
            serviceRequests = try await srs
            staff = try await st
        } catch {}
    }
}
