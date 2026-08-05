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

    private var unreadCount: Int {
        notifications.filter { !$0.read }.count
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
                                HStack(spacing: 4) {
                                    Text(tab)
                                        .font(.subheadline.weight(selectedTab == index ? .semibold : .regular))
                                        .foregroundColor(selectedTab == index ? Theme.textColor : Theme.text2Color)
                                    if index == 1 && unreadCount > 0 {
                                        Text("\(unreadCount)")
                                            .font(.caption2.weight(.bold))
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 5)
                                            .padding(.vertical, 1)
                                            .background(Theme.alertColor)
                                            .cornerRadius(8)
                                    }
                                }
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
                                if let vehicleId = notification.vehicleId {
                                    NavigationLink {
                                        VehicleDetailLoader(vehicleId: vehicleId)
                                    } label: {
                                        NotificationRow(notification: notification)
                                    }
                                    .buttonStyle(.plain)
                                    .simultaneousGesture(TapGesture().onEnded {
                                        if !notification.read {
                                            Task { await markRead(notification) }
                                        }
                                    })
                                } else {
                                    NotificationRow(notification: notification)
                                        .onTapGesture {
                                            if !notification.read {
                                                Task { await markRead(notification) }
                                            }
                                        }
                                }
                            }
                        }
                        .padding()
                    }
                    .refreshable { await loadNotifications() }
                }
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Notifications")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Mark All Read") {
                        Task { await markAllRead() }
                    }
                    .font(.caption)
                    .foregroundColor(Theme.goldColor)
                    .disabled(unreadCount == 0)
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

    private func markRead(_ notification: Notification) async {
        try? await authService.dataProvider.markNotificationRead(id: notification.id)
        if let idx = notifications.firstIndex(where: { $0.id == notification.id }) {
            let old = notifications[idx]
            notifications[idx] = Notification(
                id: old.id, userId: old.userId, type: old.type,
                title: old.title, body: old.body, read: true,
                vehicleId: old.vehicleId, createdAt: old.createdAt
            )
        }
    }

    private func markAllRead() async {
        guard let userId = authService.currentUser?.id else { return }
        try? await authService.dataProvider.markAllNotificationsRead(userId: userId)
        notifications = notifications.map {
            Notification(id: $0.id, userId: $0.userId, type: $0.type,
                         title: $0.title, body: $0.body, read: true,
                         vehicleId: $0.vehicleId, createdAt: $0.createdAt)
        }
    }
}

// MARK: - Vehicle Detail Loader

private struct VehicleDetailLoader: View {
    let vehicleId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var vehicle: Vehicle?
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                LoadingView()
            } else if let vehicle {
                VehicleDetailView(vehicle: vehicle)
            } else {
                EmptyStateView(icon: "car.fill", title: "Not Found", message: "Vehicle could not be loaded.")
            }
        }
        .task {
            isLoading = true
            defer { isLoading = false }
            vehicle = try? await authService.dataProvider.fetchVehicle(id: vehicleId)
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
                    .multilineTextAlignment(.leading)

                HStack(spacing: 4) {
                    Text(timeAgo)
                        .font(.caption2)
                        .foregroundColor(Theme.mutedColor)
                    if notification.vehicleId != nil {
                        Spacer()
                        HStack(spacing: 2) {
                            Text("View")
                                .font(.caption2)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 8))
                        }
                        .foregroundColor(Theme.goldColor)
                    }
                }
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
