import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authService: AuthService

    // Mock data for scaffold
    private let stats: [(title: String, value: String, icon: String, color: Color)] = [
        ("In Service", "12", "wrench.and.screwdriver.fill", Theme.accentColor),
        ("Ready", "5", "checkmark.circle.fill", .green),
        ("Awaiting", "3", "clock.fill", .orange),
        ("This Week", "8", "calendar.badge.checkmark", Theme.accentColor),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Greeting
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back,")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Text(authService.currentUser?.fullName ?? "Team")
                                .font(.title2.bold())
                        }
                        Spacer()
                        Image(systemName: "person.circle.fill")
                            .font(.title)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)

                    // Stat Cards
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 16),
                        GridItem(.flexible(), spacing: 16),
                    ], spacing: 16) {
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
                            Spacer()
                            NavigationLink {
                                VehicleListView()
                            } label: {
                                Text("See All")
                                    .font(.subheadline)
                                    .foregroundColor(Theme.accentColor)
                            }
                        }
                        .padding(.horizontal)

                        ForEach(Vehicle.mockList) { vehicle in
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
                    }
                }
            }
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
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(16)
    }
}

// MARK: - Mock Data

extension Vehicle {
    static let mockList: [Vehicle] = [
        Vehicle(
            id: UUID(), organizationId: UUID(), customerId: UUID(),
            vin: "1HGBH41JXMN109186", year: 2024, make: "Mercedes-Benz", model: "S 580",
            color: "Black", licensePlate: "WG-001", mileage: 12500,
            status: .inService, notes: nil,
            createdAt: Date(), updatedAt: Date()
        ),
        Vehicle(
            id: UUID(), organizationId: UUID(), customerId: UUID(),
            vin: "5YJSA1E26MF123456", year: 2023, make: "BMW", model: "750i",
            color: "Alpine White", licensePlate: "WG-002", mileage: 8300,
            status: .readyForDelivery, notes: nil,
            createdAt: Date(), updatedAt: Date()
        ),
        Vehicle(
            id: UUID(), organizationId: UUID(), customerId: UUID(),
            vin: "WAUZZZ8V8KA012345", year: 2024, make: "Porsche", model: "Cayenne",
            color: "Meteor Grey", licensePlate: "WG-003", mileage: 3100,
            status: .awaitingApproval, notes: nil,
            createdAt: Date(), updatedAt: Date()
        ),
    ]
}

#Preview {
    DashboardView()
        .environmentObject(AuthService())
}
