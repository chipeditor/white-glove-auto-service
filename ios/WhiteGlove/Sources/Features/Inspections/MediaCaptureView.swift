import SwiftUI
import PhotosUI

struct MediaCaptureView: View {
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []

    var body: some View {
        VStack(spacing: 24) {
            if selectedImages.isEmpty {
                // Empty State
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
            } else {
                // Photo Grid
                ScrollView {
                    MediaGrid(images: selectedImages)
                        .padding()
                }
            }

            // Action Buttons
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

                Button {
                    // Camera capture placeholder
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
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
        .background(Theme.bgColor.ignoresSafeArea())
        .navigationTitle("Capture Media")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: selectedItems) { _, newItems in
            Task {
                selectedImages = []
                for item in newItems {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        selectedImages.append(image)
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        MediaCaptureView()
    }
}
