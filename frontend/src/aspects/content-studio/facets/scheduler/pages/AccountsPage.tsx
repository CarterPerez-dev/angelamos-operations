// ===================
// © AngelaMos | 2025
// AccountsPage.tsx
// ===================

import { useState, useEffect } from 'react'
import {
  useConnectedAccounts,
  useConnectAccount,
  useDisconnectAccount,
  useSyncAccounts,
  useFollowerHistory,
  useRecordFollowerStats,
} from '../hooks'
import {
  useSchedulerStore,
  useConnectedAccounts as useAccountsStore,
  useIsLoadingAccounts,
  useSchedulerError,
} from '../stores'
import {
  PlatformType,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_COLORS,
} from '../types/scheduler.enums'
import type { ConnectedAccount, FollowerStats } from '../types'
import styles from './AccountsPage.module.scss'

const SUPPORTED_PLATFORMS = [
  PlatformType.TIKTOK,
  PlatformType.YOUTUBE,
  PlatformType.INSTAGRAM,
  PlatformType.TWITTER,
  PlatformType.LINKEDIN,
  PlatformType.FACEBOOK,
  PlatformType.PINTEREST,
  PlatformType.REDDIT,
  PlatformType.BLUESKY,
  PlatformType.THREADS,
  PlatformType.GOOGLE_BUSINESS,
]

export function AccountsPage() {
  const { data, refetch } = useConnectedAccounts()
  const connectAccount = useConnectAccount()
  const disconnectAccount = useDisconnectAccount()
  const syncAccounts = useSyncAccounts()
  const { data: followerHistory } = useFollowerHistory(30)
  const recordFollowerStats = useRecordFollowerStats()

  const accounts = useAccountsStore()
  const isLoading = useIsLoadingAccounts()
  const error = useSchedulerError()
  const { clearError } = useSchedulerStore()

  const getLatestFollowerCount = (accountId: string): number | null => {
    if (!followerHistory) return null
    const accountStats = followerHistory
      .filter((s) => s.connected_account_id === accountId)
      .sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())
    return accountStats[0]?.follower_count ?? null
  }

  const handleConnect = (platform: PlatformType) => {
    const redirectUrl = window.location.origin + '/content-studio/scheduler/accounts/callback'
    connectAccount.mutate({ platform, redirectUrl })
  }

  const handleDisconnect = (accountId: string) => {
    if (window.confirm('Are you sure you want to disconnect this account?')) {
      disconnectAccount.mutate(accountId)
    }
  }

  const handleSync = () => {
    syncAccounts.mutate()
  }

  const getConnectedPlatforms = (): Set<PlatformType> => {
    return new Set(accounts.map((a) => a.platform))
  }

  const connectedPlatforms = getConnectedPlatforms()

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatNumber = (num?: number | null): string => {
    if (num == null) return '-'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Connected Accounts</h1>
          <button
            className={styles.syncButton}
            onClick={handleSync}
            disabled={syncAccounts.isPending}
            type="button"
          >
            {syncAccounts.isPending ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
        <p className={styles.subtitle}>
          Connect your social media accounts to schedule and publish content
        </p>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={clearError} type="button">
            Dismiss
          </button>
        </div>
      )}

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>Loading accounts...</div>
        ) : (
          <>
            {accounts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Your Accounts</h2>
                <div className={styles.accountsGrid}>
                  {accounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onDisconnect={() => handleDisconnect(account.id)}
                      isDisconnecting={disconnectAccount.isPending}
                      savedFollowerCount={getLatestFollowerCount(account.id)}
                      onSaveFollowers={(count) => {
                        recordFollowerStats.mutate({
                          connected_account_id: account.id,
                          follower_count: count,
                        })
                      }}
                      isSaving={recordFollowerStats.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Add New Account</h2>
              <div className={styles.platformsGrid}>
                {SUPPORTED_PLATFORMS.map((platform) => {
                  const isConnected = connectedPlatforms.has(platform)
                  return (
                    <button
                      key={platform}
                      className={`${styles.platformCard} ${isConnected ? styles.connected : ''}`}
                      onClick={() => !isConnected && handleConnect(platform)}
                      disabled={isConnected || connectAccount.isPending}
                      style={{
                        '--platform-color': PLATFORM_COLORS[platform],
                      } as React.CSSProperties}
                      type="button"
                    >
                      <span className={styles.platformName}>
                        {PLATFORM_DISPLAY_NAMES[platform]}
                      </span>
                      <span className={styles.platformStatus}>
                        {isConnected ? 'Connected' : 'Connect'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>
      </div>
    </div>
  )
}

interface AccountCardProps {
  account: ConnectedAccount
  onDisconnect: () => void
  isDisconnecting: boolean
  savedFollowerCount: number | null
  onSaveFollowers: (count: number) => void
  isSaving: boolean
}

function AccountCard({
  account,
  onDisconnect,
  isDisconnecting,
  savedFollowerCount,
  onSaveFollowers,
  isSaving,
}: AccountCardProps) {
  const [manualCount, setManualCount] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (savedFollowerCount !== null) {
      setManualCount(savedFollowerCount.toString())
    }
  }, [savedFollowerCount])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatNumber = (num?: number | null): string => {
    if (num == null) return '-'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleSaveManual = () => {
    const num = parseInt(manualCount, 10)
    if (!isNaN(num) && num >= 0) {
      onSaveFollowers(num)
    }
    setIsEditing(false)
  }

  const displayFollowers = account.followers_count ?? savedFollowerCount

  return (
    <div
      className={styles.accountCard}
      style={{
        '--platform-color': PLATFORM_COLORS[account.platform],
      } as React.CSSProperties}
    >
      <div className={styles.accountHeader}>
        <div className={styles.accountInfo}>
          {account.profile_image_url ? (
            <img
              src={account.profile_image_url}
              alt={account.platform_username}
              className={styles.avatar}
            />
          ) : (
            <div
              className={styles.avatarFallback}
              style={{ background: PLATFORM_COLORS[account.platform] }}
            >
              {(account.platform_display_name || account.platform_username || '?')[0].toUpperCase()}
            </div>
          )}
          <div className={styles.accountDetails}>
            <span className={styles.displayName}>
              {account.platform_display_name || account.platform_username}
            </span>
            <span className={styles.username}>@{account.platform_username}</span>
          </div>
        </div>
        <span className={styles.platformBadge}>
          {PLATFORM_DISPLAY_NAMES[account.platform]}
        </span>
      </div>

      <div className={styles.accountStats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatNumber(displayFollowers)}
          </span>
          <span className={styles.statLabel}>Followers</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {account.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className={styles.statLabel}>Status</span>
        </div>
      </div>

      <div className={styles.manualFollowers}>
        <span className={styles.manualLabel}>Manual count:</span>
        {isEditing ? (
          <div className={styles.manualEdit}>
            <input
              type="number"
              value={manualCount}
              onChange={(e) => setManualCount(e.target.value)}
              className={styles.manualInput}
              placeholder="0"
              min="0"
            />
            <button
              type="button"
              className={styles.manualSave}
              onClick={handleSaveManual}
              disabled={isSaving}
            >
              {isSaving ? '...' : 'Save'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.manualValue}
            onClick={() => setIsEditing(true)}
          >
            {savedFollowerCount !== null ? formatNumber(savedFollowerCount) : 'Set'}
          </button>
        )}
      </div>

      <div className={styles.accountFooter}>
        <span className={styles.connectedDate}>
          Connected {formatDate(account.connected_at)}
        </span>
        <button
          className={styles.disconnectButton}
          onClick={onDisconnect}
          disabled={isDisconnecting}
          type="button"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
