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

    /// Resolved from memberships table on sign-in; falls back to hardcoded org for mock mode
    @Published private(set) var resolvedOrgId: UUID?

    var organizationId: UUID {
        resolvedOrgId ?? MockDataProvider.orgId
    }

    /// Set to false for live Supabase, true for offline demo mode
    static let useMockData = false

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
                await resolveOrganization(userId: user.id)
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
            await resolveOrganization(userId: user.id)
        } catch {
            errorMessage = Self.describe(error)
        }
    }

    /// DecodingError's localizedDescription collapses to an unhelpful
    /// "data couldn't be read" string, hiding which field actually failed.
    static func describe(_ error: Error) -> String {
        guard let decodingError = error as? DecodingError else {
            return error.localizedDescription
        }
        switch decodingError {
        case let .keyNotFound(key, context):
            return "Missing field '\(key.stringValue)' at \(path(context))"
        case let .typeMismatch(type, context):
            return "Type mismatch: expected \(type) at \(path(context))"
        case let .valueNotFound(type, context):
            return "Null value for non-optional \(type) at \(path(context))"
        case let .dataCorrupted(context):
            return "Corrupted data at \(path(context)): \(context.debugDescription)"
        @unknown default:
            return decodingError.localizedDescription
        }
    }

    private static func path(_ context: DecodingError.Context) -> String {
        let joined = context.codingPath.map(\.stringValue).joined(separator: ".")
        return joined.isEmpty ? "root" : joined
    }

    func signOut() async {
        do {
            try await dataProvider.signOut()
            currentUser = nil
            isAuthenticated = false
            resolvedOrgId = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func resolveOrganization(userId: UUID) async {
        if Self.useMockData {
            resolvedOrgId = MockDataProvider.orgId
            return
        }
        guard let service = dataProvider as? SupabaseService else { return }
        do {
            let data = try await service.client
                .from("memberships")
                .select("organization_id")
                .eq("user_id", value: userId.uuidString)
                .eq("is_active", value: "true")
                .limit(1)
                .single()
                .execute()
                .value as Data

            struct MembershipRow: Decodable {
                let organizationId: UUID
                enum CodingKeys: String, CodingKey {
                    case organizationId = "organization_id"
                }
            }
            let row = try JSONDecoder().decode(MembershipRow.self, from: data)
            resolvedOrgId = row.organizationId
        } catch {
            resolvedOrgId = MockDataProvider.orgId
        }
    }
}
