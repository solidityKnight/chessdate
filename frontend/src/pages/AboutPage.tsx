import React, { useEffect } from 'react';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'ChessDate · about';
  }, []);

  return (
    <RomanticLayout>
      <section className="hero">
        <div className="hero-left">
          <h1>
            <span>About</span> ChessDate
          </h1>
          <p className="description">
            A romantic chess dating web app where hearts meet checkmates. Match, play, and chat in real time.
          </p>
          <div className="buttons">
            <RomanticButton variant="primary" onClick={() => navigate('/play')}>Start Match</RomanticButton>
            <RomanticButton variant="secondary" onClick={() => navigate('/')}>Home</RomanticButton>
          </div>
        </div>

        <div className="chat-box">
          <h3>Why it exists</h3>
          <div className="message"><span>Chess:</span> Strategy, patience, and style.<div className="timestamp">forever</div></div>
          <div className="message"><span>Dating:</span> Connection, curiosity, and charm.<div className="timestamp">forever</div></div>
          <div className="message"><span>Together:</span> A match worth making.<div className="timestamp">now</div></div>
        </div>
      </section>
    </RomanticLayout>
  );
};

export default AboutPage;

