import SwiftUI

// MARK: - Glass card modifier

struct GlassCardModifier: ViewModifier {
    var padding: CGFloat = 14
    var cornerRadius: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(.ultraThinMaterial)
            .background(Color.white.opacity(0.03))
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .overlay(alignment: .top) {
                GlassHighlight(cornerRadius: cornerRadius)
            }
    }
}

struct GlassHighlight: View {
    var cornerRadius: CGFloat = 16

    var body: some View {
        LinearGradient(
            colors: [.clear, .white.opacity(0.12), .clear],
            startPoint: .leading,
            endPoint: .trailing
        )
        .frame(height: 1)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

extension View {
    func glassCard(padding: CGFloat = 14, cornerRadius: CGFloat = 16) -> some View {
        modifier(GlassCardModifier(padding: padding, cornerRadius: cornerRadius))
    }
}

// MARK: - Tech action button

struct TechActionButton: View {
    let icon: String
    let label: String
    var iconColor: Color = Theme.goldColor
    var isProminent: Bool = false

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(iconColor)
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundColor(isProminent ? iconColor : .white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(.ultraThinMaterial)
        .background(isProminent ? iconColor.opacity(0.08) : Color.white.opacity(0.02))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isProminent ? iconColor.opacity(0.2) : Color.white.opacity(0.08), lineWidth: 1)
        )
        .overlay(alignment: .top) {
            GlassHighlight(cornerRadius: 16)
        }
    }
}

// MARK: - Full-width status advance button

struct StatusAdvanceButton: View {
    let label: String
    var icon: String = "arrow.right"

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
            Text(label)
                .font(.subheadline.weight(.semibold))
        }
        .foregroundColor(Theme.goldColor)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.ultraThinMaterial)
        .background(Theme.goldColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.goldColor.opacity(0.2), lineWidth: 1)
        )
        .overlay(alignment: .top) {
            GlassHighlight(cornerRadius: 16)
        }
    }
}

// MARK: - Glass navigation row

struct GlassNavRow: View {
    let icon: String
    let label: String
    var iconColor: Color = Theme.goldColor

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(iconColor)
                .frame(width: 28)
            Text(label)
                .font(.subheadline.weight(.medium))
                .foregroundColor(.white.opacity(0.9))
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.white.opacity(0.25))
        }
        .padding(14)
        .background(.ultraThinMaterial)
        .background(Color.white.opacity(0.02))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }
}
