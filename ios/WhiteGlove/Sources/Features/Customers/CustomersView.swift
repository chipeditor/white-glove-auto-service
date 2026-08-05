import SwiftUI

struct CustomersView: View {
    @EnvironmentObject var authService: AuthService
    @State private var customers: [Customer] = []
    @State private var vehicles: [Vehicle] = []
    @State private var isLoading = true
    @State private var searchText = ""

    var filtered: [Customer] {
        if searchText.isEmpty { return customers }
        let q = searchText.lowercased()
        return customers.filter {
            $0.fullName.lowercased().contains(q) ||
            ($0.phone?.contains(q) ?? false) ||
            ($0.email?.lowercased().contains(q) ?? false)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()

                if isLoading {
                    ProgressView().tint(Theme.goldColor)
                } else if filtered.isEmpty {
                    EmptyStateView(
                        icon: "person.2.fill",
                        title: searchText.isEmpty ? "No Customers" : "No Results",
                        message: searchText.isEmpty ? "Customers will appear here after intake." : "No customers match your search."
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(filtered) { customer in
                                NavigationLink {
                                    CustomerDetailView(customer: customer, vehicles: vehicles.filter { $0.customerId == customer.id })
                                } label: {
                                    customerCard(customer)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                    .refreshable { await loadData() }
                }
            }
            .navigationTitle("Customers")
            .searchable(text: $searchText, prompt: "Search by name, phone, or email")
            .task { await loadData() }
        }
    }

    func customerCard(_ customer: Customer) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Theme.goldColor.opacity(0.12))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(String(customer.fullName.prefix(1)))
                        .font(.headline)
                        .foregroundColor(Theme.goldColor)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(customer.fullName)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.9))
                if let phone = customer.phone {
                    Text(phone)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                if let email = customer.email {
                    Text(email)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.35))
                }
            }

            Spacer()

            let vehicleCount = vehicles.filter { $0.customerId == customer.id }.count
            if vehicleCount > 0 {
                Text("\(vehicleCount)")
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.06))
                    .foregroundColor(.white.opacity(0.5))
                    .clipShape(Capsule())
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.white.opacity(0.25))
        }
        .glassCard(padding: 12)
    }

    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let c = authService.dataProvider.fetchCustomers(organizationId: authService.organizationId)
            async let v = authService.dataProvider.fetchVehicles(organizationId: authService.organizationId)
            customers = try await c
            vehicles = try await v
        } catch {}
    }
}

struct CustomerDetailView: View {
    let customer: Customer
    let vehicles: [Vehicle]

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    if let email = customer.email {
                        Label(email, systemImage: "envelope.fill")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.85))
                    }
                    if let phone = customer.phone {
                        Label(phone, systemImage: "phone.fill")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.85))
                    }
                    Label("Since \(customer.createdAt.formatted(date: .abbreviated, time: .omitted))", systemImage: "calendar")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.35))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .glassCard()

                if !vehicles.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Vehicles")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.9))

                        ForEach(vehicles) { vehicle in
                            NavigationLink {
                                VehicleDetailView(vehicle: vehicle)
                            } label: {
                                VehicleCard(vehicle: vehicle)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding()
        }
        .background(
            LinearGradient(
                colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                startPoint: .top, endPoint: .bottom
            ).ignoresSafeArea()
        )
        .navigationTitle(customer.fullName)
        .navigationBarTitleDisplayMode(.inline)
    }
}
