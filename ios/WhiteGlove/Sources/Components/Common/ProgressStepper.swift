import SwiftUI

struct ProgressStepper: View {
    let steps: [String]
    let currentStep: Int

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                HStack(spacing: 0) {
                    // Step Circle
                    VStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(stepColor(for: index))
                                .frame(width: 32, height: 32)

                            if index < currentStep {
                                Image(systemName: "checkmark")
                                    .font(.caption.bold())
                                    .foregroundColor(.white)
                            } else {
                                Text("\(index + 1)")
                                    .font(.caption.bold())
                                    .foregroundColor(index == currentStep ? .white : .secondary)
                            }
                        }

                        Text(step)
                            .font(.caption2)
                            .foregroundColor(index <= currentStep ? .white : .secondary)
                    }

                    // Connector Line
                    if index < steps.count - 1 {
                        Rectangle()
                            .fill(index < currentStep ? Theme.accentColor : Theme.cardColor)
                            .frame(height: 2)
                            .frame(maxWidth: .infinity)
                            .padding(.horizontal, 4)
                            .offset(y: -10)
                    }
                }
            }
        }
    }

    private func stepColor(for index: Int) -> Color {
        if index < currentStep {
            return .green
        } else if index == currentStep {
            return Theme.accentColor
        } else {
            return Theme.cardColor
        }
    }
}

#Preview {
    ProgressStepper(steps: ["Vehicle", "Customer", "Service", "Inspection"], currentStep: 1)
        .padding()
        .background(Theme.bgColor)
}
