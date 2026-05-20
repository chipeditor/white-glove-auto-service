import SwiftUI

struct DeliveryChecklistView: View {
    let vehicle: Vehicle
    @State private var items: [MockChecklistItem] = MockChecklistItem.deliveryItems

    private var completedCount: Int {
        items.filter(\.isCompleted).count
    }

    private var progress: Double {
        guard !items.isEmpty else { return 0 }
        return Double(completedCount) / Double(items.count)
    }

    private var isReadyForDelivery: Bool {
        progress == 1.0
    }

    var body: some View {
        VStack(spacing: 0) {
            // Vehicle Header
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

            // Progress
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: isReadyForDelivery ? "checkmark.seal.fill" : "clock.fill")
                        .foregroundColor(isReadyForDelivery ? .green : .orange)
                    Text(isReadyForDelivery ? "Ready for Delivery" : "Pre-Delivery Checklist")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Text("\(completedCount)/\(items.count)")
                        .font(.caption.weight(.bold))
                        .foregroundColor(.secondary)
                }

                ProgressView(value: progress)
                    .tint(isReadyForDelivery ? .green : Theme.accentColor)
                    .scaleEffect(y: 2)
            }
            .padding()
            .background(Theme.cardColor.opacity(0.5))

            // Checklist
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

            // Deliver Button
            if isReadyForDelivery {
                Button {
                    // Mark as delivered
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
    }
}

extension MockChecklistItem {
    static let deliveryItems: [MockChecklistItem] = [
        .init(label: "Final exterior wash and dry", isCompleted: false),
        .init(label: "Interior detail and vacuum", isCompleted: false),
        .init(label: "Glass cleaned inside and out", isCompleted: false),
        .init(label: "Tire dressing applied", isCompleted: false),
        .init(label: "All personal items returned", isCompleted: false),
        .init(label: "Paperwork prepared", isCompleted: false),
        .init(label: "Keys and fobs accounted for", isCompleted: false),
        .init(label: "Walk-around photos taken", isCompleted: false),
        .init(label: "Customer notified of pickup time", isCompleted: false),
        .init(label: "Final quality sign-off", isCompleted: false),
    ]
}

#Preview {
    NavigationStack {
        DeliveryChecklistView(vehicle: Vehicle.mockList[1])
    }
}
