import {useCollectionData} from "react-firebase-hooks/firestore";
import {doc, limit, query, updateDoc, where, UpdateData} from "firebase/firestore";
import db from "../utils/db";
import User from "../models/User";
import GameBirdShooter from "../models/GameBirdShooter";

interface HitsPlayer {
    player: User
    hits: number[]
    currentScore: number
}

interface PlayBirdShooterGameHook {
    loading: boolean
    error: Error | null
    gameState: {
        currentPlayer: User
        currentRound: number
        maxRounds: number
        winner: HitsPlayer | null
        hitsPerPlayer: HitsPlayer[]
    } | null,
    gameActions: {
        newHit(score: number): Promise<void>
    } | null,
}

function usePlayBirdShooterGame(gameId: string | undefined): PlayBirdShooterGameHook {
    const [games, gameLoading, gameError] = useCollectionData(query(db.gameBirdShooter, where("id", "==", gameId), limit(1)))
    const game = (games && games.length > 0) ? games[0] : null
    const [players, playersLoading, playersError] = useCollectionData(game && query(db.users, where("id", "in", game.playerIds)))


    // const [currentRound, setCurrentRound] = useState(1)
    // const [winner, setWinner] = useState<User | null>(null)
    // const [currentPlayer, setCurrentPlayer] = useState<User | null>(null)

    const loading = gameLoading || playersLoading
    const error = gameError || playersError

    if (loading || error || !game || !players) {
        const noGameIdError = !gameId && new Error("No game id was given.")
        const noGameOrPlayersError = (!game || !players) && new Error("No game or players found!?")

        return {
            loading: loading,
            error: error || noGameIdError || noGameOrPlayersError || null,
            gameActions: null,
            gameState: null,
        }
    }

    const currentPlayerIndex = game.hits.length % players.length
    const currentPlayer = players[currentPlayerIndex]

    const maxRounds = game.rounds
    const currentRound = Math.floor(game.hits.length / game.playerIds.length) + 1
    const hits = game.hits

    const hitsPerPlayer: HitsPlayer[] = players.map(player => {
        const playersHits = hits
            .filter(hit => hit.playerId === player.id)
            .map(hit => hit.score)

        const currentScore = playersHits.reduce((sum, current) => current + sum, 0)

        return {player: player, hits: playersHits, currentScore}
    })

    const playerHighestScore = hitsPerPlayer.reduce((prev, curr) => prev.currentScore < curr.currentScore ? curr : prev)
    const winner = (currentRound > maxRounds) ? playerHighestScore : null


    const newHit = async (score: number) => {
        
        
        const newHits = [
            ...game.hits,
            {
                playerId: currentPlayer.id,
                score: score,
            }
        ]

        const docRef = doc(db.gameBirdShooter, game.id)
        const updateData: UpdateData<GameBirdShooter> = {
            hits: newHits,
        }

        await updateDoc(docRef, updateData)
    }


    return {
        loading: false,
        error: null,
        gameState: {
            currentPlayer,
            currentRound,
            maxRounds,
            winner,
            hitsPerPlayer,
        },
        gameActions: {
            newHit
        }
    }
}

export default usePlayBirdShooterGame
