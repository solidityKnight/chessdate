import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useChessGame } from '../hooks/useChessGame';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useGameStore } from '../store/gameStore';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import RomanticChessboard from '../components/RomanticChessboard';
import RomanticChatBox from '../components/RomanticChatBox';
import AdBanner from '../components/AdBanner';
import LearningTip from '../components/LearningTip';
import LearningPanel from '../components/LearningPanel';
import api from '../services/apiService';
import type { MoveRecord } from '../store/gameStore';
import type { MatchSelection, SaveKind } from '../types/social';
import {
  describeMatchPreferences,
  getMatchSelectionFromPreferences,
} from '../utils/social';

interface AnalysisMove {
  move: string;
  type: string;
  comment: string;
  bestMove?: string;
}

interface GameAnalysis {
  accuracy: number;
  summary: Record<string, number | string>;
  moves: AnalysisMove[];
}

const parseApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data
  ) {
    return String(error.response.data.message);
  }

  return fallback;
};

const selectionLabels: Record<MatchSelection, string> = {
  male: 'Match with men',
  female: 'Match with women',
  any: 'Match with anyone',
};

const PlayPage: React.FC = () => {
  useSocket();

  const { selectGender, cancelMatchmaking, isInQueue, selectedGender, queueStats } =
    useMatchmaking();
  const { isConnected, error, currentGame, user: authUser, setUser } = useGameStore();
  const reset = useGameStore((state) => state.reset);
  const clearError = useGameStore((state) => state.setError);
  const token = useGameStore((state) => state.token);
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isLearnPanelOpen, setIsLearnPanelOpen] = useState(false);
  const {
    resignGame,
    requestNewGame,
    requestRematch,
    acceptRematch,
    declineRematch,
    rematchStatus,
    learningTips,
    currentTip,
    setCurrentTip,
  } = useChessGame();

  const preferenceSelection = getMatchSelectionFromPreferences(authUser?.matchPreferences);
  const opponentProfile = currentGame?.opponentProfile;
  const isGameOver =
    currentGame?.status === 'finished' ||
    currentGame?.gameStatus?.status === 'checkmate' ||
    currentGame?.gameStatus?.status === 'stalemate' ||
    currentGame?.gameStatus?.status === 'draw';
  const canRecoverFromStaleGame =
    !!currentGame && (error === 'You are not in this game' || error === 'Game not found');

  const handleAnalyze = async () => {
    if (!currentGame?.moves || currentGame.moves.length === 0) return;
    setAnalyzing(true);
    try {
      const response = await api.post('/game/analyze', {
        moves: currentGame.moves.map((move: MoveRecord) => move.san || `${move.from}${move.to}`),
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Analysis failed', error);
      window.alert('Failed to analyze game. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleLearnMode = async () => {
    if (!authUser) return;
    const newMode = !authUser.learnMode;
    try {
      const response = await api.put('/user/profile', { learnMode: newMode });
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to toggle learn mode', error);
    }
  };

  const handlePostGameAction = async (action: 'follow' | SaveKind) => {
    if (!opponentProfile?.id) return;

    setActionLoading(action);

    try {
      if (action === 'follow') {
        await api.post('/follow/request', { followingId: opponentProfile.id });
      } else {
        await api.post('/saved-players', {
          targetUserId: opponentProfile.id,
          kind: action,
          sourceGameId: currentGame?.gameId,
        });
      }
    } catch (error) {
      window.alert(parseApiErrorMessage(error, `Could not ${action} this player.`));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    document.title = 'ChessDate - where hearts meet checkmates';
  }, []);

  if (!token) {
    return (
      <RomanticLayout>
        <section className="hero">
          <div className="hero-left">
            <h1>
              <span>Login</span> to
              <br />
              start playing
            </h1>
            <p className="description">
              You need an account to start a match and choose your matchmaking
              preference.
            </p>
            <div className="buttons">
              <RomanticButton variant="primary" onClick={() => navigate('/login')}>
                Login
              </RomanticButton>
              <RomanticButton variant="secondary" onClick={() => navigate('/signup')}>
                Create Account
              </RomanticButton>
            </div>
          </div>
          <RomanticChessboard interactive={false} showHeartGlow={true} />
          <RomanticChatBox title="Match chat" showInput={false} />
        </section>
        <div className="page-center">
          <AdBanner />
        </div>
      </RomanticLayout>
    );
  }

  return (
    <RomanticLayout>
      <section className="hero">
        <div className="hero-left">
          <h1>
            <span>Live</span> match
            <br />
            starts here
          </h1>
          <p className="description">
            {isConnected ? 'Connected to server.' : 'Reconnecting...'}
            {error ? ` ${error}` : ''}
          </p>

          {canRecoverFromStaleGame && (
            <div className="buttons">
              <RomanticButton
                variant="primary"
                onClick={() => {
                  reset();
                  clearError(null);
                }}
              >
                Start New Match
              </RomanticButton>
            </div>
          )}

          {!currentGame && (
            <div className="flex flex-col gap-4">
              <div className="buttons">
                {isInQueue ? (
                  <RomanticButton variant="danger" onClick={cancelMatchmaking}>
                    Cancel Matchmaking
                  </RomanticButton>
                ) : (
                  <>
                    <RomanticButton
                      variant="primary"
                      onClick={() => selectGender(preferenceSelection)}
                    >
                      Match my preference
                    </RomanticButton>
                    <RomanticButton variant="secondary" onClick={() => selectGender('male')}>
                      Match with men
                    </RomanticButton>
                    <RomanticButton variant="secondary" onClick={() => selectGender('female')}>
                      Match with women
                    </RomanticButton>
                    <RomanticButton variant="secondary" onClick={() => selectGender('any')}>
                      Match with anyone
                    </RomanticButton>
                  </>
                )}
              </div>

              <div className="page-glass-card rounded-[1.8rem] p-5 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                  Matchmaking settings
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-rose-100 bg-white/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Saved preference
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {describeMatchPreferences(authUser?.matchPreferences)}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-rose-100 bg-white/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Queue view
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {isInQueue && selectedGender
                        ? `Searching: ${selectionLabels[selectedGender]}`
                        : 'Pick a preference to join'}
                    </p>
                  </div>
                </div>

                {queueStats && (
                  <p className="mt-4 text-sm text-slate-500">
                    Queue now: {queueStats.total} waiting, {queueStats.male} men,{' '}
                    {queueStats.female} women.
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/60 p-3">
                  <button
                    type="button"
                    onClick={toggleLearnMode}
                    className={`relative h-6 w-12 rounded-full transition-colors ${
                      authUser?.learnMode ? 'bg-pink-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        authUser?.learnMode ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    Learn While Dating Mode: {authUser?.learnMode ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentGame && (
            <div className="space-y-4">
              <div className="buttons">
                {isGameOver ? (
                  rematchStatus === 'received' ? (
                    <>
                      <RomanticButton variant="primary" onClick={acceptRematch}>
                        Accept Rematch
                      </RomanticButton>
                      <RomanticButton variant="secondary" onClick={declineRematch}>
                        Decline
                      </RomanticButton>
                      <RomanticButton
                        variant="secondary"
                        onClick={() => {
                          requestNewGame();
                          reset();
                          clearError(null);
                          setAnalysis(null);
                        }}
                      >
                        Play Again
                      </RomanticButton>
                      <RomanticButton
                        variant="primary"
                        onClick={handleAnalyze}
                        disabled={analyzing}
                      >
                        {analyzing ? 'Analyzing...' : 'Analyze Game'}
                      </RomanticButton>
                    </>
                  ) : (
                    <>
                      <RomanticButton
                        variant="primary"
                        onClick={requestRematch}
                        disabled={rematchStatus === 'declined' || rematchStatus === 'requested'}
                      >
                        {rematchStatus === 'requested'
                          ? 'Waiting...'
                          : rematchStatus === 'declined'
                            ? 'Rematch Declined'
                            : 'Rematch'}
                      </RomanticButton>
                      <RomanticButton
                        variant="secondary"
                        onClick={() => {
                          requestNewGame();
                          reset();
                          clearError(null);
                          setAnalysis(null);
                        }}
                      >
                        Play Again
                      </RomanticButton>
                      <RomanticButton
                        variant="primary"
                        onClick={handleAnalyze}
                        disabled={analyzing}
                      >
                        {analyzing ? 'Analyzing...' : 'Analyze Game'}
                      </RomanticButton>
                    </>
                  )
                ) : (
                  <RomanticButton variant="danger" onClick={resignGame}>
                    Resign
                  </RomanticButton>
                )}
              </div>

              {isGameOver && opponentProfile && (
                <div className="page-glass-card rounded-[1.9rem] p-5 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                    Post-game connection
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    Keep the game going with {opponentProfile.displayName || opponentProfile.username}.
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <RomanticButton
                      variant="primary"
                      onClick={() => handlePostGameAction('follow')}
                      disabled={actionLoading === 'follow'}
                    >
                      Follow Opponent
                    </RomanticButton>
                    <RomanticButton
                      variant="secondary"
                      onClick={() => navigate(`/friends?contact=${opponentProfile.id}`)}
                    >
                      Send First Message
                    </RomanticButton>
                    <RomanticButton
                      variant="secondary"
                      onClick={() => handlePostGameAction('rematch_later')}
                      disabled={actionLoading === 'rematch_later'}
                    >
                      Rematch Later
                    </RomanticButton>
                    <RomanticButton
                      variant="secondary"
                      onClick={() => handlePostGameAction('favorite')}
                      disabled={actionLoading === 'favorite'}
                    >
                      Save Favorite
                    </RomanticButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <RomanticChessboard interactive={true} showHeartGlow={true} />

        <div className="relative">
          <RomanticChatBox title="Match chat" showInput={true} />

          {authUser?.learnMode && learningTips.length > 0 && (
            <button
              type="button"
              onClick={() => setIsLearnPanelOpen(true)}
              className="absolute -top-12 right-0 rounded-xl border border-pink-100 bg-white/80 px-4 py-2 text-xs font-bold text-pink-500 shadow-sm transition-colors hover:bg-pink-50"
            >
              Learn Log ({learningTips.length})
            </button>
          )}
        </div>
      </section>

      <LearningTip tip={currentTip} onClose={() => setCurrentTip(null)} />
      <LearningPanel
        tips={learningTips}
        isOpen={isLearnPanelOpen}
        onClose={() => setIsLearnPanelOpen(false)}
      />

      <div className="page-center">
        {analysis && (
          <div className="card" style={{ width: 'min(800px, 95vw)', marginTop: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Game Analysis</h2>
              <div
                style={{
                  background: 'linear-gradient(135deg, #ff6b95, #ff4d7d)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                }}
              >
                Accuracy: {analysis.accuracy}%
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
              {Object.entries(analysis.summary).map(([key, value]) => (
                <div key={key} style={{ background: '#f8f9fa', padding: 10, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'capitalize' }}>{key}</div>
                  <div style={{ fontWeight: 'bold' }}>{String(value)}</div>
                </div>
              ))}
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', padding: 10, background: '#fdfdfd', borderRadius: 15, border: '1px solid #eee' }}>
              {analysis.moves.map((move, index) => (
                <div
                  key={`${move.move}-${index}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: index === analysis.moves.length - 1 ? 'none' : '1px solid #f0f0f0',
                    gap: 16,
                  }}
                >
                  <div>
                    <span style={{ opacity: 0.4, marginRight: 10 }}>
                      {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}
                    </span>
                    <b
                      style={{
                        color:
                          move.type === 'Blunder'
                            ? '#e53e3e'
                            : move.type === 'Mistake'
                              ? '#dd6b20'
                              : move.type === 'Best Move'
                                ? '#38a169'
                                : 'inherit',
                      }}
                    >
                      {move.move}
                    </b>
                    <span style={{ marginLeft: 10, fontSize: '0.85rem', color: '#718096' }}>
                      - {move.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#4a5568' }}>
                    {move.comment} {move.bestMove && move.type !== 'Best Move' ? `(Best: ${move.bestMove})` : ''}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <RomanticButton variant="secondary" onClick={() => setAnalysis(null)}>
                Close Analysis
              </RomanticButton>
            </div>
          </div>
        )}
        <AdBanner />
      </div>
    </RomanticLayout>
  );
};

export default PlayPage;
