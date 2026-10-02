# Privacy and terms pages

**This is not legal advice.** Adapt both pages with someone qualified in the
law of the place where the cafe operates, and do not publish the site until
they describe what the cafe and this website really do.

The pages in `src/content/legal/` (`privacy.md` and `terms.md`) ship as a
short, neutral starting text. This guide holds the fuller structure they were
cut down from, section by section. Adapt the pages to the business and to the
privacy laws that apply to it (GDPR, CCPA, KVKK or equivalent), and to local
consumer law.

## What the shipped pages say, and what each sentence depends on

The shipped pages name no business and make no promise about how long
anything is kept or how quickly anybody answers. Each fact sentence on them
is true for this kit as delivered and rests on one setting. When the setting
changes, change the sentence.

| Page, section | It says | True while | Change the sentence when |
| --- | --- | --- | --- |
| privacy, "What this site collects" | the contact form asks for a name, an email address and a message | the form on `src/pages/contact.astro` has those fields | you add or remove a field |
| privacy, "Where it goes" | the message reaches you directly or through a form service, and the website keeps no copy | `contactFormAction` in `src/lib/site.ts` points at your inbox route or a form service (as delivered it is `"#"` and delivers nothing) | you use a form service: name it in that paragraph, with a link to its own privacy terms |
| privacy, "Cookies and analytics" | no analytics, no cookies | the kit's own code adds neither, and `mapEmbedUrl` is empty | your host adds an analytics script (Cloudflare Web Analytics does when it is switched on for the site, and the headers in `public/_headers` allow it), you set `mapEmbedUrl` (the map provider loads in the visitor's browser), or you add any other third-party script: name the provider and say what it stores |
| terms, "Reservations" | the site takes no reservations | the kit has no booking form | you add one |

## Privacy page: the fuller structure

The demo policy was written in the voice of the fictional cafe. Its sections,
and the example wording it used, are below. Keep a sentence only if it is
true for the cafe.

**Who is responsible.** The demo opened with: "Fern & Filter ("we", "us")
respects your privacy. This policy explains what we collect through this
website and why." Name the business that runs the site.

**What we collect.** The demo said the details are used "only to reply to
you". It also said: "This site does not set advertising cookies and does not
profile visitors. If we add analytics, it will be privacy-respecting and
aggregate-only, and this policy will be updated."

**In-store data.** The demo said: "Our Wi-Fi is open and unauthenticated. We
do not log who connects to it or what they do while connected." Write only
what is true of the cafe's own network.

**How long we keep it.** The demo said: "Messages sent through the contact
form are kept as long as needed to resolve your request, and no longer than
12 months." Write the period the cafe really keeps.

**Sharing.** The demo said: "We do not sell or share your personal data with
third parties, except the service providers that technically process our
forms and email, bound by their own data-processing agreements." Name those
providers.

**Your rights.** The demo said: "You can ask us at any time what data we hold
about you, and ask us to correct or delete it. Write to us using the contact
details on this site and we will respond within 30 days." Only promise a
response time the cafe keeps.

## Terms page: the fuller structure

**Acceptance.** The demo opened with: "By using the Fern & Filter website you
agree to these terms. If you do not agree, please do not use the site."

**What this site is.** The demo added: "What is on the board in the shop is
the current version."

**Seating and service.** The demo said: "We are walk-in only and do not
accept reservations through this site. Seating is first come, first served."

**Liability.** The demo said: "We keep this site accurate and available as
far as we reasonably can, but it may at times contain errors or be
unreachable." What a liability clause may say depends on the country; write
it for the place where the cafe operates.

## Before you publish

- [ ] Both pages describe this cafe, not the demo.
- [ ] Every row in the table above still holds, or its sentence has changed.
- [ ] The sections the shipped pages leave out (who is responsible, how long
      data is kept, who else sees it, liability) are written where they
      apply.
- [ ] `updated` in the front matter of each page is the date of your last
      change.
