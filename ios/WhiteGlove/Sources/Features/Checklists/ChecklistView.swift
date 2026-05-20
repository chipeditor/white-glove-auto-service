import SwiftUI

struct ChecklistView: View {
    let title: String
    @State private var items: [MockChecklistItem]

    init(title: String = "Service Checklist", items: [MockChecklistItem] = MockChecklistItem.sampleItems) {
        self.title = title
        self._items = State(initialValue: items)
    }

    private var completedCount: Int {
        items.filter(\.isCompleted).count
    }

    private var progress: Double {
        guard !items.isEmpty else { return 0 }
        return Double(completedCount) / Double(items.count)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Progress Header
            VStack(spacing: 12) {
                HStack {
                    Text("\(completedCount) of \(items.count) completed")
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

            // Checklist Items
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                        ChecklistItemRow(item: item) {
                            withAnimation(.spring(response: 0.3)) {
                                items[index].isCompleted.toggle()
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationTitle(title)
    }
}

// MARK: - Mock Data

struct MockChecklistItem: Identifiable {
    let id = UUID()
    let label: String
    var isCompleted: Bool

    static let sampleItems: [MockChecklistItem] = [
        .init(label: "Exterior wash completed", isCompleted: true),
        .init(label: "Interior vacuum and wipe down", isCompleted: true),
        .init(label: "All fluids topped off", isCompleted: true),
        .init(label: "Tire pressure checked and adjusted", isCompleted: false),
        .init(label: "Battery tested", isCompleted: false),
        .init(label: "Brake inspection", isCompleted: false),
        .init(label: "Alignment check", isCompleted: false),
        .init(label: "A/C system tested", isCompleted: false),
        .init(label: "All lights functioning", isCompleted: false),
        .init(label: "Windshield wipers replaced if needed", isCompleted: false),
        .init(label: "Final quality review", isCompleted: false),
        .init(label: "Customer notification sent", isCompleted: false),
    ]
}

#Preview {
    NavigationStack {
        ChecklistView()
    }
}
