import Foundation

enum GameCategory: String {
    case game = "Games"
    case techDemo = "Tech Demos"
}

struct GameDefinition: Identifiable, Hashable {
    let id: String          // matches Resources/Games/<id>/
    let title: String
    let subtitle: String
    let category: GameCategory
    let entryFile: String   // html file to open (default: index.html)
    let icon: String        // SF Symbol name
    let accentColor: String // hex string used for card tint

    static func == (lhs: GameDefinition, rhs: GameDefinition) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

extension GameDefinition {
    /// Full URL for the game entry point under the worlds:// scheme
    var schemeURL: URL {
        URL(string: "worlds://\(id)/\(entryFile)")!
    }
}

// MARK: – Catalogue

let allGames: [GameDefinition] = [
    GameDefinition(
        id: "island-voxel",
        title: "Island Voxel",
        subtitle: "Third-person voxel explorer",
        category: .game,
        entryFile: "index.html",
        icon: "mountain.2.fill",
        accentColor: "#4a9e5c"
    ),
    GameDefinition(
        id: "island-2d",
        title: "Island",
        subtitle: "2D top-down adventure",
        category: .game,
        entryFile: "index.html",
        icon: "map.fill",
        accentColor: "#5b9ecf"
    ),
    GameDefinition(
        id: "world",
        title: "World",
        subtitle: "Zero-player civilisation sim",
        category: .game,
        entryFile: "index.html",
        icon: "globe.europe.africa.fill",
        accentColor: "#7c6fa0"
    ),
    GameDefinition(
        id: "house",
        title: "House",
        subtitle: "First-person interior explorer",
        category: .game,
        entryFile: "index.html",
        icon: "house.fill",
        accentColor: "#c28a4a"
    ),
    GameDefinition(
        id: "pavilion",
        title: "Pavilion",
        subtitle: "Modernist single-storey residence",
        category: .game,
        entryFile: "index.html",
        icon: "building.columns.fill",
        accentColor: "#a0b88a"
    ),
    // Tech Demos
    GameDefinition(
        id: "island-toon",
        title: "Island Toon",
        subtitle: "Cel shading + outline pass",
        category: .techDemo,
        entryFile: "demo.html",
        icon: "paintpalette.fill",
        accentColor: "#e07070"
    ),
    GameDefinition(
        id: "world-voxel",
        title: "World Voxel",
        subtitle: "Civilisation sim in 3D",
        category: .techDemo,
        entryFile: "index.html",
        icon: "cube.fill",
        accentColor: "#a07050"
    ),
]
