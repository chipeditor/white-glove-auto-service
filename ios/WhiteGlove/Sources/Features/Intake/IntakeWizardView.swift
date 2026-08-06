import SwiftUI

struct IntakeWizardView: View {
    @EnvironmentObject var authService: AuthService
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
    @State private var isSubmitting = false
    @State private var showSuccess = false
    @State private var submitError: String?
    @State private var existingCustomers: [Customer] = []
    @State private var customerSearchText = ""
    @State private var selectedCustomer: Customer?

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

                HStack(spacing: 12) {
                    if currentStep > 0 {
                        Button {
                            withAnimation { currentStep -= 1 }
                        } label: {
                            HStack {
                                Image(systemName: "chevron.left")
                                Text("Back")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(.ultraThinMaterial)
                            .background(Color.white.opacity(0.03))
                            .foregroundColor(.white.opacity(0.7))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            )
                        }
                    }

                    Button {
                        if currentStep < steps.count - 1 {
                            withAnimation { currentStep += 1 }
                        } else {
                            Task { await submitIntake() }
                        }
                    } label: {
                        HStack {
                            if isSubmitting {
                                ProgressView().tint(.white)
                            }
                            Text(currentStep == steps.count - 1 ? "Submit" : "Next")
                            if currentStep < steps.count - 1 {
                                Image(systemName: "chevron.right")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.goldColor.opacity(0.15))
                        .foregroundColor(Theme.goldColor)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Theme.goldColor.opacity(0.25), lineWidth: 1)
                        )
                    }
                    .disabled(isSubmitting)
                }
                .padding()
            }
            .background(
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("New Intake")
            .alert("Intake Submitted", isPresented: $showSuccess) {
                Button("OK") { resetForm() }
            } message: {
                Text("Vehicle and service request have been created successfully.")
            }
            .alert("Error", isPresented: .init(
                get: { submitError != nil },
                set: { if !$0 { submitError = nil } }
            )) {
                Button("OK") { submitError = nil }
            } message: {
                Text(submitError ?? "")
            }
        }
    }

    private func submitIntake() async {
        guard !make.isEmpty, !model.isEmpty else {
            submitError = "Please enter at least the vehicle make and model."
            return
        }

        isSubmitting = true
        defer { isSubmitting = false }

        let orgId = authService.organizationId

        do {
            // An existing customer picked from search is reused as-is; anything
            // else must actually be inserted before the vehicle can reference it.
            let customer: Customer
            if let existing = selectedCustomer {
                customer = existing
            } else {
                customer = try await authService.dataProvider.createCustomer(
                    Customer(
                        id: UUID(), organizationId: orgId,
                        fullName: customerName.isEmpty ? "Walk-in" : customerName,
                        email: customerEmail.isEmpty ? nil : customerEmail,
                        phone: customerPhone.isEmpty ? nil : customerPhone,
                        address: nil, createdAt: Date()
                    )
                )
            }

            let vehicle = try await authService.dataProvider.createVehicle(
                Vehicle(
                    id: UUID(), organizationId: orgId, customerId: customer.id,
                    vin: vin.isEmpty ? nil : vin,
                    year: Int(year), make: make, model: model,
                    color: color.isEmpty ? nil : color,
                    licensePlate: nil, mileage: nil,
                    status: .intakeStarted, notes: nil,
                    createdAt: Date(), updatedAt: Date()
                )
            )

            let title = "\(selectedInspectionType.rawValue.capitalized) — \(vehicle.displayName)"
            let serviceRequest = try await authService.dataProvider.createServiceRequest(
                vehicleId: vehicle.id,
                organizationId: orgId,
                title: title,
                description: serviceDescription.isEmpty ? nil : serviceDescription
            )

            _ = try await authService.dataProvider.createInspection(
                vehicleId: vehicle.id,
                serviceRequestId: serviceRequest.id,
                organizationId: orgId,
                inspectorId: authService.currentUser?.id,
                type: selectedInspectionType
            )

            showSuccess = true
        } catch {
            submitError = error.localizedDescription
        }
    }

    private func resetForm() {
        currentStep = 0
        make = ""; model = ""; year = ""; vin = ""; color = ""
        customerName = ""; customerEmail = ""; customerPhone = ""
        serviceDescription = ""
        selectedInspectionType = .intake
    }

    // MARK: - Steps

    private var vehicleStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                GlassSectionHeader(title: "Vehicle Information", icon: "car.fill")

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
                    .padding(.vertical, 16)
                    .background(.ultraThinMaterial)
                    .background(Theme.goldColor.opacity(0.06))
                    .foregroundColor(Theme.goldColor)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.goldColor.opacity(0.2), lineWidth: 1)
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
                            .foregroundColor(.white.opacity(0.5))
                    }
                }

                GlassFormField(label: "VIN", text: $vin, placeholder: "17-character VIN")
                    .autocapitalization(.allCharacters)
                GlassFormField(label: "Make", text: $make, placeholder: "e.g. Mercedes-Benz")
                GlassFormField(label: "Model", text: $model, placeholder: "e.g. S 580")
                GlassFormField(label: "Year", text: $year, placeholder: "e.g. 2024", keyboardType: .numberPad)
                GlassFormField(label: "Color", text: $color, placeholder: "e.g. Obsidian Black")
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
                GlassSectionHeader(title: "Customer Information", icon: "person.fill")

                VStack(alignment: .leading, spacing: 8) {
                    Text("Find Existing Customer")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.white.opacity(0.5))

                    TextField("Search by name or phone", text: $customerSearchText)
                        .padding()
                        .background(.ultraThinMaterial)
                        .background(Color.white.opacity(0.03))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .foregroundColor(.white)
                        .onChange(of: customerSearchText) { _, _ in
                            selectedCustomer = nil
                        }

                    if !customerSearchText.isEmpty {
                        let matches = existingCustomers.filter { c in
                            let q = customerSearchText.lowercased()
                            return c.fullName.lowercased().contains(q) || (c.phone?.contains(q) ?? false)
                        }
                        if !matches.isEmpty {
                            VStack(spacing: 4) {
                                ForEach(matches.prefix(5)) { c in
                                    Button {
                                        selectedCustomer = c
                                        customerName = c.fullName
                                        customerEmail = c.email ?? ""
                                        customerPhone = c.phone ?? ""
                                        customerSearchText = ""
                                    } label: {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(c.fullName)
                                                    .font(.subheadline)
                                                    .foregroundColor(.white.opacity(0.9))
                                                if let phone = c.phone {
                                                    Text(phone)
                                                        .font(.caption)
                                                        .foregroundColor(.white.opacity(0.45))
                                                }
                                            }
                                            Spacer()
                                            if selectedCustomer?.id == c.id {
                                                Image(systemName: "checkmark.circle.fill")
                                                    .foregroundColor(Theme.goldColor)
                                            }
                                        }
                                        .padding(10)
                                        .background(Color.white.opacity(0.04))
                                        .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }

                    if let sc = selectedCustomer {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(Theme.goldColor)
                            Text("Selected: \(sc.fullName)")
                                .font(.caption.weight(.medium))
                                .foregroundColor(Theme.goldColor)
                            Spacer()
                            Button("Clear") {
                                selectedCustomer = nil
                                customerName = ""
                                customerEmail = ""
                                customerPhone = ""
                            }
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.45))
                        }
                        .padding(8)
                        .background(Theme.goldColor.opacity(0.08))
                        .cornerRadius(8)
                    }
                }

                Rectangle().fill(Color.white.opacity(0.06)).frame(height: 1)

                Text("Or enter new customer")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.4))

                GlassFormField(label: "Full Name", text: $customerName, placeholder: "Customer name")
                GlassFormField(label: "Email", text: $customerEmail, placeholder: "customer@email.com", keyboardType: .emailAddress)
                GlassFormField(label: "Phone", text: $customerPhone, placeholder: "(555) 123-4567", keyboardType: .phonePad)
            }
            .padding()
        }
        .task {
            do {
                existingCustomers = try await authService.dataProvider.fetchCustomers(organizationId: authService.organizationId)
            } catch {}
        }
    }

    private var serviceStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                GlassSectionHeader(title: "Service Details", icon: "wrench.and.screwdriver.fill")

                VStack(alignment: .leading, spacing: 8) {
                    Text("Description")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.white.opacity(0.5))
                    TextEditor(text: $serviceDescription)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(.ultraThinMaterial)
                        .background(Color.white.opacity(0.03))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .scrollContentBackground(.hidden)
                }
            }
            .padding()
        }
    }

    private var inspectionStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                GlassSectionHeader(title: "Initial Inspection", icon: "checklist")

                Text("An intake inspection will be created for this vehicle. You can complete it after submission.")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.5))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard(padding: 14)

                VStack(alignment: .leading, spacing: 12) {
                    Text("Inspection Type")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.white.opacity(0.5))

                    ForEach([InspectionType.intake, .cosmetic, .mechanical], id: \.self) { type in
                        Button {
                            selectedInspectionType = type
                        } label: {
                            HStack {
                                Image(systemName: selectedInspectionType == type ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(selectedInspectionType == type ? Theme.goldColor : .white.opacity(0.3))
                                Text(type.rawValue.capitalized.replacingOccurrences(of: "_", with: " "))
                                    .foregroundColor(.white.opacity(0.85))
                                Spacer()
                            }
                            .glassCard(padding: 14)
                        }
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Glass Form Components

private struct GlassSectionHeader: View {
    let title: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(Theme.goldColor)
            Text(title)
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            Spacer()
        }
    }
}

private struct GlassFormField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.subheadline.weight(.medium))
                .foregroundColor(.white.opacity(0.5))
            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .padding()
                .background(.ultraThinMaterial)
                .background(Color.white.opacity(0.03))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .foregroundColor(.white)
        }
    }
}

#Preview {
    IntakeWizardView()
}
