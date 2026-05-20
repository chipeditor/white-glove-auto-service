import SwiftUI

struct VehicleListView: View {
    @State private var searchText = ""
    @State private var selectedStatus: VehicleStatus?

    private var filteredVehicles: [Vehicle] {
        var vehicles = Vehicle.mockList
        if let status = selectedStatus {
            vehicles = vehicles.filter { $0.status == status }
        }
        if !searchText.isEmpty {
            vehicles = vehicles.filter {
                $0.displayName.localizedCaseInsensitiveContains(searchText)
                || ($0.vin ?? "").localizedCaseInsensitiveContains(searchText)
                || ($0.licensePlate ?? "").localizedCaseInsensitiveContains(searchText)
            }
        }
        return vehicles
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

                if filteredVehicles.isEmpty {
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
                .background(isSelected ? Theme.accentColor : Theme.cardColor)
                .foregroundColor(isSelected ? .white : .secondary)
                .cornerRadius(20)
        }
    }
}

#Preview {
    VehicleListView()
}
