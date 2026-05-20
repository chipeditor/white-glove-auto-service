import Foundation
import SwiftUI

@MainActor
final class AuthService: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let supabase = SupabaseService.shared

    init() {
        Task {
            await checkSession()
        }
    }

    func checkSession() async {
        isLoading = true
        defer { isLoading = false }

        do {
            if let user = try await supabase.getCurrentUser() {
                currentUser = user
                isAuthenticated = true
            }
        } catch {
            isAuthenticated = false
            currentUser = nil
        }
    }

    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let user = try await supabase.signIn(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        do {
            try await supabase.signOut()
            currentUser = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
