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

            VehicleListView()
                .tabItem {
                    Label("Vehicles", systemImage: "car.fill")
                }

            ServiceRequestListView()
                .tabItem {
                    Label("Work Orders", systemImage: "wrench.and.screwdriver.fill")
                }

            IntakeWizardView()
                .tabItem {
                    Label("Intake", systemImage: "plus.circle.fill")
                }

            NotificationCenterView()
                .tabItem {
                    Label("Notifications", systemImage: "bell.fill")
                }
        }
        .tint(Theme.goldColor)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService())
}
