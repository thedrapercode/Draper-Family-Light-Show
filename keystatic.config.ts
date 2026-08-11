import { config, collection, singleton, fields } from '@keystatic/core';

export default config({
  storage: import.meta.env.PROD
    ? {
        kind: 'github',
        repo: {
          owner: 'thedrapercode',
          name: 'Draper-Family-Light-Show',
        },
      }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Draper Light Show Admin' },
  },

  singletons: {
    ticketing: singleton({
      label: 'Ticketing: Scary on Cherry',
      path: 'src/content/ticketing/settings',
      format: { data: 'json' },
      schema: {
        enabled: fields.checkbox({
          label: 'Ticket Sales Open',
          description: 'Toggle ON to open reservations, OFF to show a "coming soon" message.',
          defaultValue: false,
        }),
        eventName: fields.text({
          label: 'Event Name',
          defaultValue: 'Scary on Cherry',
        }),
        eventDescription: fields.text({
          label: 'Event Description',
          description: 'Shown at the top of the ticket booking page.',
          multiline: true,
        }),
        showDates: fields.array(
          fields.date({ label: 'Date' }),
          {
            label: 'Show Dates',
            description: 'Add each night the event runs. Guests pick from these dates when booking.',
            itemLabel: () => 'Show Date',
          }
        ),
        slotStartTime: fields.text({
          label: 'First Slot Start Time',
          description: '24-hour format. Example: 18:00 for 6:00 PM',
          defaultValue: '18:00',
        }),
        slotEndTime: fields.text({
          label: 'Last Slot End Time',
          description: '24-hour format. Example: 21:00 for 9:00 PM',
          defaultValue: '21:00',
        }),
        slotDurationMinutes: fields.integer({
          label: 'Slot Duration (minutes)',
          defaultValue: 15,
        }),
        slotCapacity: fields.integer({
          label: 'Max People Per Slot',
          description: 'How many people can book the same 15-minute window.',
          defaultValue: 20,
        }),
        donationEnabled: fields.checkbox({
          label: 'Show Optional Donation Step',
          defaultValue: true,
        }),
        donationCharity: fields.text({
          label: 'Charity Name',
          defaultValue: 'United Way of Hardin County',
        }),
        donationDisclosure: fields.text({
          label: 'Donation Disclosure Statement',
          description: 'Shown next to the donation option so guests know where money goes.',
          defaultValue: 'Donations are collected by Draper Family Light Show and given in full to United Way of Hardin County.',
          multiline: true,
        }),
        donationAmounts: fields.array(
          fields.integer({ label: 'Amount ($)' }),
          {
            label: 'Suggested Donation Amounts',
            description: 'Quick-select buttons guests see. Always includes a "Skip" option.',
            itemLabel: () => 'Amount',
          }
        ),
        squareMode: fields.select({
          label: 'Payment Mode',
          description: 'Switch between sandbox (test payments) and production (real payments). Rebuild the site after changing.',
          options: [
            { label: 'Sandbox — test payments only', value: 'sandbox' },
            { label: 'Production — real payments', value: 'production' },
          ],
          defaultValue: 'sandbox',
        }),
        squareSandboxAppId: fields.text({
          label: 'Sandbox Application ID',
          description: 'From developer.squareup.com → your app → Sandbox tab → Credentials. Starts with sandbox-sq0idb-',
        }),
        squareSandboxLocationId: fields.text({
          label: 'Sandbox Location ID',
          description: 'From developer.squareup.com → your app → Sandbox tab → Locations.',
        }),
        squareProductionAppId: fields.text({
          label: 'Production Application ID',
          description: 'From developer.squareup.com → your app → Production tab → Credentials. Starts with sq0idb-',
        }),
        squareProductionLocationId: fields.text({
          label: 'Production Location ID',
          description: 'From developer.squareup.com → your app → Production tab → Locations.',
        }),
        confirmationEmailSubject: fields.text({
          label: 'Confirmation Email Subject',
          defaultValue: 'Your Scary on Cherry tickets are confirmed!',
        }),
        confirmationEmailMessage: fields.text({
          label: 'Confirmation Email Message',
          description: 'Additional message shown in the confirmation email below the ticket details.',
          multiline: true,
          defaultValue: 'Park on the street and enter through the front yard. We can\'t wait to scare you!',
        }),
      },
    }),

    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings/site',
      format: { data: 'json' },
      schema: {
        season: fields.select({
          label: 'Current Season',
          description: 'Controls the site color scheme and active show branding.',
          options: [
            { label: '🎃 Halloween: Scary on Cherry', value: 'halloween' },
            { label: '🎄 Christmas: Merry on Cherry', value: 'christmas' },
            { label: '⭐ Off Season', value: 'offseason' },
          ],
          defaultValue: 'offseason',
        }),
        showActive: fields.checkbox({
          label: 'Show is Currently LIVE Tonight',
          description: 'Toggle ON during active show nights. Switches Now Playing widget to live mode.',
          defaultValue: false,
        }),
        nextEventName: fields.text({
          label: 'Next Event Name',
          description: 'Shown in the off-season countdown. e.g. "Scary on Cherry"',
        }),
        nextEventDate: fields.date({
          label: 'Next Show Return Date',
          description: 'Used to calculate the off-season countdown.',
        }),
        nowPlayingImage: fields.image({
          label: 'Now Playing House Photo',
          description: 'The house photo shown in the Now Playing widget. Upload your best show photo.',
          directory: 'public/images/now-playing',
          publicPath: '/images/now-playing/',
        }),
        announcement: fields.text({
          label: 'Site-Wide Announcement',
          description: 'Shown as a banner at the top of every page. Leave empty to hide.',
          multiline: false,
        }),
        announcementLink: fields.url({
          label: 'Announcement Link URL (optional)',
        }),
      },
    }),
  },

  collections: {
    shows: collection({
      label: 'Shows',
      path: 'src/content/shows/*',
      format: { contentField: 'body' },
      slugField: 'title',
      schema: {
        title: fields.slug({ name: { label: 'Show Title' } }),
        tagline: fields.text({ label: 'Tagline', description: 'One-line description shown on cards.' }),
        body: fields.markdoc({ label: 'Show Description', extension: 'md' }),
        order: fields.integer({ label: 'Display Order', defaultValue: 99 }),
        accent: fields.text({ label: 'Accent Color', description: 'Hex color, e.g. #ff6b1a' }),
        hours: fields.text({ label: 'Show Hours', description: 'e.g. 8pm - 11pm' }),
        months: fields.text({ label: 'Show Months', description: 'e.g. Every Friday & Saturday in October' }),
        heroImage: fields.image({
          label: 'Hero / Banner Image',
          directory: 'public/images/shows',
          publicPath: '/images/shows/',
        }),
        featured: fields.checkbox({ label: 'Feature on Homepage', defaultValue: false }),
        charity: fields.text({ label: 'Charity Name', validation: { isRequired: false } }),
        charityUrl: fields.url({ label: 'Charity Donation URL' }),
      },
    }),

    events: collection({
      label: 'Events',
      path: 'src/content/events/*',
      format: { contentField: 'body' },
      slugField: 'title',
      schema: {
        title: fields.slug({ name: { label: 'Event Title' } }),
        date: fields.date({ label: 'Event Date', validation: { isRequired: true } }),
        startTime: fields.text({ label: 'Start Time', description: 'e.g. 8:00 PM' }),
        endTime: fields.text({ label: 'End Time', description: 'e.g. 11:00 PM' }),
        showSlug: fields.text({ label: 'Show Slug', description: 'e.g. scary-on-cherry' }),
        cancelled: fields.checkbox({ label: 'Cancelled', defaultValue: false }),
        body: fields.markdoc({ label: 'Notes', extension: 'md' }),
      },
    }),

    partnerEvents: collection({
      label: 'Partner Events',
      path: 'src/content/partner-events/*',
      format: { contentField: 'body' },
      slugField: 'title',
      schema: {
        title: fields.slug({ name: { label: 'Event Title' } }),
        date: fields.date({ label: 'Event Date', validation: { isRequired: true } }),
        startTime: fields.text({ label: 'Start Time', description: 'e.g. 6:00 PM' }),
        endTime: fields.text({ label: 'End Time', description: 'e.g. 10:00 PM' }),
        location: fields.text({ label: 'Location', description: 'e.g. 352 N Cherry St, Kenton, Ohio' }),
        externalTicketUrl: fields.url({ label: 'Ticket URL', description: 'Eventbrite or other external link. Leave blank if invite-only.' }),
        ticketLabel: fields.text({ label: 'Ticket Button Label', description: 'e.g. Get Tickets on Eventbrite', defaultValue: 'Get Tickets' }),
        inviteOnly: fields.checkbox({ label: 'Invite Only (no public tickets)', defaultValue: false }),
        partnerOrgs: fields.array(
          fields.text({ label: 'Organization Name' }),
          { label: 'Partner Organizations', itemLabel: () => 'Organization' }
        ),
        charity: fields.text({ label: 'Charity or Beneficiary' }),
        charityUrl: fields.url({ label: 'Charity URL' }),
        heroImage: fields.image({
          label: 'Event Image',
          directory: 'public/images/events',
          publicPath: '/images/events/',
        }),
        featured: fields.checkbox({ label: 'Feature on Homepage', defaultValue: false }),
        body: fields.markdoc({ label: 'Event Details', extension: 'md' }),
      },
    }),

    albums: collection({
      label: 'Photo Albums',
      path: 'src/content/albums/*/index',
      format: { data: 'json' },
      slugField: 'title',
      schema: {
        title: fields.slug({ name: { label: 'Album Title', description: 'e.g. Scary on Cherry 2024' } }),
        showSlug: fields.text({ label: 'Show', description: 'e.g. scary-on-cherry' }),
        year: fields.integer({ label: 'Year', validation: { isRequired: true } }),
        description: fields.text({ label: 'Album Description', multiline: true }),
        coverImage: fields.image({
          label: 'Cover Photo',
          directory: 'public/images/albums',
          publicPath: '/images/albums/',
        }),
        photos: fields.array(
          fields.image({
            label: 'Photo',
            directory: 'public/images/albums',
            publicPath: '/images/albums/',
          }),
          { label: 'Photos', itemLabel: () => 'Photo' }
        ),
      },
    }),

    videos: collection({
      label: 'Videos',
      path: 'src/content/videos/*',
      format: { contentField: 'body' },
      slugField: 'videoTitle',
      schema: {
        videoTitle: fields.slug({ name: { label: 'Video Title', description: 'e.g. "Scary on Cherry 2026 Highlights"' } }),
        showSlug: fields.select({
          label: 'Show',
          description: 'Which show does this video belong to?',
          options: [
            { label: 'Scary on Cherry', value: 'scary-on-cherry' },
            { label: 'Merry on Cherry', value: 'merry-on-cherry' },
            { label: 'LibertyLights (July 4th)', value: 'libertylights-july-4th' },
            { label: 'May the 4th Be With You', value: 'may-the-4th-be-with-you' },
            { label: 'Memorial Day', value: 'memorial-day' },
            { label: "Valentine's Day", value: 'love-valentines-day' },
          ],
          defaultValue: 'scary-on-cherry',
        }),
        platform: fields.select({
          label: 'Platform',
          options: [
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
          ],
          defaultValue: 'youtube',
        }),
        url: fields.url({ label: 'Video URL', description: 'Full URL e.g. https://www.youtube.com/watch?v=...' }),
        body: fields.markdoc({ label: 'Notes (optional)', extension: 'md' }),
      },
    }),

    press: collection({
      label: 'Press & News',
      path: 'src/content/press/*',
      format: { contentField: 'body' },
      slugField: 'headline',
      schema: {
        headline: fields.slug({ name: { label: 'Headline', description: 'Article headline or title.' } }),
        showSlug: fields.select({
          label: 'Show',
          description: 'Which show does this article cover?',
          options: [
            { label: 'Scary on Cherry', value: 'scary-on-cherry' },
            { label: 'Merry on Cherry', value: 'merry-on-cherry' },
            { label: 'LibertyLights (July 4th)', value: 'libertylights-july-4th' },
            { label: 'May the 4th Be With You', value: 'may-the-4th-be-with-you' },
            { label: 'Memorial Day', value: 'memorial-day' },
            { label: "Valentine's Day", value: 'love-valentines-day' },
          ],
          defaultValue: 'scary-on-cherry',
        }),
        publication: fields.text({ label: 'Publication', description: 'e.g. Hardin County Tribune' }),
        url: fields.url({ label: 'Article URL' }),
        date: fields.text({ label: 'Date', description: 'e.g. October 15, 2026' }),
        body: fields.markdoc({ label: 'Notes (optional)', extension: 'md' }),
      },
    }),
  },
});
