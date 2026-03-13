import React, { useEffect } from 'react';
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
import axios from 'axios';
import LearningTip from '../components/LearningTip';
import LearningPanel from '../components/LearningPanel';
import api from '../services/apiService';

const PlayPage: React.FC = () => {
  useSocket();

  const { selectGender, cancelMatchmaking, isInQueue } = useMatchmaking();
  const { isConnected, error, currentGame, user: authUser, setUser } = useGameStore();
  const reset = useGameStore((s) => s.reset);
  const clearError = useGameStore((s) => s.setError);
  const token = useGameStore((s) => s.token);
  const navigate = useNavigate();
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [isLearnPanelOpen, setIsLearnPanelOpen] = React.useState(false);
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

  const handleAnalyze = async () => {
    if (!currentGame?.moves || currentGame.moves.length === 0) return;
    setAnalyzing(true);
    try {
      const response = await api.post('/game/analyze', { 
        moves: currentGame.moves.map((m: any) => m.san || m.lan || m) 
      });
      setAnalysis(response.data);
    } catch (err) {
      console.error('Analysis failed', err);
      alert('Failed to analyze game. Please try again.');
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
    } catch (err) {
      console.error('Failed to toggle learn mode', err);
    }
  };

  useEffect(() => {
    document.title = 'ChessDate · where hearts meet checkmates';
  }, []);

  const isGameOver =
    currentGame?.status === 'finished' ||
    currentGame?.gameStatus?.status === 'checkmate' ||
    currentGame?.gameStatus?.status === 'stalemate' ||
    currentGame?.gameStatus?.status === 'draw';

  const canRecoverFromStaleGame = !!currentGame && (error === 'You are not in this game' || error === 'Game not found');

  if (!token) {
    return (
      <RomanticLayout>
        <section className="hero">
          <div className="hero-left">
            <h1>
              <span>Login</span> to<br />start playing
            </h1>
            <p className="description">
              You need an account to start a match and select your gender.
            </p>
            <div className="buttons">
              <RomanticButton variant="primary" onClick={() => navigate('/login')}>Login</RomanticButton>
              <RomanticButton variant="secondary" onClick={() => navigate('/signup')}>Create Account</RomanticButton>
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
            <span>Live</span> match<br />starts here
          </h1>
          <p className="description">
            {isConnected ? 'Connected to server.' : 'Reconnecting…'}
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
                  <RomanticButton variant="danger" onClick={cancelMatchmaking}>Cancel Matchmaking</RomanticButton>
                ) : (
                  <>
                    <RomanticButton variant="primary" onClick={() => selectGender('male')}>Play as Male</RomanticButton>
                    <RomanticButton variant="secondary" onClick={() => selectGender('female')}>Play as Female</RomanticButton>
                  </>
                )}
              </div>
              
              {!isInQueue && (
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-pink-100 w-fit">
                  <div 
                    onClick={toggleLearnMode}
                    className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${authUser?.learnMode ? 'bg-pink-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${authUser?.learnMode ? 'left-7' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Learn While Dating Mode: {authUser?.learnMode ? 'ON' : 'OFF'}</span>
                </div>
              )}
            </div>
          )}

          {currentGame && (
            <div className="buttons">
              {isGameOver ? (
                rematchStatus === 'received' ? (
                  <>
                    <RomanticButton variant="primary" onClick={acceptRematch}>Accept Rematch</RomanticButton>
                    <RomanticButton variant="secondary" onClick={declineRematch}>Decline</RomanticButton>
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
                      {rematchStatus === 'requested' ? 'Waiting…' : rematchStatus === 'declined' ? 'Rematch Declined' : 'Rematch'}
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
                <RomanticButton variant="danger" onClick={resignGame}>Resign</RomanticButton>
              )}
            </div>
          )}
        </div>

        <RomanticChessboard interactive={true} showHeartGlow={true} />

        <div className="relative">
          <RomanticChatBox title="Match chat" showInput={true} />
          
          {authUser?.learnMode && learningTips.length > 0 && (
            <button 
              onClick={() => setIsLearnPanelOpen(true)}
              className="absolute -top-12 right-0 bg-white/80 backdrop-blur-sm border border-pink-100 px-4 py-2 rounded-xl text-xs font-bold text-pink-500 shadow-sm hover:bg-pink-50 transition-colors flex items-center gap-2"
            >
              🎓 Learn Log ({learningTips.length})
            </button>
          )}
        </div>
      </section>

      <LearningTip tip={currentTip} onClose={() => setCurrentTip(null)} />
      <LearningPanel tips={learningTips} isOpen={isLearnPanelOpen} onClose={() => setIsLearnPanelOpen(false)} />

      <div className="page-center">
        {analysis && (
          <div className="card" style={{ width: 'min(800px, 95vw)', marginTop: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Game Analysis ♟️</h2>
              <div style={{ 
                background: 'linear-gradient(135deg, #ff6b95, #ff4d7d)', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                Accuracy: {analysis.accuracy}%
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
              {Object.entries(analysis.summary).map(([key, val]: [string, any]) => (
                <div key={key} style={{ background: '#f8f9fa', padding: 10, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'capitalize' }}>{key}</div>
                  <div style={{ fontWeight: 'bold' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', padding: 10, background: '#fdfdfd', borderRadius: 15, border: '1px solid #eee' }}>
              {analysis.moves.map((m: any, i: number) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '10px 0', 
                  borderBottom: i === analysis.moves.length - 1 ? 'none' : '1px solid #f0f0f0' 
                }}>
                  <div>
                    <span style={{ opacity: 0.4, marginRight: 10 }}>{Math.floor(i/2) + 1}.{i%2===0?'':'..'}</span>
                    <b style={{ color: m.type === 'Blunder' ? '#e53e3e' : m.type === 'Mistake' ? '#dd6b20' : m.type === 'Best Move' ? '#38a169' : 'inherit' }}>
                      {m.move}
                    </b>
                    <span style={{ marginLeft: 10, fontSize: '0.85rem', color: '#718096' }}>— {m.type}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#4a5568' }}>
                    {m.comment} {m.bestMove && m.type !== 'Best Move' ? `(Best: ${m.bestMove})` : ''}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <RomanticButton variant="secondary" onClick={() => setAnalysis(null)}>Close Analysis</RomanticButton>
            </div>
          </div>
        )}
        <AdBanner />
      </div>
    </RomanticLayout>
  );
};

export default PlayPage;
