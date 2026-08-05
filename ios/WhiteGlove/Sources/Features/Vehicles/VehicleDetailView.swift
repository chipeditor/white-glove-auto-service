import SwiftUI

struct VehicleDetailView: View {
    let vehicle: Vehicle
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab = 0
    @State private var inspections: [Inspection] = []
    @State private var serviceRequests: [ServiceRequest] = []
    @State private var mediaAssets: [MediaAsset] = []

    private let tabs = ["Overview", "Inspections", "Service", "Checklists", "Delivery", "Files", "History"]

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(vehicle.displayName)
                            .font(.title2.bold())
                        if let color = vehicle.color {
                            Text(color)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                    StatusBadge(status: vehicle.status)
                }

                HStack(spacing: 24) {
                    if let vin = vehicle.vin {
                        Label(String(vin.suffix(8)), systemImage: "barcode")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if let mileage = vehicle.mileage {
                        Label("\(mileage.formatted()) mi", systemImage: "gauge.with.needle")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if let plate = vehicle.licensePlate {
                        Label(plate, systemImage: "rectangle.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Theme.cardColor)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                        Button {
                            withAnimation { selectedTab = index }
                        } label: {
                            VStack(spacing: 8) {
                                Text(tab)
                                    .font(.subheadline.weight(selectedTab == index ? .semibold : .regular))
                                    .foregroundColor(selectedTab == index ? Theme.textColor : Theme.text2Color)
                                Rectangle()
                                    .fill(selectedTab == index ? Theme.goldColor : .clear)
                                    .frame(height: 2)
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.top, 8)
            }
            .background(Theme.cardColor)

            Group {
                switch selectedTab {
                case 0: OverviewTab(vehicle: vehicle, onRefresh: loadData)
                case 1: InspectionsTab(inspections: inspections, vehicleId: vehicle.id, organizationId: vehicle.organizationId, onRefresh: loadData)
                case 2: ServiceTab(serviceRequests: serviceRequests, onRefresh: loadData)
                case 3: ChecklistView(vehicleId: vehicle.id)
                case 4: DeliveryChecklistView(vehicle: vehicle)
                case 5: FilesTab(mediaAssets: mediaAssets, onRefresh: loadData)
                case 6: HistoryTab(vehicleId: vehicle.id)
                default: OverviewTab(vehicle: vehicle, onRefresh: loadData)
                }
            }
            .frame(maxHeight: .infinity)
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    private func loadData() async {
        do {
            async let i = authService.dataProvider.fetchInspections(vehicleId: vehicle.id)
            async let s = authService.dataProvider.fetchServiceRequests(organizationId: vehicle.organizationId)
            async let m = authService.dataProvider.fetchMediaAssets(vehicleId: vehicle.id)
            inspections = try await i
            let allRequests = try await s
            serviceRequests = allRequests.filter { $0.vehicleId == vehicle.id }
            mediaAssets = try await m
        } catch {}
    }
}

// MARK: - Tab Views

private struct OverviewTab: View {
    let vehicle: Vehicle
    let onRefresh: () async -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                InfoRow(label: "Year", value: vehicle.year.map { "\($0)" } ?? "N/A")
                InfoRow(label: "Make", value: vehicle.make)
                InfoRow(label: "Model", value: vehicle.model)
                InfoRow(label: "Color", value: vehicle.color ?? "N/A")
                InfoRow(label: "VIN", value: vehicle.vin ?? "N/A")
                InfoRow(label: "License Plate", value: vehicle.licensePlate ?? "N/A")
                InfoRow(label: "Mileage", value: vehicle.mileage.map { "\($0.formatted()) mi" } ?? "N/A")

                if let notes = vehicle.notes {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes")
                            .font(.headline)
                        Text(notes)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Theme.cardColor)
                    .cornerRadius(12)
                }
            }
            .padding()
        }
        .refreshable { await onRefresh() }
    }
}

private struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}

private struct InspectionsTab: View {
    let inspections: [Inspection]
    let vehicleId: UUID
    let organizationId: UUID
    let onRefresh: () async -> Void

    var body: some View {
        if inspections.isEmpty {
            EmptyStateView(icon: "doc.text.fill", title: "No Inspections", message: "No inspections have been created for this vehicle.")
        } else {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(inspections) { inspection in
                        NavigationLink {
                            InspectionView(inspectionId: inspection.id, vehicleId: vehicleId, organizationId: organizationId)
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(inspection.type.rawValue.capitalized.replacingOccurrences(of: "_", with: " "))
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundColor(.white)
                                    Text(inspection.createdAt.formatted(date: .abbreviated, time: .omitted))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text(inspection.status.rawValue.capitalized.replacingOccurrences(of: "_", with: " "))
                                    .font(.caption2.weight(.bold))
                                    .textCase(.uppercase)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(inspectionStatusColor(inspection.status).opacity(0.15))
                                    .foregroundColor(inspectionStatusColor(inspection.status))
                                    .cornerRadius(6)
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Theme.cardColor)
                            .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
            .refreshable { await onRefresh() }
        }
    }

    private func inspectionStatusColor(_ status: InspectionStatus) -> Color {
        switch status {
        case .notStarted: return .secondary
        case .inProgress: return .orange
        case .completed, .signedOff: return .green
        case .needsAttention: return .red
        }
    }
}

private struct ServiceTab: View {
    let serviceRequests: [ServiceRequest]
    let onRefresh: () async -> Void

    var body: some View {
        if serviceRequests.isEmpty {
            EmptyStateView(icon: "wrench.and.screwdriver.fill", title: "No Service Requests", message: "No service requests for this vehicle.")
        } else {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(serviceRequests) { request in
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(request.title)
                                    .font(.subheadline.weight(.semibold))
                                if let desc = request.description {
                                    Text(desc)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .lineLimit(2)
                                }
                            }
                            Spacer()
                            ServiceStatusBadge(status: request.status)
                        }
                        .padding()
                        .background(Theme.cardColor)
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .refreshable { await onRefresh() }
        }
    }
}

private struct FilesTab: View {
    let mediaAssets: [MediaAsset]
    let onRefresh: () async -> Void

    private let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
    ]

    var body: some View {
        if mediaAssets.isEmpty {
            EmptyStateView(icon: "photo.on.rectangle.angled", title: "No Files", message: "Photos and documents will appear here after upload.")
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("\(mediaAssets.count) file\(mediaAssets.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    LazyVGrid(columns: columns, spacing: 8) {
                        ForEach(mediaAssets) { asset in
                            AsyncImage(url: URL(string: asset.url)) { phase in
                                switch phase {
                                case .success(let image):
                                    image
                                        .resizable()
                                        .aspectRatio(1, contentMode: .fill)
                                        .clipped()
                                case .failure:
                                    Rectangle()
                                        .fill(Theme.cardColor)
                                        .aspectRatio(1, contentMode: .fit)
                                        .overlay {
                                            Image(systemName: "exclamationmark.triangle")
                                                .foregroundColor(.secondary)
                                        }
                                default:
                                    Rectangle()
                                        .fill(Theme.cardColor)
                                        .aspectRatio(1, contentMode: .fit)
                                        .overlay {
                                            ProgressView()
                                        }
                                }
                            }
                            .cornerRadius(8)
                        }
                    }
                }
                .padding()
            }
            .refreshable { await onRefresh() }
        }
    }
}

private struct HistoryTab: View {
    let vehicleId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var events: [AuditEvent] = []
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                LoadingView()
            } else if events.isEmpty {
                EmptyStateView(icon: "clock.fill", title: "No History", message: "No activity recorded for this vehicle yet.")
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(Array(events.enumerated()), id: \.element.id) { index, event in
                            HStack(alignment: .top, spacing: 12) {
                                VStack(spacing: 0) {
                                    Circle()
                                        .fill(Color(hex: event.action.color))
                                        .frame(width: 32, height: 32)
                                        .overlay {
                                            Image(systemName: event.action.icon)
                                                .font(.system(size: 14))
                                                .foregroundColor(.white)
                                        }
                                    if index < events.count - 1 {
                                        Rectangle()
                                            .fill(Theme.borderColor)
                                            .frame(width: 2)
                                            .frame(maxHeight: .infinity)
                                    }
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(event.action.displayName)
                                        .font(.subheadline.weight(.semibold))
                                    Text(eventDetail(event))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(event.createdAt.formatted(date: .abbreviated, time: .shortened))
                                        .font(.caption2)
                                        .foregroundColor(Theme.mutedColor)
                                }
                                .padding(.bottom, 20)

                                Spacer()
                            }
                        }
                    }
                    .padding()
                }
                .refreshable { await loadEvents() }
            }
        }
        .task { await loadEvents() }
    }

    private func loadEvents() async {
        isLoading = true
        defer { isLoading = false }
        do {
            events = try await authService.dataProvider.fetchAuditEvents(
                entityType: "vehicle", entityId: vehicleId
            )
        } catch {
            events = []
        }
    }

    private func eventDetail(_ event: AuditEvent) -> String {
        if let changes = event.changes {
            if let from = changes["from"]?.value as? String,
               let to = changes["to"]?.value as? String {
                let clean: (String) -> String = { $0.replacingOccurrences(of: "_", with: " ").capitalized }
                return "\(clean(from)) → \(clean(to))"
            }
        }
        if let metadata = event.metadata {
            let parts = metadata.compactMap { key, val -> String? in
                guard let s = val.value as? String else { return nil }
                return "\(key): \(s)"
            }
            if !parts.isEmpty { return parts.joined(separator: ", ") }
        }
        return event.entityType.capitalized
    }
}
