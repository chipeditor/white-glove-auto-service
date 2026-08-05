import SwiftUI

struct IntakeWizardView: View {
    @State private var currentStep = 0
    @State private var make = ""
    @State private var model = ""
    @State private var year = ""
    @State private var vin = ""
    @State private var color = ""
    @State private var customerName = ""
    @State private var customerEmail = ""
    @State private var customerPhone = ""
    @State private var serviceDescription = ""
    @State private var selectedInspectionType: InspectionType = .intake
    @State private var showVINScanner = false
    @State private var isDecodingVIN = false

    private let steps = ["Vehicle", "Customer", "Service", "Inspection"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ProgressStepper(steps: steps, currentStep: currentStep)
                    .padding()

                TabView(selection: $currentStep) {
                    vehicleStep.tag(0)
                    customerStep.tag(1)
                    serviceStep.tag(2)
                    inspectionStep.tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentStep)

                // Navigation Buttons
                HStack(spacing: 16) {
                    if currentStep > 0 {
                        Button {
                            withAnimation { currentStep -= 1 }
                        } label: {
                            HStack {
                                Image(systemName: "chevron.left")
                                Text("Back")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Theme.cardColor)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }

                    Button {
                        if currentStep < steps.count - 1 {
                            withAnimation { currentStep += 1 }
                        } else {
                            // Submit
                        }
                    } label: {
                        HStack {
                            Text(currentStep == steps.count - 1 ? "Submit" : "Next")
                            if currentStep < steps.count - 1 {
                                Image(systemName: "chevron.right")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("New Intake")
        }
    }

    // MARK: - Steps

    private var vehicleStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionHeader(title: "Vehicle Information", icon: "car.fill")

                Button {
                    showVINScanner = true
                } label: {
                    HStack {
                        Image(systemName: "barcode.viewfinder")
                            .font(.system(size: 20))
                        Text("Scan VIN Barcode")
                            .font(.subheadline.weight(.medium))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Theme.cardColor)
                    .foregroundColor(Theme.goldColor)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.goldColor.opacity(0.3), lineWidth: 1)
                    )
                }
                .sheet(isPresented: $showVINScanner) {
                    VINScannerView(scannedVIN: $vin)
                        .ignoresSafeArea()
                        .onChange(of: vin) { _, newVIN in
                            if newVIN.count == 17 {
                                decodeVIN(newVIN)
                            }
                        }
                }

                if isDecodingVIN {
                    HStack(spacing: 8) {
                        ProgressView().tint(Theme.goldColor)
                        Text("Decoding VIN...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                FormField(label: "VIN", text: $vin, placeholder: "17-character VIN")
                    .autocapitalization(.allCharacters)
                FormField(label: "Make", text: $make, placeholder: "e.g. Mercedes-Benz")
                FormField(label: "Model", text: $model, placeholder: "e.g. S 580")
                FormField(label: "Year", text: $year, placeholder: "e.g. 2024", keyboardType: .numberPad)
                FormField(label: "Color", text: $color, placeholder: "e.g. Obsidian Black")
            }
            .padding()
        }
    }

    private func decodeVIN(_ vinValue: String) {
        guard vinValue.count == 17 else { return }
        isDecodingVIN = true

        Task {
            defer { isDecodingVIN = false }
            guard let url = URL(string: "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/\(vinValue)?format=json") else { return }
            guard let (data, _) = try? await URLSession.shared.data(from: url),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let results = json["Results"] as? [[String: Any]],
                  let r = results.first else { return }

            let clean: (String?) -> String = { val in
                guard let v = val, v != "Not Applicable", v != "N/A", !v.isEmpty else { return "" }
                return v.trimmingCharacters(in: .whitespaces)
            }

            await MainActor.run {
                let decoded_make = clean(r["Make"] as? String)
                let decoded_model = clean(r["Model"] as? String)
                let decoded_year = clean(r["ModelYear"] as? String)

                if !decoded_make.isEmpty { make = decoded_make }
                if !decoded_model.isEmpty { model = decoded_model }
                if !decoded_year.isEmpty { year = decoded_year }
            }
        }
    }

    private var customerStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionHeader(title: "Customer Information", icon: "person.fill")
                FormField(label: "Full Name", text: $customerName, placeholder: "Customer name")
                FormField(label: "Email", text: $customerEmail, placeholder: "customer@email.com", keyboardType: .emailAddress)
                FormField(label: "Phone", text: $customerPhone, placeholder: "(555) 123-4567", keyboardType: .phonePad)
            }
            .padding()
        }
    }

    private var serviceStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionHeader(title: "Service Details", icon: "wrench.and.screwdriver.fill")

                VStack(alignment: .leading, spacing: 8) {
                    Text("Description")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.secondary)
                    TextEditor(text: $serviceDescription)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Theme.cardColor)
                        .cornerRadius(12)
                        .scrollContentBackground(.hidden)
                }
            }
            .padding()
        }
    }

    private var inspectionStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionHeader(title: "Initial Inspection", icon: "checklist")

                Text("An intake inspection will be created for this vehicle. You can complete it after submission.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Theme.cardColor)
                    .cornerRadius(12)

                VStack(alignment: .leading, spacing: 12) {
                    Text("Inspection Type")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.secondary)

                    ForEach([InspectionType.intake, .cosmetic, .mechanical], id: \.self) { type in
                        Button {
                            selectedInspectionType = type
                        } label: {
                            HStack {
                                Image(systemName: selectedInspectionType == type ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(selectedInspectionType == type ? Theme.accentColor : .secondary)
                                Text(type.rawValue.capitalized.replacingOccurrences(of: "_", with: " "))
                                    .foregroundColor(.white)
                                Spacer()
                            }
                            .padding()
                            .background(Theme.cardColor)
                            .cornerRadius(12)
                        }
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Form Components

private struct SectionHeader: View {
    let title: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(Theme.accentColor)
            Text(title)
                .font(.headline)
            Spacer()
        }
    }
}

private struct FormField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline.weight(.medium))
                .foregroundColor(.secondary)
            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .padding()
                .background(Theme.cardColor)
                .cornerRadius(12)
                .foregroundColor(.white)
        }
    }
}

#Preview {
    IntakeWizardView()
}
