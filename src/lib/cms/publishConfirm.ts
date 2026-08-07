/**
 * Shared publish confirmation modal (vanilla DOM for Astro + React-friendly API).
 */
export type PublishModalCopy = {
  title: string
  body: string
  editNote: string
  confirm: string
  cancel: string
  publishing: string
  error: string
}

export function buildPublishModalCopy(locale: string, editPath = '/edit'): PublishModalCopy {
  const editUrl = editPath.startsWith('http') ? editPath : editPath
  if (locale === 'en') {
    return {
      title: 'Publish your portfolio?',
      body: 'After you publish, anyone with the link can see your page.',
      editNote: `You can always change your content later at ${editUrl}.`,
      confirm: 'Publish now',
      cancel: 'Not yet',
      publishing: 'Publishing…',
      error: 'Could not publish. Try again.',
    }
  }
  return {
    title: 'Opublikować portfolio?',
    body: 'Po publikacji strona będzie widoczna publicznie dla każdego, kto ma link.',
    editNote: `Treści możesz zawsze zmieniać pod adresem ${editUrl}.`,
    confirm: 'Opublikuj teraz',
    cancel: 'Jeszcze nie',
    publishing: 'Publikowanie…',
    error: 'Nie udało się opublikować. Spróbuj ponownie.',
  }
}

export async function requestPortfolioPublish(): Promise<{ ok: boolean; status: number }> {
  const res = await fetch('/api/edit/portfolio/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: '{}',
  })
  return { ok: res.ok, status: res.status }
}
