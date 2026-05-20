import Foundation
import SwiftUI

@MainActor
final class AuthService: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    /// The active data provider — MockDataProvider for demo, SupabaseService for production.
    let dataProvider: DataProvider

    /// Current organization ID (from membership, hardcoded for demo)
    var organizationId: UUID {
        MockDataProvider.orgId
    }

    /// Set to true to use mock data (no Supabase connection needed)
    static let useMockData = true

    init() {
        if Self.useMockData {
            self.dataProvider = MockDataProvider.shared
        } else {
            self.dataProvider = SupabaseService.shared
        }
        Task {
            await checkSession()
        }
    }

    func checkSession() async {
        isLoading = true
        defer { isLoading = false }

        do {
            if let user = try await dataProvider.getCurrentUser() {
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
            let user = try await dataProvider.signIn(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        do {
            try await dataProvider.signOut()
            currentUser = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
