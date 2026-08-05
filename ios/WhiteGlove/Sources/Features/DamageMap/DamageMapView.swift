import SwiftUI

enum VehicleType: String, CaseIterable {
    case sedan = "Sedan"
    case suv = "SUV"
    case truck = "Truck"
}

struct DamageMapMarker: Identifiable {
    let id: UUID
    var x: CGFloat
    var y: CGFloat
    var severity: DamageSeverity
    var note: String

    init(id: UUID = UUID(), x: CGFloat, y: CGFloat, severity: DamageSeverity = .minor, note: String = "") {
        self.id = id
        self.x = x
        self.y = y
        self.severity = severity
        self.note = note
    }
}

struct DamageMapView: View {
    @Binding var markers: [DamageMapMarker]
    let vehicleType: VehicleType
    let readOnly: Bool

    @State private var selectedId: UUID?

    init(markers: Binding<[DamageMapMarker]>, vehicleType: VehicleType = .sedan, readOnly: Bool = false) {
        self._markers = markers
        self.vehicleType = vehicleType
        self.readOnly = readOnly
    }

    private var selectedMarker: DamageMapMarker? {
        markers.first { $0.id == selectedId }
    }

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                vehicleShape
                    .stroke(Color(hex: Theme.border), lineWidth: 1.5)
                    .background(vehicleShape.fill(Color(hex: Theme.card).opacity(0.3)))
                    .frame(width: 280, height: 380)
                    .contentShape(Rectangle())
                    .onTapGesture { location in
                        guard !readOnly else { return }
                        let x = location.x / 280
                        let y = location.y / 380
                        guard x >= 0.1 && x <= 0.9 && y >= 0.02 && y <= 0.98 else { return }
                        let marker = DamageMapMarker(x: x, y: y)
                        markers.append(marker)
                        selectedId = marker.id
                    }

                ForEach(markers) { marker in
                    Circle()
                        .fill(colorForSeverity(marker.severity))
                        .frame(width: marker.id == selectedId ? 20 : 14, height: marker.id == selectedId ? 20 : 14)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.8), lineWidth: marker.id == selectedId ? 2 : 1)
                        )
                        .shadow(color: colorForSeverity(marker.severity).opacity(0.5), radius: marker.id == selectedId ? 6 : 2)
                        .position(x: marker.x * 280, y: marker.y * 380)
                        .onTapGesture {
                            selectedId = selectedId == marker.id ? nil : marker.id
                        }
                }

                vehicleLabels
                    .frame(width: 280, height: 380)
            }
            .frame(width: 280, height: 380)
            .padding(20)
            .background(Color(hex: Theme.background2))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: Theme.border), lineWidth: 1))

            if let marker = selectedMarker, !readOnly {
                markerDetail(marker)
            }

            if !markers.isEmpty {
                summary
            }
        }
    }

    private var vehicleShape: AnyShape {
        switch vehicleType {
        case .sedan: AnyShape(SedanShape())
        case .suv: AnyShape(SUVShape())
        case .truck: AnyShape(TruckShape())
        }
    }

    @ViewBuilder
    private var vehicleLabels: some View {
        ZStack {
            Text("FRONT")
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(Color(hex: Theme.muted))
                .position(x: 140, y: 30)
            Text("REAR")
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(Color(hex: Theme.muted))
                .position(x: 140, y: 350)
            if vehicleType == .truck {
                Text("CAB")
                    .font(.system(size: 8, weight: .medium))
                    .foregroundColor(Color(hex: Theme.muted).opacity(0.6))
                    .position(x: 140, y: 120)
                Text("BED")
                    .font(.system(size: 8, weight: .medium))
                    .foregroundColor(Color(hex: Theme.muted).opacity(0.6))
                    .position(x: 140, y: 260)
            } else {
                Text("ROOF")
                    .font(.system(size: 8, weight: .medium))
                    .foregroundColor(Color(hex: Theme.muted).opacity(0.6))
                    .position(x: 140, y: 190)
            }
        }
    }

    private func markerDetail(_ marker: DamageMapMarker) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Marker Detail")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(Color(hex: Theme.text))
                Spacer()
                Button {
                    markers.removeAll { $0.id == marker.id }
                    selectedId = nil
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: Theme.red))
                }
            }

            HStack(spacing: 8) {
                ForEach(DamageSeverity.allCases, id: \.self) { severity in
                    Button {
                        if let idx = markers.firstIndex(where: { $0.id == marker.id }) {
                            markers[idx].severity = severity
                        }
                    } label: {
                        Text(severity.rawValue.capitalized)
                            .font(.system(size: 11, weight: .medium))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(
                                marker.severity == severity
                                    ? colorForSeverity(severity).opacity(0.2)
                                    : Color(hex: Theme.card)
                            )
                            .foregroundColor(
                                marker.severity == severity
                                    ? colorForSeverity(severity)
                                    : Color(hex: Theme.text2)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(
                                        marker.severity == severity
                                            ? colorForSeverity(severity).opacity(0.5)
                                            : Color(hex: Theme.border),
                                        lineWidth: 1
                                    )
                            )
                    }
                }
            }

            TextField("Add note...", text: Binding(
                get: { markers.first { $0.id == marker.id }?.note ?? "" },
                set: { newValue in
                    if let idx = markers.firstIndex(where: { $0.id == marker.id }) {
                        markers[idx].note = newValue
                    }
                }
            ))
            .font(.system(size: 13))
            .padding(8)
            .background(Color(hex: Theme.card))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: Theme.border), lineWidth: 1))
            .foregroundColor(Color(hex: Theme.text))
        }
        .padding(12)
        .background(Color(hex: Theme.card))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: Theme.border), lineWidth: 1))
    }

    private var summary: some View {
        HStack(spacing: 16) {
            ForEach(DamageSeverity.allCases, id: \.self) { severity in
                let count = markers.filter { $0.severity == severity }.count
                if count > 0 {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(colorForSeverity(severity))
                            .frame(width: 8, height: 8)
                        Text("\(count) \(severity.rawValue)")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: Theme.text2))
                    }
                }
            }
        }
    }

    private func colorForSeverity(_ severity: DamageSeverity) -> Color {
        switch severity {
        case .minor: return Color(hex: Theme.gold)
        case .moderate: return Color(hex: "#e89040")
        case .severe: return Color(hex: Theme.red)
        }
    }
}

extension DamageSeverity: CaseIterable {
    static var allCases: [DamageSeverity] = [.minor, .moderate, .severe]
}

// MARK: - Vehicle Shapes

struct SedanShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width, h = rect.height
        var p = Path()
        p.move(to: CGPoint(x: w * 0.35, y: h * 0.05))
        p.addQuadCurve(to: CGPoint(x: w * 0.65, y: h * 0.05), control: CGPoint(x: w * 0.5, y: h * 0.02))
        p.addLine(to: CGPoint(x: w * 0.75, y: h * 0.15))
        p.addLine(to: CGPoint(x: w * 0.8, y: h * 0.3))
        p.addLine(to: CGPoint(x: w * 0.8, y: h * 0.7))
        p.addLine(to: CGPoint(x: w * 0.75, y: h * 0.85))
        p.addQuadCurve(to: CGPoint(x: w * 0.35, y: h * 0.95), control: CGPoint(x: w * 0.65, y: h * 0.95))
        p.addQuadCurve(to: CGPoint(x: w * 0.25, y: h * 0.85), control: CGPoint(x: w * 0.25, y: h * 0.95))
        p.addLine(to: CGPoint(x: w * 0.2, y: h * 0.7))
        p.addLine(to: CGPoint(x: w * 0.2, y: h * 0.3))
        p.addLine(to: CGPoint(x: w * 0.25, y: h * 0.15))
        p.closeSubpath()
        return p
    }
}

struct SUVShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width, h = rect.height
        var p = Path()
        p.move(to: CGPoint(x: w * 0.3, y: h * 0.05))
        p.addQuadCurve(to: CGPoint(x: w * 0.7, y: h * 0.05), control: CGPoint(x: w * 0.5, y: h * 0.02))
        p.addLine(to: CGPoint(x: w * 0.78, y: h * 0.12))
        p.addLine(to: CGPoint(x: w * 0.82, y: h * 0.25))
        p.addLine(to: CGPoint(x: w * 0.82, y: h * 0.75))
        p.addLine(to: CGPoint(x: w * 0.78, y: h * 0.88))
        p.addQuadCurve(to: CGPoint(x: w * 0.3, y: h * 0.95), control: CGPoint(x: w * 0.7, y: h * 0.95))
        p.addQuadCurve(to: CGPoint(x: w * 0.22, y: h * 0.88), control: CGPoint(x: w * 0.22, y: h * 0.95))
        p.addLine(to: CGPoint(x: w * 0.18, y: h * 0.75))
        p.addLine(to: CGPoint(x: w * 0.18, y: h * 0.25))
        p.addLine(to: CGPoint(x: w * 0.22, y: h * 0.12))
        p.closeSubpath()
        return p
    }
}

struct TruckShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width, h = rect.height
        var p = Path()
        // Cab
        p.move(to: CGPoint(x: w * 0.3, y: h * 0.05))
        p.addQuadCurve(to: CGPoint(x: w * 0.7, y: h * 0.05), control: CGPoint(x: w * 0.5, y: h * 0.02))
        p.addLine(to: CGPoint(x: w * 0.78, y: h * 0.12))
        p.addLine(to: CGPoint(x: w * 0.82, y: h * 0.25))
        p.addLine(to: CGPoint(x: w * 0.82, y: h * 0.42))
        p.addLine(to: CGPoint(x: w * 0.85, y: h * 0.44))
        // Bed
        p.addLine(to: CGPoint(x: w * 0.85, y: h * 0.85))
        p.addQuadCurve(to: CGPoint(x: w * 0.3, y: h * 0.95), control: CGPoint(x: w * 0.7, y: h * 0.95))
        p.addQuadCurve(to: CGPoint(x: w * 0.15, y: h * 0.85), control: CGPoint(x: w * 0.15, y: h * 0.95))
        p.addLine(to: CGPoint(x: w * 0.15, y: h * 0.44))
        p.addLine(to: CGPoint(x: w * 0.18, y: h * 0.42))
        p.addLine(to: CGPoint(x: w * 0.18, y: h * 0.25))
        p.addLine(to: CGPoint(x: w * 0.22, y: h * 0.12))
        p.closeSubpath()
        return p
    }
}
