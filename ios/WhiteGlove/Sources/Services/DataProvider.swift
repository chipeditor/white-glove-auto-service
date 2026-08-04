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

    // Inspections
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

    // Notifications
    func fetchNotifications(userId: UUID) async throws -> [Notification]
    func markNotificationRead(id: UUID) async throws
}
