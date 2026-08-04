import Foundation

/// Mock data provider using the same demo data as the web app.
/// Uses identical UUIDs so both platforms reference the same Supabase rows
/// once a live database is connected.
@MainActor
final class MockDataProvider: DataProvider {
    static let shared = MockDataProvider()

    // MARK: - Shared UUIDs (match web mock-data.ts and seed.sql)

    static let orgId        = UUID(uuidString: "a0000000-0000-0000-0000-000000000001")!
    static let userAdminId  = UUID(uuidString: "b0000000-0000-0000-0000-000000000001")!
    static let userAdvisorId = UUID(uuidString: "b0000000-0000-0000-0000-000000000002")!
    static let userTechId   = UUID(uuidString: "b0000000-0000-0000-0000-000000000003")!
    static let userTech2Id  = UUID(uuidString: "b0000000-0000-0000-0000-000000000004")!
    static let userMechId   = UUID(uuidString: "b0000000-0000-0000-0000-000000000005")!
    static let userCustId   = UUID(uuidString: "b0000000-0000-0000-0000-000000000006")!

    static let cust1Id = UUID(uuidString: "c0000000-0000-0000-0000-000000000001")!
    static let cust2Id = UUID(uuidString: "c0000000-0000-0000-0000-000000000002")!
    static let cust3Id = UUID(uuidString: "c0000000-0000-0000-0000-000000000003")!
    static let cust4Id = UUID(uuidString: "c0000000-0000-0000-0000-000000000004")!
    static let cust5Id = UUID(uuidString: "c0000000-0000-0000-0000-000000000005")!

    static let veh1Id = UUID(uuidString: "d0000000-0000-0000-0000-000000000001")!
    static let veh2Id = UUID(uuidString: "d0000000-0000-0000-0000-000000000002")!
    static let veh3Id = UUID(uuidString: "d0000000-0000-0000-0000-000000000003")!
    static let veh4Id = UUID(uuidString: "d0000000-0000-0000-0000-000000000004")!
    static let veh5Id = UUID(uuidString: "d0000000-0000-0000-0000-000000000005")!

    static let sr1Id = UUID(uuidString: "e0000000-0000-0000-0000-000000000001")!

    static let insp1Id = UUID(uuidString: "f0000000-0000-0000-0000-000000000001")!
    static let insp2Id = UUID(uuidString: "f0000000-0000-0000-0000-000000000002")!

    // MARK: - Time helpers

    private static func ago(_ minutes: Int) -> Date {
        Date(timeIntervalSinceNow: -Double(minutes) * 60)
    }

    // MARK: - Users

    let users: [User] = [
        User(id: userAdminId, email: "john@whiteglove.com", fullName: "John Smith",
             avatarUrl: nil, role: .shopAdmin, createdAt: ago(50400)),
        User(id: userAdvisorId, email: "lisa@whiteglove.com", fullName: "Lisa Chen",
             avatarUrl: nil, role: .serviceAdvisor, createdAt: ago(50400)),
        User(id: userTechId, email: "james@whiteglove.com", fullName: "James Taylor",
             avatarUrl: nil, role: .technician, createdAt: ago(40320)),
        User(id: userTech2Id, email: "maria@whiteglove.com", fullName: "Maria Garcia",
             avatarUrl: nil, role: .technician, createdAt: ago(40320)),
        User(id: userMechId, email: "robert@whiteglove.com", fullName: "Robert Kim",
             avatarUrl: nil, role: .technician, createdAt: ago(30240)),
        User(id: userCustId, email: "mike.johnson@email.com", fullName: "Mike Johnson",
             avatarUrl: nil, role: .customer, createdAt: ago(10080)),
    ]

    // MARK: - Customers

    let customers: [Customer] = [
        Customer(id: cust1Id, organizationId: orgId, fullName: "Mike Johnson",
                 email: "mike.johnson@email.com", phone: "(555) 123-4567", address: nil, createdAt: ago(10080)),
        Customer(id: cust2Id, organizationId: orgId, fullName: "Sarah Williams",
                 email: "sarah.w@email.com", phone: "(555) 234-5678", address: nil, createdAt: ago(20160)),
        Customer(id: cust3Id, organizationId: orgId, fullName: "David Chen",
                 email: "david.chen@email.com", phone: "(555) 345-6789", address: nil, createdAt: ago(30240)),
        Customer(id: cust4Id, organizationId: orgId, fullName: "Alex Rodriguez",
                 email: "alex.r@email.com", phone: "(555) 456-7890", address: nil, createdAt: ago(40320)),
        Customer(id: cust5Id, organizationId: orgId, fullName: "Emily Davis",
                 email: "emily.d@email.com", phone: "(555) 567-8901", address: nil, createdAt: ago(50400)),
    ]

    // MARK: - Vehicles

    var vehicles: [Vehicle] = [
        Vehicle(id: veh1Id, organizationId: orgId, customerId: cust1Id,
                vin: "1G1YB2D73F5100001", year: 2015, make: "Chevrolet", model: "Corvette",
                color: "Torch Red", licensePlate: "ABC1234", mileage: 5312,
                status: .inService, notes: nil,
                createdAt: ago(2880), updatedAt: ago(2)),
        Vehicle(id: veh2Id, organizationId: orgId, customerId: cust2Id,
                vin: "WP0A82A99MS123456", year: 2021, make: "Porsche", model: "911 Carrera S",
                color: "GT Silver", licensePlate: nil, mileage: 12450,
                status: .readyForDelivery, notes: nil,
                createdAt: ago(4320), updatedAt: ago(60)),
        Vehicle(id: veh3Id, organizationId: orgId, customerId: cust3Id,
                vin: "WBS4Y9C08L5P12345", year: 2020, make: "BMW", model: "M4 Competition",
                color: "Isle of Man Green", licensePlate: nil, mileage: 28900,
                status: .awaitingApproval, notes: nil,
                createdAt: ago(10080), updatedAt: ago(180)),
        Vehicle(id: veh4Id, organizationId: orgId, customerId: cust4Id,
                vin: "WDB4632761X345678", year: 2019, make: "Mercedes-Benz", model: "G63 AMG",
                color: "Obsidian Black", licensePlate: nil, mileage: 34200,
                status: .intakeStarted, notes: nil,
                createdAt: ago(14400), updatedAt: ago(300)),
        Vehicle(id: veh5Id, organizationId: orgId, customerId: cust5Id,
                vin: "WUAPWAF55JA123456", year: 2018, make: "Audi", model: "RS5",
                color: "Nardo Gray", licensePlate: nil, mileage: 41000,
                status: .inService, notes: nil,
                createdAt: ago(20160), updatedAt: ago(1440)),
    ]

    // MARK: - Service Requests

    let serviceRequests: [ServiceRequest] = [
        ServiceRequest(id: sr1Id, vehicleId: veh1Id, organizationId: orgId,
                       title: "Performance inspection and delivery verification",
                       description: "Full performance inspection including engine, brakes, suspension, and delivery prep.",
                       status: .inProgress, priority: 1, estimatedCompletion: nil,
                       actualCompletion: nil, createdAt: ago(2880)),
    ]

    // MARK: - Inspections

    let inspections: [Inspection] = [
        Inspection(id: insp1Id, vehicleId: veh1Id, inspectorId: userTechId,
                   type: .intake, status: .completed, notes: nil,
                   completedAt: ago(2700), createdAt: ago(2880)),
        Inspection(id: insp2Id, vehicleId: veh1Id, inspectorId: userTech2Id,
                   type: .delivery, status: .inProgress, notes: nil,
                   completedAt: nil, createdAt: ago(2880)),
    ]

    // MARK: - Inspection Sections & Items

    var inspectionSections: [InspectionSection] = [
        InspectionSection(
            id: UUID(uuidString: "00000000-0000-0000-0001-000000000001")!,
            inspectionId: insp1Id, name: "Exterior Front", sortOrder: 0,
            items: [
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000001")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000001")!,
                               label: "Hood condition", passed: true, notes: nil, sortOrder: 0),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000002")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000001")!,
                               label: "Front bumper", passed: false,
                               notes: "Light scratches on front bumper", sortOrder: 1),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000003")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000001")!,
                               label: "Headlights", passed: true, notes: nil, sortOrder: 2),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000004")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000001")!,
                               label: "Grille", passed: true, notes: nil, sortOrder: 3),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000005")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000001")!,
                               label: "Windshield", passed: true, notes: nil, sortOrder: 4),
            ]),
        InspectionSection(
            id: UUID(uuidString: "00000000-0000-0000-0001-000000000002")!,
            inspectionId: insp1Id, name: "Interior", sortOrder: 1,
            items: [
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000010")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000002")!,
                               label: "Seats condition", passed: true, notes: nil, sortOrder: 0),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000011")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000002")!,
                               label: "Dashboard", passed: true, notes: nil, sortOrder: 1),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000012")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000002")!,
                               label: "Steering wheel", passed: true, notes: nil, sortOrder: 2),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000013")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000002")!,
                               label: "Center console", passed: true, notes: nil, sortOrder: 3),
            ]),
        InspectionSection(
            id: UUID(uuidString: "00000000-0000-0000-0001-000000000003")!,
            inspectionId: insp1Id, name: "Mechanical", sortOrder: 2,
            items: [
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000020")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000003")!,
                               label: "Engine oil level", passed: true, notes: nil, sortOrder: 0),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000021")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000003")!,
                               label: "Belts and hoses", passed: true, notes: nil, sortOrder: 1),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000022")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000003")!,
                               label: "Front brake pads", passed: false,
                               notes: "Approximately 35% remaining. Replace within 5,000 miles.", sortOrder: 2),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000023")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000003")!,
                               label: "Air filter", passed: false,
                               notes: "Significantly dirty, restricting airflow. Replacement recommended.", sortOrder: 3),
            ]),
        InspectionSection(
            id: UUID(uuidString: "00000000-0000-0000-0001-000000000004")!,
            inspectionId: insp1Id, name: "Tires & Wheels", sortOrder: 3,
            items: [
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000030")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000004")!,
                               label: "Front left tire", passed: true, notes: nil, sortOrder: 0),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000031")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000004")!,
                               label: "Front right tire", passed: true, notes: nil, sortOrder: 1),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000032")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000004")!,
                               label: "Rear left tire", passed: true, notes: nil, sortOrder: 2),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000033")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000004")!,
                               label: "Rear right tire", passed: true, notes: nil, sortOrder: 3),
                InspectionItem(id: UUID(uuidString: "00000000-0000-0000-0002-000000000034")!,
                               sectionId: UUID(uuidString: "00000000-0000-0000-0001-000000000004")!,
                               label: "Wheel condition", passed: true, notes: nil, sortOrder: 4),
            ]),
    ]

    // MARK: - Checklists

    var checklists: [Checklist] = [
        Checklist(
            id: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
            vehicleId: veh1Id, title: "Service Checklist", type: "service",
            items: [
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000001")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Engine oil and filter change", completed: true,
                              completedBy: userTechId, completedAt: ago(1440), sortOrder: 0),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000002")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Brake fluid flush", completed: true,
                              completedBy: userTechId, completedAt: ago(1200), sortOrder: 1),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000003")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Coolant system inspection", completed: true,
                              completedBy: userTechId, completedAt: ago(960), sortOrder: 2),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000004")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Tire rotation and balance", completed: true,
                              completedBy: userTechId, completedAt: ago(720), sortOrder: 3),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000005")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Alignment check", completed: true,
                              completedBy: userTechId, completedAt: ago(480), sortOrder: 4),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000006")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Suspension inspection", completed: true,
                              completedBy: userTechId, completedAt: ago(360), sortOrder: 5),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000007")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Exhaust system check", completed: true,
                              completedBy: userTechId, completedAt: ago(240), sortOrder: 6),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000008")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Electrical systems diagnostic", completed: false,
                              completedBy: nil, completedAt: nil, sortOrder: 7),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000009")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Performance data logging", completed: false,
                              completedBy: nil, completedAt: nil, sortOrder: 8),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000010")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Interior detail and cleaning", completed: false,
                              completedBy: nil, completedAt: nil, sortOrder: 9),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000011")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Exterior wash and polish", completed: false,
                              completedBy: nil, completedAt: nil, sortOrder: 10),
                ChecklistItem(id: UUID(uuidString: "00000000-0000-0000-0004-000000000012")!,
                              checklistId: UUID(uuidString: "00000000-0000-0000-0003-000000000001")!,
                              label: "Final quality inspection", completed: false,
                              completedBy: nil, completedAt: nil, sortOrder: 11),
            ],
            createdAt: ago(2880)),
    ]

    // MARK: - Notifications

    var notifications: [Notification] = [
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000001")!,
                     userId: userAdminId, type: .intakeCompleted, title: "Intake Completed",
                     body: "Your Corvette Z51 intake inspection is complete and ready for review.",
                     read: false, vehicleId: veh1Id, createdAt: ago(2)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000002")!,
                     userId: userAdminId, type: .approvalNeeded, title: "Approval Needed",
                     body: "Additional approval is needed for recommended repairs on the M4 Competition.",
                     read: false, vehicleId: veh3Id, createdAt: ago(60)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000003")!,
                     userId: userAdminId, type: .serviceStarted, title: "Service Started",
                     body: "We've started working on the Corvette Z51. You'll be notified at every step.",
                     read: true, vehicleId: veh1Id, createdAt: ago(180)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000004")!,
                     userId: userAdminId, type: .issueFlagged, title: "Technician Note",
                     body: "Light scratches noted on front bumper during Corvette Z51 inspection.",
                     read: true, vehicleId: veh1Id, createdAt: ago(300)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000005")!,
                     userId: userAdminId, type: .deliveryReady, title: "Delivery Ready",
                     body: "Great news — the 911 Carrera S is ready for delivery. Contact us to schedule pickup.",
                     read: true, vehicleId: veh2Id, createdAt: ago(1440)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000006")!,
                     userId: userAdminId, type: .issueFlagged, title: "Brake Pad Warning",
                     body: "Front brake pads at 35% on the Corvette Z51. Replacement recommended within 5,000 miles.",
                     read: false, vehicleId: veh1Id, createdAt: ago(120)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000007")!,
                     userId: userAdminId, type: .serviceCompleted, title: "Oil Change Complete",
                     body: "Engine oil and filter change completed on the Corvette Z51.",
                     read: true, vehicleId: veh1Id, createdAt: ago(1440)),
        Notification(id: UUID(uuidString: "00000000-0000-0000-0005-000000000008")!,
                     userId: userAdminId, type: .intakeStarted, title: "New Vehicle Intake",
                     body: "2019 Mercedes-Benz G63 AMG has been checked in by James Taylor.",
                     read: true, vehicleId: veh4Id, createdAt: ago(300)),
    ]

    // MARK: - DataProvider conformance

    func signIn(email: String, password: String) async throws -> User {
        // Simulate network delay
        try await Task.sleep(nanoseconds: 500_000_000)
        guard let user = users.first(where: { $0.email == email }) else {
            throw MockError.invalidCredentials
        }
        return user
    }

    func signOut() async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
    }

    func getCurrentUser() async throws -> User? {
        return nil // Not logged in by default in mock mode
    }

    func fetchVehicles(organizationId: UUID) async throws -> [Vehicle] {
        try await Task.sleep(nanoseconds: 300_000_000)
        return vehicles.filter { $0.organizationId == organizationId }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    func fetchVehicle(id: UUID) async throws -> Vehicle {
        guard let vehicle = vehicles.first(where: { $0.id == id }) else {
            throw MockError.notFound
        }
        return vehicle
    }

    func fetchVehiclesForCustomer(email: String) async throws -> [Vehicle] {
        try await Task.sleep(nanoseconds: 300_000_000)
        guard let customer = customers.first(where: { $0.email == email }) else {
            return []
        }
        return vehicles.filter { $0.customerId == customer.id }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    func createVehicle(_ vehicle: Vehicle) async throws -> Vehicle {
        try await Task.sleep(nanoseconds: 300_000_000)
        vehicles.append(vehicle)
        return vehicle
    }

    func updateVehicleStatus(id: UUID, status: VehicleStatus) async throws {
        if let idx = vehicles.firstIndex(where: { $0.id == id }) {
            let old = vehicles[idx]
            vehicles[idx] = Vehicle(
                id: old.id, organizationId: old.organizationId, customerId: old.customerId,
                vin: old.vin, year: old.year, make: old.make, model: old.model,
                color: old.color, licensePlate: old.licensePlate, mileage: old.mileage,
                status: status, notes: old.notes, createdAt: old.createdAt, updatedAt: Date()
            )
        }
    }

    func fetchCustomers(organizationId: UUID) async throws -> [Customer] {
        try await Task.sleep(nanoseconds: 200_000_000)
        return customers.filter { $0.organizationId == organizationId }
    }

    func fetchCustomer(id: UUID) async throws -> Customer {
        guard let customer = customers.first(where: { $0.id == id }) else {
            throw MockError.notFound
        }
        return customer
    }

    func createCustomer(_ customer: Customer) async throws -> Customer {
        return customer
    }

    func fetchServiceRequests(organizationId: UUID) async throws -> [ServiceRequest] {
        try await Task.sleep(nanoseconds: 200_000_000)
        return serviceRequests.filter { $0.organizationId == organizationId }
    }

    func fetchServiceRequest(id: UUID) async throws -> ServiceRequest {
        guard let sr = serviceRequests.first(where: { $0.id == id }) else {
            throw MockError.notFound
        }
        return sr
    }

    func fetchInspections(vehicleId: UUID) async throws -> [Inspection] {
        return inspections.filter { $0.vehicleId == vehicleId }
    }

    func fetchInspection(id: UUID) async throws -> Inspection {
        guard let inspection = inspections.first(where: { $0.id == id }) else {
            throw MockError.notFound
        }
        return inspection
    }

    func fetchInspectionSections(inspectionId: UUID) async throws -> [InspectionSection] {
        return inspectionSections.filter { $0.inspectionId == inspectionId }
            .sorted { $0.sortOrder < $1.sortOrder }
    }

    func updateInspectionItem(id: UUID, passed: Bool?, notes: String?) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
        for si in inspectionSections.indices {
            guard var items = inspectionSections[si].items else { continue }
            if let ii = items.firstIndex(where: { $0.id == id }) {
                let old = items[ii]
                items[ii] = InspectionItem(
                    id: old.id, sectionId: old.sectionId, label: old.label,
                    passed: passed ?? old.passed, notes: notes ?? old.notes,
                    sortOrder: old.sortOrder
                )
                let sec = inspectionSections[si]
                inspectionSections[si] = InspectionSection(
                    id: sec.id, inspectionId: sec.inspectionId,
                    name: sec.name, sortOrder: sec.sortOrder, items: items
                )
                return
            }
        }
    }

    func updateInspectionStatus(id: UUID, status: InspectionStatus) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
    }

    func uploadPhoto(imageData: Data, vehicleId: UUID, inspectionId: UUID?, inspectionItemId: UUID?, organizationId: UUID) async throws -> MediaAsset {
        try await Task.sleep(nanoseconds: 500_000_000)
        return MediaAsset(
            id: UUID(), organizationId: organizationId,
            vehicleId: vehicleId, inspectionId: inspectionId,
            inspectionItemId: inspectionItemId, uploadedBy: MockDataProvider.userAdminId,
            type: .photo, storagePath: "mock/\(UUID().uuidString).jpg",
            url: "https://placeholder.co/400", thumbnailUrl: nil,
            fileName: "photo.jpg", fileSize: imageData.count,
            mimeType: "image/jpeg", caption: nil, createdAt: Date()
        )
    }

    func fetchMediaAssets(vehicleId: UUID) async throws -> [MediaAsset] {
        return []
    }

    func fetchChecklists(vehicleId: UUID) async throws -> [Checklist] {
        return checklists.filter { $0.vehicleId == vehicleId }
    }

    func updateChecklistItem(id: UUID, completed: Bool) async throws {
        for ci in checklists.indices {
            if var items = checklists[ci].items,
               let ii = items.firstIndex(where: { $0.id == id }) {
                items[ii].completed = completed
                let old = checklists[ci]
                checklists[ci] = Checklist(
                    id: old.id, vehicleId: old.vehicleId, title: old.title,
                    type: old.type, items: items, createdAt: old.createdAt
                )
            }
        }
    }

    func fetchNotifications(userId: UUID) async throws -> [Notification] {
        try await Task.sleep(nanoseconds: 200_000_000)
        return notifications
            .filter { $0.userId == userId }
            .sorted { $0.createdAt > $1.createdAt }
    }

    func markNotificationRead(id: UUID) async throws {
        if let idx = notifications.firstIndex(where: { $0.id == id }) {
            let old = notifications[idx]
            notifications[idx] = Notification(
                id: old.id, userId: old.userId, type: old.type,
                title: old.title, body: old.body, read: true,
                vehicleId: old.vehicleId, createdAt: old.createdAt
            )
        }
    }

    // MARK: - Helper to get customer for a vehicle

    func customer(for vehicle: Vehicle) -> Customer? {
        customers.first { $0.id == vehicle.customerId }
    }
}

// MARK: - Mock Errors

enum MockError: LocalizedError {
    case invalidCredentials
    case notFound

    var errorDescription: String? {
        switch self {
        case .invalidCredentials: return "Invalid email or password. Try john@whiteglove.com / password"
        case .notFound: return "Resource not found"
        }
    }
}
