import SwiftUI

struct VehicleCard: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                // Vehicle Icon
                Image(systemName: "car.fill")
                    .font(.title2)
                    .foregroundColor(Theme.goldColor)
                    .frame(width: 44, height: 44)
                    .background(Theme.goldColor.opacity(0.12))
                    .cornerRadius(10)

                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white)

                    if let color = vehicle.color {
                        Text(color)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                StatusBadge(status: vehicle.status)
            }

            Divider()
                .background(Color.white.opacity(0.1))

            HStack {
                if let plate = vehicle.licensePlate {
                    Label(plate, systemImage: "rectangle.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if let mileage = vehicle.mileage {
                    Label("\(mileage.formatted()) mi", systemImage: "gauge.with.needle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Label(vehicle.updatedAt.formatted(.relative(presentation: .named)), systemImage: "clock")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
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
    VehicleCard(vehicle: MockDataProvider.shared.vehicles[0])
        .padding()
        .background(Theme.bgColor)
}
