import Foundation
import Supabase

/// Live Supabase data provider. Shares the same database as the web app.
/// Both platforms use identical table schemas and UUIDs.
@MainActor
final class SupabaseService: DataProvider {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: SupabaseConfig.url,
            supabaseKey: SupabaseConfig.anonKey
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

    func fetchVehiclesForCustomer(email: String) async throws -> [Vehicle] {
        // Get customer by email, then fetch their vehicles
        let custData = try await client
            .from("customers")
            .select()
            .eq("email", value: email)
            .limit(1)
            .execute()
            .value as Data
        let customers = try JSONDecoder.supabase.decode([Customer].self, from: custData)
        guard let customer = customers.first else { return [] }
        let data = try await client
            .from("vehicles")
            .select()
            .eq("customer_id", value: customer.id.uuidString)
            .order("updated_at", ascending: false)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Vehicle].self, from: data)
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

    func createServiceRequest(vehicleId: UUID, organizationId: UUID, title: String, description: String?) async throws -> ServiceRequest {
        let payload: [String: String] = [
            "vehicle_id": vehicleId.uuidString,
            "organization_id": organizationId.uuidString,
            "title": title,
            "description": description ?? "",
            "status": "submitted",
            "priority": "1",
        ].compactMapValues { $0 }

        let data = try await client
            .from("service_requests")
            .insert(payload)
            .select()
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

    func updateInspectionItem(id: UUID, passed: Bool?, notes: String?) async throws {
        var updates: [String: String] = [
            "updated_at": ISO8601DateFormatter().string(from: Date()),
        ]
        if let passed {
            updates["passed"] = passed ? "true" : "false"
        }
        if let notes {
            updates["notes"] = notes
        }
        try await client
            .from("inspection_items")
            .update(updates)
            .eq("id", value: id.uuidString)
            .execute()
    }

    func updateInspectionStatus(id: UUID, status: InspectionStatus) async throws {
        var updates: [String: String] = [
            "status": status.rawValue,
            "updated_at": ISO8601DateFormatter().string(from: Date()),
        ]
        if status == .completed {
            updates["completed_at"] = ISO8601DateFormatter().string(from: Date())
        }
        try await client
            .from("inspections")
            .update(updates)
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Media

    func uploadPhoto(imageData: Data, vehicleId: UUID, inspectionId: UUID?, inspectionItemId: UUID?, organizationId: UUID) async throws -> MediaAsset {
        let fileName = "\(UUID().uuidString).jpg"
        let path = "\(organizationId.uuidString)/\(vehicleId.uuidString)/\(fileName)"

        try await client.storage
            .from("vehicle-media")
            .upload(path, data: imageData, options: .init(contentType: "image/jpeg"))

        let publicURL = try client.storage
            .from("vehicle-media")
            .getPublicURL(path: path)

        let session = try await client.auth.session
        let insertPayload: [String: String?] = [
            "organization_id": organizationId.uuidString,
            "vehicle_id": vehicleId.uuidString,
            "inspection_id": inspectionId?.uuidString,
            "inspection_item_id": inspectionItemId?.uuidString,
            "uploaded_by": session.user.id.uuidString,
            "type": "photo",
            "storage_path": path,
            "url": publicURL.absoluteString,
            "file_name": fileName,
            "file_size": "\(imageData.count)",
            "mime_type": "image/jpeg",
        ]

        let data = try await client
            .from("media_assets")
            .insert(insertPayload.compactMapValues { $0 })
            .select()
            .single()
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode(MediaAsset.self, from: data)
    }

    func fetchMediaAssets(vehicleId: UUID) async throws -> [MediaAsset] {
        let data = try await client
            .from("media_assets")
            .select()
            .eq("vehicle_id", value: vehicleId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([MediaAsset].self, from: data)
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

    // MARK: - Appointments

    func fetchAppointments(organizationId: UUID) async throws -> [Appointment] {
        let data = try await client
            .from("appointments")
            .select()
            .eq("organization_id", value: organizationId.uuidString)
            .order("scheduled_date", ascending: true)
            .order("scheduled_time", ascending: true)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([Appointment].self, from: data)
    }

    func updateAppointmentStatus(id: UUID, status: AppointmentStatus) async throws {
        try await client
            .from("appointments")
            .update(["status": status.rawValue])
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Audit Events

    func fetchAuditEvents(entityType: String, entityId: UUID) async throws -> [AuditEvent] {
        let data = try await client
            .from("audit_events")
            .select()
            .eq("entity_type", value: entityType)
            .eq("entity_id", value: entityId.uuidString)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value as Data
        return try JSONDecoder.supabase.decode([AuditEvent].self, from: data)
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

    func markAllNotificationsRead(userId: UUID) async throws {
        try await client
            .from("notifications")
            .update(["read": "true", "read_at": ISO8601DateFormatter().string(from: Date())])
            .eq("user_id", value: userId.uuidString)
            .eq("read", value: "false")
            .execute()
    }
}

// MARK: - JSON Decoder

extension JSONDecoder {
    static let supabase: JSONDecoder = {
        let decoder = JSONDecoder()
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
