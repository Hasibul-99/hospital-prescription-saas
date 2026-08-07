/**
 * Landing page copy, per locale.
 *
 * The marketing prose lives here rather than inline in Welcome.tsx so the
 * language toggle actually changes the page. Plan names, taglines and feature
 * bullets are NOT here — those come from the `plans` table and are translated
 * by the super admin in the admin panel.
 *
 * Deliberately untranslated: the strings inside the fake product screenshots
 * (drug names, clinical-check rows, button labels in the mock). Those depict
 * the application UI, which is English-first, so translating them would
 * misrepresent what the user actually sees after signing in.
 */

const en = {
    headTitle: 'Pulse Rx — Prescribing software for modern clinics',
    brandSuffix: 'for clinics',

    nav: {
        features: 'Features',
        workflow: 'Workflow',
        pricing: 'Pricing',
        signIn: 'Sign in',
        startTrial: 'Start free trial',
        goToApp: 'Go to app',
    },

    hero: {
        badgeNew: 'New',
        badgeText: 'EPCS-certified · sign controlled Rx digitally',
        titleBefore: 'Prescriptions in',
        titleHighlight: '52 seconds',
        titleAfter: ', not 5 minutes.',
        sub: 'Pulse Rx is the prescription-management platform built for clinic speed — drug search, decision support, patient history, and e-Rx in one tab.',
        ctaPrimary: 'Start free trial — no card required',
        ctaSecondary: 'Live demo',
        badges: ['SOC2 Type II certified', 'HIPAA compliant', 'No setup fee'],
    },

    trustBar: 'Trusted by clinics at',

    features: {
        eyebrow: 'Features',
        titleLine1: 'Everything a modern clinic needs,',
        titleLine2: "nothing it doesn't.",
        sub: 'Purpose-built for doctors and clinic staff — not general-purpose EHR bloat.',
        cards: [
            { title: '52-second prescription', desc: 'Drug autocomplete, dose presets, and one-click sign. Fastest Rx workflow in the industry — backed by 8.2M prescriptions processed.' },
            { title: 'Real-time decision support', desc: 'Allergy cross-check, drug–drug interaction alerts, and formulary tier — surfaced automatically, not buried in a sidebar.' },
            { title: 'Global drug library', desc: '12,000+ medicines with brand/generic aliases, route, form, and standard dosing. Doctor-specific favourites and custom defaults.' },
            { title: 'Electronic prescribing', desc: 'EPCS-certified signing, DEA-bound keys, and direct pharmacy transmission. Paper is optional, not the default.' },
            { title: 'One-tap refills', desc: 'Refill requests surfaced in the queue. Review, approve, and transmit in seconds without opening a full Rx form.' },
            { title: 'EHR & lab integrations', desc: 'HL7 FHIR connectors for major EHRs. Lab results auto-populate patient records so every Rx is informed.' },
        ],
    },

    showcaseRx: {
        eyebrow: 'Prescription builder',
        title: 'Safety checks happen automatically — not as an afterthought.',
        body: "Every prescription is cross-checked in real time: allergies, drug interactions, formulary tier, and renal dosing. Alerts surface inline, not in a pop-up you'll click through.",
        bullets: [
            'Drug autocomplete with 12,000+ medicines',
            'Per-doctor default doses remembered',
            'Print-ready ℞ slip with e-signature block',
            "Direct transmission to patient's pharmacy",
        ],
    },

    showcasePatient: {
        eyebrow: 'Patient records',
        title: 'Full patient context — one screen, zero clicks.',
        body: 'Allergies, active medications, vitals, conditions, and prescription history all in a single patient record that pre-fills every new Rx automatically.',
        bullets: [
            'Allergy warnings always visible',
            'Active med grid with refill shortcuts',
            'Condition list + ICD-10 codes',
            'Timeline of all prescriptions',
        ],
    },

    workflow: {
        eyebrow: 'How it works',
        title: 'From patient to pharmacy in four steps.',
        sub: 'A workflow your entire clinic can learn in under 10 minutes.',
        steps: [
            { t: 'Search patient', d: 'Pull up the patient by name or UID — record pre-fills allergies and active meds.' },
            { t: 'Search drug', d: 'Type 3 letters to autocomplete. Default dose pre-fills; adjust if needed.' },
            { t: 'Review & sign', d: 'Clinical checks run automatically. One click to sign electronically.' },
            { t: 'Pharmacy receives', d: 'Prescription transmits instantly. Patient gets SMS confirmation.' },
        ],
    },

    stats: [
        { l: 'Median Rx time', s: 'vs 4.2 min industry avg' },
        { l: 'Uptime SLA', s: 'zero planned downtime' },
        { l: 'Prescriptions signed', s: 'and counting' },
        { l: 'Faster refills', s: 'vs manual workflow' },
    ],

    testimonial: {
        quote: '"We switched from our old EHR\'s prescription module to Pulse Rx two months ago. My team writes prescriptions in under a minute now, and the interaction alerts have already caught two serious conflicts."',
        name: 'Dr. Shalini Reddy',
        role: 'Head of Internal Medicine · Apollo Clinics Mumbai',
    },

    pricing: {
        eyebrow: 'Pricing',
        title: 'Simple pricing, no surprises.',
        sub: 'Start free. Scale when you grow. No per-prescription fees.',
        monthly: 'Monthly',
        yearly: 'Yearly',
        save: (percent: number) => `Save ${percent}%`,
        perMonth: '/mo',
        perYear: '/yr',
        empty: 'Pricing is being updated — please check back shortly.',
        trialNote: (days: number) => `Paid plans include a ${days}-day free trial. No credit card required.`,
        popular: 'Most popular',
        defaultCta: 'Get started',
    },

    cta: {
        titleLine1: 'Ready to cut your',
        titleLine2: 'Rx time by 80%?',
        body: "Join 2,400+ clinicians already using Pulse Rx. Book a 20-minute demo and we'll configure a workspace for your clinic on the call.",
        bullets: ['14-day free trial, no card', 'HIPAA-compliant from day one', 'Onboarding call included', 'Cancel any time'],
        formTitle: 'Request a demo',
        formSub: "We'll reach out within one business day.",
        fieldName: 'Full name',
        fieldEmail: 'Work email',
        fieldClinic: 'Clinic name',
        placeholderName: 'Dr. Jane Smith',
        placeholderEmail: 'jane@yourclinic.com',
        placeholderClinic: 'General Hospital',
        submit: 'Book my demo',
        noSpam: 'No spam. Unsubscribe any time.',
        successTitle: "We'll be in touch!",
        successSub: 'Expect a calendar invite within 24 hours.',
    },

    footer: {
        tagline: 'Prescribing software for modern clinics. Fast, safe, and built around how doctors actually work.',
        columns: [
            { h: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Status'] },
            { h: 'Resources', links: ['Documentation', 'API Reference', 'Help Center', 'Blog', 'Webinars'] },
            { h: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms', 'Security'] },
        ],
        copyright: '© 2026 Pulse Rx Inc. All rights reserved.',
        builtBy: 'Built for clinicians, by clinicians.',
    },
};

/** The English copy defines the shape; `bn` is checked against it, so a missing
 *  or misspelled Bangla key is a compile error rather than a blank on the page. */
export type LandingCopy = typeof en;

const bn: LandingCopy = {
    headTitle: 'Pulse Rx — আধুনিক ক্লিনিকের প্রেসক্রিপশন সফটওয়্যার',
    brandSuffix: 'ক্লিনিকের জন্য',

    nav: {
        features: 'ফিচার',
        workflow: 'কর্মপ্রবাহ',
        pricing: 'প্যাকেজ',
        signIn: 'সাইন ইন',
        startTrial: 'ফ্রি ট্রায়াল শুরু করুন',
        goToApp: 'অ্যাপে যান',
    },

    hero: {
        badgeNew: 'নতুন',
        badgeText: 'EPCS-সার্টিফাইড · ডিজিটালি কন্ট্রোলড ℞ সাইন করুন',
        titleBefore: 'প্রেসক্রিপশন',
        titleHighlight: '৫২ সেকেন্ডে',
        titleAfter: ', ৫ মিনিটে নয়।',
        sub: 'Pulse Rx হলো ক্লিনিকের গতির জন্য তৈরি প্রেসক্রিপশন ম্যানেজমেন্ট প্ল্যাটফর্ম — ওষুধ সার্চ, ক্লিনিক্যাল সাপোর্ট, রোগীর ইতিহাস এবং ই-প্রেসক্রিপশন একই ট্যাবে।',
        ctaPrimary: 'ফ্রি ট্রায়াল শুরু করুন — কার্ড লাগবে না',
        ctaSecondary: 'লাইভ ডেমো',
        badges: ['SOC2 Type II সার্টিফাইড', 'HIPAA কমপ্লায়েন্ট', 'কোনো সেটআপ ফি নেই'],
    },

    trustBar: 'যেসব ক্লিনিক আমাদের উপর ভরসা করে',

    features: {
        eyebrow: 'ফিচার',
        titleLine1: 'আধুনিক ক্লিনিকের যা যা প্রয়োজন,',
        titleLine2: 'অপ্রয়োজনীয় কিছু নয়।',
        sub: 'ডাক্তার ও ক্লিনিক স্টাফের জন্য বিশেষভাবে তৈরি — ভারী সাধারণ EHR নয়।',
        cards: [
            { title: '৫২ সেকেন্ডে প্রেসক্রিপশন', desc: 'ওষুধের অটোকমপ্লিট, ডোজ প্রিসেট এবং এক ক্লিকে সাইন। ইন্ডাস্ট্রির দ্রুততম ℞ কর্মপ্রবাহ — ৮২ লক্ষ প্রেসক্রিপশনের অভিজ্ঞতায় গড়া।' },
            { title: 'রিয়েল-টাইম ক্লিনিক্যাল সাপোর্ট', desc: 'অ্যালার্জি ক্রস-চেক, ওষুধের পারস্পরিক বিক্রিয়ার সতর্কতা এবং ফর্মুলারি টিয়ার — স্বয়ংক্রিয়ভাবে সামনে আসে, সাইডবারে লুকানো থাকে না।' },
            { title: 'গ্লোবাল ওষুধ ডাটাবেজ', desc: 'ব্র্যান্ড ও জেনেরিক নাম, রুট, ফর্ম এবং স্ট্যান্ডার্ড ডোজসহ ১২,০০০+ ওষুধ। ডাক্তারভিত্তিক পছন্দের তালিকা ও কাস্টম ডিফল্ট।' },
            { title: 'ইলেকট্রনিক প্রেসক্রাইবিং', desc: 'EPCS-সার্টিফাইড সাইনিং, DEA-বাউন্ড কী এবং সরাসরি ফার্মেসিতে পাঠানো। কাগজ ঐচ্ছিক, বাধ্যতামূলক নয়।' },
            { title: 'এক ট্যাপে রিফিল', desc: 'রিফিল অনুরোধ সরাসরি কিউতে আসে। পুরো ℞ ফর্ম না খুলেই সেকেন্ডে রিভিউ, অনুমোদন ও পাঠানো যায়।' },
            { title: 'EHR ও ল্যাব ইন্টিগ্রেশন', desc: 'বড় EHR-এর জন্য HL7 FHIR কানেক্টর। ল্যাব রিপোর্ট নিজে থেকেই রোগীর রেকর্ডে যুক্ত হয়, তাই প্রতিটি ℞ তথ্যভিত্তিক।' },
        ],
    },

    showcaseRx: {
        eyebrow: 'প্রেসক্রিপশন বিল্ডার',
        title: 'নিরাপত্তা যাচাই হয় স্বয়ংক্রিয়ভাবে — পরে মনে করে নয়।',
        body: 'প্রতিটি প্রেসক্রিপশন রিয়েল-টাইমে যাচাই হয়: অ্যালার্জি, ওষুধের বিক্রিয়া, ফর্মুলারি টিয়ার এবং কিডনির অবস্থা অনুযায়ী ডোজ। সতর্কতা ইনলাইনেই দেখায়, ক্লিক করে বন্ধ করার পপ-আপে নয়।',
        bullets: [
            '১২,০০০+ ওষুধের অটোকমপ্লিট',
            'প্রতি ডাক্তারের ডিফল্ট ডোজ মনে রাখে',
            'ই-স্বাক্ষরসহ প্রিন্ট-রেডি ℞ স্লিপ',
            'রোগীর ফার্মেসিতে সরাসরি পাঠানো',
        ],
    },

    showcasePatient: {
        eyebrow: 'রোগীর রেকর্ড',
        title: 'রোগীর সম্পূর্ণ তথ্য — এক স্ক্রিনে, ক্লিক ছাড়াই।',
        body: 'অ্যালার্জি, চলমান ওষুধ, ভাইটালস, রোগ এবং প্রেসক্রিপশনের ইতিহাস — সবই এক রেকর্ডে, যা প্রতিটি নতুন ℞ স্বয়ংক্রিয়ভাবে পূরণ করে।',
        bullets: [
            'অ্যালার্জি সতর্কতা সবসময় দৃশ্যমান',
            'রিফিল শর্টকাটসহ চলমান ওষুধের তালিকা',
            'রোগের তালিকা + ICD-10 কোড',
            'সব প্রেসক্রিপশনের টাইমলাইন',
        ],
    },

    workflow: {
        eyebrow: 'যেভাবে কাজ করে',
        title: 'রোগী থেকে ফার্মেসি — মাত্র চার ধাপে।',
        sub: 'এমন একটি কর্মপ্রবাহ, যা আপনার পুরো ক্লিনিক ১০ মিনিটেই শিখে নেবে।',
        steps: [
            { t: 'রোগী খুঁজুন', d: 'নাম বা UID দিয়ে রোগী বের করুন — অ্যালার্জি ও চলমান ওষুধ নিজে থেকেই আসবে।' },
            { t: 'ওষুধ খুঁজুন', d: '৩টি অক্ষর লিখলেই অটোকমপ্লিট। ডিফল্ট ডোজ আগেই বসানো থাকে, প্রয়োজনে বদলান।' },
            { t: 'রিভিউ ও সাইন', d: 'ক্লিনিক্যাল যাচাই স্বয়ংক্রিয়ভাবে চলে। এক ক্লিকেই ইলেকট্রনিক স্বাক্ষর।' },
            { t: 'ফার্মেসি পায়', d: 'প্রেসক্রিপশন সঙ্গে সঙ্গে পৌঁছে যায়। রোগী SMS নিশ্চিতকরণ পান।' },
        ],
    },

    stats: [
        { l: 'গড় ℞ সময়', s: 'ইন্ডাস্ট্রি গড় ৪.২ মিনিটের বিপরীতে' },
        { l: 'আপটাইম SLA', s: 'কোনো পরিকল্পিত ডাউনটাইম নেই' },
        { l: 'স্বাক্ষরিত প্রেসক্রিপশন', s: 'এবং বাড়ছে' },
        { l: 'দ্রুত রিফিল', s: 'ম্যানুয়াল পদ্ধতির তুলনায়' },
    ],

    testimonial: {
        quote: '"দুই মাস আগে আমরা পুরনো EHR-এর প্রেসক্রিপশন মডিউল ছেড়ে Pulse Rx-এ এসেছি। এখন আমার টিম এক মিনিটেরও কম সময়ে প্রেসক্রিপশন লেখে, আর ইন্টার‌্যাকশন সতর্কতা ইতিমধ্যেই দুটি গুরুতর সমস্যা ধরেছে।"',
        name: 'ডা. শালিনী রেড্ডি',
        role: 'বিভাগীয় প্রধান, ইন্টারনাল মেডিসিন · অ্যাপোলো ক্লিনিকস মুম্বাই',
    },

    pricing: {
        eyebrow: 'প্যাকেজ',
        title: 'সহজ মূল্য, কোনো লুকানো খরচ নেই।',
        sub: 'ফ্রি শুরু করুন। বড় হলে বাড়ান। প্রতি প্রেসক্রিপশনে আলাদা ফি নেই।',
        monthly: 'মাসিক',
        yearly: 'বার্ষিক',
        save: (percent: number) => `${percent}% সাশ্রয়`,
        perMonth: '/মাস',
        perYear: '/বছর',
        empty: 'মূল্য হালনাগাদ করা হচ্ছে — কিছুক্ষণ পর আবার দেখুন।',
        trialNote: (days: number) => `পেইড প্যাকেজে ${days} দিনের ফ্রি ট্রায়াল আছে। ক্রেডিট কার্ড লাগবে না।`,
        popular: 'সর্বাধিক জনপ্রিয়',
        defaultCta: 'শুরু করুন',
    },

    cta: {
        titleLine1: '℞ লেখার সময়',
        titleLine2: '৮০% কমাতে প্রস্তুত?',
        body: '২,৪০০+ চিকিৎসক ইতিমধ্যেই Pulse Rx ব্যবহার করছেন। ২০ মিনিটের একটি ডেমো বুক করুন — কলেই আপনার ক্লিনিকের ওয়ার্কস্পেস সেট করে দেব।',
        bullets: ['১৪ দিনের ফ্রি ট্রায়াল, কার্ড ছাড়া', 'প্রথম দিন থেকেই HIPAA কমপ্লায়েন্ট', 'অনবোর্ডিং কল অন্তর্ভুক্ত', 'যেকোনো সময় বাতিল'],
        formTitle: 'ডেমোর জন্য অনুরোধ',
        formSub: 'আমরা এক কর্মদিবসের মধ্যে যোগাযোগ করব।',
        fieldName: 'পুরো নাম',
        fieldEmail: 'অফিসিয়াল ইমেইল',
        fieldClinic: 'ক্লিনিকের নাম',
        placeholderName: 'ডা. জেন স্মিথ',
        placeholderEmail: 'jane@yourclinic.com',
        placeholderClinic: 'জেনারেল হাসপাতাল',
        submit: 'ডেমো বুক করুন',
        noSpam: 'কোনো স্প্যাম নেই। যেকোনো সময় আনসাবস্ক্রাইব করুন।',
        successTitle: 'আমরা শীঘ্রই যোগাযোগ করব!',
        successSub: '২৪ ঘণ্টার মধ্যে ক্যালেন্ডার ইনভাইট পাবেন।',
    },

    footer: {
        tagline: 'আধুনিক ক্লিনিকের প্রেসক্রিপশন সফটওয়্যার। দ্রুত, নিরাপদ এবং ডাক্তাররা যেভাবে কাজ করেন সেভাবেই তৈরি।',
        columns: [
            { h: 'প্রোডাক্ট', links: ['ফিচার', 'প্যাকেজ', 'চেঞ্জলগ', 'রোডম্যাপ', 'স্ট্যাটাস'] },
            { h: 'রিসোর্স', links: ['ডকুমেন্টেশন', 'API রেফারেন্স', 'হেল্প সেন্টার', 'ব্লগ', 'ওয়েবিনার'] },
            { h: 'কোম্পানি', links: ['আমাদের সম্পর্কে', 'ক্যারিয়ার', 'গোপনীয়তা', 'শর্তাবলি', 'নিরাপত্তা'] },
        ],
        copyright: '© ২০২৬ Pulse Rx Inc. সর্বস্বত্ব সংরক্ষিত।',
        builtBy: 'চিকিৎসকদের জন্য, চিকিৎসকদের হাতেই তৈরি।',
    },
};

export const copy: Record<'en' | 'bn', LandingCopy> = { en, bn };
