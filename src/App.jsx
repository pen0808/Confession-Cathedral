import { useState } from 'react'
import './App.css'

const MAX = 280

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

function App() {
  const [text, setText] = useState('')
  const [entries, setEntries] = useState([])

  const len = text.length
  const over = len > MAX
  const pct = len / MAX
  const countClass = 'char-count' + (over ? ' danger' : pct > 0.85 ? ' warn' : '')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (over) return
    setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
    setText('')
  }

  return (
    <div className="app">
      <h1 className="title">Confession Cathedral</h1>
      <p className="subtitle">speak your truth, leave your burden</p>

      <form className="form" onSubmit={handleSubmit}>
        <textarea
          className="input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your confession here…"
          maxLength={500}
        />
        <div className="row">
          <span className={countClass}>{len} / {MAX}</span>
          <button className="btn" type="submit" disabled={over}>
            absolve
          </button>
        </div>
      </form>

      <div className="feed">
        {entries.length === 0 ? (
          <p className="empty">no confessions yet. the floor is yours.</p>
        ) : (
          entries.map((e, i) => (
            <div className="entry" key={e.time + '-' + i}>
              <p className="entry-text">{e.text}</p>
              <span className="entry-time">{timeAgo(e.time)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
