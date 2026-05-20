import SwiftUI

struct StatusBadge: View {
    let status: VehicleStatus

    private var color: Color {
        switch status {
        case .intake: return .blue
        case .inService: return .orange
        case .readyForDelivery: return .green
        case .delivered: return .secondary
        case .awaitingApproval: return .yellow
        }
    }

    var body: some View {
        Text(status.displayName)
            .font(.caption2.weight(.bold))
            .textCase(.uppercase)
            .tracking(0.5)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .cornerRadius(6)
    }
}

struct ServiceStatusBadge: View {
    let status: ServiceRequestStatus

    private var color: Color {
        switch status {
        case .pending: return .orange
        case .approved: return .blue
        case .inProgress: return Theme.accentColor
        case .completed: return .green
        case .cancelled: return .secondary
        }
    }

    var body: some View {
        Text(status.displayName)
            .font(.caption2.weight(.bold))
            .textCase(.uppercase)
            .tracking(0.5)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .cornerRadius(6)
    }
}

#Preview {
    VStack(spacing: 12) {
        ForEach(VehicleStatus.allCases, id: \.self) { status in
            StatusBadge(status: status)
        }
    }
    .padding()
    .background(Theme.bgColor)
}
