import SwiftUI

struct ContentView: View {
    @State private var activeGame: GameDefinition? = nil

    var body: some View {
        ZStack {
            LauncherView(activeGame: $activeGame)
            if let game = activeGame {
                GameView(game: game, onDismiss: { activeGame = nil })
                    .transition(.opacity)
                    .zIndex(1)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: activeGame?.id)
    }
}
