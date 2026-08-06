import SwiftUI

/// The technician's working view of a repair order.
///
/// Deliberately not the estimate builder: a tech cares about *what work is on
/// this car and what's left*, not pricing. Money is collapsed to a single
/// footer line so the job list stays the focus.
struct RepairOrderView: View {
    let serviceRequest: ServiceRequest
    @EnvironmentObject var authService: AuthService

    @State private var lines: [RepairOrderLine] = []
    @State private var vehicle: Vehicle?
    @State private var isLoading = true
    @State private var updatingLineIds: Set<UUID> = []
    @State private var errorMessage: String?
    @State private var showAdvancePrompt = false

    private var workLines: [RepairOrderLine] {
        // Fees and discounts are billing artifacts, not work to perform.
        lines.filter { $0.lineType != .fee && $0.lineType != .discount }
            .sorted { $0.sortOrder < $1.sortOrder }
    }

    private var completedCount: Int {
        workLines.filter { $0.status == .completed }.count
    }

    private var allWorkDone: Bool {
        !workLines.isEmpty && completedCount == workLines.count
    }

    private var progress: Double {
        workLines.isEmpty ? 0 : Double(completedCount) / Double(workLines.count)
    }

    private var total: Double {
        lines.reduce(0) { $0 + $1.total }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if isLoading {
                    ProgressView().tint(Theme.goldColor).padding(.top, 60)
                } else {
                    headerCard
                    progressCard
                    if workLines.isEmpty {
                        emptyWorkCard
                    } else {
                        ForEach(workLines) { line in
                            lineRow(line)
                        }
                    }
                    totalsFooter
                }
            }
            .padding()
        }
        .background(
            LinearGradient(
                colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                startPoint: .top, endPoint: .bottom
            ).ignoresSafeArea()
        )
        .navigationTitle("Repair Order")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await loadData() }
        .task { await loadData() }
        .alert("Could Not Update", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .confirmationDialog(
            "All work is complete. Move this job to Quality Control?",
            isPresented: $showAdvancePrompt,
            titleVisibility: .visible
        ) {
            Button("Move to Quality Control") {
                Task { await advanceToQC() }
            }
            Button("Not Yet", role: .cancel) {}
        }
    }

    // MARK: - Header

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle?.displayName ?? "Vehicle")
                        .font(.title3.weight(.semibold))
                        .foregroundColor(.white.opacity(0.95))
                    Text(serviceRequest.title)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.55))
                }
                Spacer()
                ServiceStatusBadge(status: serviceRequest.status)
            }

            if let vin = vehicle?.vin, !vin.isEmpty {
                Label("VIN \(String(vin.suffix(8)))", systemImage: "number")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.4))
            }

            if let promised = serviceRequest.promisedAt {
                Label("Promised \(promised.formatted(date: .abbreviated, time: .shortened))",
                      systemImage: "clock.fill")
                    .font(.caption.weight(.medium))
                    .foregroundColor(promised < Date() ? Color(hex: Theme.alert) : Theme.goldColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard(padding: 16)
    }

    // MARK: - Progress

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Work Progress")
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.85))
                Spacer()
                Text("\(completedCount) of \(workLines.count)")
                    .font(.subheadline.weight(.semibold).monospacedDigit())
                    .foregroundColor(allWorkDone ? Color(hex: Theme.green) : Theme.goldColor)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.08))
                    Capsule()
                        .fill(allWorkDone ? Color(hex: Theme.green) : Theme.goldColor)
                        .frame(width: max(0, geo.size.width * progress))
                        .animation(.easeInOut(duration: 0.25), value: progress)
                }
            }
            .frame(height: 8)
        }
        .glassCard(padding: 16)
    }

    private var emptyWorkCard: some View {
        VStack(spacing: 8) {
            Image(systemName: "wrench.and.screwdriver")
                .font(.title2)
                .foregroundColor(.white.opacity(0.3))
            Text("No work items yet")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.6))
            Text("Labor and parts added to this job will appear here.")
                .font(.caption)
                .foregroundColor(.white.opacity(0.35))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .glassCard(padding: 24)
    }

    // MARK: - Line row

    private func lineRow(_ line: RepairOrderLine) -> some View {
        let isDone = line.status == .completed
        let isBusy = updatingLineIds.contains(line.id)

        return HStack(spacing: 12) {
            // Large tap target — techs use this with gloves on.
            Button {
                Task { await toggle(line) }
            } label: {
                ZStack {
                    Circle()
                        .strokeBorder(
                            isDone ? Color(hex: Theme.green) : Color.white.opacity(0.25),
                            lineWidth: 2
                        )
                        .background(Circle().fill(isDone ? Color(hex: Theme.green).opacity(0.15) : .clear))
                        .frame(width: 30, height: 30)
                    if isBusy {
                        ProgressView().scaleEffect(0.7).tint(Theme.goldColor)
                    } else if isDone {
                        Image(systemName: "checkmark")
                            .font(.subheadline.weight(.bold))
                            .foregroundColor(Color(hex: Theme.green))
                    }
                }
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(isBusy)
            .accessibilityLabel(isDone ? "Mark \(line.description) not done" : "Mark \(line.description) done")

            VStack(alignment: .leading, spacing: 3) {
                Text(line.description)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(isDone ? 0.45 : 0.92))
                    .strikethrough(isDone, color: .white.opacity(0.35))

                HStack(spacing: 8) {
                    Label(line.lineType.rawValue.capitalized, systemImage: iconFor(line.lineType))
                        .font(.caption2)
                        .foregroundColor(colorFor(line.lineType).opacity(0.9))

                    if line.quantity != 1 {
                        Text("× \(line.quantity, specifier: "%.0f")")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.35))
                    }

                    if let parts = line.partsStatus, parts != .notNeeded, parts != .installed {
                        Text(parts.displayName)
                            .font(.caption2.weight(.medium))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: Theme.alert).opacity(0.15))
                            .foregroundColor(Color(hex: Theme.alert))
                            .clipShape(Capsule())
                    }
                }
            }

            Spacer()

            Text("$\(line.total, specifier: "%.2f")")
                .font(.caption.monospacedDigit())
                .foregroundColor(.white.opacity(0.4))
        }
        .glassCard(padding: 12)
        .opacity(isDone ? 0.75 : 1)
    }

    private var totalsFooter: some View {
        HStack {
            Text("Order Total")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.5))
            Spacer()
            Text("$\(total, specifier: "%.2f")")
                .font(.headline.monospacedDigit())
                .foregroundColor(.white.opacity(0.85))
        }
        .glassCard(padding: 16)
    }

    private func iconFor(_ type: LineItemType) -> String {
        switch type {
        case .labor: return "wrench.fill"
        case .parts: return "gearshape.fill"
        case .sublet: return "arrow.triangle.branch"
        case .fee: return "dollarsign.circle.fill"
        case .discount: return "tag.fill"
        }
    }

    private func colorFor(_ type: LineItemType) -> Color {
        switch type {
        case .labor: return Color(hex: Theme.blue)
        case .parts: return Theme.goldColor
        case .sublet: return Color(hex: "#e87040")
        case .fee: return .white.opacity(0.5)
        case .discount: return Color(hex: Theme.green)
        }
    }

    // MARK: - Actions

    private func toggle(_ line: RepairOrderLine) async {
        let next: LineItemStatus = line.status == .completed ? .inProgress : .completed
        updatingLineIds.insert(line.id)
        defer { updatingLineIds.remove(line.id) }

        do {
            try await authService.dataProvider.updateLineItemStatus(id: line.id, status: next)
            lines = try await authService.dataProvider.fetchLineItems(serviceRequestId: serviceRequest.id)
            if allWorkDone, serviceRequest.status == .inProgress {
                showAdvancePrompt = true
            }
        } catch {
            errorMessage = AuthService.describe(error)
        }
    }

    private func advanceToQC() async {
        do {
            try await authService.dataProvider.updateServiceRequestStatus(
                id: serviceRequest.id, status: .qualityControl
            )
        } catch {
            errorMessage = AuthService.describe(error)
        }
    }

    private func loadData() async {
        do {
            async let lineResult = authService.dataProvider.fetchLineItems(serviceRequestId: serviceRequest.id)
            async let vehicleResult = authService.dataProvider.fetchVehicle(id: serviceRequest.vehicleId)
            lines = try await lineResult
            vehicle = try await vehicleResult
        } catch {
            errorMessage = AuthService.describe(error)
        }
        isLoading = false
    }
}
