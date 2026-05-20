import SwiftUI

struct NotificationCenterView: View {
    @State private var selectedTab = 0
    private let tabs = ["All", "Unread", "Updates", "Alerts"]

    private var filteredNotifications: [MockNotification] {
        switch selectedTab {
        case 1: return MockNotification.samples.filter { !$0.isRead }
        case 2: return MockNotification.samples.filter { $0.type == .update || $0.type == .completion }
        case 3: return MockNotification.samples.filter { $0.type == .alert || $0.type == .approval }
        default: return MockNotification.samples
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                HStack(spacing: 0) {
                    ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                        Button {
                            withAnimation { selectedTab = index }
                        } label: {
                            VStack(spacing: 8) {
                                Text(tab)
                                    .font(.subheadline.weight(selectedTab == index ? .semibold : .regular))
                                    .foregroundColor(selectedTab == index ? .white : .secondary)
                                Rectangle()
                                    .fill(selectedTab == index ? Theme.accentColor : .clear)
                                    .frame(height: 2)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .padding(.top, 8)
                .background(Theme.cardColor)

                if filteredNotifications.isEmpty {
                    EmptyStateView(
                        icon: "bell.slash.fill",
                        title: "No Notifications",
                        message: "You're all caught up!"
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(filteredNotifications) { notification in
                                NotificationRow(notification: notification)
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Notifications")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Mark All Read") {}
                        .font(.caption)
                }
            }
        }
    }
}

// MARK: - Notification Row

private struct NotificationRow: View {
    let notification: MockNotification

    private var iconName: String {
        switch notification.type {
        case .update: return "arrow.triangle.2.circlepath"
        case .alert: return "exclamationmark.triangle.fill"
        case .approval: return "hand.thumbsup.fill"
        case .completion: return "checkmark.seal.fill"
        }
    }

    private var iconColor: Color {
        switch notification.type {
        case .update: return Theme.accentColor
        case .alert: return Theme.alertColor
        case .approval: return .orange
        case .completion: return .green
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: iconName)
                .font(.title3)
                .foregroundColor(iconColor)
                .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(notification.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(notification.isRead ? .secondary : .white)
                    Spacer()
                    if !notification.isRead {
                        Circle()
                            .fill(Theme.accentColor)
                            .frame(width: 8, height: 8)
                    }
                }

                Text(notification.body)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                Text(notification.timeAgo)
                    .font(.caption2)
                    .foregroundColor(.secondary.opacity(0.7))
            }
        }
        .padding()
        .background(notification.isRead ? Theme.cardColor : Theme.cardColor.opacity(0.8))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(notification.isRead ? .clear : Theme.accentColor.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Mock Data

struct MockNotification: Identifiable {
    let id = UUID()
    let type: NotificationType
    let title: String
    let body: String
    let isRead: Bool
    let timeAgo: String

    static let samples: [MockNotification] = [
        .init(type: .approval, title: "Approval Requested", body: "2024 Mercedes S 580 service estimate requires customer approval.", isRead: false, timeAgo: "5m ago"),
        .init(type: .alert, title: "Inspection Finding", body: "Critical brake wear detected on 2023 BMW 750i during pre-delivery inspection.", isRead: false, timeAgo: "22m ago"),
        .init(type: .update, title: "Status Update", body: "Porsche Cayenne has been moved to Ready for Delivery.", isRead: false, timeAgo: "1h ago"),
        .init(type: .completion, title: "Service Complete", body: "Full detail and ceramic coating completed on 2024 Range Rover.", isRead: true, timeAgo: "3h ago"),
        .init(type: .update, title: "New Vehicle Intake", body: "2024 Audi RS7 has been checked in by Mike T.", isRead: true, timeAgo: "5h ago"),
        .init(type: .approval, title: "Estimate Approved", body: "Customer approved $2,450 service estimate for BMW 750i.", isRead: true, timeAgo: "1d ago"),
    ]
}

#Preview {
    NotificationCenterView()
}
