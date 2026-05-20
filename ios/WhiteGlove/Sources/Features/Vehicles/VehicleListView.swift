import SwiftUI

struct VehicleListView: View {
    @EnvironmentObject var authService: AuthService
    @State private var vehicles: [Vehicle] = []
    @State private var searchText = ""
    @State private var selectedStatus: VehicleStatus?
    @State private var isLoading = true

    private var filteredVehicles: [Vehicle] {
        var result = vehicles
        if let status = selectedStatus {
            result = result.filter { $0.status == status }
        }
        if !searchText.isEmpty {
            result = result.filter {
                $0.displayName.localizedCaseInsensitiveContains(searchText)
                || ($0.vin ?? "").localizedCaseInsensitiveContains(searchText)
                || ($0.licensePlate ?? "").localizedCaseInsensitiveContains(searchText)
            }
        }
        return result
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Status Filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: "All", isSelected: selectedStatus == nil) {
                            selectedStatus = nil
                        }
                        ForEach(VehicleStatus.allCases, id: \.self) { status in
                            FilterChip(title: status.displayName, isSelected: selectedStatus == status) {
                                selectedStatus = status
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                if isLoading {
                    LoadingView()
                } else if filteredVehicles.isEmpty {
                    EmptyStateView(
                        icon: "car.fill",
                        title: "No Vehicles Found",
                        message: "No vehicles match your current filters."
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredVehicles) { vehicle in
                                NavigationLink {
                                    VehicleDetailView(vehicle: vehicle)
                                } label: {
                                    VehicleCard(vehicle: vehicle)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Vehicles")
            .searchable(text: $searchText, prompt: "Search vehicles...")
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

// MARK: - Filter Chip

private struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.medium))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(isSelected ? Theme.goldColor : Theme.cardColor)
                .foregroundColor(isSelected ? Color(hex: Theme.background) : Theme.text2Color)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isSelected ? .clear : Theme.borderColor, lineWidth: 1)
                )
        }
    }
}

#Preview {
    VehicleListView()
        .environmentObject(AuthService())
}
