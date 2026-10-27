import React from 'react';

const BugleOpinionSection: React.FC = () => {
  return (
    <div className="bg-gray-50 border-2 border-black p-6 mb-8">
      <h2 className="text-4xl font-black uppercase mb-4 text-center border-b-2 border-black pb-2 text-black">
        Editorial Opinion
      </h2>
      <article className="max-w-4xl mx-auto">
        <h3 className="text-3xl font-black uppercase mb-3 text-black" style={{ fontFamily: 'Georgia, serif' }}>
          It's Time to Unmask the Menace
        </h3>
        <div className="text-sm mb-2 italic text-gray-600">By J. Jonah Jameson, Publisher</div>
        <div className="text-base leading-relaxed text-black" style={{ fontFamily: 'Georgia, serif' }}>
          <p className="mb-4">
            For months, I've been warning the citizens of New York about the threat posed by the so-called "Spider-Man."
            This masked criminal, hiding behind a costume and a web of lies, has convinced some that he's a hero. Nothing
            could be further from the truth.
          </p>
          <p className="mb-4">
            What kind of hero hides his face? What kind of hero operates in the shadows, accountable to no one? The answer
            is simple: no hero at all. Spider-Man is a menace to our city, a vigilante who thinks he's above the law that
            governs the rest of us.
          </p>
          <p className="mb-4">
            We have police officers — brave men and women who put their lives on the line every day — who are trained,
            accountable, and work within our legal system. We don't need some wall-crawling freak swinging through our
            streets, causing mayhem and property damage in the name of "justice."
          </p>
          <p className="italic">
            The Daily Bugle will continue to investigate and expose the truth about Spider-Man until this threat is
            neutralized.
          </p>
        </div>
      </article>
    </div>
  );
};

export default BugleOpinionSection;
