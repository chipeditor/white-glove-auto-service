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
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2.fill")
                }

            ScheduleView()
                .tabItem {
                    Label("Schedule", systemImage: "calendar")
                }

            ServiceRequestListView()
                .tabItem {
                    Label("Work Orders", systemImage: "wrench.and.screwdriver.fill")
                }

            CustomersView()
                .tabItem {
                    Label("Customers", systemImage: "person.2.fill")
                }

            SettingsView()
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
        }
        .tint(Theme.goldColor)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService())
}
