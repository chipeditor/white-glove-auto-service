import SwiftUI

struct NotificationCenterView: View {
    @EnvironmentObject var authService: AuthService
    @State private var notifications: [Notification] = []
    @State private var selectedTab = 0
    @State private var isLoading = true

    private let tabs = ["All", "Unread", "Updates", "Alerts"]

    private var filteredNotifications: [Notification] {
        switch selectedTab {
        case 1: return notifications.filter { !$0.read }
        case 2: return notifications.filter {
            [.intakeStarted, .intakeCompleted, .serviceStarted, .serviceCompleted, .vehicleDelivered].contains($0.type)
        }
        case 3: return notifications.filter {
            [.issueFlagged, .approvalNeeded, .approvalReceived].contains($0.type)
        }
        default: return notifications
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack(spacing: 0) {
                    ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                        Button {
                            withAnimation { selectedTab = index }
                        } label: {
                            VStack(spacing: 8) {
                                Text(tab)
                                    .font(.subheadline.weight(selectedTab == index ? .semibold : .regular))
                                    .foregroundColor(selectedTab == index ? Theme.textColor : Theme.text2Color)
                                Rectangle()
                                    .fill(selectedTab == index ? Theme.goldColor : .clear)
                                    .frame(height: 2)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .padding(.top, 8)
                .background(Theme.cardColor)

                if isLoading {
                    LoadingView()
                } else if filteredNotifications.isEmpty {
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
                        .foregroundColor(Theme.goldColor)
                }
            }
            .task {
                await loadNotifications()
            }
        }
    }

    private func loadNotifications() async {
        isLoading = true
        defer { isLoading = false }
        guard let userId = authService.currentUser?.id else { return }
        do {
            notifications = try await authService.dataProvider.fetchNotifications(userId: userId)
        } catch {
            notifications = []
        }
    }
}

// MARK: - Notification Row

private struct NotificationRow: View {
    let notification: Notification

    private var iconName: String {
        switch notification.type {
        case .intakeStarted, .intakeCompleted: return "arrow.triangle.2.circlepath"
        case .issueFlagged: return "exclamationmark.triangle.fill"
        case .approvalNeeded, .approvalReceived: return "hand.thumbsup.fill"
        case .serviceStarted, .serviceCompleted: return "wrench.and.screwdriver.fill"
        case .deliveryReady, .vehicleDelivered: return "checkmark.seal.fill"
        case .reportReady: return "doc.text.fill"
        }
    }

    private var iconColor: Color {
        switch notification.type {
        case .intakeStarted, .intakeCompleted, .serviceStarted: return Theme.blueColor
        case .issueFlagged: return Theme.alertColor
        case .approvalNeeded, .approvalReceived: return .orange
        case .serviceCompleted, .deliveryReady, .vehicleDelivered: return Theme.greenColor
        case .reportReady: return Theme.text2Color
        }
    }

    private var timeAgo: String {
        notification.createdAt.formatted(.relative(presentation: .named))
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
                        .foregroundColor(notification.read ? Theme.text2Color : Theme.textColor)
                    Spacer()
                    if !notification.read {
                        Circle()
                            .fill(Theme.goldColor)
                            .frame(width: 8, height: 8)
                    }
                }

                Text(notification.body)
                    .font(.caption)
                    .foregroundColor(Theme.text2Color)
                    .lineLimit(2)

                Text(timeAgo)
                    .font(.caption2)
                    .foregroundColor(Theme.mutedColor)
            }
        }
        .padding()
        .background(notification.read ? Theme.cardColor : Theme.cardColor.opacity(0.8))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(notification.read ? Theme.borderColor : Theme.goldColor.opacity(0.2), lineWidth: 1)
        )
    }
}

#Preview {
    NotificationCenterView()
        .environmentObject(AuthService())
}
