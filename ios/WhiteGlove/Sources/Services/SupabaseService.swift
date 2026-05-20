import Foundation
import Supabase

/// Live Supabase data provider. Shares the same database as the web app.
/// Both platforms use identical table schemas and UUIDs.
@MainActor
final class SupabaseService: DataProvider {
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

    // MARK: - Customers

    func fetchCustomers(organizationId: UUID) async throws -> [Customer] {
        let data = try await client
            .from("customers")
            .select()
            .eq("organization_id", value: organizationId.uuidString)
            .order("full_name")
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Customer].self, from: data)
    }

    func fetchCustomer(id: UUID) async throws -> Customer {
        let data = try await client
            .from("customers")
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(Customer.self, from: data)
    }

    func createCustomer(_ customer: Customer) async throws -> Customer {
        let data = try await client
            .from("customers")
            .insert(customer)
            .select()
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(Customer.self, from: data)
    }

    // MARK: - Service Requests

    func fetchServiceRequests(organizationId: UUID) async throws -> [ServiceRequest] {
        let data = try await client
            .from("service_requests")
            .select()
            .eq("organization_id", value: organizationId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([ServiceRequest].self, from: data)
    }

    func fetchServiceRequest(id: UUID) async throws -> ServiceRequest {
        let data = try await client
            .from("service_requests")
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(ServiceRequest.self, from: data)
    }

    // MARK: - Inspections

    func fetchInspections(vehicleId: UUID) async throws -> [Inspection] {
        let data = try await client
            .from("inspections")
            .select()
            .eq("vehicle_id", value: vehicleId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Inspection].self, from: data)
    }

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

    func fetchInspectionSections(inspectionId: UUID) async throws -> [InspectionSection] {
        let data = try await client
            .from("inspection_sections")
            .select("*, items:inspection_items(*)")
            .eq("inspection_id", value: inspectionId.uuidString)
            .order("sort_order")
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([InspectionSection].self, from: data)
    }

    // MARK: - Checklists

    func fetchChecklists(vehicleId: UUID) async throws -> [Checklist] {
        let data = try await client
            .from("checklists")
            .select("*, items:checklist_items(*)")
            .eq("vehicle_id", value: vehicleId.uuidString)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Checklist].self, from: data)
    }

    func updateChecklistItem(id: UUID, completed: Bool) async throws {
        var updates: [String: String] = [
            "is_completed": completed ? "true" : "false",
            "updated_at": ISO8601DateFormatter().string(from: Date()),
        ]
        if completed {
            updates["completed_at"] = ISO8601DateFormatter().string(from: Date())
        }
        try await client
            .from("checklist_items")
            .update(updates)
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Notifications

    func fetchNotifications(userId: UUID) async throws -> [Notification] {
        let data = try await client
            .from("notifications")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Notification].self, from: data)
    }

    func markNotificationRead(id: UUID) async throws {
        try await client
            .from("notifications")
            .update(["read": "true", "read_at": ISO8601DateFormatter().string(from: Date())])
            .eq("id", value: id.uuidString)
            .execute()
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
