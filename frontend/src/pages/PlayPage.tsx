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

const PlayPage: React.FC = () => {
  useSocket();

  const { selectGender, cancelMatchmaking, isInQueue } = useMatchmaking();
  const { isConnected, error, currentGame } = useGameStore();
  const reset = useGameStore((s) => s.reset);
  const clearError = useGameStore((s) => s.setError);
  const token = useGameStore((s) => s.token);
  const navigate = useNavigate();
  const {
    resignGame,
    requestNewGame,
    requestRematch,
    acceptRematch,
    declineRematch,
    rematchStatus,
  } = useChessGame();

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
                      }}
                    >
                      Play Again
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
                      }}
                    >
                      Play Again
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

        <RomanticChatBox title="Match chat" showInput={true} />
      </section>
      <div className="page-center">
        <AdBanner />
      </div>
    </RomanticLayout>
  );
};

export default PlayPage;
