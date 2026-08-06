import SwiftUI

struct ServiceRequestDetailView: View {
    let serviceRequestId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var sr: ServiceRequest?
    @State private var vehicle: Vehicle?
    @State private var staff: [User] = []
    @State private var isLoading = true
    @State private var showStatusPicker = false
    @State private var isUpdatingStatus = false
    @State private var statusError: String?

    var technicianName: String? {
        guard let techId = sr?.technicianId else { return nil }
        return staff.first(where: { $0.id == techId })?.fullName
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView().tint(Theme.goldColor)
            } else if let sr {
                ScrollView {
                    VStack(spacing: 12) {
                        headerCard(sr)
                        statusAdvanceSection(sr)
                        techActionsGrid(sr)
                        statusProgressCard(sr)
                        if let vehicle { vehicleCard(vehicle) }
                        detailsCard(sr)
                    }
                    .padding()
                }
                .refreshable { await loadData() }
            } else {
                EmptyStateView(
                    icon: "exclamationmark.triangle",
                    title: "Not Found",
                    message: "Could not load this service request."
                )
            }
        }
        .background(
            LinearGradient(
                colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                startPoint: .top, endPoint: .bottom
            ).ignoresSafeArea()
        )
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .alert("Could Not Update Status", isPresented: .init(
            get: { statusError != nil },
            set: { if !$0 { statusError = nil } }
        )) {
            Button("OK") { statusError = nil }
        } message: {
            Text(statusError ?? "")
        }
    }

    private func loadData() async {
        do {
            async let srResult = authService.dataProvider.fetchServiceRequest(id: serviceRequestId)
            async let staffResult = authService.dataProvider.fetchStaff(organizationId: authService.organizationId)
            sr = try await srResult
            staff = try await staffResult
            if let vehicleId = sr?.vehicleId {
                vehicle = try await authService.dataProvider.fetchVehicle(id: vehicleId)
            }
        } catch {}
        isLoading = false
    }

    // MARK: - Header

    @ViewBuilder
    private func headerCard(_ sr: ServiceRequest) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(sr.title)
                    .font(.title3.bold())
                    .foregroundColor(.white.opacity(0.95))
                    .lineLimit(2)
                Spacer()
                ServiceStatusBadge(status: sr.status)
            }
            if let desc = sr.description {
                Text(desc)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.5))
            }
            HStack(spacing: 10) {
                Image(systemName: "person.badge.wrench")
                    .font(.subheadline)
                    .foregroundColor(Theme.goldColor)
                Text(technicianName ?? "Unassigned")
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(technicianName != nil ? .white.opacity(0.85) : .white.opacity(0.35))
                Spacer()
                if let phase = sr.phase {
                    Text(phase.displayName)
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color(hex: phase.color).opacity(0.2))
                        .foregroundColor(Color(hex: phase.color))
                        .clipShape(Capsule())
                }
                if let health = sr.healthStatus {
                    Circle()
                        .fill(Color(hex: health.color))
                        .frame(width: 8, height: 8)
                }
            }
        }
        .glassCard()
    }

    // MARK: - Status advance

    @ViewBuilder
    private func statusAdvanceSection(_ sr: ServiceRequest) -> some View {
        let nextOptions = nextStatuses(from: sr.status)
        if let primary = nextOptions.first {
            Button {
                showStatusPicker = true
            } label: {
                StatusAdvanceButton(label: "Move to \(primary.displayName)")
            }
            .disabled(isUpdatingStatus)
            .confirmationDialog("Update Status", isPresented: $showStatusPicker) {
                ForEach(nextOptions, id: \.self) { status in
                    Button(status.displayName) {
                        Task { await advance(to: status) }
                    }
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private func advance(to status: ServiceRequestStatus) async {
        isUpdatingStatus = true
        defer { isUpdatingStatus = false }
        do {
            try await authService.dataProvider.updateServiceRequestStatus(id: serviceRequestId, status: status)
            await loadData()
        } catch {
            statusError = error.localizedDescription
        }
    }

    // MARK: - Tech actions grid

    @ViewBuilder
    private func techActionsGrid(_ sr: ServiceRequest) -> some View {
        if let vehicle {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                NavigationLink {
                    RepairOrderView(serviceRequest: sr)
                } label: {
                    TechActionButton(
                        icon: "wrench.and.screwdriver.fill",
                        label: "Repair Order",
                        iconColor: Theme.goldColor,
                        isProminent: true
                    )
                }

                NavigationLink {
                    EstimateBuilderView(serviceRequest: sr)
                } label: {
                    TechActionButton(
                        icon: "doc.text.fill",
                        label: "Estimate",
                        iconColor: Theme.blueColor
                    )
                }

                NavigationLink {
                    VehicleInspectionsView(vehicle: vehicle)
                } label: {
                    TechActionButton(
                        icon: "checklist.checked",
                        label: "Inspections",
                        iconColor: Theme.blueColor
                    )
                }

                NavigationLink {
                    ChecklistView(vehicleId: vehicle.id)
                } label: {
                    TechActionButton(
                        icon: "list.bullet.clipboard",
                        label: "Checklists",
                        iconColor: Theme.greenColor
                    )
                }

                NavigationLink {
                    VehicleDetailView(vehicle: vehicle)
                } label: {
                    TechActionButton(
                        icon: "camera.fill",
                        label: "Photos",
                        iconColor: Color(hex: "#e87040")
                    )
                }
            }
        }
    }

    // MARK: - Status progress

    @ViewBuilder
    private func statusProgressCard(_ sr: ServiceRequest) -> some View {
        let steps: [ServiceRequestStatus] = [
            .draft, .submitted, .awaitingCustomerApproval, .approved,
            .inProgress, .qualityControl, .readyForDelivery, .completed,
        ]
        let currentIdx = steps.firstIndex(of: sr.status) ?? -1

        VStack(spacing: 8) {
            HStack(spacing: 3) {
                ForEach(Array(steps.enumerated()), id: \.offset) { i, _ in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(
                            i <= currentIdx
                                ? LinearGradient(colors: [Theme.goldColor, Color(hex: "#d4b876")], startPoint: .leading, endPoint: .trailing)
                                : LinearGradient(colors: [Color.white.opacity(0.06)], startPoint: .leading, endPoint: .trailing)
                        )
                        .frame(height: 4)
                }
            }
            HStack {
                Text(sr.status.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(Theme.goldColor)
                Spacer()
                Text("Step \(currentIdx + 1) of \(steps.count)")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.3))
            }
        }
        .glassCard(padding: 12)
    }

    // MARK: - Vehicle

    @ViewBuilder
    private func vehicleCard(_ vehicle: Vehicle) -> some View {
        NavigationLink {
            VehicleDetailView(vehicle: vehicle)
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "car.fill")
                    .font(.title3)
                    .foregroundColor(Theme.goldColor)
                VStack(alignment: .leading, spacing: 2) {
                    Text(vehicle.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white.opacity(0.9))
                    if let vin = vehicle.vin {
                        Text("VIN: \(String(vin.suffix(8)))")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.35))
                    }
                }
                Spacer()
                if let mileage = vehicle.mileage {
                    Text("\(mileage.formatted()) mi")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.25))
            }
        }
        .glassCard()
    }

    // MARK: - Details

    @ViewBuilder
    private func detailsCard(_ sr: ServiceRequest) -> some View {
        VStack(spacing: 12) {
            GlassDetailRow(label: "Priority", value: sr.priority == 0 ? "Normal" : sr.priority == 1 ? "High" : "Urgent")
            GlassDetailRow(label: "Created", value: sr.createdAt.formatted(date: .abbreviated, time: .shortened))
            if let est = sr.estimatedCompletion {
                GlassDetailRow(label: "Est. Completion", value: est.formatted(date: .abbreviated, time: .shortened))
            }
            if let promised = sr.promisedAt {
                GlassDetailRow(label: "Promised By", value: promised.formatted(date: .abbreviated, time: .shortened))
            }
            if let actual = sr.actualCompletion {
                GlassDetailRow(label: "Completed", value: actual.formatted(date: .abbreviated, time: .shortened))
            }
            if let subtotal = sr.subtotal, subtotal > 0 {
                GlassDetailRow(label: "Subtotal", value: String(format: "$%.2f", subtotal))
            }
        }
        .glassCard()
    }

    private func nextStatuses(from current: ServiceRequestStatus) -> [ServiceRequestStatus] {
        switch current {
        case .draft: return [.submitted]
        case .submitted: return [.approved, .awaitingCustomerApproval]
        case .awaitingCustomerApproval: return [.approved, .declined]
        case .approved: return [.inProgress]
        case .inProgress: return [.qualityControl, .readyForDelivery]
        case .qualityControl: return [.readyForDelivery]
        case .readyForDelivery: return [.completed]
        default: return []
        }
    }
}

// MARK: - Vehicle Inspections List

struct VehicleInspectionsView: View {
    @EnvironmentObject var authService: AuthService
    let vehicle: Vehicle
    @State private var inspections: [Inspection] = []
    @State private var isLoading = true

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                startPoint: .top, endPoint: .bottom
            ).ignoresSafeArea()

            if isLoading {
                ProgressView().tint(Theme.goldColor)
            } else if inspections.isEmpty {
                EmptyStateView(
                    icon: "checklist.checked",
                    title: "No Inspections",
                    message: "No inspections have been created for this vehicle."
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(inspections) { inspection in
                            NavigationLink {
                                InspectionView(inspectionId: inspection.id, vehicleId: vehicle.id, organizationId: vehicle.organizationId)
                            } label: {
                                HStack {
                                    Image(systemName: "clipboard.fill")
                                        .foregroundColor(Theme.goldColor)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(inspection.type.rawValue.capitalized.replacingOccurrences(of: "_", with: " "))
                                            .font(.subheadline.weight(.medium))
                                            .foregroundColor(.white.opacity(0.9))
                                        Text(inspection.status.rawValue.capitalized.replacingOccurrences(of: "_", with: " "))
                                            .font(.caption)
                                            .foregroundColor(.white.opacity(0.5))
                                    }
                                    Spacer()
                                    Text(inspection.createdAt.formatted(date: .abbreviated, time: .omitted))
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.35))
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.25))
                                }
                            }
                            .buttonStyle(.plain)
                            .glassCard(padding: 12)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Inspections")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            isLoading = true
            defer { isLoading = false }
            do {
                inspections = try await authService.dataProvider.fetchInspections(vehicleId: vehicle.id)
            } catch {}
        }
    }
}

// MARK: - Detail Row

private struct GlassDetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.4))
            Spacer()
            Text(value)
                .font(.subheadline.weight(.medium))
                .foregroundColor(.white.opacity(0.85))
        }
    }
}
