import ActivityKit
import SwiftUI
import WidgetKit

struct FocusPulseLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusSessionAttributes.self) { context in
            LockScreenView(attributes: context.attributes, state: context.state)
                .activityBackgroundTint(Color.black)
                .activitySystemActionForegroundColor(Color.white)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "target")
                        .foregroundStyle(.orange)
                        .font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    timerText(state: context.state)
                        .font(.title3.monospacedDigit())
                        .foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.attributes.sessionName)
                            .font(.headline)
                            .foregroundStyle(.white)
                        progressView(attributes: context.attributes, state: context.state)
                    }
                    .padding(.top, 4)
                }
            } compactLeading: {
                Image(systemName: "target")
                    .foregroundStyle(.orange)
            } compactTrailing: {
                timerText(state: context.state)
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.white)
                    .frame(width: 46)
            } minimal: {
                Image(systemName: "target")
                    .foregroundStyle(.orange)
            }
            .keylineTint(.orange)
        }
    }
}

private func timerText(state: FocusSessionAttributes.ContentState) -> some View {
    Group {
        if state.isPaused {
            Text(formatted(seconds: state.remainingWhenPaused))
        } else {
            Text(timerInterval: Date.now...state.endDate, countsDown: true)
        }
    }
}

private func progressView(attributes: FocusSessionAttributes, state: FocusSessionAttributes.ContentState) -> some View {
    Group {
        if state.isPaused {
            ProgressView(value: 1 - (state.remainingWhenPaused / attributes.totalDuration))
                .tint(.orange)
        } else {
            // Anchored to endDate - totalDuration rather than Date.now, so the
            // range stays fixed across widget re-renders (e.g. lock/unlock)
            // instead of resetting to "0% progress" every time SwiftUI
            // re-evaluates this view.
            let sessionStart = state.endDate.addingTimeInterval(-attributes.totalDuration)
            ProgressView(
                timerInterval: sessionStart...state.endDate,
                countsDown: false,
                label: { EmptyView() },
                currentValueLabel: { EmptyView() }
            )
            .tint(.orange)
        }
    }
}

private func formatted(seconds: TimeInterval) -> String {
    let total = max(0, Int(seconds))
    let minutes = total / 60
    let secs = total % 60
    return String(format: "%02d:%02d", minutes, secs)
}

private struct LockScreenView: View {
    let attributes: FocusSessionAttributes
    let state: FocusSessionAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label(attributes.sessionName, systemImage: "target")
                    .font(.headline)
                    .foregroundStyle(.white)
                Spacer()
                timerText(state: state)
                    .font(.title3.monospacedDigit())
                    .foregroundStyle(.orange)
            }
            progressView(attributes: attributes, state: state)
            Text(state.isPaused ? "Paused" : "Stay focused — you've got this")
                .font(.caption)
                .foregroundStyle(.gray)
        }
        .padding()
    }
}
