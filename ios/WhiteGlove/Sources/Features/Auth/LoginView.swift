import SwiftUI

struct StaffMember {
    let name: String
    let role: String
    let email: String
    let icon: String
}

private let staff = [
    StaffMember(name: "Juan", role: "Shop Manager", email: "juan@ksbperformance.com", icon: "shield.fill"),
    StaffMember(name: "Aiden", role: "Service Advisor", email: "aiden@ksbperformance.com", icon: "display"),
    StaffMember(name: "Geo", role: "Tech", email: "geo@ksbperformance.com", icon: "wrench.fill"),
    StaffMember(name: "James", role: "Tech", email: "james@ksbperformance.com", icon: "wrench.fill"),
]

private let webAppURL = ProcessInfo.processInfo.environment["WEB_APP_URL"]
    ?? "https://white-glove-auto-service.vercel.app"

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var password = ""
    @State private var loadingEmail: String?
    @State private var staffError: String?

    private let bgColor = Color(hex: Theme.background)
    private let cardColor = Color(hex: Theme.card)
    private let goldColor = Color(hex: Theme.gold)
    private let alertColor = Color(hex: Theme.alert)

    var body: some View {
        ZStack {
            bgColor.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer(minLength: 40)

                    Image("KSBLogo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: 280)

                    // Staff Picker
                    VStack(spacing: 16) {
                        Text("Sign in as")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: Theme.text2))

                        VStack(spacing: 8) {
                            ForEach(staff, id: \.email) { person in
                                Button {
                                    Task { await handleStaffLogin(person.email) }
                                } label: {
                                    HStack(spacing: 12) {
                                        ZStack {
                                            Circle()
                                                .fill(cardColor)
                                                .frame(width: 38, height: 38)
                                                .overlay(
                                                    Circle()
                                                        .stroke(Color(hex: Theme.border), lineWidth: 1)
                                                )
                                            Image(systemName: person.icon)
                                                .font(.system(size: 14))
                                                .foregroundColor(goldColor)
                                        }
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(person.name)
                                                .font(.subheadline.weight(.medium))
                                                .foregroundColor(Color(hex: Theme.text))
                                            Text(person.role)
                                                .font(.caption)
                                                .foregroundColor(Color(hex: Theme.muted))
                                        }
                                        Spacer()
                                        if loadingEmail == person.email {
                                            ProgressView()
                                                .tint(goldColor)
                                                .scaleEffect(0.8)
                                        }
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 12)
                                    .background(Color(hex: Theme.background2))
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(hex: Theme.border), lineWidth: 1)
                                    )
                                }
                                .disabled(loadingEmail != nil)
                                .opacity(loadingEmail != nil && loadingEmail != person.email ? 0.5 : 1.0)
                            }
                        }
                    }
                    .padding(.horizontal, 32)

                    // Divider
                    HStack {
                        Rectangle().fill(Color(hex: Theme.border)).frame(height: 1)
                        Text("or sign in manually")
                            .font(.caption)
                            .foregroundColor(Color(hex: Theme.muted))
                            .layoutPriority(1)
                        Rectangle().fill(Color(hex: Theme.border)).frame(height: 1)
                    }
                    .padding(.horizontal, 32)

                    // Manual Login
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

                        Button {
                            Task { await authService.signIn(email: email, password: password) }
                        } label: {
                            Group {
                                if authService.isLoading && loadingEmail == nil {
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
                    }
                    .padding(.horizontal, 32)

                    if let error = staffError ?? authService.errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text(error)
                        }
                        .font(.caption)
                        .foregroundColor(alertColor)
                        .padding(.horizontal, 32)
                    }

                    Spacer(minLength: 40)
                }
            }
        }
    }

    private func handleStaffLogin(_ email: String) async {
        loadingEmail = email
        staffError = nil

        do {
            guard let url = URL(string: "\(webAppURL)/api/test-login") else {
                staffError = "Invalid server URL"
                loadingEmail = nil
                return
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: ["email": email])

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                let body = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                staffError = body?["error"] as? String ?? "Failed to set up test account"
                loadingEmail = nil
                return
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: String],
                  let staffEmail = json["email"],
                  let staffPassword = json["password"] else {
                staffError = "Invalid server response"
                loadingEmail = nil
                return
            }

            await authService.signIn(email: staffEmail, password: staffPassword)
            loadingEmail = nil
        } catch {
            staffError = error.localizedDescription
            loadingEmail = nil
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
