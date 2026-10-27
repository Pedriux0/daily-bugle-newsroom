import React from 'react';
import tobey from '../../assets/photos/tobey-maguire-2014.jpg';
import andrew from '../../assets/photos/andrew-garfield-by-gage-skidmore-cropped.jpg';
import tom from '../../assets/photos/tom-holland-by-gage-skidmore.jpg';

interface SpiderMan {
  name: string;
  films: string;
  photo: string;
  width: number;
  height: number;
  credit: { by: string; licence: string; licenceUrl: string; page: string };
  favorite?: boolean;
}

// Andrew sits in the middle: he's the site owner's favourite
const SPIDER_MEN: SpiderMan[] = [
  {
    name: 'Tobey Maguire',
    films: 'Spider-Man trilogy, 2002 to 2007',
    photo: tobey,
    width: 769,
    height: 1024,
    credit: {
      by: 'gdcgraphics',
      licence: 'CC BY-SA 2.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      page: 'https://commons.wikimedia.org/wiki/File:Tobey_Maguire_2014.jpg',
    },
  },
  {
    name: 'Andrew Garfield',
    films: 'The Amazing Spider-Man, 2012 to 2014',
    photo: andrew,
    width: 960,
    height: 1216,
    favorite: true,
    credit: {
      by: 'Gage Skidmore',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Andrew_Garfield_by_Gage_Skidmore_(cropped).jpg',
    },
  },
  {
    name: 'Tom Holland',
    films: 'Marvel Cinematic Universe, 2016 to today',
    photo: tom,
    width: 960,
    height: 1417,
    credit: {
      by: 'Gage Skidmore',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Tom_Holland_by_Gage_Skidmore.jpg',
    },
  },
];

/** The three Spider-Men who swung together in No Way Home, Andrew in the middle */
const SpiderMen: React.FC = () => (
  <section className="np-section" id="spider-men" aria-labelledby="spider-men-head">
    <div className="np-grid spider-men-top">
      <h2 className="desk-head" id="spider-men-head" data-reveal>
        Three Spider-Men.
      </h2>
      <p className="np-measure" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        Three actors, three Peter Parkers, one multiverse. All of them swung together in Spider-Man: No Way Home in
        2021.
      </p>
    </div>

    <ul className="spider-men">
      {SPIDER_MEN.map((man, i) => (
        <li
          key={man.name}
          className={`spider-man${man.favorite ? ' spider-man--favorite' : ''}`}
          data-reveal
          style={{ '--i': i } as React.CSSProperties}
        >
          <figure>
            <div className="spider-man-photo">
              {/* Shown unaltered: these photos are share-alike licensed */}
              <img src={man.photo} alt={`${man.name}, smiling`} width={man.width} height={man.height} loading="lazy" />
              {man.favorite && (
                <p className="favorite-note" aria-label="Note: my favorite Spider-Man">
                  My favorite Spider-Man!
                </p>
              )}
            </div>
            <figcaption>
              <strong>{man.name}</strong>
              <span>{man.films}</span>
              <span className="news-credit">
                Photo:{' '}
                <a href={man.credit.page} target="_blank" rel="noopener noreferrer">
                  {man.credit.by}
                </a>
                ,{' '}
                <a href={man.credit.licenceUrl} target="_blank" rel="noopener noreferrer">
                  {man.credit.licence}
                </a>
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  </section>
);

export default SpiderMen;
