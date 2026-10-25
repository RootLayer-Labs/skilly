//
//  UpdateCoordinator.swift
//  leanring-buddy
//
//  Owns Sparkle. Checks and downloads run in the background (Info.plist
//  SUEnableAutomaticChecks / SUAutomaticallyUpdate), and because Skilly is a
//  menu bar app that rarely quits, every waiting update is surfaced as a macOS
//  notification instead of relying on a window the user may never see.
//

import AppKit
import Sparkle
import UserNotifications

final class UpdateCoordinator: NSObject, SPUUpdaterDelegate, SPUStandardUserDriverDelegate, UNUserNotificationCenterDelegate {
    static let shared = UpdateCoordinator()

    /// Sent to Studio as X-Skilly-Build so it can require a newer build.
    static let currentBuild = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"

    nonisolated private static let updateAvailableNotificationId = "skilly-update-available"
    nonisolated private static let updateReadyNotificationId = "skilly-update-ready"

    private var updaterController: SPUStandardUpdaterController?
    private var installUpdateNow: (() -> Void)?
    private var isShowingRequiredUpdateAlert = false

    func start() {
        UNUserNotificationCenter.current().delegate = self
        // The "Skilly Dev" (DEBUG) build skips auto-update entirely so it
        // never tries to update itself into the release app via the production appcast.
        #if !DEBUG
        let updaterController = SPUStandardUpdaterController(
            startingUpdater: false,
            updaterDelegate: self,
            userDriverDelegate: self
        )
        self.updaterController = updaterController
        do {
            try updaterController.updater.start()
            // Info.plist only sets defaults; a stored "no" from Sparkle's old
            // permission prompt would override them, so set both explicitly.
            updaterController.updater.automaticallyChecksForUpdates = true
            updaterController.updater.automaticallyDownloadsUpdates = true
        } catch {
            // Sparkle failed to start; release builds skip auto-update this launch.
        }
        #endif
    }

    func checkForUpdates() {
        if let installUpdateNow {
            installUpdateNow()
            return
        }
        updaterController?.checkForUpdates(nil)
    }

    /// Studio refused a hosted session because this build is below the
    /// configured minimum. Voice stays blocked until the user updates.
    func promptRequiredUpdate() {
        guard !isShowingRequiredUpdateAlert else { return }
        isShowingRequiredUpdateAlert = true
        defer { isShowingRequiredUpdateAlert = false }

        let alert = NSAlert()
        alert.alertStyle = .warning
        alert.messageText = "Update required"
        alert.informativeText = "This version of Skilly is no longer supported. Update to keep using Skilly."
        alert.addButton(withTitle: "Update Now")
        alert.addButton(withTitle: "Later")
        NSApp.activate(ignoringOtherApps: true)
        if alert.runModal() == .alertFirstButtonReturn {
            checkForUpdates()
        }
    }

    // MARK: - SPUUpdaterDelegate

    func updater(
        _ updater: SPUUpdater,
        willInstallUpdateOnQuit item: SUAppcastItem,
        immediateInstallationBlock immediateInstallHandler: @escaping () -> Void
    ) -> Bool {
        installUpdateNow = immediateInstallHandler
        postNotification(
            identifier: Self.updateReadyNotificationId,
            title: "Skilly \(item.displayVersionString) is ready",
            body: "Click to restart and update now. It also installs the next time Skilly quits."
        )
        return true
    }

    // MARK: - SPUStandardUserDriverDelegate

    var supportsGentleScheduledUpdateReminders: Bool { true }

    func standardUserDriverWillHandleShowingUpdate(
        _ handleShowingUpdate: Bool,
        forUpdate update: SUAppcastItem,
        state: SPUUserUpdateState
    ) {
        guard !state.userInitiated else { return }
        postNotification(
            identifier: Self.updateAvailableNotificationId,
            title: "Skilly \(update.displayVersionString) is available",
            body: "Click to update Skilly."
        )
    }

    func standardUserDriverDidReceiveUserAttention(forUpdate update: SUAppcastItem) {
        UNUserNotificationCenter.current().removeDeliveredNotifications(
            withIdentifiers: [Self.updateAvailableNotificationId]
        )
    }

    // MARK: - UNUserNotificationCenterDelegate

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let identifier = response.notification.request.identifier
        guard identifier == Self.updateAvailableNotificationId
            || identifier == Self.updateReadyNotificationId else { return }
        await MainActor.run { self.checkForUpdates() }
    }

    private func postNotification(identifier: String, title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
        )
    }
}
