import Foundation
import Supabase

final class SupabaseService: Sendable {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        let supabaseURL = URL(string: ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? "https://your-project.supabase.co")!
        let supabaseKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? "your-anon-key"

        client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey
        )
    }

    // MARK: - Auth

    func signIn(email: String, password: String) async throws -> User {
        let response = try await client.auth.signIn(email: email, password: password)
        let data = try await client
            .from("users")
            .select()
            .eq("id", value: response.user.id.uuidString)
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(User.self, from: data)
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func getCurrentUser() async throws -> User? {
        guard let session = try? await client.auth.session else { return nil }
        let data = try await client
            .from("users")
            .select()
            .eq("id", value: session.user.id.uuidString)
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(User.self, from: data)
    }

    // MARK: - Vehicles

    func fetchVehicles(organizationId: UUID) async throws -> [Vehicle] {
        let data = try await client
            .from("vehicles")
            .select()
            .eq("organization_id", value: organizationId.uuidString)
            .order("updated_at", ascending: false)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Vehicle].self, from: data)
    }

    func fetchVehicle(id: UUID) async throws -> Vehicle {
        let data = try await client
            .from("vehicles")
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(Vehicle.self, from: data)
    }

    func createVehicle(_ vehicle: Vehicle) async throws -> Vehicle {
        let data = try await client
            .from("vehicles")
            .insert(vehicle)
            .select()
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(Vehicle.self, from: data)
    }

    func updateVehicleStatus(id: UUID, status: VehicleStatus) async throws {
        try await client
            .from("vehicles")
            .update(["status": status.rawValue, "updated_at": ISO8601DateFormatter().string(from: Date())])
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Inspections

    func fetchInspection(id: UUID) async throws -> Inspection {
        let data = try await client
            .from("inspections")
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(Inspection.self, from: data)
    }
}

// MARK: - JSON Decoder

extension JSONDecoder {
    static let supabase: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            if let date = formatter.date(from: dateString) {
                return date
            }
            let fallback = ISO8601DateFormatter()
            if let date = fallback.date(from: dateString) {
                return date
            }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
        return decoder
    }()
}
