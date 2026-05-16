import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useVoiceContext } from '../context/VoiceContext';
import { useSoundContext } from '../context/SoundContext';
import VoiceControlUI from './VoiceControlUI';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: '⚔️' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/notes', label: 'Journal', icon: '📓' },
  { href: '/activities', label: 'Activity', icon: '⚡' },
  { href: '/obsidian', label: 'Vault', icon: '🔮' },
];

export default function Navbar() {
  const [current, setCurrent] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { muted, toggleMute, playNavClick } = useSoundContext();

  useEffect(() => {
    setCurrent(window.location.pathname);
  }, []);

  const handleNavClick = () => {
    playNavClick();
    setMobileOpen(false);
  };

  return (
    <>
      <motion.nav
        data-tour="navbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(10, 10, 12, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e1e20',
          padding: '0 1.5rem',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: '0.5rem' }}>
          {/* Logo */}
          <a href="/" onClick={handleNavClick} style={{ textDecoration: 'none', marginRight: '1rem', flexShrink: 0 }}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              style={{
                fontWeight: 800,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #b8923c, #f4d77a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.08em',
                fontFamily: 'Orbitron, sans-serif',
                display: 'inline-block',
              }}
            >
              THE FORGE
            </motion.span>
          </a>

          {/* Desktop nav links */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
            {navLinks.map((link) => {
              const isActive = current === link.href || (link.href !== '/' && current.startsWith(link.href));
              return (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#f4d77a' : '#888',
                    background: isActive ? '#b8923c18' : 'transparent',
                    border: isActive ? '1px solid #b8923c35' : '1px solid transparent',
                    transition: 'color 0.15s',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </motion.a>
              );
            })}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Sound toggle */}
            <motion.button
              onClick={() => { toggleMute(); }}
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #2a2a2c',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                color: muted ? '#444' : '#888',
              }}
            >
              {muted ? '🔇' : '🔊'}
            </motion.button>

            {/* Voice control */}
            <div data-tour="voice-button">
              <VoiceControlUI />
            </div>

            {/* Account */}
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              onClick={handleNavClick}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#666',
                border: '1px solid #2a2a2c',
              }}
              className="account-link"
            >
              Account
            </motion.a>

            {/* Mobile hamburger */}
            <motion.button
              className="hamburger"
              onClick={() => setMobileOpen(o => !o)}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 36,
                height: 36,
                background: 'transparent',
                border: '1px solid #2a2a2c',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 4,
                padding: '7px',
              }}
            >
              {mobileOpen ? (
                <span style={{ color: '#b8923c', fontSize: '1rem', lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <span style={{ display: 'block', width: '100%', height: 2, background: '#888', borderRadius: 1 }} />
                  <span style={{ display: 'block', width: '100%', height: 2, background: '#888', borderRadius: 1 }} />
                  <span style={{ display: 'block', width: '100%', height: 2, background: '#888', borderRadius: 1 }} />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              style={{ overflow: 'hidden', borderTop: '1px solid #1e1e20' }}
            >
              <div style={{ padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {navLinks.map((link) => {
                  const isActive = current === link.href || (link.href !== '/' && current.startsWith(link.href));
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={handleNavClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.9375rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#f4d77a' : '#c4c4ca',
                        background: isActive ? '#b8923c12' : 'transparent',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                      {link.label}
                    </a>
                  );
                })}
                <a href="/login" onClick={handleNavClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>
                  👤 Account
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
