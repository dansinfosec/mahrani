import Seo from '../components/seo/Seo.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { useSite } from '../site/SiteContext.jsx'

export default function NotFoundPage() {
  const { site } = useSite()
  return (
    <>
      <Seo seo={{ title: 'Page not found', full_title: `Page not found${site.seo.title_suffix}`, no_index: true }} />
      <ErrorState title="This page has wandered off." message="The page you are looking for does not exist." />
    </>
  )
}
