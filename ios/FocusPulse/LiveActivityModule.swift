import ActivityKit
import Foundation
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

    private var currentActivity: Activity<FocusSessionAttributes>?

    @objc
    static func requiresMainQueueSetup() -> Bool { true }

    @objc(startActivity:resolve:reject:)
    func startActivity(
        _ options: NSDictionary,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            reject("ACTIVITIES_DISABLED", "Live Activities are disabled for this app in Settings", nil)
            return
        }

        let sessionName = options["sessionName"] as? String ?? "Focus Session"
        let durationSeconds = options["durationSeconds"] as? Double ?? 1500

        let attributes = FocusSessionAttributes(sessionName: sessionName, totalDuration: durationSeconds)
        let state = FocusSessionAttributes.ContentState(
            endDate: Date().addingTimeInterval(durationSeconds),
            isPaused: false,
            remainingWhenPaused: durationSeconds
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil),
                pushType: nil
            )
            currentActivity = activity
            resolve(activity.id)
        } catch {
            reject("START_FAILED", error.localizedDescription, error)
        }
    }

    @objc(updateActivity:resolve:reject:)
    func updateActivity(
        _ options: NSDictionary,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else {
            resolve(nil)
            return
        }

        let isPaused = options["isPaused"] as? Bool ?? false
        let remainingSeconds = options["remainingSeconds"] as? Double ?? 0
        let newState = FocusSessionAttributes.ContentState(
            endDate: Date().addingTimeInterval(remainingSeconds),
            isPaused: isPaused,
            remainingWhenPaused: remainingSeconds
        )

        Task {
            await activity.update(.init(state: newState, staleDate: nil))
            resolve(nil)
        }
    }

    @objc(endActivity:reject:)
    func endActivity(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else {
            resolve(nil)
            return
        }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            currentActivity = nil
            resolve(nil)
        }
    }
}
