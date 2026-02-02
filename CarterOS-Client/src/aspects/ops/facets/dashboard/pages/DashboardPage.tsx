// ===================
// © AngelaMos | 2025
// DashboardPage.tsx
// ===================

import {
  FaCloudflare,
  FaGithub,
  FaApple,
  FaXTwitter,
} from 'react-icons/fa6'
import {
  SiStripe,
  SiSupabase,
  SiGoogleanalytics,
  SiSentry,
  SiResend,
  SiZoho,
  SiExpo,
  SiTiktok,
  SiYoutube,
  SiInstagram,
  SiLinkedin,
  SiReddit,
  SiFacebook,
  SiMongodb,
  SiVuedotjs,
} from 'react-icons/si'
import { GiCardJoker, GiHeartBeats } from 'react-icons/gi'
import styles from './DashboardPage.module.scss'

interface LinkCard {
  title: string
  url: string
  description?: string
  icon?: React.ComponentType
  iconColor?: string
}

interface LinkSection {
  title: string
  cards: LinkCard[]
}

const sections: LinkSection[] = [
  {
    title: 'Main Websites',
    cards: [
      {
        title: 'CertGames ADMIN',
        url: 'https://cracked.certgames.com/',
        description: 'Admin Panel',
        icon: GiCardJoker,
        iconColor: '#DC2626',
      },
      {
        title: 'CertGames Dashboard',
        url: 'https://certgames.com/dashboard',
        description: 'CertGames user dashboard',
        icon: GiCardJoker,
        iconColor: '#DC2626',
      },
    ],
  },
  {
    title: 'Database & Analytics',
    cards: [
      {
        title: 'MongoDB UI',
        url: 'http://localhost:5173',
        description: 'MongoDB database interface',
        icon: SiMongodb,
        iconColor: '#47A248',
      },
      {
        title: 'Stripe Dashboard',
        url: 'https://dashboard.stripe.com/acct_1R3wAfBeeXPGfjzr/dashboard',
        description: 'Payment processing and revenue',
        icon: SiStripe,
        iconColor: '#635BFF',
      },
      {
        title: 'Supabase',
        url: 'https://supabase.com/dashboard/project/pnkqlebswkflagwkvnoi/database/schemas',
        description: 'Database management',
        icon: SiSupabase,
        iconColor: '#3ECF8E',
      },
      {
        title: 'Google Analytics',
        url: 'https://analytics.google.com/analytics/web/?authuser=1#/a355638530p489819315/reports/intelligenthome',
        description: 'Website analytics and insights',
        icon: SiGoogleanalytics,
        iconColor: '#E37400',
      },
    ],
  },
  {
    title: 'Error Logs & Monitoring',
    cards: [
      {
        title: 'Kuma',
        url: 'http://localhost:24000/dashboard',
        description: 'Uptime monitoring',
        icon: GiHeartBeats,
        iconColor: '#5CDD8B',
      },
      {
        title: 'Sentry',
        url: 'https://certgames.sentry.io/issues/',
        description: 'Error tracking and monitoring',
        icon: SiSentry,
        iconColor: '#362D59',
      },
      {
        title: 'Google Search Console',
        url: 'https://search.google.com/u/1/search-console?resource_id=sc-domain%3Acertgames.com',
        description: 'Search performance and indexing',
        icon: SiGoogleanalytics,
        iconColor: '#4285F4',
      },
    ],
  },
  {
    title: 'Cloudflare',
    cards: [
      {
        title: 'Cloudflare Domains',
        url: 'https://dash.cloudflare.com/50b62d49d4439d599f871dc471c5ccc8/home/domains',
        description: 'Domain management and DNS',
        icon: FaCloudflare,
        iconColor: '#F38020',
      },
      {
        title: 'Cloudflare One',
        url: 'https://one.dash.cloudflare.com/50b62d49d4439d599f871dc471c5ccc8/overview?tab=overview&duration=24h',
        description: 'Zero Trust security dashboard',
        icon: FaCloudflare,
        iconColor: '#F38020',
      },
    ],
  },
  {
    title: 'Development',
    cards: [
      {
        title: 'Vuemantics',
        url: 'http://localhost:856',
        description: 'Media storage',
        icon: SiVuedotjs,
        iconColor: '#4FC08D',
      },
      {
        title: 'GitHub Projects',
        url: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
        description: 'Project repository',
        icon: FaGithub,
        iconColor: '#FFFFFF',
      },
    ],
  },
  {
    title: 'Social Media',
    cards: [
      {
        title: 'TikTok',
        url: 'https://www.tiktok.com/',
        icon: SiTiktok,
        iconColor: '#FF0050',
      },
      {
        title: 'YouTube',
        url: 'https://www.youtube.com/@certgamesdev',
        icon: SiYoutube,
        iconColor: '#FF0000',
      },
      {
        title: 'Instagram',
        url: 'https://www.instagram.com/certsgamified/',
        icon: SiInstagram,
        iconColor: '#E4405F',
      },
      {
        title: 'X (Twitter)',
        url: 'https://x.com/suuci2',
        icon: FaXTwitter,
        iconColor: '#FFFFFF',
      },
      {
        title: 'LinkedIn (Personal)',
        url: 'https://www.linkedin.com/in/carterperez-dev/',
        icon: SiLinkedin,
        iconColor: '#0A66C2',
      },
      {
        title: 'LinkedIn (Company)',
        url: 'https://www.linkedin.com/company/certgames/?viewAsMember=true',
        icon: SiLinkedin,
        iconColor: '#0A66C2',
      },
      {
        title: 'Reddit',
        url: 'https://www.reddit.com/user/Hopeful_Beat7161/',
        icon: SiReddit,
        iconColor: '#FF4500',
      },
      {
        title: 'Facebook',
        url: 'https://www.facebook.com/people/CertGames/61574087485497/',
        icon: SiFacebook,
        iconColor: '#1877F2',
      },
    ],
  },
  {
    title: 'Tools',
    cards: [
      {
        title: 'Resend',
        url: 'https://resend.com/login',
        description: 'Email service',
        icon: SiResend,
        iconColor: '#FFFFFF',
      },
      {
        title: 'Zoho Mail',
        url: 'https://mail.zoho.com/zm/#mail/folder/inbox',
        description: 'Business email',
        icon: SiZoho,
        iconColor: '#E42527',
      },
    ],
  },
  {
    title: 'iOS Development',
    cards: [
      {
        title: 'Expo',
        url: 'https://expo.dev/accounts/certgames/projects/CertGamesApp',
        description: 'Mobile app development',
        icon: SiExpo,
        iconColor: '#000020',
      },
      {
        title: 'App Store Connect',
        url: 'https://appstoreconnect.apple.com/apps',
        description: 'iOS app management',
        icon: FaApple,
        iconColor: '#FFFFFF',
      },
      {
        title: 'Apple Developer',
        url: 'https://developer.apple.com/account/resources/profiles/list',
        description: 'Developer certificates and profiles',
        icon: FaApple,
        iconColor: '#FFFFFF',
      },
    ],
  },
]

export function DashboardPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Operations Hub</h1>
        <p className={styles.subtitle}>
          Quick access to all business tools and platforms
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          <div className={styles.grid}>
            {section.cards.map((card) => {
              const Icon = card.icon
              return (
                <a
                  key={card.title}
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    {Icon && (
                      <Icon
                        className={styles.cardIcon}
                        style={{ color: card.iconColor }}
                      />
                    )}
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                  </div>
                  {card.description && (
                    <p className={styles.cardDescription}>{card.description}</p>
                  )}
                </a>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
