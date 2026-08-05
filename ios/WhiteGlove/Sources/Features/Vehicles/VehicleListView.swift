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
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        GlassFilterChip(title: "All", isSelected: selectedStatus == nil) {
                            selectedStatus = nil
                        }
                        ForEach(VehicleStatus.allCases, id: \.self) { status in
                            GlassFilterChip(title: status.displayName, isSelected: selectedStatus == status) {
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
                        LazyVStack(spacing: 10) {
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
            .background(
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("Vehicles")
            .searchable(text: $searchText, prompt: "Search vehicles...")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink {
                        IntakeWizardView()
                    } label: {
                        Image(systemName: "plus")
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

// MARK: - Glass Filter Chip

private struct GlassFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(isSelected ? .semibold : .medium))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    isSelected
                        ? AnyShapeStyle(.ultraThinMaterial)
                        : AnyShapeStyle(Color.clear)
                )
                .background(isSelected ? Theme.goldColor.opacity(0.1) : Color.white.opacity(0.03))
                .foregroundColor(isSelected ? Theme.goldColor : .white.opacity(0.45))
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Theme.goldColor.opacity(0.25) : Color.white.opacity(0.06), lineWidth: 1)
                )
        }
    }
}

#Preview {
    VehicleListView()
        .environmentObject(AuthService())
}
