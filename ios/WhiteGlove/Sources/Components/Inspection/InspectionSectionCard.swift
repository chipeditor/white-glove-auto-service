import SwiftUI

struct InspectionSectionCard: View {
    let name: String
    let itemCount: Int
    let completedCount: Int
    let status: InspectionStatus

    private var progress: Double {
        guard itemCount > 0 else { return 0 }
        return Double(completedCount) / Double(itemCount)
    }

    private var statusIcon: String {
        switch status {
        case .notStarted: return "circle"
        case .inProgress: return "circle.lefthalf.filled"
        case .completed, .signedOff: return "checkmark.circle.fill"
        case .needsAttention: return "exclamationmark.triangle.fill"
        }
    }

    private var statusColor: Color {
        switch status {
        case .notStarted: return .secondary
        case .inProgress: return .orange
        case .completed, .signedOff: return .green
        case .needsAttention: return .red
        }
    }

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: statusIcon)
                .font(.title2)
                .foregroundColor(statusColor)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 6) {
                Text(name)
                    .font(.subheadline.weight(.semibold))

                ProgressView(value: progress)
                    .tint(statusColor)

                Text("\(completedCount) of \(itemCount) items")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}

#Preview {
    VStack(spacing: 12) {
        InspectionSectionCard(name: "Exterior", itemCount: 12, completedCount: 8, status: .inProgress)
        InspectionSectionCard(name: "Interior", itemCount: 10, completedCount: 10, status: .completed)
        InspectionSectionCard(name: "Engine Bay", itemCount: 8, completedCount: 0, status: .notStarted)
    }
    .padding()
    .background(Theme.bgColor)
}
