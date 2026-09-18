import { useEffect, useState } from 'react'

type MessageRow = {
  IDMESSAGES: string
  Sujet: string | null
  Destinataire: string | null
  Type_message: string | null
  Date_message: string | null
  Heure_message: string | null
  NomContact: string | null
}

type Props = {
  societeId: string
}

const apiUrl = (path: string) => `http://${window.location.hostname}:3000/${path}`

function toDateLabel(value: string | null): string {
  return value ? value.slice(0, 10) : '—'
}

// Onglet « Messages envoyés » de la fiche Société (SocieteForm.tsx) —
// lecture seule (voir backend/src/message/message.service.ts).
export function SocieteMessagesTab({ societeId }: Props) {
  const [messages, setMessages] = useState<MessageRow[] | null>(null)

  useEffect(() => {
    setMessages(null)
    fetch(apiUrl(`messages?societeId=${encodeURIComponent(societeId)}`))
      .then((res) => res.json() as Promise<{ messages: MessageRow[] }>)
      .then((json) => setMessages(json.messages))
      .catch(() => setMessages([]))
  }, [societeId])

  if (messages === null) return <p className="societe-tab-loading">Chargement...</p>
  if (messages.length === 0) return <p className="societe-tab-empty">Aucun message envoyé pour cette société.</p>

  return (
    <table className="societe-tab-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Sujet</th>
          <th>Destinataire</th>
          <th>Type</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>
        {messages.map((m) => (
          <tr key={m.IDMESSAGES}>
            <td>{toDateLabel(m.Date_message)}{m.Heure_message ? ` ${m.Heure_message.slice(11, 16)}` : ''}</td>
            <td>{m.Sujet || '—'}</td>
            <td>{m.Destinataire || '—'}</td>
            <td>{m.Type_message || '—'}</td>
            <td>{m.NomContact || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
