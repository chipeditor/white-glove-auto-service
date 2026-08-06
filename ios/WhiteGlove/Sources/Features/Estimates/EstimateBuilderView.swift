import SwiftUI

struct EstimateBuilderView: View {
    @EnvironmentObject var authService: AuthService
    let serviceRequest: ServiceRequest

    @State private var lineItems: [RepairOrderLine] = []
    @State private var cannedJobs: [CannedJob] = []
    @State private var isLoading = true
    @State private var showAddSheet = false
    @State private var showCannedJobPicker = false
    @State private var pendingDeletion: RepairOrderLine?

    var subtotal: Double {
        lineItems.reduce(0) { $0 + $1.total }
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                startPoint: .top, endPoint: .bottom
            ).ignoresSafeArea()

            if isLoading {
                ProgressView().tint(Theme.goldColor)
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        summaryCard

                        ForEach(lineItems) { item in
                            lineItemCard(item)
                        }

                        if lineItems.isEmpty {
                            EmptyStateView(
                                icon: "doc.text",
                                title: "No Line Items",
                                message: "Add labor, parts, or use a canned job template."
                            )
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Estimate")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        showAddSheet = true
                    } label: {
                        Label("Add Line Item", systemImage: "plus")
                    }
                    Button {
                        showCannedJobPicker = true
                    } label: {
                        Label("From Template", systemImage: "doc.on.doc")
                    }
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(Theme.goldColor)
                }
            }
        }
        .sheet(isPresented: $showAddSheet) {
            AddLineItemSheet(serviceRequest: serviceRequest) { newItem in
                lineItems.append(newItem)
            }
        }
        .sheet(isPresented: $showCannedJobPicker) {
            CannedJobPickerSheet(cannedJobs: cannedJobs, serviceRequest: serviceRequest) { newItem in
                lineItems.append(newItem)
            }
        }
        .task { await loadData() }
        .confirmationDialog(
            "Remove this line item?",
            isPresented: .init(
                get: { pendingDeletion != nil },
                set: { if !$0 { pendingDeletion = nil } }
            ),
            titleVisibility: .visible
        ) {
            if let item = pendingDeletion {
                Button("Delete \(item.description)", role: .destructive) {
                    Task { await deleteItem(item) }
                }
            }
            Button("Cancel", role: .cancel) { pendingDeletion = nil }
        }
        .refreshable { await loadData() }
    }

    var summaryCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Estimate Total")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
                Text("$\(subtotal, specifier: "%.2f")")
                    .font(.title.weight(.bold).monospacedDigit())
                    .foregroundColor(Theme.goldColor)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(lineItems.count) items")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
                Text(serviceRequest.status.displayName)
                    .font(.caption.weight(.medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Theme.goldColor.opacity(0.12))
                    .foregroundColor(Theme.goldColor)
                    .clipShape(Capsule())
            }
        }
        .glassCard(padding: 16)
    }

    func lineItemCard(_ item: RepairOrderLine) -> some View {
        HStack(spacing: 12) {
            VStack {
                Image(systemName: lineItemIcon(item.lineType))
                    .font(.title3)
                    .foregroundColor(lineItemColor(item.lineType))
            }
            .frame(width: 36)

            VStack(alignment: .leading, spacing: 4) {
                Text(item.description)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.9))
                HStack(spacing: 8) {
                    Text(item.lineType.rawValue.capitalized)
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.5))
                    if item.quantity != 1 {
                        Text("× \(item.quantity, specifier: "%.0f")")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.35))
                    }
                    Text(item.status.displayName)
                        .font(.caption2.weight(.medium))
                        .foregroundColor(.white.opacity(0.5))
                }
            }

            Spacer()

            Text("$\(item.total, specifier: "%.2f")")
                .font(.subheadline.weight(.semibold).monospacedDigit())
                .foregroundColor(.white.opacity(0.9))

            // A visible control rather than .swipeActions, which only fires
            // inside a List and this card is laid out in a ScrollView.
            Button {
                pendingDeletion = item
            } label: {
                Image(systemName: "trash")
                    .font(.footnote)
                    .foregroundColor(Color(hex: Theme.alert).opacity(0.8))
                    .frame(width: 32, height: 32)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Delete \(item.description)")
        }
        .glassCard(padding: 12)
    }

    func lineItemIcon(_ type: LineItemType) -> String {
        switch type {
        case .labor: return "wrench.fill"
        case .parts: return "gearshape.fill"
        case .sublet: return "arrow.triangle.branch"
        case .fee: return "dollarsign.circle.fill"
        case .discount: return "tag.fill"
        }
    }

    func lineItemColor(_ type: LineItemType) -> Color {
        switch type {
        case .labor: return Color(hex: Theme.blue)
        case .parts: return Theme.goldColor
        case .sublet: return Color(hex: "#e87040")
        case .fee: return .white.opacity(0.5)
        case .discount: return Color(hex: Theme.green)
        }
    }

    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let items = authService.dataProvider.fetchLineItems(serviceRequestId: serviceRequest.id)
            async let jobs = authService.dataProvider.fetchCannedJobs(organizationId: authService.organizationId)
            lineItems = try await items
            cannedJobs = try await jobs
        } catch {}
    }

    func deleteItem(_ item: RepairOrderLine) async {
        do {
            try await authService.dataProvider.deleteLineItem(id: item.id)
            lineItems.removeAll { $0.id == item.id }
        } catch {}
    }
}

// MARK: - Add Line Item Sheet

struct AddLineItemSheet: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    let serviceRequest: ServiceRequest
    let onAdd: (RepairOrderLine) -> Void

    @State private var lineType: LineItemType = .labor
    @State private var description = ""
    @State private var quantity = "1"
    @State private var unitPrice = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Picker("Type", selection: $lineType) {
                    ForEach(LineItemType.allCases, id: \.self) { type in
                        Text(type.rawValue.capitalized).tag(type)
                    }
                }

                TextField("Description", text: $description)
                TextField("Quantity", text: $quantity)
                    .keyboardType(.decimalPad)
                TextField("Unit Price", text: $unitPrice)
                    .keyboardType(.decimalPad)

                if let qty = Double(quantity), let price = Double(unitPrice) {
                    HStack {
                        Text("Total")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("$\(qty * price, specifier: "%.2f")")
                            .fontWeight(.semibold)
                    }
                }
            }
            .navigationTitle("Add Line Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task { await save() }
                    }
                    .disabled(description.isEmpty || unitPrice.isEmpty || isSaving)
                }
            }
        }
    }

    func save() async {
        isSaving = true
        defer { isSaving = false }
        guard let qty = Double(quantity), let price = Double(unitPrice) else { return }
        do {
            let item = try await authService.dataProvider.createLineItem(
                serviceRequestId: serviceRequest.id,
                organizationId: authService.organizationId,
                lineType: lineType,
                description: description,
                quantity: qty,
                unitPrice: price
            )
            onAdd(item)
            dismiss()
        } catch {}
    }
}

// MARK: - Canned Job Picker

struct CannedJobPickerSheet: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    let cannedJobs: [CannedJob]
    let serviceRequest: ServiceRequest
    let onAdd: (RepairOrderLine) -> Void

    var grouped: [CannedJobCategory: [CannedJob]] {
        Dictionary(grouping: cannedJobs, by: \.category)
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(grouped.sorted(by: { $0.key.rawValue < $1.key.rawValue }), id: \.key) { category, jobs in
                    Section(category.rawValue) {
                        ForEach(jobs) { job in
                            Button {
                                Task { await addFromJob(job) }
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(job.name)
                                            .font(.subheadline.weight(.medium))
                                        if let desc = job.description {
                                            Text(desc)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    Spacer()
                                    Text("$\(job.totalEstimate, specifier: "%.0f")")
                                        .font(.subheadline.weight(.semibold).monospacedDigit())
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Service Templates")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    func addFromJob(_ job: CannedJob) async {
        do {
            let item = try await authService.dataProvider.createLineItem(
                serviceRequestId: serviceRequest.id,
                organizationId: authService.organizationId,
                lineType: .labor,
                description: job.name,
                quantity: job.laborHours,
                unitPrice: job.laborRate
            )
            onAdd(item)
            dismiss()
        } catch {}
    }
}
