import SwiftUI

struct HealthBoardView: View {
    @EnvironmentObject var authService: AuthService
    @State private var boardData: HealthBoardData?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "#0d0d18"), Color(hex: "#111125")],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()

                if isLoading {
                    ProgressView().tint(Theme.goldColor)
                } else if let data = boardData {
                    ScrollView {
                        VStack(spacing: 14) {
                            pulseRow(data.pulse)
                            ForEach(data.lanes) { lane in
                                techLaneCard(lane)
                            }
                        }
                        .padding()
                    }
                } else {
                    EmptyStateView(
                        icon: "heart.text.clipboard",
                        title: "No Data",
                        message: "Health board data is not available."
                    )
                }
            }
            .navigationTitle("Health Board")
            .navigationBarTitleDisplayMode(.large)
            .task { await loadData() }
            .refreshable { await loadData() }
        }
    }

    func pulseRow(_ pulse: ShopPulse) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                pulseCard("On-Time", "\(pulse.onTimePercent)%", color: pulse.onTimePercent >= 80 ? "#c8a45c" : "#e87040")
                pulseCard("Active", "\(pulse.vehiclesActive)", color: Theme.blue)
                pulseCard("At Risk", "\(pulse.atRiskCount)", color: pulse.atRiskCount > 0 ? "#e87040" : "#9ca3af")
                pulseCard("Aging 5+d", "\(pulse.agingCount)", color: pulse.agingCount > 0 ? "#ff3b3b" : "#9ca3af")
                pulseCard("Comebacks", "\(pulse.comebackCount)", color: pulse.comebackCount > 0 ? "#ff3b3b" : "#9ca3af")
            }
        }
    }

    func pulseCard(_ label: String, _ value: String, color: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.weight(.bold).monospacedDigit())
                .foregroundColor(Color(hex: color))
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundColor(.white.opacity(0.5))
        }
        .frame(width: 82, height: 66)
        .glassCard(padding: 0)
    }

    func techLaneCard(_ lane: TechLane) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "person.fill")
                    .foregroundColor(Theme.goldColor)
                    .font(.subheadline)
                Text(lane.name)
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.9))
                Spacer()
                Text("\(lane.jobs.count) jobs")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.35))
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.white.opacity(0.06))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(
                            LinearGradient(
                                colors: [utilizationColor(lane.utilized / max(lane.capacity, 1)), utilizationColor(lane.utilized / max(lane.capacity, 1)).opacity(0.7)],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * min(lane.utilized / max(lane.capacity, 1), 1), height: 6)
                }
            }
            .frame(height: 6)

            ForEach(lane.jobs) { job in
                jobCard(job)
            }
        }
        .glassCard()
    }

    func jobCard(_ job: HealthBoardSR) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(Color(hex: job.healthStatus?.color ?? Theme.muted))
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(job.vehicleDisplayName)
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.white.opacity(0.85))
                Text(job.title)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.45))
                    .lineLimit(1)
            }

            Spacer()

            if let phase = job.phase {
                Text(phase.displayName)
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color(hex: phase.color).opacity(0.2))
                    .foregroundColor(Color(hex: phase.color))
                    .clipShape(Capsule())
            }

            if let hours = job.remainingHours {
                Text("\(hours, specifier: "%.1f")h")
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.white.opacity(0.5))
            }
        }
        .padding(10)
        .background(Color.white.opacity(0.03))
        .cornerRadius(10)
    }

    func utilizationColor(_ ratio: Double) -> Color {
        if ratio >= 0.9 { return Color(hex: "#ff3b3b") }
        if ratio >= 0.7 { return Color(hex: "#e87040") }
        return Color(hex: "#c8a45c")
    }

    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            boardData = try await authService.dataProvider.fetchHealthBoard(organizationId: authService.organizationId)
        } catch {}
    }
}
