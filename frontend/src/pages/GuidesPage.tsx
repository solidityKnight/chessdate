import React, { useEffect } from 'react';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import AdBanner from '../components/AdBanner';
import { useNavigate } from 'react-router-dom';

const GuidesPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'ChessDate · guides';
  }, []);

  return (
    <RomanticLayout>
      <section className="hero">
        <div className="hero-left">
          <h1>
            <span>Guides</span> for<br />romantic chess
          </h1>
          <p className="description">
            A few gentle tips to help you charm your opponent while keeping your king safe.
          </p>
          <div className="buttons">
            <RomanticButton variant="primary" onClick={() => navigate('/play')}>Play Now</RomanticButton>
            <RomanticButton variant="secondary" onClick={() => navigate('/')}>Back Home</RomanticButton>
          </div>
        </div>

        <div className="chat-box">
          <h3>Quick tips</h3>
          <div className="message"><span>Tip 1:</span> Open with a classic… and a compliment.<div className="timestamp">always</div></div>
          <div className="message"><span>Tip 2:</span> Don’t rush—slow moves, strong vibes.<div className="timestamp">always</div></div>
          <div className="message"><span>Tip 3:</span> Trade queens only if you’re sure…<div className="timestamp">always</div></div>
        </div>
      </section>
      <div className="page-center">
        <AdBanner />
      </div>
    </RomanticLayout>
  );
};

export default GuidesPage;

