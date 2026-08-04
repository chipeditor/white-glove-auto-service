import SwiftUI
import PhotosUI

struct MediaCaptureView: View {
    let vehicleId: UUID
    let inspectionId: UUID?
    let organizationId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []
    @State private var showCamera = false
    @State private var isUploading = false
    @State private var uploadedCount = 0
    @State private var uploadError: String?
    @State private var uploadComplete = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            if selectedImages.isEmpty {
                emptyState
            } else {
                photoGrid
            }

            if isUploading {
                uploadProgress
            }

            actionButtons
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationTitle("Capture Media")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !selectedImages.isEmpty && !isUploading {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Upload") {
                        Task { await uploadPhotos() }
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(Theme.accentColor)
                }
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraView { image in
                if let image {
                    selectedImages.append(image)
                }
            }
        }
        .onChange(of: selectedItems) { _, newItems in
            Task {
                for item in newItems {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        selectedImages.append(image)
                    }
                }
                selectedItems = []
            }
        }
        .alert("Upload Complete", isPresented: $uploadComplete) {
            Button("Done") { dismiss() }
        } message: {
            Text("\(uploadedCount) photo(s) uploaded successfully.")
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 64))
                .foregroundColor(.secondary)
            Text("Capture Inspection Photos")
                .font(.headline)
            Text("Take photos or select from your library to document the vehicle condition.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .frame(maxHeight: .infinity)
    }

    private var photoGrid: some View {
        ScrollView {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 3), spacing: 4) {
                ForEach(Array(selectedImages.enumerated()), id: \.offset) { index, image in
                    ZStack(alignment: .topTrailing) {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(1, contentMode: .fill)
                            .clipped()
                            .cornerRadius(8)

                        Button {
                            selectedImages.remove(at: index)
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title3)
                                .foregroundColor(.white)
                                .shadow(radius: 2)
                        }
                        .padding(4)
                    }
                }
            }
            .padding()
        }
    }

    private var uploadProgress: some View {
        VStack(spacing: 8) {
            ProgressView(value: Double(uploadedCount), total: Double(selectedImages.count))
                .tint(Theme.accentColor)
            Text("Uploading \(uploadedCount)/\(selectedImages.count)...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }

    private var actionButtons: some View {
        HStack(spacing: 16) {
            PhotosPicker(
                selection: $selectedItems,
                maxSelectionCount: 20,
                matching: .images
            ) {
                HStack {
                    Image(systemName: "photo.on.rectangle")
                    Text("Library")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Theme.cardColor)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isUploading)

            Button {
                showCamera = true
            } label: {
                HStack {
                    Image(systemName: "camera.fill")
                    Text("Camera")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Theme.accentColor)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isUploading)
        }
        .padding(.horizontal)
        .padding(.bottom)
    }

    private func uploadPhotos() async {
        isUploading = true
        uploadedCount = 0
        defer { isUploading = false }

        for image in selectedImages {
            guard let data = image.jpegData(compressionQuality: 0.8) else { continue }
            do {
                _ = try await authService.dataProvider.uploadPhoto(
                    imageData: data,
                    vehicleId: vehicleId,
                    inspectionId: inspectionId,
                    inspectionItemId: nil,
                    organizationId: organizationId
                )
                uploadedCount += 1
            } catch {
                uploadError = error.localizedDescription
            }
        }

        if uploadedCount > 0 {
            uploadComplete = true
        }
    }
}

// MARK: - Camera View (UIImagePickerController wrapper)

struct CameraView: UIViewControllerRepresentable {
    let onCapture: (UIImage?) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onCapture: onCapture)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage?) -> Void

        init(onCapture: @escaping (UIImage?) -> Void) {
            self.onCapture = onCapture
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            let image = info[.originalImage] as? UIImage
            onCapture(image)
            picker.dismiss(animated: true)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onCapture(nil)
            picker.dismiss(animated: true)
        }
    }
}
