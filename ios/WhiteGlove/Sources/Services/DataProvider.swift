import Foundation

/// Protocol defining all data operations for the app.
/// Both MockDataProvider and SupabaseService conform to this,
/// allowing seamless switching between demo and live modes.
@MainActor
protocol DataProvider {
    // Auth
    func signIn(email: String, password: String) async throws -> User
    func signOut() async throws
    func getCurrentUser() async throws -> User?

    // Vehicles
    func fetchVehicles(organizationId: UUID) async throws -> [Vehicle]
    func fetchVehicle(id: UUID) async throws -> Vehicle
    func fetchVehiclesForCustomer(email: String) async throws -> [Vehicle]
    func createVehicle(_ vehicle: Vehicle) async throws -> Vehicle
    func updateVehicleStatus(id: UUID, status: VehicleStatus) async throws

    // Customers
    func fetchCustomers(organizationId: UUID) async throws -> [Customer]
    func fetchCustomer(id: UUID) async throws -> Customer
    func createCustomer(_ customer: Customer) async throws -> Customer

    // Service Requests
    func fetchServiceRequests(organizationId: UUID) async throws -> [ServiceRequest]
    func fetchServiceRequest(id: UUID) async throws -> ServiceRequest
    func createServiceRequest(vehicleId: UUID, organizationId: UUID, title: String, description: String?) async throws -> ServiceRequest
    func updateServiceRequestStatus(id: UUID, status: ServiceRequestStatus) async throws

    // Inspections
    func createInspection(vehicleId: UUID, serviceRequestId: UUID?, organizationId: UUID, inspectorId: UUID?, type: InspectionType) async throws -> Inspection
    func fetchInspections(vehicleId: UUID) async throws -> [Inspection]
    func fetchInspection(id: UUID) async throws -> Inspection
    func fetchInspectionSections(inspectionId: UUID) async throws -> [InspectionSection]
    func updateInspectionItem(id: UUID, passed: Bool?, notes: String?) async throws
    func updateInspectionStatus(id: UUID, status: InspectionStatus) async throws

    // Media
    func uploadPhoto(imageData: Data, vehicleId: UUID, inspectionId: UUID?, inspectionItemId: UUID?, organizationId: UUID) async throws -> MediaAsset
    func fetchMediaAssets(vehicleId: UUID) async throws -> [MediaAsset]

    // Checklists
    func fetchChecklists(vehicleId: UUID) async throws -> [Checklist]
    func updateChecklistItem(id: UUID, completed: Bool) async throws

    // Appointments
    func fetchAppointments(organizationId: UUID) async throws -> [Appointment]
    func updateAppointmentStatus(id: UUID, status: AppointmentStatus) async throws

    // Audit Events
    func fetchAuditEvents(entityType: String, entityId: UUID) async throws -> [AuditEvent]

    // Notifications
    func fetchNotifications(userId: UUID) async throws -> [Notification]
    func markNotificationRead(id: UUID) async throws
    func markAllNotificationsRead(userId: UUID) async throws

    // Line Items
    func fetchLineItems(serviceRequestId: UUID) async throws -> [RepairOrderLine]
    func createLineItem(serviceRequestId: UUID, organizationId: UUID, lineType: LineItemType, description: String, quantity: Double, unitPrice: Double) async throws -> RepairOrderLine
    func deleteLineItem(id: UUID) async throws

    // Canned Jobs
    func fetchCannedJobs(organizationId: UUID) async throws -> [CannedJob]
    func createCannedJob(organizationId: UUID, name: String, description: String?, category: CannedJobCategory, laborHours: Double, laborRate: Double, partsCost: Double) async throws -> CannedJob
    func deleteCannedJob(id: UUID) async throws

    // Health Board
    func fetchHealthBoard(organizationId: UUID) async throws -> HealthBoardData

    // Staff
    func fetchStaff(organizationId: UUID) async throws -> [User]
}
