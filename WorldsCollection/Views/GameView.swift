import SwiftUI
import WebKit

/// Full-screen WebView that loads a game under the worlds:// custom scheme.
/// Handles back-dismiss, locks to landscape, and wires up controller input.
struct GameView: UIViewControllerRepresentable {
    let game: GameDefinition
    let onDismiss: () -> Void

    func makeUIViewController(context: Context) -> GameViewController {
        GameViewController(game: game, onDismiss: onDismiss)
    }

    func updateUIViewController(_ uiViewController: GameViewController, context: Context) {}
}

// MARK: - GameViewController

final class GameViewController: UIViewController {
    let game: GameDefinition
    let onDismiss: () -> Void

    private var webView: WKWebView!
    private var controllerBridge: ControllerBridge?
    private var backButton: UIButton!

    init(game: GameDefinition, onDismiss: @escaping () -> Void) {
        self.game = game
        self.onDismiss = onDismiss
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Orientation (landscape only)
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        buildWebView()
        buildBackButton()
        loadGame()
        controllerBridge = ControllerBridge(webView: webView)
    }

    // MARK: - WebView setup

    private func buildWebView() {
        let config = WKWebViewConfiguration()

        // Register custom scheme
        config.setURLSchemeHandler(GameSchemeHandler(), forURLScheme: "worlds")

        // Allow inline playback + auto-play
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        // Enable JavaScript
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        // Disable text interaction for better game experience
        if #available(iOS 15.4, *) {
            config.preferences.isTextInteractionEnabled = false
        }

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.backgroundColor = .black
        webView.isOpaque = true
        webView.navigationDelegate = self

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
    }

    private func buildBackButton() {
        var config = UIButton.Configuration.plain()
        config.image = UIImage(systemName: "chevron.left")
        config.baseForegroundColor = .white.withAlphaComponent(0.7)
        config.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 14, bottom: 10, trailing: 14)

        backButton = UIButton(configuration: config)
        backButton.translatesAutoresizingMaskIntoConstraints = false
        backButton.addTarget(self, action: #selector(dismissGame), for: .touchUpInside)

        // Subtle container
        backButton.backgroundColor = UIColor.black.withAlphaComponent(0.4)
        backButton.layer.cornerRadius = 10
        backButton.layer.cornerCurve = .continuous
        backButton.clipsToBounds = true

        view.addSubview(backButton)
        NSLayoutConstraint.activate([
            backButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            backButton.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 12),
        ])

        // Auto-hide after 3s
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            UIView.animate(withDuration: 0.5) { self?.backButton.alpha = 0 }
        }

        // Show again on any touch
        let tap = UITapGestureRecognizer(target: self, action: #selector(showBackButton))
        tap.cancelsTouchesInView = false
        view.addGestureRecognizer(tap)
    }

    private func loadGame() {
        let request = URLRequest(url: game.schemeURL)
        webView.load(request)
    }

    // MARK: - Actions

    @objc private func dismissGame() {
        onDismiss()
    }

    @objc private func showBackButton() {
        backButton.alpha = 1
        NSObject.cancelPreviousPerformRequests(withTarget: self)
        perform(#selector(hideBackButton), with: nil, afterDelay: 3)
    }

    @objc private func hideBackButton() {
        UIView.animate(withDuration: 0.5) { self.backButton.alpha = 0 }
    }
}

// MARK: - WKNavigationDelegate

extension GameViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[WorldsCollection] Navigation error: \(error)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[WorldsCollection] Provisional nav error: \(error)")
    }

    // Block any attempt to navigate away from the worlds:// scheme
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        let scheme = navigationAction.request.url?.scheme ?? ""
        decisionHandler(scheme == "worlds" || scheme == "about" ? .allow : .cancel)
    }
}
