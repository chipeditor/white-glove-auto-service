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
                    // Greeting
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back,")
                                .font(.subheadline)
                                .foregroundColor(Theme.text2Color)
                            Text(authService.currentUser?.fullName ?? "Team")
                                .font(.title2.bold())
                                .foregroundColor(Theme.textColor)
                        }
                        Spacer()
                        Image(systemName: "person.circle.fill")
                            .font(.title)
                            .foregroundColor(Theme.goldColor)
                    }
                    .padding(.horizontal)

                    // Stat Cards
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12),
                    ], spacing: 12) {
                        ForEach(Array(stats.enumerated()), id: \.offset) { _, stat in
                            StatCard(
                                title: stat.title,
                                value: stat.value,
                                icon: stat.icon,
                                color: stat.color
                            )
                        }
                    }
                    .padding(.horizontal)

                    // Recent Vehicles
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Vehicles")
                                .font(.headline)
                                .foregroundColor(Theme.textColor)
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
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await authService.signOut() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(Theme.text2Color)
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

// MARK: - Stat Card

private struct StatCard: View {
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
                .foregroundColor(Theme.textColor)
            Text(title)
                .font(.caption)
                .foregroundColor(Theme.text2Color)
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.borderColor, lineWidth: 1)
        )
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthService())
}
