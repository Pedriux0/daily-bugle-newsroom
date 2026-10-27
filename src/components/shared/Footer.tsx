import React from 'react';
import { BarLink } from './BoardBar';

interface FooterColumn {
  heading: string;
  lines: React.ReactNode[];
}

interface FooterProps {
  wordmark: string;
  columns: FooterColumn[];
  links: BarLink[];
}

/** Photo and footage credits — required by the CC BY clip, kept for all of them */
const CREDITS: { title: string; by?: string; licence: string; url: string }[] = [
  { title: 'Flatiron Building NYC c1903', licence: 'public domain', url: 'https://commons.wikimedia.org/wiki/File:Flatiron_Building_NYC_c1903.jpg' },
  { title: 'The New York Times newsroom 1942', by: 'Marjory Collins', licence: 'public domain', url: 'https://commons.wikimedia.org/wiki/File:The_New_York_Times_newsroom_1942.jpg' },
  { title: 'Newsroom of the New York Times newspaper', by: 'Marjory Collins', licence: 'public domain', url: 'https://commons.wikimedia.org/wiki/File:Newsroom_of_the_New_York_Times_newspaper.8d22688v.jpg' },
  { title: 'Western Daily Press printing press 1908', by: 'Samuel Loxton', licence: 'public domain', url: 'https://commons.wikimedia.org/wiki/File:Western_Daily_Press_printing_press_1908.jpg' },
  { title: 'Printing presses at the Las Vegas Review-Journal', by: 'Harrison Keely', licence: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:The_910_ton_printing_presses_at_the_Las_Vegas_Review-Journal_were_the_largest_in_the_world_when_installed_in_2000.webm' },
  { title: 'Brooklyn Bridge at night', by: 'Kai Pilger', licence: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Brooklyn_Bridge_at_night.jpg' },
  { title: 'Queens Boulevard west of Yellowstone Boulevard', by: 'Nutmegger', licence: 'public domain', url: 'https://commons.wikimedia.org/wiki/File:Queens_Boulevard_west_of_Yellowstone_Boulevard.jpg' },
  { title: 'Tobey Maguire 2014', by: 'gdcgraphics', licence: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Tobey_Maguire_2014.jpg' },
  { title: 'Andrew Garfield', by: 'Gage Skidmore', licence: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Andrew_Garfield_by_Gage_Skidmore_(cropped).jpg' },
  { title: 'Tom Holland', by: 'Gage Skidmore', licence: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Tom_Holland_by_Gage_Skidmore.jpg' },
  { title: 'NYCC 2023 Cosplay of Spider-Man Noir', by: 'LostplanetKD73', licence: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:NYCC_2023_Cosplay_of_Spider-Man_Noir.jpg' },
];

/** Inverted close: four columns above, the wordmark fitted edge to edge below */
const Footer: React.FC<FooterProps> = ({ wordmark, columns, links }) => (
  <footer className="np-footer">
    <div className="np-grid footer-cols">
      {columns.map((column) => (
        <div key={column.heading}>
          <h2>{column.heading}</h2>
          <ul>
            {column.lines.map((line, i) => (
              <li key={i} className={i === 0 ? undefined : 'np-soft'}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <h2>Sections</h2>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <aside className="post-it" aria-label="Credits">
      <p>
        A fan project, not affiliated with Marvel. News photos belong to their publishers; each is credited under the
        picture and links to the original story. The actors' photos don't mean they endorse this site.
      </p>
      <p>
        Archive pictures and footage:{' '}
        {CREDITS.map((credit, i) => (
          <React.Fragment key={credit.url}>
            <a href={credit.url} target="_blank" rel="noopener noreferrer">
              {credit.title}
            </a>
            {credit.by ? ` by ${credit.by}` : ''}, {credit.licence}
            {i < CREDITS.length - 1 ? '; ' : ', via Wikimedia Commons.'}
          </React.Fragment>
        ))}
      </p>
    </aside>

    <svg className="footer-wordmark" viewBox="0 0 1000 132" role="img" aria-label={wordmark}>
      <text
        x="0"
        y="124"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        style={{ font: 'var(--display-weight) 168px var(--face)', letterSpacing: '-0.04em' }}
      >
        {wordmark}
      </text>
    </svg>
  </footer>
);

export default Footer;
