import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import { useGameStore } from '../store/gameStore';

const RomanticLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useGameStore((s) => s.token);

  useEffect(() => {
    document.title = 'ChessDate · where hearts meet checkmates';
  }, []);

  return (
    <RomanticLayout>
      <section className="hero">
        <div className="hero-left">
          <h1>
            <span>Castles,</span> knights<br />butterflies in<br />stomach.
          </h1>
          <p className="description">
            Play chess with a stranger and chat during the match.<br />
            Checkmate their king… and maybe their heart.
          </p>
          <div className="buttons">
            <RomanticButton variant="primary" onClick={() => navigate(token ? '/play' : '/login')}>Play Now</RomanticButton>
            <RomanticButton variant="secondary" onClick={() => navigate('/guides')}>How It Works</RomanticButton>
          </div>
        </div>

        <div className="chess-area">
          <div className="heart-bg"></div>
          <div className="board">
            <div className="square dark">♜</div><div className="square light">♞</div><div className="square dark">♝</div><div className="square light">♛</div>
            <div className="square dark">♚</div><div className="square light">♝</div><div className="square dark">♞</div><div className="square light">♜</div>
            <div className="square light">♟</div><div className="square dark">♟</div><div className="square light">♟</div><div className="square dark">♟</div>
            <div className="square light">♟</div><div className="square dark">♟</div><div className="square light">♟</div><div className="square dark">♟</div>
            <div className="square dark"></div><div className="square light"></div><div className="square dark"></div><div className="square light"></div>
            <div className="square dark"></div><div className="square light"></div><div className="square dark"></div><div className="square light"></div>
            <div className="square light"></div><div className="square dark"></div><div className="square light"></div><div className="square dark"></div>
            <div className="square light"></div><div className="square dark"></div><div className="square light"></div><div className="square dark"></div>
            <div className="square dark"></div><div className="square light"></div><div className="square dark"></div><div className="square light"></div>
            <div className="square dark"></div><div className="square light"></div><div className="square dark"></div><div className="square light"></div>
            <div className="square light"></div><div className="square dark"></div><div className="square light"></div><div className="square dark"></div>
            <div className="square light"></div><div className="square dark"></div><div className="square light"></div><div className="square dark"></div>
            <div className="square dark">♙</div><div className="square light">♙</div><div className="square dark">♙</div><div className="square light">♙</div>
            <div className="square dark">♙</div><div className="square light">♙</div><div className="square dark">♙</div><div className="square light">♙</div>
            <div className="square light">♖</div><div className="square dark">♘</div><div className="square light">♗</div><div className="square dark">♕</div>
            <div className="square light">♔</div><div className="square dark">♗</div><div className="square light">♘</div><div className="square dark">♖</div>
          </div>
        </div>

        <div className="chat-box">
          <h3>Match chat</h3>
          <div className="message"><span>pink_knight:</span> Hi! Ready to lose? ♟️❤️ <div className="timestamp">2 min ago</div></div>
          <div className="message"><span>queen_heart:</span> Haha we&apos;ll see 😏 <div className="timestamp">1 min ago</div></div>
          <div className="message"><span>pink_knight:</span> Nice opening! <div className="timestamp">just now</div></div>
        </div>
      </section>
    </RomanticLayout>
  );
};

export default RomanticLandingPage;
