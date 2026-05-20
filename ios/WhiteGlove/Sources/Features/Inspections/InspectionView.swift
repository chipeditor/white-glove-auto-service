import SwiftUI

struct InspectionView: View {
    @State private var selectedSection = 0

    private let sections = [
        ("Exterior", "car.side.fill", mockExteriorItems),
        ("Interior", "carseat.left.fill", mockInteriorItems),
        ("Engine Bay", "engine.combustion.fill", mockEngineItems),
        ("Wheels", "tire.fill", mockWheelItems),
        ("Glass", "window.ceiling", mockGlassItems),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Section Tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 4) {
                        ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                            Button {
                                withAnimation { selectedSection = index }
                            } label: {
                                VStack(spacing: 6) {
                                    Image(systemName: section.1)
                                        .font(.title3)
                                    Text(section.0)
                                        .font(.caption2.weight(.medium))
                                }
                                .frame(width: 72, height: 64)
                                .background(selectedSection == index ? Theme.accentColor : Theme.cardColor)
                                .foregroundColor(selectedSection == index ? .white : .secondary)
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Items List
                TabView(selection: $selectedSection) {
                    ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(section.2) { item in
                                    InspectionItemRow(item: item)
                                }

                                // Add Photo Button
                                NavigationLink {
                                    MediaCaptureView()
                                } label: {
                                    HStack {
                                        Image(systemName: "camera.fill")
                                        Text("Add Photos")
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Theme.cardColor)
                                    .foregroundColor(Theme.accentColor)
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Theme.accentColor.opacity(0.3), lineWidth: 1)
                                    )
                                }
                            }
                            .padding()
                        }
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Inspection")
        }
    }
}

// MARK: - Inspection Item Row

private struct InspectionItemRow: View {
    let item: MockInspectionItem
    @State private var passed: Bool?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.label)
                    .font(.subheadline.weight(.medium))
                Spacer()
                HStack(spacing: 8) {
                    Button {
                        passed = true
                    } label: {
                        Image(systemName: passed == true ? "checkmark.circle.fill" : "checkmark.circle")
                            .foregroundColor(passed == true ? .green : .secondary)
                    }
                    Button {
                        passed = false
                    } label: {
                        Image(systemName: passed == false ? "xmark.circle.fill" : "xmark.circle")
                            .foregroundColor(passed == false ? Theme.alertColor : .secondary)
                    }
                }
                .font(.title3)
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}

// MARK: - Mock Data

struct MockInspectionItem: Identifiable {
    let id = UUID()
    let label: String
}

private let mockExteriorItems = [
    MockInspectionItem(label: "Front Bumper"),
    MockInspectionItem(label: "Rear Bumper"),
    MockInspectionItem(label: "Hood"),
    MockInspectionItem(label: "Trunk"),
    MockInspectionItem(label: "Driver Side Panels"),
    MockInspectionItem(label: "Passenger Side Panels"),
    MockInspectionItem(label: "Roof"),
    MockInspectionItem(label: "Paint Condition"),
    MockInspectionItem(label: "Trim & Moldings"),
    MockInspectionItem(label: "Emblems & Badging"),
    MockInspectionItem(label: "Door Handles"),
    MockInspectionItem(label: "Side Mirrors"),
]

private let mockInteriorItems = [
    MockInspectionItem(label: "Dashboard"),
    MockInspectionItem(label: "Center Console"),
    MockInspectionItem(label: "Seats - Driver"),
    MockInspectionItem(label: "Seats - Passenger"),
    MockInspectionItem(label: "Seats - Rear"),
    MockInspectionItem(label: "Carpet & Floor Mats"),
    MockInspectionItem(label: "Headliner"),
    MockInspectionItem(label: "Door Panels"),
    MockInspectionItem(label: "Infotainment System"),
    MockInspectionItem(label: "Climate Control"),
]

private let mockEngineItems = [
    MockInspectionItem(label: "Oil Level"),
    MockInspectionItem(label: "Coolant Level"),
    MockInspectionItem(label: "Brake Fluid"),
    MockInspectionItem(label: "Battery"),
    MockInspectionItem(label: "Belts & Hoses"),
    MockInspectionItem(label: "Air Filter"),
    MockInspectionItem(label: "Fluid Leaks"),
    MockInspectionItem(label: "Engine Cover"),
]

private let mockWheelItems = [
    MockInspectionItem(label: "Front Left Tire"),
    MockInspectionItem(label: "Front Right Tire"),
    MockInspectionItem(label: "Rear Left Tire"),
    MockInspectionItem(label: "Rear Right Tire"),
    MockInspectionItem(label: "Wheel Condition"),
    MockInspectionItem(label: "Spare Tire"),
]

private let mockGlassItems = [
    MockInspectionItem(label: "Windshield"),
    MockInspectionItem(label: "Rear Window"),
    MockInspectionItem(label: "Side Windows"),
    MockInspectionItem(label: "Headlights"),
    MockInspectionItem(label: "Taillights"),
]

#Preview {
    InspectionView()
}
