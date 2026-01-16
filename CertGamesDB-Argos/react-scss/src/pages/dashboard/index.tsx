// ===================
// AngelaMos | 2026
// dashboard/index.tsx
// ===================

import { useWebSocket, useMetrics } from '@/api'
import styles from './dashboard.module.scss'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function MetricCard({
  label,
  value,
  subValue,
  highlight = false,
}: {
  label: string
  value: string | number
  subValue?: string
  highlight?: boolean
}): React.ReactElement {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue} ${highlight ? styles.highlight : ''}`}>{value}</span>
      {subValue && <span className={`${styles.metricSub} ${highlight ? styles.highlight : ''}`}>{subValue}</span>}
    </div>
  )
}

export function Component(): React.ReactElement {
  const { metrics: wsMetrics, isConnected } = useWebSocket()
  const { data: polledMetrics, isLoading } = useMetrics()

  const metrics = wsMetrics ?? polledMetrics

  if (isLoading && !metrics) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading metrics...</div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Failed to load metrics</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.serverInfo}>
          <span className={styles.host}>{metrics.server.host}</span>
          <span className={styles.version}>MongoDB {metrics.server.version}</span>
        </div>
        <div className={styles.connectionBadge}>
          <span className={`${styles.dot} ${isConnected ? styles.live : ''}`} />
          {isConnected ? 'Live Updates' : 'Polling'}
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Server</h2>
        <div className={styles.grid}>
          <MetricCard
            label="Uptime"
            value={formatUptime(metrics.server.uptime_seconds)}
          />
          <MetricCard
            label="Active Ops"
            value={metrics.active_ops}
            highlight
          />
          <MetricCard
            label="Paid Subscribers"
            value={metrics.paid_subscribers}
            highlight
          />
        </div>
      </section>

      {metrics.current_ops.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Operations ({metrics.current_ops.length})</h2>
          <div className={styles.opsTable}>
            <table>
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Type</th>
                  <th>Speed</th>
                  <th>Client</th>
                </tr>
              </thead>
              <tbody>
                {metrics.current_ops.map((op) => (
                  <tr key={op.opid}>
                    <td className={styles.collection}>{op.collection || op.namespace}</td>
                    <td className={styles.opType}>{op.type}</td>
                    <td className={styles.speed}>
                      {op.millis_running < 1
                        ? `${op.microsecs_running}µs`
                        : `${op.millis_running.toFixed(2)}ms`}
                    </td>
                    <td className={styles.client}>{op.client}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Database: {metrics.database.name}</h2>
        <div className={styles.grid}>
          <MetricCard
            label="Collections"
            value={metrics.database.collections}
            highlight
          />
          <MetricCard
            label="Documents"
            value={metrics.database.documents.toLocaleString()}
            highlight
          />
          <MetricCard
            label="Data Size"
            value={`${metrics.database.data_size_mb.toFixed(1)} MB`}
          />
          <MetricCard
            label="Storage Size"
            value={`${metrics.database.storage_size_mb.toFixed(1)} MB`}
          />
          <MetricCard
            label="Indexes"
            value={metrics.database.indexes}
            subValue={`${metrics.database.index_size_mb.toFixed(1)} MB`}
          />
          <MetricCard
            label="Total Databases"
            value={metrics.database.total_databases}
            highlight
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Connections</h2>
        <div className={styles.grid}>
          <MetricCard
            label="Current"
            value={metrics.connections.current}
          />
          <MetricCard
            label="Available"
            value={metrics.connections.available}
          />
          <MetricCard
            label="Total Created"
            value={metrics.connections.total_created.toLocaleString()}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Operations</h2>
        <div className={styles.grid}>
          <MetricCard label="Query" value={metrics.operations.query.toLocaleString()} />
          <MetricCard label="Insert" value={metrics.operations.insert.toLocaleString()} />
          <MetricCard label="Update" value={metrics.operations.update.toLocaleString()} />
          <MetricCard label="Delete" value={metrics.operations.delete.toLocaleString()} />
          <MetricCard label="Command" value={metrics.operations.command.toLocaleString()} />
          <MetricCard label="Total" value={metrics.operations.total.toLocaleString()} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Memory</h2>
        <div className={styles.grid}>
          <MetricCard
            label="Resident"
            value={`${metrics.memory.resident_mb} MB`}
          />
          <MetricCard
            label="Virtual"
            value={`${metrics.memory.virtual_mb} MB`}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Network</h2>
        <div className={styles.grid}>
          <MetricCard
            label="Bytes In"
            value={`${metrics.network.bytes_in_mb.toFixed(1)} MB`}
          />
          <MetricCard
            label="Bytes Out"
            value={`${metrics.network.bytes_out_mb.toFixed(1)} MB`}
          />
          <MetricCard
            label="Requests"
            value={metrics.network.num_requests.toLocaleString()}
          />
        </div>
      </section>
    </div>
  )
}

Component.displayName = 'Dashboard'
