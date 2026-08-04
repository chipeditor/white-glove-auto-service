import SwiftUI

struct ServiceRequestListView: View {
    @EnvironmentObject var authService: AuthService
    @State private var serviceRequests: [ServiceRequest] = []
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
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(isSelected ? Theme.goldColor.opacity(0.15) : Theme.cardColor)
                                    .foregroundColor(isSelected ? Theme.goldColor : Theme.text2Color)
                                    .cornerRadius(8)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(isSelected ? Theme.goldColor.opacity(0.3) : Color.clear, lineWidth: 1)
                                    )
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }
                .background(Theme.bgColor)

                if isLoading {
                    Spacer()
                    ProgressView()
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
                        LazyVStack(spacing: 12) {
                            ForEach(filtered) { request in
                                NavigationLink {
                                    ServiceRequestDetailView(serviceRequestId: request.id)
                                } label: {
                                    ServiceRequestCard(request: request)
                                }
                            }
                        }
                        .padding()
                    }
                    .refreshable { await loadData() }
                }
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Work Orders")
            .task { await loadData() }
        }
    }

    private func loadData() async {
        do {
            let orgId = authService.organizationId
            serviceRequests = try await authService.dataProvider.fetchServiceRequests(organizationId: orgId)
            serviceRequests.sort { $0.createdAt > $1.createdAt }
        } catch {}
        isLoading = false
    }
}

private struct ServiceRequestCard: View {
    let request: ServiceRequest

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(request.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(Theme.textColor)
                    .lineLimit(1)
                Spacer()
                ServiceStatusBadge(status: request.status)
            }

            if let desc = request.description {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(Theme.text2Color)
                    .lineLimit(2)
            }

            HStack {
                Label(request.createdAt.formatted(date: .abbreviated, time: .omitted), systemImage: "calendar")
                    .font(.caption2)
                    .foregroundColor(Theme.mutedColor)
                Spacer()
                if request.priority > 0 {
                    Label(request.priority == 1 ? "High" : "Urgent", systemImage: "exclamationmark.triangle.fill")
                        .font(.caption2)
                        .foregroundColor(request.priority == 2 ? Theme.alertColor : .orange)
                }
                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundColor(Theme.mutedColor)
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}
