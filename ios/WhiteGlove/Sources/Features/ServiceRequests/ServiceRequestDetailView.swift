import SwiftUI

struct ServiceRequestDetailView: View {
    let serviceRequestId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var sr: ServiceRequest?
    @State private var vehicle: Vehicle?
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if let sr {
                ScrollView {
                    VStack(spacing: 16) {
                        headerSection(sr)
                        statusSection(sr)
                        if let vehicle { vehicleSection(vehicle) }
                        detailsSection(sr)
                    }
                    .padding()
                }
                .refreshable { await loadData() }
            } else {
                EmptyStateView(
                    icon: "exclamationmark.triangle",
                    title: "Not Found",
                    message: "Could not load this service request."
                )
            }
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    private func loadData() async {
        do {
            sr = try await authService.dataProvider.fetchServiceRequest(id: serviceRequestId)
            if let vehicleId = sr?.vehicleId {
                vehicle = try await authService.dataProvider.fetchVehicle(id: vehicleId)
            }
        } catch {}
        isLoading = false
    }

    @ViewBuilder
    private func headerSection(_ sr: ServiceRequest) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(sr.title)
                    .font(.title3.bold())
                    .foregroundColor(Theme.textColor)
                Spacer()
                ServiceStatusBadge(status: sr.status)
            }
            if let desc = sr.description {
                Text(desc)
                    .font(.subheadline)
                    .foregroundColor(Theme.text2Color)
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }

    @ViewBuilder
    private func statusSection(_ sr: ServiceRequest) -> some View {
        let steps: [ServiceRequestStatus] = [
            .draft, .submitted, .awaitingCustomerApproval, .approved,
            .inProgress, .qualityControl, .readyForDelivery, .completed,
        ]
        let currentIdx = steps.firstIndex(of: sr.status) ?? -1

        VStack(spacing: 8) {
            HStack(spacing: 4) {
                ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                    Rectangle()
                        .fill(i <= currentIdx ? Theme.goldColor : Theme.borderColor)
                        .frame(height: 4)
                        .cornerRadius(2)
                }
            }
            HStack {
                Text(sr.status.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(Theme.goldColor)
                Spacer()
                Text("Step \(currentIdx + 1) of \(steps.count)")
                    .font(.caption2)
                    .foregroundColor(Theme.mutedColor)
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }

    @ViewBuilder
    private func vehicleSection(_ vehicle: Vehicle) -> some View {
        HStack {
            Image(systemName: "car.fill")
                .font(.title3)
                .foregroundColor(Theme.goldColor)
            VStack(alignment: .leading, spacing: 2) {
                Text(vehicle.displayName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(Theme.textColor)
                if let vin = vehicle.vin {
                    Text("VIN: \(String(vin.suffix(8)))")
                        .font(.caption)
                        .foregroundColor(Theme.mutedColor)
                }
            }
            Spacer()
            if let mileage = vehicle.mileage {
                Text("\(mileage.formatted()) mi")
                    .font(.caption)
                    .foregroundColor(Theme.text2Color)
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }

    @ViewBuilder
    private func detailsSection(_ sr: ServiceRequest) -> some View {
        VStack(spacing: 12) {
            DetailRow(label: "Priority", value: sr.priority == 0 ? "Normal" : sr.priority == 1 ? "High" : "Urgent")
            DetailRow(label: "Created", value: sr.createdAt.formatted(date: .abbreviated, time: .shortened))
            if let est = sr.estimatedCompletion {
                DetailRow(label: "Est. Completion", value: est.formatted(date: .abbreviated, time: .shortened))
            }
            if let actual = sr.actualCompletion {
                DetailRow(label: "Completed", value: actual.formatted(date: .abbreviated, time: .shortened))
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}

private struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(Theme.mutedColor)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.medium))
                .foregroundColor(Theme.textColor)
        }
    }
}
