import SwiftUI

struct StatusBadge: View {
    let status: VehicleStatus

    private var color: Color {
        Color(hex: status.statusColor)
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
        case .draft: return Theme.mutedColor
        case .submitted, .awaitingCustomerApproval: return .orange
        case .approved: return Theme.blueColor
        case .declined: return Theme.alertColor
        case .inProgress, .qualityControl: return Theme.blueColor
        case .readyForDelivery: return Theme.greenColor
        case .completed: return Theme.greenColor
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
