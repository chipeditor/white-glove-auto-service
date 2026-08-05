import SwiftUI

struct VehicleCard: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                Image(systemName: "car.fill")
                    .font(.title2)
                    .foregroundColor(Theme.goldColor)
                    .frame(width: 44, height: 44)
                    .background(Theme.goldColor.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white.opacity(0.9))

                    if let color = vehicle.color {
                        Text(color)
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.45))
                    }
                }

                Spacer()

                StatusBadge(status: vehicle.status)
            }

            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1)

            HStack {
                if let plate = vehicle.licensePlate {
                    Label(plate, systemImage: "rectangle.fill")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.4))
                }

                Spacer()

                if let mileage = vehicle.mileage {
                    Label("\(mileage.formatted()) mi", systemImage: "gauge.with.needle")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.4))
                }

                Spacer()

                Label(vehicle.updatedAt.formatted(.relative(presentation: .named)), systemImage: "clock")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.4))
            }
        }
        .glassCard()
    }
}

#Preview {
    VehicleCard(vehicle: MockDataProvider.shared.vehicles[0])
        .padding()
        .background(Theme.bgColor)
}
