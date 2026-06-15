import { mysqlTable, varchar, int, text, mysqlEnum, datetime } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const usersTable = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  emailVerifiedAt: datetime('email_verified_at'),
});

export const industryCategoriesTable = mysqlTable('industry_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const kycsTable = mysqlTable('kycs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  type: mysqlEnum('type', ['individual', 'business']).notNull(),
  status: mysqlEnum('status', ['pending', 'inprogress', 'approved', 'rejected']).default('pending').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }),
  registrationNumber: varchar('registration_number', { length: 255 }),
  taxIdentificationNumber: varchar('tax_identification_number', { length: 255 }),
  rejectionReason: text('rejection_reason'),
  industryCategoryId: int('industry_category_id').references(() => industryCategoriesTable.id),
  idType: varchar('id_type', { length: 50 }),
  idNumber: varchar('id_number', { length: 100 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  dob: varchar('dob', { length: 50 }),
  verificationStatus: mysqlEnum('verification_status', ['unverified', 'verified', 'failed']).default('unverified').notNull(),
  verifiedAt: datetime('verified_at'),
  thirdPartyReference: varchar('third_party_reference', { length: 255 }),
  verificationDetails: text('verification_details'),
});

export const kycRepresentativesTable = mysqlTable('kyc_representatives', {
  id: int('id').primaryKey().autoincrement(),
  kycId: varchar('kyc_id', { length: 36 }).references(() => kycsTable.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  position: varchar('position', { length: 255 }).notNull(),
});

export const bidCategoriesTable = mysqlTable('bid_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const bidsTable = mysqlTable('bids', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  bidNumber: varchar('bid_number', { length: 255 }).notNull().unique(),
  deadline: datetime('deadline').notNull(),
  agency: varchar('agency', { length: 255 }).notNull(),
  categoryId: int('category_id').references(() => bidCategoriesTable.id),
});

// Relationships
export const usersRelations = relations(usersTable, ({ many }) => ({
  kycs: many(kycsTable),
}));

export const kycsRelations = relations(kycsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [kycsTable.userId],
    references: [usersTable.id],
  }),
  industryCategory: one(industryCategoriesTable, {
    fields: [kycsTable.industryCategoryId],
    references: [industryCategoriesTable.id],
  }),
  representatives: many(kycRepresentativesTable),
}));

export const kycRepresentativesRelations = relations(kycRepresentativesTable, ({ one }) => ({
  kyc: one(kycsTable, {
    fields: [kycRepresentativesTable.kycId],
    references: [kycsTable.id],
  }),
}));

export const industryCategoriesRelations = relations(industryCategoriesTable, ({ many }) => ({
  kycs: many(kycsTable),
}));

export const bidCategoriesRelations = relations(bidCategoriesTable, ({ many }) => ({
  bids: many(bidsTable),
}));

export const bidsRelations = relations(bidsTable, ({ one }) => ({
  category: one(bidCategoriesTable, {
    fields: [bidsTable.categoryId],
    references: [bidCategoriesTable.id],
  }),
}));
