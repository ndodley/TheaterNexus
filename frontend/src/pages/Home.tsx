import { Link, useNavigate } from 'react-router-dom'
import { imageUrl } from '../api'
import { getMovies } from '../api/movies'
import type { Movie } from '../types'
import HeroCarousel, { type HeroSlide } from '../components/HeroCarousel'
import { useFetch } from '../hooks/useFetch'
import './Home.css'

function HomePage() {
  const navigate = useNavigate()
  const { data: movies = [], loading, error } = useFetch(() => getMovies().then(res => res.data), [])

  const statusKey = (m: Movie) => (m.availability_status || '').toLowerCase()
  const hasPoster = (m: Movie) => !!(m.image_url || m.image)
  const ratingNum = (m: Movie) => {
    const n = typeof m.rating_average === 'number' ? m.rating_average : Number(m.rating_average)
    return Number.isFinite(n) ? n : 0
  }

  const withPoster = movies.filter(hasPoster)
  const nowShowingWithPoster = withPoster
    .filter(m => statusKey(m) === 'now_showing')
    .sort((a, b) => ratingNum(b) - ratingNum(a))
  const comingSoonWithPoster = withPoster
    .filter(m => statusKey(m) === 'coming_soon')
    .sort((a, b) => ratingNum(b) - ratingNum(a))

  // Pick a balanced set so the hero isn't dominated by one status.
  const heroPicked: Movie[] = []
  heroPicked.push(...nowShowingWithPoster.slice(0, 4))
  heroPicked.push(...comingSoonWithPoster.slice(0, 2))

  if (heroPicked.length < 6) {
    const pickedIds = new Set(heroPicked.map(m => m.id))
    const rest = withPoster
      .filter(m => !pickedIds.has(m.id))
      .sort((a, b) => ratingNum(b) - ratingNum(a))
    heroPicked.push(...rest.slice(0, 6 - heroPicked.length))
  }

  const heroMovies = heroPicked.slice(0, 6)

  const heroSlides: HeroSlide[] = heroMovies.map(m => ({
      src: imageUrl(m.image_url || m.image),
      alt: m.title,
      caption: m.title,
      onClick: () => navigate(`/movies/${m.id}`),
    }))


  const nowShowing = movies.filter(m => statusKey(m) === 'now_showing')
  const comingSoon = movies.filter(m => statusKey(m) === 'coming_soon')

  const topNowShowing = nowShowing.slice(0, 8)
  const topComingSoon = comingSoon.slice(0, 8)

  return (
    <div>
      {/* Hero */}
      <section className="fade-in home-heroSection">
        <div className="container">
          <div className="home-heroHeader">
            <div className="home-heroKicker">Trending now • Fresh releases • Fast checkout</div>
            <h1 className="home-heroTitle">
              Welcome to <span className="logo home-heroLogoAccent">Theater Nexus</span>
            </h1>
            <p className="home-heroSubtitle">Your modern movie ticketing experience. Browse films, explore details, and book with ease.</p>
          </div>

          <div className="home-heroCarouselWrap">
            <HeroCarousel slides={heroSlides} height={420} intervalMs={7000}>
              {({ activeIndex }) => {
                const featured = heroMovies[activeIndex]
                const statusLabel = featured?.availability_status
                  ? featured.availability_status.toLowerCase().replaceAll('_', ' ')
                  : ''
                return (
                  <div className="hero__glass">
                    <div className="hero__kicker">Featured</div>
                    <h2 className="hero__title home-featuredTitle">
                      {featured ? featured.title : 'Featured Movies'}
                    </h2>
                    <p className="hero__subtitle">
                      {featured ? (
                        <>
                          {featured.genres?.length ? <>{featured.genres.slice(0, 2).map(g => g.name).join(' / ')} • </> : null}
                          {statusLabel ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) : 'Now Showing'}
                        </>
                      ) : (
                        <>Click a poster to open details.</>
                      )}
                    </p>

                    {featured?.plot_summary && (
                      <div className="hero__caption">{featured.plot_summary.slice(0, 140)}{featured.plot_summary.length > 140 ? '…' : ''}</div>
                    )}
                  </div>
                )
              }}
            </HeroCarousel>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="container home-sections">
        {loading && (
          <div className="card">Loading featured movies…</div>
        )}
        {error && (
          <div className="card">Error: {error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="home-sectionsGrid">
              <div id="now-showing" className="home-section">
                <div className="home-sectionHeader">
                  <h2 className="home-sectionTitle">Now Showing</h2>
                  <Link className="home-sectionLink" to="/movies">View all</Link>
                </div>
                <div className="home-grid">
                  {topNowShowing.map(m => (
                    <Link key={m.id} to={`/movies/${m.id}`} className="home-movieCard">
                      {m.image && (
                        <img className="home-card-img" src={imageUrl(m.image_url || m.image)} alt={m.title} />
                      )}
                      <div className="home-movieBody">
                        <div className="home-movieTitle">{m.title}</div>
                        <div className="home-movieBadges">
                          {m.genres.slice(0, 2).map(g => <span key={g.id} className="badge">{g.name}</span>)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div id="coming-soon" className="home-section">
                <div className="home-sectionHeader">
                  <h2 className="home-sectionTitle">Coming Soon</h2>
                  <Link className="home-sectionLink" to="/movies">View all</Link>
                </div>
                <div className="home-grid">
                  {topComingSoon.map(m => (
                    <Link key={m.id} to={`/movies/${m.id}`} className="home-movieCard">
                      {m.image && (
                        <img className="home-card-img" src={imageUrl(m.image_url || m.image)} alt={m.title} />
                      )}
                      <div className="home-movieBody">
                        <div className="home-movieTitle">{m.title}</div>
                        <div className="home-movieBadges">
                          {m.genres.slice(0, 2).map(g => <span key={g.id} className="badge">{g.name}</span>)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default HomePage
