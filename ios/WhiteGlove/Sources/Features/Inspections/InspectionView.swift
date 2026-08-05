import SwiftUI

struct InspectionView: View {
    let inspectionId: UUID
    let vehicleId: UUID
    let organizationId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var sections: [InspectionSection] = []
    @State private var selectedSection = 0
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var showCompleteAlert = false
    @State private var errorMessage: String?
    @State private var damageMarkers: [DamageMapMarker] = []
    @State private var showDamageMap = true

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if isLoading {
                    LoadingView()
                } else if sections.isEmpty {
                    EmptyStateView(icon: "checklist", title: "No Sections", message: "This inspection has no sections yet.")
                } else {
                    sectionTabs
                    if showDamageMap {
                        ScrollView {
                            DamageMapView(markers: $damageMarkers)
                                .padding()
                        }
                    } else {
                        sectionContent
                    }
                }
            }
            .background(Theme.bgColor.ignoresSafeArea())
            .navigationTitle("Inspection")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCompleteAlert = true
                    } label: {
                        Text("Complete")
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Theme.greenColor)
                            .cornerRadius(8)
                    }
                }
            }
            .alert("Complete Inspection", isPresented: $showCompleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Complete") { Task { await completeInspection() } }
            } message: {
                Text("Mark this inspection as completed? All items should be reviewed first.")
            }
            .task { await loadSections() }
        }
    }

    private var sectionTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                Button {
                    withAnimation { showDamageMap = true }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.title3)
                        Text("Damage")
                            .font(.caption2.weight(.medium))
                        Text("\(damageMarkers.count)")
                            .font(.system(size: 9).weight(.medium))
                            .foregroundColor(damageMarkers.isEmpty ? .secondary : Theme.alertColor)
                    }
                    .frame(width: 76, height: 72)
                    .background(showDamageMap ? Theme.accentColor : Theme.cardColor)
                    .foregroundColor(showDamageMap ? .white : .secondary)
                    .cornerRadius(12)
                }

                ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                    let itemCount = section.items?.count ?? 0
                    let passedCount = section.items?.filter({ $0.passed != nil }).count ?? 0
                    Button {
                        withAnimation { selectedSection = index; showDamageMap = false }
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: iconForSection(section.name))
                                .font(.title3)
                            Text(section.name)
                                .font(.caption2.weight(.medium))
                            Text("\(passedCount)/\(itemCount)")
                                .font(.system(size: 9).weight(.medium))
                                .foregroundColor(passedCount == itemCount && itemCount > 0 ? Theme.greenColor : .secondary)
                        }
                        .frame(width: 76, height: 72)
                        .background(selectedSection == index && !showDamageMap ? Theme.accentColor : Theme.cardColor)
                        .foregroundColor(selectedSection == index && !showDamageMap ? .white : .secondary)
                        .cornerRadius(12)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    private var sectionContent: some View {
        TabView(selection: $selectedSection) {
            ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(section.items ?? []) { item in
                            InspectionItemRow(
                                item: item,
                                onUpdate: { passed, notes in
                                    Task { await saveItem(id: item.id, passed: passed, notes: notes) }
                                }
                            )
                        }

                        NavigationLink {
                            MediaCaptureView(
                                vehicleId: vehicleId,
                                inspectionId: inspectionId,
                                organizationId: organizationId
                            )
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

    private func loadSections() async {
        isLoading = true
        defer { isLoading = false }
        do {
            sections = try await authService.dataProvider.fetchInspectionSections(inspectionId: inspectionId)
        } catch {
            sections = []
        }
    }

    private func saveItem(id: UUID, passed: Bool?, notes: String?) async {
        do {
            try await authService.dataProvider.updateInspectionItem(id: id, passed: passed, notes: notes)
            sections = try await authService.dataProvider.fetchInspectionSections(inspectionId: inspectionId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func completeInspection() async {
        isSaving = true
        defer { isSaving = false }
        do {
            try await authService.dataProvider.updateInspectionStatus(id: inspectionId, status: .completed)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func iconForSection(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.contains("exterior") { return "car.side.fill" }
        if lower.contains("interior") { return "carseat.left.fill" }
        if lower.contains("engine") || lower.contains("mechanical") { return "engine.combustion.fill" }
        if lower.contains("wheel") || lower.contains("tire") { return "tire.fill" }
        if lower.contains("glass") || lower.contains("light") { return "window.ceiling" }
        return "checklist"
    }
}

// MARK: - Inspection Item Row

private struct InspectionItemRow: View {
    let item: InspectionItem
    let onUpdate: (Bool?, String?) -> Void
    @State private var passed: Bool?
    @State private var notes: String
    @State private var showNotes = false

    init(item: InspectionItem, onUpdate: @escaping (Bool?, String?) -> Void) {
        self.item = item
        self.onUpdate = onUpdate
        _passed = State(initialValue: item.passed)
        _notes = State(initialValue: item.notes ?? "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.label)
                    .font(.subheadline.weight(.medium))
                Spacer()
                HStack(spacing: 8) {
                    Button {
                        passed = true
                        onUpdate(true, notes.isEmpty ? nil : notes)
                    } label: {
                        Image(systemName: passed == true ? "checkmark.circle.fill" : "checkmark.circle")
                            .foregroundColor(passed == true ? .green : .secondary)
                    }
                    Button {
                        passed = false
                        showNotes = true
                        onUpdate(false, notes.isEmpty ? nil : notes)
                    } label: {
                        Image(systemName: passed == false ? "xmark.circle.fill" : "xmark.circle")
                            .foregroundColor(passed == false ? Theme.alertColor : .secondary)
                    }
                    Button {
                        showNotes.toggle()
                    } label: {
                        Image(systemName: "note.text")
                            .foregroundColor(notes.isEmpty ? .secondary : Theme.accentColor)
                    }
                }
                .font(.title3)
            }

            if showNotes || !notes.isEmpty {
                TextField("Add notes...", text: $notes, axis: .vertical)
                    .font(.caption)
                    .foregroundColor(Theme.text2Color)
                    .padding(8)
                    .background(Theme.bgColor)
                    .cornerRadius(8)
                    .lineLimit(1...4)
                    .onSubmit {
                        onUpdate(passed, notes.isEmpty ? nil : notes)
                    }
            }

            if let existingNotes = item.notes, !existingNotes.isEmpty, notes.isEmpty {
                Text(existingNotes)
                    .font(.caption)
                    .foregroundColor(Theme.alertColor)
            }
        }
        .padding()
        .background(Theme.cardColor)
        .cornerRadius(12)
    }
}
