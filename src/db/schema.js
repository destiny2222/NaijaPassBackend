import { mysqlTable, varchar, int, text, mysqlEnum, datetime } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const usersTable = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', {length: 225 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  emailVerifiedAt: datetime('email_verified_at'),
  otpCode: varchar('otp_code', { length: 6 }),
  otpExpiresAt: datetime('otp_expires_at'),
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
  dateOfBirth: varchar('date_of_birth', { length: 50 }),
  nationality: varchar('nationality', { length: 100 }),
  residentialAddress: text('residential_address'),
  mailingAddress: text('mailing_address'),
  idDocument: text('id_document'),
  idDocumentPublicId: varchar('id_document_public_id', { length: 255 }),
  proofOfAddress: text('proof_of_address'),
  proofOfAddressPublicId: varchar('proof_of_address_public_id', { length: 255 }),
  businessType: varchar('business_type', { length: 100 }),
  industry: varchar('industry', { length: 255 }),
  registeredAddress: text('registered_address'),
  businessAddress: text('business_address'),
  contactPersonName: varchar('contact_person_name', { length: 255 }),
  contactPersonEmail: varchar('contact_person_email', { length: 255 }),
  certificateOfIncorporation: text('certificate_of_incorporation'),
  certificateOfIncorporationPublicId: varchar('certificate_of_incorporation_public_id', { length: 255 }),
  memorandumArticles: text('memorandum_articles'),
  memorandumArticlesPublicId: varchar('memorandum_articles_public_id', { length: 255 }),
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
  createdById: varchar('created_by_id', { length: 36 }).references(() => usersTable.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  bidNumber: varchar('bid_number', { length: 255 }).notNull().unique(),
  deadline: datetime('deadline').notNull(),
  agency: varchar('agency', { length: 255 }).notNull(),
  procuringEntity: varchar('procuring_entity', { length: 255 }),
  sector: varchar('sector', { length: 255 }),
  location: varchar('location', { length: 255 }),
  description: text('description'),
  status: mysqlEnum('status', ['draft', 'published', 'cancelled', 'awarded']).default('published').notNull(),
  categoryId: int('category_id').references(() => bidCategoriesTable.id),
});

export const bidApplicationsTable = mysqlTable('bid_applications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bidId: varchar('bid_id', { length: 36 }).references(() => bidsTable.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  proposalText: text('proposal_text').notNull(),
  proposedAmount: varchar('proposed_amount', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'accepted', 'rejected']).default('pending').notNull(),
  createdAt: datetime('created_at').notNull(),
});

export const bidReviewsTable = mysqlTable('bid_reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bidId: varchar('bid_id', { length: 36 }).references(() => bidsTable.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  rating: int('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: datetime('created_at').notNull(),
});

// Relationships
export const usersRelations = relations(usersTable, ({ many }) => ({
  kycs: many(kycsTable),
  bids: many(bidsTable),
  bidApplications: many(bidApplicationsTable),
  bidReviews: many(bidReviewsTable),
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

export const bidsRelations = relations(bidsTable, ({ one, many }) => ({
  createdBy: one(usersTable, {
    fields: [bidsTable.createdById],
    references: [usersTable.id],
  }),
  category: one(bidCategoriesTable, {
    fields: [bidsTable.categoryId],
    references: [bidCategoriesTable.id],
  }),
  applications: many(bidApplicationsTable),
  reviews: many(bidReviewsTable),
}));

export const bidApplicationsRelations = relations(bidApplicationsTable, ({ one }) => ({
  bid: one(bidsTable, {
    fields: [bidApplicationsTable.bidId],
    references: [bidsTable.id],
  }),
  user: one(usersTable, {
    fields: [bidApplicationsTable.userId],
    references: [usersTable.id],
  }),
}));

export const bidReviewsRelations = relations(bidReviewsTable, ({ one }) => ({
  bid: one(bidsTable, {
    fields: [bidReviewsTable.bidId],
    references: [bidsTable.id],
  }),
  user: one(usersTable, {
    fields: [bidReviewsTable.userId],
    references: [usersTable.id],
  }),
}));
