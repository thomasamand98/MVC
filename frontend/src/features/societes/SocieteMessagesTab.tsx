import { useEffect, useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { apiJson } from '../../lib/api.js'
import { features } from '../../lib/tableFeatures.js'
import { DataTable } from '../../components/DataTable.js'
import { TableSearch } from '../../components/TableSearch.js'

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

// Date « AAAA-MM-JJ HH:MM » : triable telle quelle comme du texte.
function formatDateHeure(m: MessageRow): string {
  if (!m.Date_message) return ''
  const heure = m.Heure_message ? ` ${m.Heure_message.slice(11, 16)}` : ''
  return `${m.Date_message.slice(0, 10)}${heure}`
}

const helper = createColumnHelper<typeof features, MessageRow>()

const columns = helper.columns([
  helper.accessor(formatDateHeure, { id: 'date', header: 'Date', filterFn: 'includesString' }),
  helper.accessor('Sujet', { header: 'Sujet', filterFn: 'includesString' }),
  helper.accessor('Destinataire', { header: 'Destinataire', filterFn: 'includesString' }),
  helper.accessor('Type_message', { header: 'Type', filterFn: 'includesString' }),
  helper.accessor('NomContact', { header: 'Contact', filterFn: 'includesString' }),
])

// Onglet « Messages envoyés » de la fiche Société (SocieteForm.tsx) : table
// standard (recherche, filtres, tri, export) mais en lecture seule — ce
// sont des journaux d'envoi, le backend n'expose aucune création/
// modification (voir backend/src/message/message.service.ts).
export function SocieteMessagesTab({ societeId }: Props) {
  const [messages, setMessages] = useState<MessageRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ societeId })
    if (search.trim()) params.set('search', search.trim())
    apiJson<{ messages: MessageRow[] }>(`messages?${params.toString()}`)
      .then((json) => {
        if (cancelled) return
        setMessages(json.messages)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [societeId, search])

  if (messages === null) return error ? <p>Erreur : {error}</p> : <p className="societe-tab-loading">Chargement...</p>

  return (
    <div>
      <div className="page-header">
        <h2>Messages envoyés ({messages.length})</h2>
      </div>
      {error && <p className="crud-page-error">Erreur : {error}</p>}
      <DataTable
        data={messages}
        columns={columns}
        exportFileName="Messages envoyés"
        toolbarStart={<TableSearch value={search} onChange={setSearch} />}
      />
    </div>
  )
}
