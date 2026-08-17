# 09 — QA Acceptance Checklist

## Platform / Backend
- [ ] Next.js uses the API for application workflows.
- [ ] React Native uses the same API.
- [ ] Business authorization is enforced by the API.
- [ ] Core workflows do not depend on direct client-side database access.
- [ ] Supabase persistence is behind repository abstractions.
- [ ] Domain models are independent of Supabase-generated DB types.
- [ ] Authenticated API requests resolve correct business membership.
- [ ] API errors are consistent across Web and Mobile.
- [ ] Financial results are consistent across Web, Mobile, and API.

## Authentication
- [ ] Sign In works independently of business setup.
- [ ] First account with zero businesses routes to Create Business.
- [ ] Business requires only name/country/currency.
- [ ] Returning user enters last-used business.

## Business context
- [ ] Current business is always clear.
- [ ] Business-scoped data never leaks.
- [ ] Switching during edit confirms draft status.

## Invoice editor
- [ ] Client selection works.
- [ ] Inline Add Client works and auto-selects.
- [ ] Custom line item works without product library.
- [ ] Quantity supports decimals.
- [ ] Rate input does not create leading-zero bug.
- [ ] Taxes are business-configurable.
- [ ] Deposit percentage works.
- [ ] Deposit fixed amount works.
- [ ] Deposit does not reduce total.
- [ ] Autosave success/error states work.

## Invoice Review
- [ ] Invalid client/items/rate block progression.
- [ ] Review does not send.
- [ ] Theme selector changes document appearance only.
- [ ] Theme does not change financial values.
- [ ] Continue to Send works.

## Send
- [ ] Multiple To recipients.
- [ ] CC/BCC.
- [ ] Per-email validation.
- [ ] Subject/message editable.
- [ ] PDF summary visible.
- [ ] Send routes to Detail.

## Payments
- [ ] Payment amount editable.
- [ ] Payment need not equal deposit.
- [ ] Partial status correct.
- [ ] Paid status correct.
- [ ] Total/Paid/Balance consistent.

## Quotes
- [ ] Uses shared document architecture.
- [ ] Valid Until replaces Due Date.
- [ ] Deposit upon acceptance wording.
- [ ] Viewing != acceptance.
- [ ] Accept is explicit.
- [ ] Conversion creates new draft invoice.
- [ ] New invoice has own number/dates.
- [ ] Relationship preserved.

## Clients
- [ ] Name OR Company required.
- [ ] Multiple emails.
- [ ] Historical documents preserve client snapshot.

## Products
- [ ] Library optional.
- [ ] Document edit does not mutate saved item.

## Settings
- [ ] Account settings separate from business settings.
- [ ] Currency change warning.
- [ ] Old documents retain currency.
- [ ] Numbering prevents duplicates.
- [ ] Tax model supports multiple components.

## Themes
- [ ] Theme list.
- [ ] Create from preset.
- [ ] Duplicate.
- [ ] Rename.
- [ ] Invoice default.
- [ ] Quote default.
- [ ] Archive.
- [ ] Referenced theme cannot be deleted.
- [ ] Default requires replacement before archive.

## Theme Builder
- [ ] Page properties.
- [ ] Brand properties.
- [ ] Typography changes visible.
- [ ] Header layouts.
- [ ] Bill To styles.
- [ ] Items table styles.
- [ ] Totals styles.
- [ ] Deposit styles.
- [ ] Safe reorder.
- [ ] Multi-page fixture.
- [ ] Quote fixture.
- [ ] Undo/Redo.
- [ ] Warning vs blocking diagnostics.

## Theme versions
- [ ] Save creates immutable new version.
- [ ] Existing draft stays on older version.
- [ ] Draft shows newer version available.
- [ ] Explicit update works.
- [ ] Send freezes selected version.
- [ ] Later theme changes do not alter sent doc.
- [ ] New draft uses current default theme/current version.

## Shared renderer
- [ ] Same renderer drives Theme Builder Preview.
- [ ] Same renderer drives Invoice Review.
- [ ] Same renderer drives Quote Review.
- [ ] Same renderer drives Print.
- [ ] Same renderer drives PDF.
- [ ] Same renderer drives client-facing view.
- [ ] Item rows do not clip/split unexpectedly.
- [ ] Table header repeats.
- [ ] Totals + Deposit stay together.
- [ ] Footer/page numbering correct.

## Responsive
- [ ] Desktop sidebar.
- [ ] Tablet compact nav.
- [ ] Mobile bottom nav.
- [ ] Mobile item cards.
- [ ] Mobile primary CTA reachable.
- [ ] Theme Builder limited appropriately on mobile.
- [ ] Touch targets >= 44px.

## Accessibility
- [ ] Visible focus.
- [ ] Keyboard navigation.
- [ ] Form labels.
- [ ] Errors not color-only.
- [ ] Status text not color-only.
- [ ] Dialog focus management.
- [ ] Icon buttons named.

## Primary E2E
- [ ] Create $5,000 invoice.
- [ ] New client.
- [ ] 30% deposit.
- [ ] Review.
- [ ] Select theme.
- [ ] Send.
- [ ] Record partial payment.
- [ ] Record final payment.
- [ ] Status Paid.

## Theme lifecycle E2E
- [ ] Draft uses Theme v1.
- [ ] Edit theme → v2.
- [ ] Draft remains v1.
- [ ] User adopts v2.
- [ ] Send freezes v2.
- [ ] Edit theme → v3.
- [ ] Sent invoice still renders v2.
