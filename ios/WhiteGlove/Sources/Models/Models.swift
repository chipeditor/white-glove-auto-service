import Foundation

// MARK: - Theme (matches web globals.css)

enum Theme {
    // Core palette
    static let background = "#0d0d14"
    static let background2 = "#111122"
    static let card = "#1a1a2e"
    static let cardHover = "#22223a"
    static let border = "#2a2a40"

    // Brand
    static let gold = "#c8a45c"
    static let goldHover = "#b8944c"

    // Accents
    static let accent = "#4a90d9"
    static let blue = "#4a90d9"
    static let alert = "#e94560"
    static let red = "#e94560"
    static let green = "#34d399"

    // Text
    static let text = "#e8e8f0"
    static let text2 = "#9898b0"
    static let muted = "#6a6a82"
}

// MARK: - Enums

enum VehicleStatus: String, Codable, Sendable, CaseIterable {
    case intake = "intake"
    case intakeCompleted = "intake_completed"
    case awaitingApproval = "awaiting_approval"
    case inService = "in_service"
    case readyForDelivery = "ready_for_delivery"
    case delivered = "delivered"

    var displayName: String {
        switch self {
        case .intake: return "Intake"
        case .intakeCompleted: return "Intake Completed"
        case .awaitingApproval: return "Awaiting Approval"
        case .inService: return "In Service"
        case .readyForDelivery: return "Ready for Delivery"
        case .delivered: return "Delivered"
        }
    }

    var statusColor: String {
        switch self {
        case .intake: return Theme.text2
        case .intakeCompleted: return Theme.blue
        case .awaitingApproval: return "#f59e0b"
        case .inService: return Theme.blue
        case .readyForDelivery: return Theme.green
        case .delivered: return Theme.green
        }
    }
}

enum ServiceRequestStatus: String, Codable, Sendable, CaseIterable {
    case pending = "pending"
    case approved = "approved"
    case inProgress = "in_progress"
    case completed = "completed"
    case cancelled = "cancelled"

    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .approved: return "Approved"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }
}

enum InspectionStatus: String, Codable, Sendable {
    case pending = "pending"
    case inProgress = "in_progress"
    case completed = "completed"
}

enum InspectionType: String, Codable, Sendable {
    case intake = "intake"
    case preDelivery = "pre_delivery"
    case damage = "damage"
}

enum MediaType: String, Codable, Sendable {
    case photo = "photo"
    case video = "video"
    case document = "document"
}

enum NotificationType: String, Codable, Sendable {
    case update = "update"
    case alert = "alert"
    case approval = "approval"
    case completion = "completion"
}

enum DamageSeverity: String, Codable, Sendable {
    case minor = "minor"
    case moderate = "moderate"
    case severe = "severe"
}

enum UserRole: String, Codable, Sendable {
    case admin = "admin"
    case technician = "technician"
    case manager = "manager"
    case viewer = "viewer"
}

// MARK: - Models

struct Organization: Codable, Identifiable, Sendable {
    let id: UUID
    let name: String
    let slug: String
    let logoUrl: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, slug
        case logoUrl = "logo_url"
        case createdAt = "created_at"
    }
}

struct User: Codable, Identifiable, Sendable {
    let id: UUID
    let email: String
    let fullName: String
    let avatarUrl: String?
    let role: UserRole
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, role
        case fullName = "full_name"
        case avatarUrl = "avatar_url"
        case createdAt = "created_at"
    }
}

struct Membership: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let organizationId: UUID
    let role: UserRole
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, role
        case userId = "user_id"
        case organizationId = "organization_id"
        case createdAt = "created_at"
    }
}

struct Customer: Codable, Identifiable, Sendable {
    let id: UUID
    let organizationId: UUID
    let fullName: String
    let email: String?
    let phone: String?
    let address: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, phone, address
        case organizationId = "organization_id"
        case fullName = "full_name"
        case createdAt = "created_at"
    }
}

struct Vehicle: Codable, Identifiable, Sendable {
    let id: UUID
    let organizationId: UUID
    let customerId: UUID
    let vin: String?
    let year: Int?
    let make: String
    let model: String
    let color: String?
    let licensePlate: String?
    let mileage: Int?
    let status: VehicleStatus
    let notes: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, vin, year, make, model, color, mileage, status, notes
        case organizationId = "organization_id"
        case customerId = "customer_id"
        case licensePlate = "license_plate"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var displayName: String {
        let yearStr = year.map { "\($0) " } ?? ""
        return "\(yearStr)\(make) \(model)"
    }
}

struct ServiceRequest: Codable, Identifiable, Sendable {
    let id: UUID
    let vehicleId: UUID
    let organizationId: UUID
    let title: String
    let description: String?
    let status: ServiceRequestStatus
    let estimatedCost: Double?
    let approvedAt: Date?
    let completedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, description, status
        case vehicleId = "vehicle_id"
        case organizationId = "organization_id"
        case estimatedCost = "estimated_cost"
        case approvedAt = "approved_at"
        case completedAt = "completed_at"
        case createdAt = "created_at"
    }
}

struct Inspection: Codable, Identifiable, Sendable {
    let id: UUID
    let vehicleId: UUID
    let inspectorId: UUID?
    let type: InspectionType
    let status: InspectionStatus
    let notes: String?
    let completedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, status, notes
        case vehicleId = "vehicle_id"
        case inspectorId = "inspector_id"
        case completedAt = "completed_at"
        case createdAt = "created_at"
    }
}

struct InspectionSection: Codable, Identifiable, Sendable {
    let id: UUID
    let inspectionId: UUID
    let name: String
    let sortOrder: Int
    let items: [InspectionItem]?

    enum CodingKeys: String, CodingKey {
        case id, name, items
        case inspectionId = "inspection_id"
        case sortOrder = "sort_order"
    }
}

struct InspectionItem: Codable, Identifiable, Sendable {
    let id: UUID
    let sectionId: UUID
    let label: String
    let passed: Bool?
    let notes: String?
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, label, passed, notes
        case sectionId = "section_id"
        case sortOrder = "sort_order"
    }
}

struct MediaAsset: Codable, Identifiable, Sendable {
    let id: UUID
    let vehicleId: UUID?
    let inspectionId: UUID?
    let type: MediaType
    let url: String
    let thumbnailUrl: String?
    let caption: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, url, caption
        case vehicleId = "vehicle_id"
        case inspectionId = "inspection_id"
        case thumbnailUrl = "thumbnail_url"
        case createdAt = "created_at"
    }
}

struct DamageMarker: Codable, Identifiable, Sendable {
    let id: UUID
    let inspectionId: UUID
    let xPosition: Double
    let yPosition: Double
    let severity: DamageSeverity
    let description: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, severity, description
        case inspectionId = "inspection_id"
        case xPosition = "x_position"
        case yPosition = "y_position"
        case createdAt = "created_at"
    }
}

struct Checklist: Codable, Identifiable, Sendable {
    let id: UUID
    let vehicleId: UUID
    let title: String
    let type: String
    let items: [ChecklistItem]?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, type, items
        case vehicleId = "vehicle_id"
        case createdAt = "created_at"
    }
}

struct ChecklistItem: Codable, Identifiable, Sendable {
    let id: UUID
    let checklistId: UUID
    let label: String
    var isCompleted: Bool
    let completedBy: UUID?
    let completedAt: Date?
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, label
        case checklistId = "checklist_id"
        case isCompleted = "is_completed"
        case completedBy = "completed_by"
        case completedAt = "completed_at"
        case sortOrder = "sort_order"
    }
}

struct Notification: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let type: NotificationType
    let title: String
    let body: String
    let isRead: Bool
    let vehicleId: UUID?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, title, body
        case userId = "user_id"
        case isRead = "is_read"
        case vehicleId = "vehicle_id"
        case createdAt = "created_at"
    }
}

struct AffiliateRecommendation: Codable, Identifiable, Sendable {
    let id: UUID
    let vehicleId: UUID
    let organizationId: UUID
    let affiliateName: String
    let serviceType: String
    let notes: String?
    let status: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, notes, status
        case vehicleId = "vehicle_id"
        case organizationId = "organization_id"
        case affiliateName = "affiliate_name"
        case serviceType = "service_type"
        case createdAt = "created_at"
    }
}
