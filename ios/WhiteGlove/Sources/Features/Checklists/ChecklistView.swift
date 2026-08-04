import SwiftUI

struct ChecklistView: View {
    let vehicleId: UUID
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

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 12) {
                HStack {
                    Text("\(completedCount) of \(allItems.count) completed")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(Int(progress * 100))%")
                        .font(.subheadline.weight(.bold))
                        .foregroundColor(progress == 1.0 ? .green : Theme.accentColor)
                }

                ProgressView(value: progress)
                    .tint(progress == 1.0 ? .green : Theme.accentColor)
                    .scaleEffect(y: 2)
            }
            .padding()
            .background(Theme.cardColor)

            if isLoading {
                LoadingView()
            } else if checklists.isEmpty {
                EmptyStateView(icon: "checklist", title: "No Checklists", message: "No checklists have been created for this vehicle yet.")
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(checklists) { checklist in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(checklist.title)
                                    .font(.headline)
                                    .padding(.horizontal)

                                ForEach(checklist.items ?? []) { item in
                                    ChecklistItemRow(item: item) {
                                        Task { await toggleItem(item) }
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationTitle("Checklists")
        .task { await loadChecklists() }
    }

    private func loadChecklists() async {
        isLoading = true
        defer { isLoading = false }
        do {
            checklists = try await authService.dataProvider.fetchChecklists(vehicleId: vehicleId)
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
}
