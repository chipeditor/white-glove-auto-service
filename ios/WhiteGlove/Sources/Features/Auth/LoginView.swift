import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var password = ""

    private let bgColor = Color(hex: Theme.background)
    private let cardColor = Color(hex: Theme.card)
    private let goldColor = Color(hex: Theme.gold)
    private let alertColor = Color(hex: Theme.alert)

    var body: some View {
        ZStack {
            bgColor.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // Branding
                Image("KSBLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxWidth: 280)

                // Login Form
                VStack(spacing: 20) {
                    VStack(spacing: 16) {
                        HStack {
                            Image(systemName: "envelope.fill")
                                .foregroundColor(.white.opacity(0.5))
                                .frame(width: 24)
                            TextField("Email", text: $email)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .autocorrectionDisabled()
                                .keyboardType(.emailAddress)
                                .foregroundColor(.white)
                        }
                        .padding()
                        .background(cardColor)
                        .cornerRadius(12)

                        HStack {
                            Image(systemName: "lock.fill")
                                .foregroundColor(.white.opacity(0.5))
                                .frame(width: 24)
                            SecureField("Password", text: $password)
                                .textContentType(.password)
                                .foregroundColor(.white)
                        }
                        .padding()
                        .background(cardColor)
                        .cornerRadius(12)
                    }

                    if let error = authService.errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text(error)
                        }
                        .font(.caption)
                        .foregroundColor(alertColor)
                        .padding(.horizontal)
                    }

                    Button {
                        Task {
                            await authService.signIn(email: email, password: password)
                        }
                    } label: {
                        Group {
                            if authService.isLoading {
                                ProgressView()
                                    .tint(Color(hex: Theme.background))
                            } else {
                                Text("Sign In")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(goldColor)
                        .foregroundColor(Color(hex: Theme.background))
                        .cornerRadius(12)
                    }
                    .disabled(email.isEmpty || password.isEmpty || authService.isLoading)
                    .opacity(email.isEmpty || password.isEmpty ? 0.5 : 1.0)

                    // One-tap demo login
                    Button {
                        Task {
                            email = "john@whiteglove.com"
                            password = "password"
                            await authService.signIn(email: "john@whiteglove.com", password: "password")
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "person.fill.viewfinder")
                            Text("Demo Login")
                                .font(.subheadline.weight(.medium))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(cardColor)
                        .foregroundColor(goldColor)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(goldColor.opacity(0.3), lineWidth: 1)
                        )
                    }
                    .disabled(authService.isLoading)
                }
                .padding(.horizontal, 32)

                Spacer()
                Spacer()
            }
        }
    }
}

// MARK: - Color Hex Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255.0
            g = Double((int >> 8) & 0xFF) / 255.0
            b = Double(int & 0xFF) / 255.0
        default:
            r = 0; g = 0; b = 0
        }
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Theme Color Helpers

extension Theme {
    static let bgColor = Color(hex: background)
    static let bg2Color = Color(hex: background2)
    static let cardColor = Color(hex: card)
    static let cardHoverColor = Color(hex: cardHover)
    static let borderColor = Color(hex: border)
    static let goldColor = Color(hex: gold)
    static let goldHoverColor = Color(hex: goldHover)
    static let accentColor = Color(hex: accent)
    static let blueColor = Color(hex: blue)
    static let alertColor = Color(hex: alert)
    static let greenColor = Color(hex: green)
    static let textColor = Color(hex: text)
    static let text2Color = Color(hex: text2)
    static let mutedColor = Color(hex: muted)
}

#Preview {
    LoginView()
        .environmentObject(AuthService())
}
