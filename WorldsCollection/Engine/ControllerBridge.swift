import GameController
import WebKit

/// Bridges MFi / Xbox / PlayStation / DualSense controllers to the Web Gamepad API
/// by injecting a minimal JS shim into the WKWebView.
///
/// The Web Gamepad API already works natively in WKWebView on iOS 14.5+, so for
/// games that already call navigator.getGamepads() (Island Voxel) this does nothing —
/// they will see the controller directly.
///
/// For games that don't poll the Gamepad API (House, Pavilion, Island 2D), this
/// bridge also injects keyboard events mapped from controller buttons, so their
/// existing keyboard handlers just work.
final class ControllerBridge {

    weak var webView: WKWebView?
    private var observation: NSObjectProtocol?

    // Button → key mapping for games that use keyboard input
    private static let buttonKeyMap: [GCControllerButtonInput: (key: String, code: String)] = [:]
    // We use axis + button identifiers via profile snapshot instead

    init(webView: WKWebView) {
        self.webView = webView
        setupObservers()
        // Inject the shim for all active controllers
        GCController.controllers().forEach { injectShimIfNeeded(for: $0) }
    }

    deinit {
        if let obs = observation { NotificationCenter.default.removeObserver(obs) }
    }

    // MARK: – Setup

    private func setupObservers() {
        observation = NotificationCenter.default.addObserver(
            forName: .GCControllerDidConnect,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let controller = note.object as? GCController else { return }
            self?.injectShimIfNeeded(for: controller)
        }
    }

    /// The Web Gamepad API surfaces controllers natively on iOS 14.5+.
    /// We only need to wire up keyboard-event simulation for games that don't
    /// use the Gamepad API at all (House, Pavilion).
    private func injectShimIfNeeded(for controller: GCController) {
        guard let wv = webView else { return }

        guard let profile = controller.extendedGamepad else { return }

        // D-pad / left stick → WASD
        func pressKey(_ key: String, down: Bool) {
            let type = down ? "keydown" : "keyup"
            let js = """
            (function() {
                var e = new KeyboardEvent('\(type)', {
                    key: '\(key)', code: '\(key)', bubbles: true, cancelable: true
                });
                document.dispatchEvent(e);
            })();
            """
            wv.evaluateJavaScript(js, completionHandler: nil)
        }

        let axisThreshold: Float = 0.4

        // Left stick
        profile.leftThumbstick.valueChangedHandler = { [weak self] _, x, y in
            guard self != nil else { return }
            pressKey("w", down: y >  axisThreshold)
            pressKey("s", down: y < -axisThreshold)
            pressKey("a", down: x < -axisThreshold)
            pressKey("d", down: x >  axisThreshold)
        }

        // D-pad
        profile.dpad.valueChangedHandler = { [weak self] _, x, y in
            guard self != nil else { return }
            pressKey("ArrowUp",    down: y >  0.5)
            pressKey("ArrowDown",  down: y < -0.5)
            pressKey("ArrowLeft",  down: x < -0.5)
            pressKey("ArrowRight", down: x >  0.5)
        }

        // Right stick → look (mouse-move simulation)
        profile.rightThumbstick.valueChangedHandler = { [weak self] _, x, y in
            guard let wv = self?.webView else { return }
            let dx = Int(x * 10)
            let dy = Int(-y * 10)
            if dx == 0 && dy == 0 { return }
            let js = """
            (function() {
                var e = new MouseEvent('mousemove', {
                    movementX: \(dx), movementY: \(dy), bubbles: true
                });
                document.dispatchEvent(e);
            })();
            """
            wv.evaluateJavaScript(js, completionHandler: nil)
        }

        // A / Cross → Space (jump / interact)
        profile.buttonA.valueChangedHandler = { [weak self] _, _, pressed in
            guard self != nil else { return }
            pressKey(" ", down: pressed)
        }

        // B / Circle → Escape
        profile.buttonB.valueChangedHandler = { [weak self] _, _, pressed in
            guard self != nil else { return }
            pressKey("Escape", down: pressed)
        }

        // X / Square → E (interact)
        profile.buttonX.valueChangedHandler = { [weak self] _, _, pressed in
            guard self != nil else { return }
            pressKey("e", down: pressed)
        }

        // Y / Triangle → F (action)
        profile.buttonY.valueChangedHandler = { [weak self] _, _, pressed in
            guard self != nil else { return }
            pressKey("f", down: pressed)
        }

        // Left shoulder → Shift (sprint)
        profile.leftShoulder.valueChangedHandler = { [weak self] _, _, pressed in
            guard self != nil else { return }
            pressKey("Shift", down: pressed)
        }
    }
}
