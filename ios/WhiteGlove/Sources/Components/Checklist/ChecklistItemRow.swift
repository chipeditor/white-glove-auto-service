import SwiftUI

struct ChecklistItemRow: View {
    let item: ChecklistItem
    var onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 14) {
                Image(systemName: item.completed ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(item.completed ? .green : .secondary)

                Text(item.label)
                    .font(.subheadline)
                    .foregroundColor(item.completed ? .secondary : .white)
                    .strikethrough(item.completed, color: .secondary)

                Spacer()
            }
            .padding()
            .background(Theme.cardColor)
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}
