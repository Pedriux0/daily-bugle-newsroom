import React, { useEffect, useState } from 'react';

export interface BarLink {
  href: string;
  label: string;
}

interface BoardBarProps {
  mark: React.ReactNode;
  markLabel: string;
  links: BarLink[];
  isPlaying: boolean;
  onToggleMusic: () => void;
  cursorEnabled: boolean;
  onToggleCursor: () => void;
  action: { label: string; onClick: () => void };
}

/** Highlights the link for the section currently on screen */
function useActiveSection(links: BarLink[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      // A section counts as "current" when it crosses the upper third of the screen
      { rootMargin: '-30% 0px -65% 0px' }
    );
    links.forEach((link) => {
      const el = document.querySelector(link.href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [links]);

  return active;
}

interface SwitchProps {
  label: string;
  on: boolean;
  onToggle: () => void;
  className?: string;
}

const BarSwitch: React.FC<SwitchProps> = ({ label, on, onToggle, className = '' }) => (
  <button type="button" role="switch" aria-checked={on} className={`bar-switch ${className}`} onClick={onToggle}>
    <span>{label}</span>
    <span className="bar-switch-track" aria-hidden="true">
      <span className="bar-switch-knob" />
    </span>
  </button>
);

/** The site's one sticky bar: logo tile, a tile per section, two switches, the action */
const BoardBar: React.FC<BoardBarProps> = ({
  mark,
  markLabel,
  links,
  isPlaying,
  onToggleMusic,
  cursorEnabled,
  onToggleCursor,
  action,
}) => {
  const active = useActiveSection(links);

  return (
    <nav className="site-bar" aria-label="Sections">
      <a href="#top" className="bar-mark" aria-label={markLabel}>
        {mark}
      </a>
      <ul className="bar-links">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="bar-link" aria-current={active === link.href ? 'true' : undefined}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="bar-switches">
        <BarSwitch label="Music" on={isPlaying} onToggle={onToggleMusic} />
        <BarSwitch label="Cursor" on={cursorEnabled} onToggle={onToggleCursor} className="bar-cursor" />
      </div>
      <button type="button" className="np-button bar-action" onClick={action.onClick}>
        {action.label}
      </button>
    </nav>
  );
};

export default BoardBar;
