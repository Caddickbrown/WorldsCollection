import SwiftUI

struct ContentView: View {
    @State private var activeGame: GameDefinition? = nil

    var body: some View {
        LauncherView(activeGame: $activeGame)
            .fullScreenCover(item: $activeGame) { game in
                GameView(game: game, onDismiss: { activeGame = nil })
                    .ignoresSafeArea()
            }
    }
}
