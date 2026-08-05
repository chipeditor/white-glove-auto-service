import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authService: AuthService
    @State private var vehicles: [Vehicle] = []
    @State private var isLoading = true

    private var stats: [(title: String, value: String, icon: String, color: Color)] {
        let inService = vehicles.filter { $0.status == .inService }.count
        let ready = vehicles.filter { $0.status == .readyForDelivery }.count
        let awaiting = vehicles.filter { $0.status == .awaitingApproval }.count
        return [
            ("In Service", "\(inService)", "wrench.and.screwdriver.fill", Theme.blueColor),
            ("Ready", "\(ready)", "checkmark.circle.fill", Theme.greenColor),
            ("Awaiting", "\(awaiting)", "clock.fill", .orange),
            ("Total", "\(vehicles.count)", "car.fill", Theme.goldColor),
        ]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back,")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.5))
                            Text(authService.currentUser?.fullName ?? "Team")
                                .font(.title2.bold())
                                .foregroundColor(.white.opacity(0.95))
                        }
                        Spacer()
                        Image(systemName: "person.circle.fill")
                            .font(.title)
                            .foregroundColor(Theme.goldColor)
                    }
                    .padding(.horizontal)

                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 10),
                        GridItem(.flexible(), spacing: 10),
                    ], spacing: 10) {
                        ForEach(Array(stats.enumerated()), id: \.offset) { _, stat in
                            GlassStatCard(
                                title: stat.title,
                                value: stat.value,
                                icon: stat.icon,
                                color: stat.color
                            )
                        }
                    }
                    .padding(.horizontal)

                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Vehicles")
                                .font(.headline)
                                .foregroundColor(.white.opacity(0.9))
                            Spacer()
                            NavigationLink {
                                VehicleListView()
                            } label: {
                                Text("See All")
                                    .font(.subheadline)
                                    .foregroundColor(Theme.goldColor)
                            }
                        }
                        .padding(.horizontal)

                        if isLoading {
                            LoadingView()
                                .frame(height: 200)
                        } else {
                            ForEach(vehicles.prefix(5)) { vehicle in
                                NavigationLink {
                                    VehicleDetailView(vehicle: vehicle)
                                } label: {
                                    VehicleCard(vehicle: vehicle)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
            }
            .background(
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await authService.signOut() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
            }
            .task {
                await loadVehicles()
            }
        }
    }

    private func loadVehicles() async {
        isLoading = true
        defer { isLoading = false }
        do {
            vehicles = try await authService.dataProvider.fetchVehicles(
                organizationId: authService.organizationId
            )
        } catch {
            vehicles = []
        }
    }
}

// MARK: - Glass Stat Card

private struct GlassStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }
            Text(value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.white.opacity(0.95))
            Text(title)
                .font(.caption)
                .foregroundColor(.white.opacity(0.5))
        }
        .glassCard()
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthService())
}
