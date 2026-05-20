import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var password = ""

    private let bgColor = Color(hex: Theme.background)
    private let cardColor = Color(hex: Theme.card)
    private let accentColor = Color(hex: Theme.accent)
    private let alertColor = Color(hex: Theme.alert)

    var body: some View {
        ZStack {
            bgColor.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // Branding
                VStack(spacing: 16) {
                    Image(systemName: "car.top.radiowaves.front.fill")
                        .font(.system(size: 64))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [accentColor, .white.opacity(0.8)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    Text("WHITE GLOVE")
                        .font(.system(size: 32, weight: .bold, design: .default))
                        .tracking(6)
                        .foregroundColor(.white)

                    Text("Auto Service")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                        .tracking(4)
                }

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
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [accentColor, accentColor.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(email.isEmpty || password.isEmpty || authService.isLoading)
                    .opacity(email.isEmpty || password.isEmpty ? 0.5 : 1.0)
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
    static let cardColor = Color(hex: card)
    static let accentColor = Color(hex: accent)
    static let alertColor = Color(hex: alert)
}

#Preview {
    LoginView()
        .environmentObject(AuthService())
}
