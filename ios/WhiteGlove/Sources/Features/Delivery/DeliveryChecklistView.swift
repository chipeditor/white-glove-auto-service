import SwiftUI

struct DeliveryChecklistView: View {
    let vehicle: Vehicle
    @EnvironmentObject var authService: AuthService
    @State private var checklists: [Checklist] = []
    @State private var isLoading = true

    private var allItems: [ChecklistItem] {
        checklists.flatMap { $0.items ?? [] }
    }

    private var completedCount: Int {
        allItems.filter(\.completed).count
    }

    private var progress: Double {
        guard !allItems.isEmpty else { return 0 }
        return Double(completedCount) / Double(allItems.count)
    }

    private var isReadyForDelivery: Bool {
        !allItems.isEmpty && progress == 1.0
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.displayName)
                        .font(.headline)
                    if let color = vehicle.color {
                        Text(color)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                StatusBadge(status: vehicle.status)
            }
            .padding()
            .background(Theme.cardColor)

            VStack(spacing: 12) {
                HStack {
                    Image(systemName: isReadyForDelivery ? "checkmark.seal.fill" : "clock.fill")
                        .foregroundColor(isReadyForDelivery ? .green : .orange)
                    Text(isReadyForDelivery ? "Ready for Delivery" : "Pre-Delivery Checklist")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Text("\(completedCount)/\(allItems.count)")
                        .font(.caption.weight(.bold))
                        .foregroundColor(.secondary)
                }

                ProgressView(value: progress)
                    .tint(isReadyForDelivery ? .green : Theme.accentColor)
                    .scaleEffect(y: 2)
            }
            .padding()
            .background(Theme.cardColor.opacity(0.5))

            if isLoading {
                LoadingView()
            } else if allItems.isEmpty {
                EmptyStateView(icon: "checklist", title: "No Checklist", message: "No delivery checklist has been created for this vehicle yet.")
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(allItems) { item in
                            ChecklistItemRow(item: item) {
                                Task { await toggleItem(item) }
                            }
                        }
                    }
                    .padding()
                }
            }

            if isReadyForDelivery {
                Button {
                    Task { await markDelivered() }
                } label: {
                    HStack {
                        Image(systemName: "hand.thumbsup.fill")
                        Text("Mark as Delivered")
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .padding()
            }
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationTitle("Delivery")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadChecklists() }
    }

    private func loadChecklists() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let all = try await authService.dataProvider.fetchChecklists(vehicleId: vehicle.id)
            checklists = all.filter { $0.type == "delivery" }
        } catch {
            checklists = []
        }
    }

    private func toggleItem(_ item: ChecklistItem) async {
        do {
            try await authService.dataProvider.updateChecklistItem(id: item.id, completed: !item.completed)
            await loadChecklists()
        } catch {}
    }

    private func markDelivered() async {
        do {
            try await authService.dataProvider.updateVehicleStatus(id: vehicle.id, status: .delivered)
        } catch {}
    }
}
