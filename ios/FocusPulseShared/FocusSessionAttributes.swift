import ActivityKit
import Foundation

struct FocusSessionAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var endDate: Date
        var isPaused: Bool
        var remainingWhenPaused: TimeInterval
    }

    var sessionName: String
    var totalDuration: TimeInterval
}
