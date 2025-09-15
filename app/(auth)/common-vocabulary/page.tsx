const vocabularyData = {
  title: "Great Lakes I-Corps Common Vocabulary",
  terms: [
    {
      id: 1,
      term: "Customer Discovery",
      definition:
        "The process of conversing with people (strangers) to test hypotheses from the <strong>Business Model Canvas (BMC)</strong> and learn about the envisioned market.",
    },
    {
      id: 2,
      term: "Business Model Canvas (BMC)",
      definition:
        "The <strong>Business Model Canvas</strong> includes 9 elements for organizing business hypotheses. Focus on Customer Segments and Value Proposition for Product Market fit. Need clear, quantified answers before execution.",
    },
    {
      id: 3,
      term: "Get out of the building",
      definition:
        "A lean start-up rallying cry to engage with strangers outside the comfort zone. Customer Discovery is the core of I-Corps methodology, learned through doing and iterating.",
    },
    {
      id: 4,
      term: "Business Thesis",
      definition:
        'A short statement capturing the <strong>"PRIMARY"</strong> value proposition and beachhead market. Should be quantifiable, relatable, specific, and testable (<strong>QRST</strong>) through customer discovery, addressing who will buy, what they will buy, and why.',
    },
    {
      id: 5,
      term: "QRST",
      definition:
        "Stands for <strong>Quantitative, Relatable, Specific & Testable</strong>. Serves as a reminder to quantify, use stakeholder language, identify key metrics, and develop testable questions for customer discovery.",
    },
    {
      id: 6,
      term: "Value Proposition",
      definition:
        'Answers "What pain are you solving, what gain are you creating, and for who?". Value Propositions should be benefits to specific stakeholders, <strong>"NOT FEATURES"</strong>. Watch out for words ending in "-er" (e.g., <em>faster, stronger, safer</em>).',
    },
  ],
};

export default function CommonVocabularyPage() {
  return (
    <div className="min-h-screen bg-[#eff0f4] p-8">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center flex-1">
          {vocabularyData.title}
        </h1>
      </div>
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg">
        <div className="space-y-6">
          {vocabularyData.terms.map((term) => (
            <div
              key={term.id}
              className={`${
                term.id % 2 === 1 ? "bg-[#F4F0FF]" : "bg-white"
              } p-12 mb-0`}
            >
              <div className="flex items-start gap-8">
                <div className="flex w-100 items-center gap-4 flex-shrink-0">
                  <img
                    src="/Group 19965.png"
                    alt="Term icon"
                    className="w-16 h-16 object-contain mt-1"
                  />
                  <div>
                    <div className="text-[#6A35FF] text-md font-bold mb-1">
                      Term #{term.id}
                    </div>
                    <h3 className="text-xl text-gray-900">{term.term}</h3>
                  </div>
                </div>

                <div className="flex-1">
                  <p
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: term.definition }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
