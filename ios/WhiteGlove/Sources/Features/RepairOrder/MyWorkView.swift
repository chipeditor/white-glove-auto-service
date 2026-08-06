import SwiftUI

/// A technician's own queue — the jobs assigned to them, nothing else.
///
/// The Work Orders tab lists the whole shop, which makes a tech hunt for their
/// own cars. This opens straight onto their work, ordered so the job they
/// should touch next is at the top.
struct MyWorkView: View {
    @EnvironmentObject var authService: AuthService

    @State private var jobs: [ServiceRequest] = []
    @State private var vehiclesById: [UUID: Vehicle] = [:]
    @State private var isLoading = true
    @State private var errorMessage: String?

    /// Active work first, then what's waiting on someone else.
    private static let statusOrder: [ServiceRequestStatus] = [
        .inProgress, .approved, .qualityControl, .readyForDelivery,
        .submitted, .awaitingCustomerApproval, .draft,
    ]

    private var grouped: [(status: ServiceRequestStatus, items: [ServiceRequest])] {
        Self.statusOrder.compactMap { status in
            let items = jobs.filter { $0.status == status }
            return items.isEmpty ? nil : (status, items)
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView().tint(Theme.goldColor)
                } else if jobs.isEmpty {
                    EmptyStateView(
                        icon: "wrench.and.screwdriver",
                        title: "No Jobs Assigned",
                        message: "Work assigned to you will show up here."
                    )
                } else {
                    ScrollView {
                        VStack(spacing: 16) {
                            ForEach(grouped, id: \.status) { group in
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text(group.status.displayName)
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundColor(.white.opacity(0.85))
                                        Text("\(group.items.count)")
                                            .font(.caption.weight(.medium))
                                            .foregroundColor(.white.opacity(0.4))
                                        Spacer()
                                    }
                                    .padding(.horizontal, 4)

                                    ForEach(group.items) { job in
                                        NavigationLink {
                                            RepairOrderView(serviceRequest: job)
                                        } label: {
                                            jobCard(job)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                        .padding()
                    }
                    .refreshable { await loadData() }
                }
            }
            .background(
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("My Work")
        }
        .task { await loadData() }
        .alert("Could Not Load Work", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private func jobCard(_ job: ServiceRequest) -> some View {
        let vehicle = vehiclesById[job.vehicleId]
        let overdue = job.promisedAt.map { $0 < Date() } ?? false

        return HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 3)
                .fill(job.status == .inProgress ? Theme.goldColor : Color.white.opacity(0.15))
                .frame(width: 3)

            VStack(alignment: .leading, spacing: 4) {
                Text(vehicle?.displayName ?? "Vehicle")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white.opacity(0.92))
                Text(job.title)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
                    .lineLimit(1)

                if let promised = job.promisedAt {
                    Label(promised.formatted(date: .abbreviated, time: .shortened),
                          systemImage: overdue ? "exclamationmark.triangle.fill" : "clock")
                        .font(.caption2.weight(.medium))
                        .foregroundColor(overdue ? Color(hex: Theme.alert) : .white.opacity(0.4))
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundColor(.white.opacity(0.25))
        }
        .glassCard(padding: 12)
    }

    private func loadData() async {
        defer { isLoading = false }
        guard let me = authService.currentUser?.id else { return }

        do {
            let all = try await authService.dataProvider.fetchServiceRequests(
                organizationId: authService.organizationId
            )
            let mine = all.filter { $0.technicianId == me && $0.status != .completed }
            jobs = mine

            // Vehicle names make the list scannable; fetch only what's shown.
            var lookup: [UUID: Vehicle] = [:]
            for vehicleId in Set(mine.map(\.vehicleId)) {
                if let vehicle = try? await authService.dataProvider.fetchVehicle(id: vehicleId) {
                    lookup[vehicleId] = vehicle
                }
            }
            vehiclesById = lookup
        } catch {
            errorMessage = AuthService.describe(error)
        }
    }
}
