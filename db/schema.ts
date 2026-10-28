import { mysqlTable, varchar, longtext, timestamp } from 'drizzle-orm/mysql-core'

export const progress = mysqlTable('go_progress', {
  playerKey: varchar('player_key', { length: 128 }).primaryKey(),
  data: longtext('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})
