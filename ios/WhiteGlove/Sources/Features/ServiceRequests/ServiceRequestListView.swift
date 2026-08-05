import SwiftUI

struct ServiceRequestListView: View {
    @EnvironmentObject var authService: AuthService
    @State private var serviceRequests: [ServiceRequest] = []
    @State private var staff: [User] = []
    @State private var isLoading = true
    @State private var selectedFilter: ServiceRequestStatus? = nil

    private var filtered: [ServiceRequest] {
        guard let filter = selectedFilter else { return serviceRequests }
        return serviceRequests.filter { $0.status == filter }
    }

    private let filterOptions: [ServiceRequestStatus?] = [
        nil, .submitted, .approved, .inProgress, .qualityControl, .readyForDelivery, .completed,
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(filterOptions, id: \.self) { option in
                            let label = option?.displayName ?? "All"
                            let isSelected = selectedFilter == option
                            Button {
                                withAnimation { selectedFilter = option }
                            } label: {
                                Text(label)
                                    .font(.caption.weight(isSelected ? .semibold : .regular))
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 7)
                                    .background(
                                        isSelected
                                            ? AnyShapeStyle(.ultraThinMaterial)
                                            : AnyShapeStyle(Color.clear)
                                    )
                                    .background(isSelected ? Theme.goldColor.opacity(0.1) : Color.white.opacity(0.03))
                                    .foregroundColor(isSelected ? Theme.goldColor : .white.opacity(0.45))
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(isSelected ? Theme.goldColor.opacity(0.25) : Color.white.opacity(0.06), lineWidth: 1)
                                    )
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }

                if isLoading {
                    Spacer()
                    ProgressView().tint(Theme.goldColor)
                    Spacer()
                } else if filtered.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "wrench.and.screwdriver.fill",
                        title: "No Service Requests",
                        message: selectedFilter != nil ? "No requests with this status." : "No service requests yet."
                    )
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(filtered) { request in
                                NavigationLink {
                                    ServiceRequestDetailView(serviceRequestId: request.id)
                                } label: {
                                    ServiceRequestCard(request: request, staff: staff)
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
            .navigationTitle("Work Orders")
            .task { await loadData() }
        }
    }

    private func loadData() async {
        do {
            let orgId = authService.organizationId
            async let srs = authService.dataProvider.fetchServiceRequests(organizationId: orgId)
            async let st = authService.dataProvider.fetchStaff(organizationId: orgId)
            serviceRequests = try await srs
            staff = try await st
            serviceRequests.sort { $0.createdAt > $1.createdAt }
        } catch {}
        isLoading = false
    }
}

private struct ServiceRequestCard: View {
    let request: ServiceRequest
    let staff: [User]

    var techName: String? {
        guard let techId = request.technicianId else { return nil }
        return staff.first(where: { $0.id == techId })?.fullName
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(request.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(1)
                Spacer()
                ServiceStatusBadge(status: request.status)
            }

            if let desc = request.description {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
                    .lineLimit(2)
            }

            HStack {
                if let name = techName {
                    Label(name, systemImage: "person.fill")
                        .font(.caption2)
                        .foregroundColor(Theme.goldColor)
                }

                if let phase = request.phase {
                    Text(phase.displayName)
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: phase.color).opacity(0.2))
                        .foregroundColor(Color(hex: phase.color))
                        .clipShape(Capsule())
                }

                Spacer()

                Label(request.createdAt.formatted(date: .abbreviated, time: .omitted), systemImage: "calendar")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.35))

                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.25))
            }
        }
        .glassCard()
    }
}
