import WebKit
import UniformTypeIdentifiers

/// Serves the app bundle's Resources/Games/ directory under the worlds:// custom scheme.
/// This gives every game a stable same-origin so ES modules and Web Workers resolve correctly.
///
/// URL pattern:  worlds://<gameId>/<path>
/// Bundle path:  Resources/Games/<gameId>/<path>
final class GameSchemeHandler: NSObject, WKURLSchemeHandler {

    // MIME types we need beyond WebKit's defaults
    private static let mimeMap: [String: String] = [
        "js":   "application/javascript",
        "mjs":  "application/javascript",
        "json": "application/json",
        "wasm": "application/wasm",
        "html": "text/html; charset=utf-8",
        "css":  "text/css",
        "png":  "image/png",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "gif":  "image/gif",
        "svg":  "image/svg+xml",
        "ico":  "image/x-icon",
        "mp3":  "audio/mpeg",
        "ogg":  "audio/ogg",
        "wav":  "audio/wav",
        "mp4":  "video/mp4",
        "webm": "video/webm",
    ]

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(SchemeError.badURL)
            return
        }

        // worlds://<host>/<path>  →  host = gameId, path = file path within game
        let gameId = url.host ?? ""
        let filePath = url.path.hasPrefix("/") ? String(url.path.dropFirst()) : url.path

        guard let bundleURL = Bundle.main.resourceURL else {
            urlSchemeTask.didFailWithError(SchemeError.bundleNotFound)
            return
        }

        let fileURL = bundleURL
            .appendingPathComponent("Games")
            .appendingPathComponent(gameId)
            .appendingPathComponent(filePath.isEmpty ? "index.html" : filePath)

        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL) else {
            let resp = HTTPURLResponse(
                url: url,
                statusCode: 404,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "text/plain"]
            )!
            urlSchemeTask.didReceive(resp)
            urlSchemeTask.didReceive("404: \(fileURL.path)".data(using: .utf8)!)
            urlSchemeTask.didFinish()
            return
        }

        let ext = fileURL.pathExtension.lowercased()
        let mime = Self.mimeMap[ext] ?? "application/octet-stream"

        let response = HTTPURLResponse(
            url: url,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": mime,
                "Content-Length": "\(data.count)",
                // Allow shared array buffers / workers
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
            ]
        )!

        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // Nothing async to cancel
    }

    enum SchemeError: Error {
        case badURL
        case bundleNotFound
        case fileNotFound(String)
    }
}
