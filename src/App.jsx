import { useMemo, useState } from 'react'
import n5Kanji from './index.jsx'
import './App.css'

const SEEN_KANJI_KEY = 'n5-seen-kanji'

function shuffle(items) {
  const shuffled = [...items]

  // Fisher-Yates gives every item an equal chance of appearing in each position.
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

function readSeenKanji() {
  try {
    const savedKanji = JSON.parse(localStorage.getItem(SEEN_KANJI_KEY) || '[]')
    return new Set(Array.isArray(savedKanji) ? savedKanji : [])
  } catch {
    return new Set()
  }
}

function saveSeenKanji(seenKanji) {
  localStorage.setItem(SEEN_KANJI_KEY, JSON.stringify([...seenKanji]))
}

function createQuizState() {
  const seenKanji = readSeenKanji()
  let deck = n5Kanji.filter((entry) => !seenKanji.has(entry.kanji))

  // Once every kanji has been used, begin a fresh randomized round.
  if (deck.length === 0) {
    seenKanji.clear()
    deck = n5Kanji
  }

  deck = shuffle(deck)
  seenKanji.add(deck[0].kanji)
  saveSeenKanji(seenKanji)

  return { deck, seenKanji }
}

function getOptions(answer) {
  const distractors = shuffle(n5Kanji.filter((entry) => entry.kanji !== answer.kanji)).slice(0, 3)

  return shuffle([...distractors, answer])
}

function App() {
  const [quizState, setQuizState] = useState(createQuizState)
  const [selectedKanji, setSelectedKanji] = useState(null)

  const question = quizState.deck[0]
  const questionIndex = n5Kanji.length - quizState.deck.length
  const options = useMemo(() => getOptions(question), [question])
  const answered = selectedKanji !== null
  const isCorrect = selectedKanji?.kanji === question.kanji

  function chooseKanji(option) {
    if (!answered) setSelectedKanji(option)
  }

  function nextKanji() {
    setQuizState((currentState) => {
      const seenKanji = new Set(currentState.seenKanji)
      let deck = currentState.deck.slice(1)

      if (deck.length === 0) {
        seenKanji.clear()
        deck = shuffle(n5Kanji)
      }

      seenKanji.add(deck[0].kanji)
      saveSeenKanji(seenKanji)
      return { deck, seenKanji }
    })
    setSelectedKanji(null)
  }

  return (
    <main className="quiz-shell">
      <header className="quiz-header">
        <p className="eyebrow">Japanese N5 practice</p>
        <h1>Guess the Kanji</h1>
        <p className="subtitle">Choose the kanji that matches the meaning.</p>
      </header>

      <section className="quiz-card" aria-labelledby="question-title">
        <div className="progress-row">
          <span>Question {questionIndex + 1}</span>
          <span>{n5Kanji.length} kanji total</span>
        </div>

        <div className="prompt">
          <p id="question-title">Which kanji means</p>
          <h2>{question.meaning}</h2>
        </div>

        <div className="options" role="group" aria-label="Kanji choices">
          {options.map((option) => {
            const isSelected = selectedKanji?.kanji === option.kanji
            const className = [
              'option-button',
              isSelected && (isCorrect ? 'correct' : 'wrong'),
            ].filter(Boolean).join(' ')

            return (
              <button
                className={className}
                key={option.kanji}
                type="button"
                onClick={() => chooseKanji(option)}
                disabled={answered}
                aria-label={`${option.kanji}, ${option.meaning}`}
              >
                <span className="kanji-character">{option.kanji}</span>
                {isSelected && !isCorrect && <span className="wrong-label">Incorrect</span>}
                {isSelected && isCorrect && <span className="correct-label">Correct</span>}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{isCorrect ? 'Correct!' : 'Not quite.'}</strong>
            <span>
              {isCorrect
                ? `${question.kanji} means “${question.meaning}.”`
                : `${selectedKanji.kanji} means “${selectedKanji.meaning}.” The correct answer is ${question.kanji}.`}
            </span>
          </div>
        )}

        <button className="next-button" type="button" onClick={nextKanji}>
          Next Kanji <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  )
}

export default App
