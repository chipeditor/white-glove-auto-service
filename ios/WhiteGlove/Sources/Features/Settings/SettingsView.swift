import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var staff: [User] = []
    @State private var cannedJobs: [CannedJob] = []
    @State private var isLoading = true
    @State private var selectedTab = 0

    let tabs = ["Quick Links", "Team", "Templates"]

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()

                VStack(spacing: 0) {
                    tabBar

                    if isLoading {
                        Spacer()
                        ProgressView().tint(Theme.goldColor)
                        Spacer()
                    } else {
                        TabView(selection: $selectedTab) {
                            quickLinks.tag(0)
                            teamList.tag(1)
                            templatesList.tag(2)
                        }
                        .tabViewStyle(.page(indexDisplayMode: .never))
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await authService.signOut() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(Color(hex: Theme.red))
                    }
                }
            }
            .task { await loadData() }
            .refreshable { await loadData() }
        }
    }

    var tabBar: some View {
        HStack(spacing: 0) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                Button {
                    withAnimation { selectedTab = index }
                } label: {
                    VStack(spacing: 6) {
                        Text(tab)
                            .font(.subheadline.weight(selectedTab == index ? .semibold : .regular))
                            .foregroundColor(selectedTab == index ? Theme.goldColor : .white.opacity(0.45))
                        Rectangle()
                            .fill(selectedTab == index ? Theme.goldColor : Color.clear)
                            .frame(height: 2)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal)
        .background(.ultraThinMaterial)
        .background(Color.white.opacity(0.02))
    }

    var quickLinks: some View {
        ScrollView {
            VStack(spacing: 8) {
                NavigationLink {
                    HealthBoardView()
                } label: {
                    GlassNavRow(icon: "heart.text.clipboard", label: "Health Board", iconColor: Theme.goldColor)
                }

                NavigationLink {
                    AppointmentsView()
                } label: {
                    GlassNavRow(icon: "calendar.badge.clock", label: "Appointments", iconColor: Theme.blueColor)
                }

                NavigationLink {
                    NotificationCenterView()
                } label: {
                    GlassNavRow(icon: "bell.fill", label: "Notifications", iconColor: Color(hex: "#e87040"))
                }

                NavigationLink {
                    VehicleListView()
                } label: {
                    GlassNavRow(icon: "car.fill", label: "All Vehicles", iconColor: Theme.greenColor)
                }

                if let user = authService.currentUser {
                    HStack {
                        Circle()
                            .fill(Theme.goldColor.opacity(0.15))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Text(String(user.fullName.prefix(1)))
                                    .font(.headline)
                                    .foregroundColor(Theme.goldColor)
                            )
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.fullName)
                                .font(.subheadline.weight(.medium))
                                .foregroundColor(.white.opacity(0.9))
                            Text(user.role.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.5))
                        }
                        Spacer()
                    }
                    .glassCard(padding: 12)
                    .padding(.top, 8)
                }
            }
            .padding()
        }
    }

    var teamList: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(staff) { member in
                    staffCard(member)
                }
            }
            .padding()
        }
    }

    func staffCard(_ user: User) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Theme.goldColor.opacity(0.12))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(String(user.fullName.prefix(1)))
                        .font(.headline)
                        .foregroundColor(Theme.goldColor)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(user.fullName)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.9))
                Text(user.email)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }

            Spacer()

            Text(user.role.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                .font(.caption.weight(.medium))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Theme.goldColor.opacity(0.12))
                .foregroundColor(Theme.goldColor)
                .clipShape(Capsule())
        }
        .glassCard(padding: 12)
    }

    var templatesList: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(cannedJobs) { job in
                    cannedJobCard(job)
                }

                if cannedJobs.isEmpty {
                    EmptyStateView(
                        icon: "doc.on.doc",
                        title: "No Templates",
                        message: "Service templates can be created from the web app."
                    )
                }
            }
            .padding()
        }
    }

    func cannedJobCard(_ job: CannedJob) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(job.name)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.9))
                Spacer()
                Text("$\(job.totalEstimate, specifier: "%.0f")")
                    .font(.subheadline.weight(.bold).monospacedDigit())
                    .foregroundColor(Theme.goldColor)
            }

            if let desc = job.description {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }

            HStack(spacing: 12) {
                Label(job.category.rawValue, systemImage: "tag.fill")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.35))
                Label("\(job.laborHours, specifier: "%.1f")h labor", systemImage: "clock.fill")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.35))
                Label("$\(job.partsCost, specifier: "%.0f") parts", systemImage: "gearshape.fill")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.35))
            }
        }
        .glassCard(padding: 12)
    }

    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let st = authService.dataProvider.fetchStaff(organizationId: authService.organizationId)
            async let cj = authService.dataProvider.fetchCannedJobs(organizationId: authService.organizationId)
            staff = try await st
            cannedJobs = try await cj
        } catch {}
    }
}
