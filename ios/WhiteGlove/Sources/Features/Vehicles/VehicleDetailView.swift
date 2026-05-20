import SwiftUI

struct VehicleDetailView: View {
    let vehicle: Vehicle
    @State private var selectedTab = 0

    private let tabs = ["Overview", "Intake", "Inspections", "Service", "Checklists", "Files", "History"]

    var body: some View {
        VStack(spacing: 0) {
            // Vehicle Header
            VStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(vehicle.displayName)
                            .font(.title2.bold())
                        if let color = vehicle.color {
                            Text(color)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                    StatusBadge(status: vehicle.status)
                }

                HStack(spacing: 24) {
                    if let vin = vehicle.vin {
                        Label(String(vin.suffix(8)), systemImage: "barcode")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if let mileage = vehicle.mileage {
                        Label("\(mileage.formatted()) mi", systemImage: "gauge.with.needle")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if let plate = vehicle.licensePlate {
                        Label(plate, systemImage: "rectangle.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Theme.cardColor)

            // Tab Selector
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                        Button {
                            withAnimation { selectedTab = index }
                        } label: {
                            VStack(spacing: 8) {
                                Text(tab)
                                    .font(.subheadline.weight(selectedTab == index ? .semibold : .regular))
                                    .foregroundColor(selectedTab == index ? Theme.textColor : Theme.text2Color)
                                Rectangle()
                                    .fill(selectedTab == index ? Theme.goldColor : .clear)
                                    .frame(height: 2)
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.top, 8)
            }
            .background(Theme.cardColor)

            // Tab Content
            TabView(selection: $selectedTab) {
                OverviewTab(vehicle: vehicle).tag(0)
                IntakeTab().tag(1)
                InspectionsTab().tag(2)
                ServiceTab().tag(3)
                ChecklistsTab().tag(4)
                FilesTab().tag(5)
                HistoryTab().tag(6)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Tab Views

private struct OverviewTab: View {
    let vehicle: Vehicle

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                InfoRow(label: "Year", value: vehicle.year.map { "\($0)" } ?? "N/A")
                InfoRow(label: "Make", value: vehicle.make)
                InfoRow(label: "Model", value: vehicle.model)
                InfoRow(label: "Color", value: vehicle.color ?? "N/A")
                InfoRow(label: "VIN", value: vehicle.vin ?? "N/A")
                InfoRow(label: "License Plate", value: vehicle.licensePlate ?? "N/A")
                InfoRow(label: "Mileage", value: vehicle.mileage.map { "\($0.formatted()) mi" } ?? "N/A")

                if let notes = vehicle.notes {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes")
                            .font(.headline)
                        Text(notes)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Theme.cardColor)
                    .cornerRadius(12)
                }
            }
            .padding()
        }
    }
}

private struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}

private struct IntakeTab: View {
    var body: some View {
        EmptyStateView(icon: "doc.text.fill", title: "Intake Details", message: "Intake information will appear here.")
    }
}

private struct InspectionsTab: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                InspectionSectionCard(name: "Exterior", itemCount: 12, completedCount: 8, status: .inProgress)
                InspectionSectionCard(name: "Interior", itemCount: 10, completedCount: 10, status: .completed)
                InspectionSectionCard(name: "Engine Bay", itemCount: 8, completedCount: 0, status: .pending)
                InspectionSectionCard(name: "Wheels & Tires", itemCount: 6, completedCount: 0, status: .pending)
                InspectionSectionCard(name: "Glass & Lights", itemCount: 5, completedCount: 0, status: .pending)
            }
            .padding()
        }
    }
}

private struct ServiceTab: View {
    var body: some View {
        EmptyStateView(icon: "wrench.and.screwdriver.fill", title: "Service Requests", message: "Service request details will appear here.")
    }
}

private struct ChecklistsTab: View {
    var body: some View {
        EmptyStateView(icon: "checklist", title: "Checklists", message: "Vehicle checklists will appear here.")
    }
}

private struct FilesTab: View {
    var body: some View {
        EmptyStateView(icon: "photo.on.rectangle.angled", title: "Files & Media", message: "Photos and documents will appear here.")
    }
}

private struct HistoryTab: View {
    var body: some View {
        EmptyStateView(icon: "clock.fill", title: "History", message: "Vehicle activity history will appear here.")
    }
}

#Preview {
    NavigationStack {
        VehicleDetailView(vehicle: MockDataProvider.shared.vehicles[0])
    }
}
