import SwiftUI

/// Main launcher — landscape card grid, two sections (Games / Tech Demos).
struct LauncherView: View {
    @Binding var activeGame: GameDefinition?

    private let games     = allGames.filter { $0.category == .game }
    private let techDemos = allGames.filter { $0.category == .techDemo }

    private let cardWidth:  CGFloat = 200
    private let cardHeight: CGFloat = 140
    private let spacing:    CGFloat = 16

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 40) {
                    header
                    section(title: "Games", items: games)
                    section(title: "Tech Demos", items: techDemos)
                }
                .padding(.horizontal, 32)
                .padding(.vertical, 28)
            }
        }
    }

    // MARK: – Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Worlds")
                .font(.custom("DM Sans", size: 36).weight(.bold))
                .foregroundColor(.white)
            Text("Collection")
                .font(.custom("DM Sans", size: 36).weight(.light))
                .foregroundColor(.white.opacity(0.45))
        }
    }

    // MARK: – Section

    private func section(title: String, items: [GameDefinition]) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .medium))
                .tracking(1.5)
                .foregroundColor(.white.opacity(0.35))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: spacing) {
                    ForEach(items) { game in
                        Button { activeGame = game } label: {
                            GameCard(game: game)
                                .frame(width: cardWidth, height: cardHeight)
                        }
                        .buttonStyle(CardButtonStyle())
                    }
                }
                // Extra padding so last card isn't flush with edge
                .padding(.trailing, 32)
            }
        }
    }
}

// MARK: – Card press style (handles animation without fighting ScrollView)

struct CardButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

// MARK: – GameCard

struct GameCard: View {
    let game: GameDefinition

    private var accent: Color {
        Color(hex: game.accentColor) ?? .gray
    }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Background panel
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(accent.opacity(0.25), lineWidth: 1)
                )

            // Faint accent glow top-right
            Circle()
                .fill(accent.opacity(0.12))
                .frame(width: 120, height: 120)
                .offset(x: 60, y: -40)
                .blur(radius: 20)
                .clipped()

            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: game.icon)
                    .font(.system(size: 22, weight: .light))
                    .foregroundColor(accent)

                Spacer()

                Text(game.title)
                    .font(.custom("DM Sans", size: 15).weight(.semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(game.subtitle)
                    .font(.custom("DM Sans", size: 11))
                    .foregroundColor(.white.opacity(0.4))
                    .lineLimit(2)
            }
            .padding(16)
        }
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

// MARK: – Color hex init

extension Color {
    init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s = String(s.dropFirst()) }
        guard s.count == 6, let value = UInt64(s, radix: 16) else { return nil }
        let r = Double((value >> 16) & 0xFF) / 255
        let g = Double((value >> 8)  & 0xFF) / 255
        let b = Double( value        & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
