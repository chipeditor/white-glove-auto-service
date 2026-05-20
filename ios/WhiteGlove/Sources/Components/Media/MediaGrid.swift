import SwiftUI

struct MediaGrid: View {
    let images: [UIImage]
    let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
    ]

    var body: some View {
        if images.isEmpty {
            EmptyStateView(
                icon: "photo.on.rectangle.angled",
                title: "No Media",
                message: "Photos and videos will appear here."
            )
        } else {
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(Array(images.enumerated()), id: \.offset) { index, image in
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(minHeight: 100)
                        .clipped()
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                }
            }
        }
    }
}

struct MediaGridPlaceholder: View {
    let count: Int

    let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 8) {
            ForEach(0..<count, id: \.self) { _ in
                RoundedRectangle(cornerRadius: 8)
                    .fill(Theme.cardColor)
                    .frame(height: 100)
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.secondary.opacity(0.3))
                    )
            }
        }
    }
}

#Preview {
    MediaGridPlaceholder(count: 6)
        .padding()
        .background(Theme.bgColor)
}
