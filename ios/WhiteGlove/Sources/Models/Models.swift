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
    case intakeStarted = "intake_started"
    case intakeCompleted = "intake_completed"
    case awaitingApproval = "awaiting_approval"
    case inService = "in_service"
    case readyForDelivery = "ready_for_delivery"
    case delivered = "delivered"
    case archived = "archived"

    var displayName: String {
        switch self {
        case .intakeStarted: return "Intake Started"
        case .intakeCompleted: return "Intake Completed"
        case .awaitingApproval: return "Awaiting Approval"
        case .inService: return "In Service"
        case .readyForDelivery: return "Ready for Delivery"
        case .delivered: return "Delivered"
        case .archived: return "Archived"
        }
    }

    var statusColor: String {
        switch self {
        case .intakeStarted: return Theme.text2
        case .intakeCompleted: return Theme.blue
        case .awaitingApproval: return "#f59e0b"
        case .inService: return Theme.blue
        case .readyForDelivery: return Theme.green
        case .delivered: return Theme.green
        case .archived: return Theme.muted
        }
    }
}

enum ServiceRequestStatus: String, Codable, Sendable, CaseIterable {
    case draft = "draft"
    case submitted = "submitted"
    case awaitingCustomerApproval = "awaiting_customer_approval"
    case approved = "approved"
    case declined = "declined"
    case inProgress = "in_progress"
    case qualityControl = "quality_control"
    case readyForDelivery = "ready_for_delivery"
    case completed = "completed"

    var displayName: String {
        switch self {
        case .draft: return "Draft"
        case .submitted: return "Submitted"
        case .awaitingCustomerApproval: return "Awaiting Approval"
        case .approved: return "Approved"
        case .declined: return "Declined"
        case .inProgress: return "In Progress"
        case .qualityControl: return "Quality Control"
        case .readyForDelivery: return "Ready for Delivery"
        case .completed: return "Completed"
        }
    }
}

enum InspectionStatus: String, Codable, Sendable {
    case notStarted = "not_started"
    case inProgress = "in_progress"
    case completed = "completed"
    case needsAttention = "needs_attention"
    case signedOff = "signed_off"
}

enum InspectionType: String, Codable, Sendable {
    case intake = "intake"
    case mechanical = "mechanical"
    case cosmetic = "cosmetic"
    case delivery = "delivery"
    case qualityControl = "quality_control"
    case spotCheck = "spot_check"
}

enum MediaType: String, Codable, Sendable {
    case photo = "photo"
    case video = "video"
    case document = "document"
}

enum NotificationType: String, Codable, Sendable {
    case intakeStarted = "intake_started"
    case intakeCompleted = "intake_completed"
    case approvalNeeded = "approval_needed"
    case approvalReceived = "approval_received"
    case serviceStarted = "service_started"
    case serviceCompleted = "service_completed"
    case deliveryReady = "delivery_ready"
    case vehicleDelivered = "vehicle_delivered"
    case issueFlagged = "issue_flagged"
    case reportReady = "report_ready"
}

enum AppointmentStatus: String, Codable, Sendable, CaseIterable {
    case scheduled = "scheduled"
    case confirmed = "confirmed"
    case checkedIn = "checked_in"
    case inProgress = "in_progress"
    case completed = "completed"
    case cancelled = "cancelled"
    case noShow = "no_show"

    var displayName: String {
        switch self {
        case .scheduled: return "Scheduled"
        case .confirmed: return "Confirmed"
        case .checkedIn: return "Checked In"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .noShow: return "No Show"
        }
    }

    var statusColor: String {
        switch self {
        case .scheduled: return Theme.blue
        case .confirmed: return Theme.green
        case .checkedIn: return Theme.gold
        case .inProgress: return "#e89040"
        case .completed: return Theme.green
        case .cancelled: return Theme.red
        case .noShow: return Theme.muted
        }
    }

    var nextActions: [AppointmentStatus] {
        switch self {
        case .scheduled: return [.confirmed, .cancelled]
        case .confirmed: return [.checkedIn, .cancelled, .noShow]
        case .checkedIn: return [.inProgress, .cancelled]
        case .inProgress: return [.completed]
        default: return []
        }
    }
}

enum DamageSeverity: String, Codable, Sendable {
    case minor = "minor"
    case moderate = "moderate"
    case severe = "severe"
}

enum UserRole: String, Codable, Sendable {
    case superAdmin = "super_admin"
    case shopAdmin = "shop_admin"
    case serviceAdvisor = "service_advisor"
    case technician = "technician"
    case deliverySpecialist = "delivery_specialist"
    case customer = "customer"
}

// MARK: - Line Item & Work Enums

enum LineItemType: String, Codable, Sendable, CaseIterable {
    case labor = "labor"
    case parts = "parts"
    case sublet = "sublet"
    case fee = "fee"
    case discount = "discount"
}

enum LineItemStatus: String, Codable, Sendable, CaseIterable {
    case pending = "pending"
    case approved = "approved"
    case declined = "declined"
    case inProgress = "in_progress"
    case completed = "completed"

    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .approved: return "Approved"
        case .declined: return "Declined"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        }
    }
}

enum PartsStatus: String, Codable, Sendable {
    case notNeeded = "not_needed"
    case toOrder = "to_order"
    case ordered = "ordered"
    case inTransit = "in_transit"
    case received = "received"
    case installed = "installed"
}

enum PartsTier: String, Codable, Sendable {
    case oem = "oem"
    case oemPlus = "oem_plus"
    case performance = "performance"
    case economy = "economy"
}

enum WorkPhase: String, Codable, Sendable, CaseIterable {
    case diagnosis = "diagnosis"
    case scoped = "scoped"
    case active = "active"
    case hold = "hold"
    case qc = "qc"
    case complete = "complete"

    var displayName: String {
        switch self {
        case .diagnosis: return "Diagnosis"
        case .scoped: return "Scoped"
        case .active: return "Active"
        case .hold: return "Hold"
        case .qc: return "QC"
        case .complete: return "Complete"
        }
    }

    var color: String {
        switch self {
        case .diagnosis: return Theme.blue
        case .scoped: return Theme.text2
        case .active: return Theme.gold
        case .hold: return "#e87040"
        case .qc: return Theme.blue
        case .complete: return Theme.green
        }
    }
}

enum HealthStatus: String, Codable, Sendable {
    case onTrack = "on_track"
    case tight = "tight"
    case atRisk = "at_risk"
    case blocked = "blocked"
    case overdue = "overdue"

    var color: String {
        switch self {
        case .onTrack: return "#c8a45c"
        case .tight: return "#9ca3af"
        case .atRisk, .blocked: return "#e87040"
        case .overdue: return "#ff3b3b"
        }
    }
}

enum CannedJobCategory: String, Codable, Sendable, CaseIterable {
    case maintenance = "Maintenance"
    case brakes = "Brakes"
    case engine = "Engine"
    case transmission = "Transmission"
    case suspension = "Suspension"
    case climate = "Climate"
    case electrical = "Electrical"
    case diagnostics = "Diagnostics"
    case detailing = "Detailing"
    case other = "Other"
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
    let customerId: UUID?
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
    let priority: Int
    let estimatedCompletion: Date?
    let actualCompletion: Date?
    let promisedAt: Date?
    let diagnosisCompletedAt: Date?
    let isDiscovery: Bool?
    let parentRequestId: UUID?
    let subtotal: Double?
    let phase: WorkPhase?
    let healthStatus: HealthStatus?
    let technicianId: UUID?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, description, status, priority, subtotal, phase
        case vehicleId = "vehicle_id"
        case organizationId = "organization_id"
        case estimatedCompletion = "estimated_completion"
        case actualCompletion = "actual_completion"
        case promisedAt = "promised_at"
        case diagnosisCompletedAt = "diagnosis_completed_at"
        case isDiscovery = "is_discovery"
        case parentRequestId = "parent_request_id"
        case healthStatus = "health_status"
        case technicianId = "technician_id"
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
    let organizationId: UUID
    let vehicleId: UUID?
    let inspectionId: UUID?
    let inspectionItemId: UUID?
    let uploadedBy: UUID?
    let type: MediaType
    let storagePath: String
    let url: String
    let thumbnailUrl: String?
    let fileName: String?
    let fileSize: Int?
    let mimeType: String?
    let caption: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, url, caption
        case organizationId = "organization_id"
        case vehicleId = "vehicle_id"
        case inspectionId = "inspection_id"
        case inspectionItemId = "inspection_item_id"
        case uploadedBy = "uploaded_by"
        case storagePath = "storage_path"
        case thumbnailUrl = "thumbnail_url"
        case fileName = "file_name"
        case fileSize = "file_size"
        case mimeType = "mime_type"
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
    var completed: Bool
    let completedBy: UUID?
    let completedAt: Date?
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, label, completed
        case checklistId = "checklist_id"
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
    let read: Bool
    let vehicleId: UUID?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, title, body, read
        case userId = "user_id"
        case vehicleId = "vehicle_id"
        case createdAt = "created_at"
    }
}

struct Appointment: Codable, Identifiable, Sendable {
    let id: UUID
    let organizationId: UUID
    let customerName: String
    let customerEmail: String?
    let customerPhone: String?
    let serviceType: String
    let description: String?
    let scheduledDate: String
    let scheduledTime: String
    let durationMinutes: Int
    var status: AppointmentStatus
    let notes: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, description, status, notes
        case organizationId = "organization_id"
        case customerName = "customer_name"
        case customerEmail = "customer_email"
        case customerPhone = "customer_phone"
        case serviceType = "service_type"
        case scheduledDate = "scheduled_date"
        case scheduledTime = "scheduled_time"
        case durationMinutes = "duration_minutes"
        case createdAt = "created_at"
    }
}

// MARK: - Audit Events

enum AuditAction: String, Codable, Sendable {
    case created, updated, deleted
    case statusChanged = "status_changed"
    case assigned, signed, uploaded, approved, declined, flagged
    case inspectionCompleted = "inspection_completed"
    case inspectionStarted = "inspection_started"
    case itemPassed = "item_passed"
    case itemFailed = "item_failed"
    case smsSent = "sms_sent"
    case appointmentBooked = "appointment_booked"
    case appointmentCancelled = "appointment_cancelled"
    case lineItemAdded = "line_item_added"
    case lineItemRemoved = "line_item_removed"
    case invoiceGenerated = "invoice_generated"
    case paymentReceived = "payment_received"

    var displayName: String {
        rawValue.replacingOccurrences(of: "_", with: " ").capitalized
    }

    var icon: String {
        switch self {
        case .created: return "plus.circle.fill"
        case .updated: return "pencil.circle.fill"
        case .deleted: return "trash.circle.fill"
        case .statusChanged: return "arrow.triangle.2.circlepath"
        case .assigned: return "person.badge.plus"
        case .signed: return "signature"
        case .uploaded: return "arrow.up.circle.fill"
        case .approved: return "checkmark.circle.fill"
        case .declined: return "xmark.circle.fill"
        case .flagged: return "flag.fill"
        case .inspectionCompleted: return "checkmark.seal.fill"
        case .inspectionStarted: return "play.circle.fill"
        case .itemPassed: return "checkmark.square.fill"
        case .itemFailed: return "xmark.square.fill"
        case .smsSent: return "message.fill"
        case .appointmentBooked: return "calendar.badge.plus"
        case .appointmentCancelled: return "calendar.badge.minus"
        case .lineItemAdded: return "plus.rectangle.fill"
        case .lineItemRemoved: return "minus.rectangle.fill"
        case .invoiceGenerated: return "doc.text.fill"
        case .paymentReceived: return "dollarsign.circle.fill"
        }
    }

    var color: String {
        switch self {
        case .created, .approved, .inspectionCompleted, .itemPassed, .paymentReceived:
            return Theme.green
        case .deleted, .declined, .itemFailed, .flagged, .appointmentCancelled:
            return Theme.red
        case .statusChanged, .assigned, .inspectionStarted, .appointmentBooked:
            return Theme.blue
        case .uploaded, .smsSent, .lineItemAdded, .lineItemRemoved, .invoiceGenerated:
            return Theme.gold
        case .updated, .signed:
            return Theme.text2
        }
    }
}

struct AuditEvent: Codable, Identifiable, Sendable {
    let id: UUID
    let organizationId: UUID
    let actorId: UUID?
    let action: AuditAction
    let entityType: String
    let entityId: UUID
    let changes: [String: AnyCodable]?
    let metadata: [String: AnyCodable]?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, action, changes, metadata
        case organizationId = "organization_id"
        case actorId = "actor_id"
        case entityType = "entity_type"
        case entityId = "entity_id"
        case createdAt = "created_at"
    }
}

struct AnyCodable: Codable, Sendable {
    let value: Any

    init(_ value: Any) { self.value = value }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let s = try? container.decode(String.self) { value = s }
        else if let i = try? container.decode(Int.self) { value = i }
        else if let d = try? container.decode(Double.self) { value = d }
        else if let b = try? container.decode(Bool.self) { value = b }
        else { value = (try? container.decode(String.self)) ?? "" }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let s = value as? String { try container.encode(s) }
        else if let i = value as? Int { try container.encode(i) }
        else if let d = value as? Double { try container.encode(d) }
        else if let b = value as? Bool { try container.encode(b) }
        else { try container.encode(String(describing: value)) }
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

// MARK: - Repair Order Line Items

struct RepairOrderLine: Codable, Identifiable, Sendable {
    let id: UUID
    let serviceRequestId: UUID
    let organizationId: UUID
    let lineType: LineItemType
    let description: String
    let quantity: Double
    let unitPrice: Double
    let discountAmount: Double
    let total: Double
    let status: LineItemStatus
    let phase: WorkPhase?
    let partsStatus: PartsStatus?
    let partsTier: PartsTier?
    let partsEta: Date?
    let technicianId: UUID?
    let cannedJobId: UUID?
    let sortOrder: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, description, quantity, total, status, phase
        case serviceRequestId = "service_request_id"
        case organizationId = "organization_id"
        case lineType = "line_type"
        case unitPrice = "unit_price"
        case discountAmount = "discount_amount"
        case partsStatus = "parts_status"
        case partsTier = "parts_tier"
        case partsEta = "parts_eta"
        case technicianId = "technician_id"
        case cannedJobId = "canned_job_id"
        case sortOrder = "sort_order"
        case createdAt = "created_at"
    }
}

// MARK: - Canned Jobs

struct CannedJob: Codable, Identifiable, Sendable {
    let id: UUID
    let organizationId: UUID
    let name: String
    let description: String?
    let category: CannedJobCategory
    let laborHours: Double
    let laborRate: Double
    let partsCost: Double
    let totalEstimate: Double
    let isActive: Bool
    let sortOrder: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description, category
        case organizationId = "organization_id"
        case laborHours = "labor_hours"
        case laborRate = "labor_rate"
        case partsCost = "parts_cost"
        case totalEstimate = "total_estimate"
        case isActive = "is_active"
        case sortOrder = "sort_order"
        case createdAt = "created_at"
    }
}

// MARK: - Health Board

struct HealthBoardSR: Codable, Identifiable, Sendable {
    let id: UUID
    let title: String
    let status: ServiceRequestStatus
    let phase: WorkPhase?
    let healthStatus: HealthStatus?
    let estimatedCompletion: Date?
    let promisedAt: Date?
    let vehicleYear: Int?
    let vehicleMake: String?
    let vehicleModel: String?
    let technicianName: String?
    let remainingHours: Double?

    enum CodingKeys: String, CodingKey {
        case id, title, status, phase
        case healthStatus = "health_status"
        case estimatedCompletion = "estimated_completion"
        case promisedAt = "promised_at"
        case vehicleYear = "vehicle_year"
        case vehicleMake = "vehicle_make"
        case vehicleModel = "vehicle_model"
        case technicianName = "technician_name"
        case remainingHours = "remaining_hours"
    }

    var vehicleDisplayName: String {
        let year = vehicleYear.map { "\($0) " } ?? ""
        return "\(year)\(vehicleMake ?? "") \(vehicleModel ?? "")".trimmingCharacters(in: .whitespaces)
    }
}

struct TechLane: Codable, Identifiable, Sendable {
    var id: String { name }
    let name: String
    let jobs: [HealthBoardSR]
    let capacity: Double
    let utilized: Double
}

struct ShopPulse: Codable, Sendable {
    let onTimePercent: Int
    let vehiclesActive: Int
    let atRiskCount: Int
    let agingCount: Int
    let comebackCount: Int

    enum CodingKeys: String, CodingKey {
        case onTimePercent = "on_time_percent"
        case vehiclesActive = "vehicles_active"
        case atRiskCount = "at_risk_count"
        case agingCount = "aging_count"
        case comebackCount = "comeback_count"
    }
}

struct HealthBoardData: Codable, Sendable {
    let pulse: ShopPulse
    let lanes: [TechLane]
}

// MARK: - Schedule

struct ScheduleEntry: Identifiable, Sendable {
    let id: UUID
    let title: String
    let vehicleName: String
    let technicianName: String?
    let status: ServiceRequestStatus
    let estimatedCompletion: Date?
    let startDate: Date?
}

