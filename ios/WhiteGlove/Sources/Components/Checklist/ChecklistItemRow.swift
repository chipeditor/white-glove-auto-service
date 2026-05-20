import SwiftUI

struct ChecklistItemRow: View {
    let item: MockChecklistItem
    var onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 14) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(item.isCompleted ? .green : .secondary)

                Text(item.label)
                    .font(.subheadline)
                    .foregroundColor(item.isCompleted ? .secondary : .white)
                    .strikethrough(item.isCompleted, color: .secondary)

                Spacer()
            }
            .padding()
            .background(Theme.cardColor)
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    VStack(spacing: 8) {
        ChecklistItemRow(item: .init(label: "Exterior wash completed", isCompleted: true)) {}
        ChecklistItemRow(item: .init(label: "Interior vacuum and wipe down", isCompleted: false)) {}
    }
    .padding()
    .background(Theme.bgColor)
}
