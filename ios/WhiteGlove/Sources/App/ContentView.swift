import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService

    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
    }
}

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService

    /// Technicians open onto their own queue; everyone else onto the dashboard.
    private var isTechnician: Bool {
        authService.currentUser?.role == .technician
    }

    @State private var selection = 0
    @State private var pickedInitialTab = false

    var body: some View {
        TabView(selection: $selection) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2.fill")
                }
                .tag(0)

            MyWorkView()
                .tabItem {
                    Label("My Work", systemImage: "hammer.fill")
                }
                .tag(1)

            ScheduleView()
                .tabItem {
                    Label("Schedule", systemImage: "calendar")
                }
                .tag(2)

            ServiceRequestListView()
                .tabItem {
                    Label("Work Orders", systemImage: "wrench.and.screwdriver.fill")
                }
                .tag(3)

            CustomersView()
                .tabItem {
                    Label("Customers", systemImage: "person.2.fill")
                }
                .tag(4)

            SettingsView()
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
                .tag(5)
        }
        .tint(Theme.goldColor)
        .task {
            // Only choose the landing tab once, so it never yanks the tech
            // away from a tab they navigated to themselves.
            guard !pickedInitialTab, authService.currentUser != nil else { return }
            pickedInitialTab = true
            if isTechnician { selection = 1 }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService())
}
