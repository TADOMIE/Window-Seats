/**
 * ============================================================================
 * WINDOW SEAT — FIREBASE SETUP & OWNER CONFIGURATION
 * ============================================================================
 * 1. Firebase (Cloud Firestore & Google Authentication) is configured in
 *    `src/firebase.ts` using `firebase-applet-config.json`.
 * 2. IMPORTANT: Replace `OWNER_EMAIL` below AND in `firestore.rules` with your
 *    Google account email address so only your account can edit the site.
 * 3. Visitors render immediately from the embedded default data below and
 *    receive live updates via Firestore `onSnapshot` on `site/content`.
 * 4. Owner signs in via the discreet "Crew only" link in the footer (or
 *    Ctrl+Shift+E). All text edits autosave after a 1.5s debounce to
 *    `site/content` and maintain the last 5 backups in `backups/{timestamp}`.
 * ============================================================================
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  OperationType,
  handleFirestoreError,
} from './firebase';

// ============================================================================
// OWNER EMAIL: Replace with your Google account email in both this file
// and `firestore.rules`.
// ============================================================================
const OWNER_EMAIL = 'tadominohero@gmail.com';

export interface RouteStop {
  country: string;
  code: string;
}

export interface PhotoItem {
  src: string;
  alt: string;
  caption: string;
}

export interface QAItem {
  q: string;
  a: string;
}

export interface EntryItem {
  id: string;
  number: string;
  stage: string;
  title: string;
  genre: string;
  fromCode: string;
  toCode: string;
  americanah: boolean;
  americanahNote: string;
  text: string;
  photos: PhotoItem[];
  videoUrl: string;
  audioUrl: string;
  qa: QAItem[];
}

export interface SiteData {
  site: {
    title: string;
    tagline: string;
    route: RouteStop[];
  };
  about: {
    title: string;
    text: string;
    photo: PhotoItem | null;
    americanahNote: string;
  };
  author: {
    title: string;
    nationality: string;
    note: string;
    photo: string;
  };
  tips: string[];
  entries: EntryItem[];
  updatedAt?: string;
}

/* ============================================================================
   DEFAULT EMBEDDED DATA (Renders instantly & serves as offline fallback)
   ============================================================================ */
const DEFAULT_DATA: SiteData = {
  site: {
    title: 'Window Seat',
    tagline: 'Notes from a childhood in transit.',
    route: [
      { country: 'Lebanon', code: 'BEY' },
      { country: 'France', code: 'CDG' },
      { country: 'Ethiopia', code: 'ADD' },
      { country: 'Guinea', code: 'CKY' },
      { country: 'Senegal', code: 'DSS' },
    ],
  },
  about: {
    title: 'Why Window Seat?',
    text: '',
    photo: null,
    americanahNote:
      "Ifemelu's blog started as an outsider's observation of a society, and Window Seat observes the world from the seat of a child who keeps moving.",
  },
  author: {
    title: 'The Passenger',
    nationality: 'Somewhere',
    note: '',
    photo: '',
  },
  tips: [
    'Always pack your school records in your hand luggage.',
    'Keep two clocks in your head until they agree.',
    'Never promise you will not change your phone number.',
  ],
  entries: [
    {
      id: 'entry-01',
      number: '01',
      stage: 'Check-in',
      title: 'Where Are You From? A Question With No Short Answer',
      genre: 'Reflective essay',
      fromCode: 'BEY',
      toCode: 'CDG',
      americanah: true,
      americanahNote:
        'Like Ifemelu beginning her blog, I write as an outsider who observes the society around me.',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-02',
      number: '02',
      stage: 'Boarding',
      title: 'Gate 14: The Last Day Before Moving',
      genre: 'Short narrative',
      fromCode: 'BEY',
      toCode: 'CDG',
      americanah: false,
      americanahNote: '',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-03',
      number: '03',
      stage: 'Takeoff',
      title: 'Windows, Doors and Suitcases',
      genre: 'Photo essay',
      fromCode: 'CDG',
      toCode: 'ADD',
      americanah: false,
      americanahNote: '',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-04',
      number: '04',
      stage: 'Cruising altitude',
      title: 'Expat or Immigrant? Who Gets to Be Called What',
      genre: 'Social commentary',
      fromCode: 'CDG',
      toCode: 'ADD',
      americanah: true,
      americanahNote:
        'Ifemelu and Obinze show how class, race and papers decide who is welcome, and the word expat hides the same question.',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-05',
      number: '05',
      stage: 'Overhead bin',
      title: 'Hand Luggage',
      genre: 'Poetry',
      fromCode: 'ADD',
      toCode: 'CKY',
      americanah: false,
      americanahNote: '',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-06',
      number: '06',
      stage: 'Turbulence',
      title: 'Two Accents, One Sentence',
      genre: 'Short narrative',
      fromCode: 'ADD',
      toCode: 'CKY',
      americanah: true,
      americanahNote:
        'Ifemelu adopts an American accent to fit in, and my accents shift in the same way.',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-07',
      number: '07',
      stage: 'Layover',
      title: 'Why Did We Leave? Asking My Parents',
      genre: 'Interview',
      fromCode: 'CKY',
      toCode: 'DSS',
      americanah: false,
      americanahNote: '',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-08',
      number: '08',
      stage: 'Descent',
      title: 'Talking to the Camera: What Is Home?',
      genre: 'Video post',
      fromCode: 'CKY',
      toCode: 'DSS',
      americanah: false,
      americanahNote: '',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
    {
      id: 'entry-09',
      number: '09',
      stage: 'Landing',
      title: 'Insider, Outsider, Window Seat',
      genre: 'Closing commentary',
      fromCode: 'DSS',
      toCode: 'DSS',
      americanah: true,
      americanahNote:
        'Ifemelu returns to Lagos as an insider and an outsider at once, and this is where my blog ends.',
      text: '',
      photos: [],
      videoUrl: '',
      audioUrl: '',
      qa: [],
    },
  ],
};

/* ============================================================================
   WEB AUDIO CHIME (Only plays after a user click)
   ============================================================================ */
function playCabinChime(type: 'ding-dong' | 'shade' | 'stamp') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'ding-dong') {
      // Classic High-Low cabin chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.16, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.35); // C5
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.16, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.1);
    } else if (type === 'shade') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'stamp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // Ignore audio context errors if blocked
  }
}

/* ============================================================================
   IMAGE COMPRESSION (Max 1400px wide, JPEG, reduce quality until < 700 KB)
   ============================================================================ */
async function compressImageToJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        const maxWidth = 1400;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.86;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        // 700 KB binary is roughly ~930,000 characters in base64 dataUrl
        while (dataUrl.length > 700 * 1024 && quality > 0.25) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   LAZY FIRESTORE IMAGE RESOLVER ("media:ID" or direct URL)
   ============================================================================ */
const mediaMemoryCache = new Map<string, string>();

function ResolvedImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (!src) return '';
    if (src.startsWith('media:')) {
      return mediaMemoryCache.get(src) || '';
    }
    return src;
  });

  useEffect(() => {
    let active = true;
    if (!src) {
      setResolvedSrc('');
      return;
    }
    if (!src.startsWith('media:')) {
      setResolvedSrc(src);
      return;
    }
    const cached = mediaMemoryCache.get(src);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }
    const mediaId = src.slice('media:'.length);
    getDoc(doc(db, 'media', mediaId))
      .then((snap) => {
        if (!active) return;
        if (snap.exists()) {
          const dataUrl = snap.data().dataUrl as string;
          if (dataUrl) {
            mediaMemoryCache.set(src, dataUrl);
            setResolvedSrc(dataUrl);
          }
        }
      })
      .catch(() => {
        // Silent fallback if offline
      });
    return () => {
      active = false;
    };
  }, [src]);

  if (!resolvedSrc) {
    return (
      <div className="py-6 text-center font-mono text-xs text-[#5B6677]">
        Loading photo...
      </div>
    );
  }

  return <img src={resolvedSrc} alt={alt} loading="lazy" className={className} />;
}

export default function App() {
  const [data, setData] = useState<SiteData>(DEFAULT_DATA);
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [expandedAmericanah, setExpandedAmericanah] = useState<Record<string, boolean>>({});
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);

  // Scroll & Flight Telemetry State
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [heroDayOpacity, setHeroDayOpacity] = useState<number>(0);
  const [footerNightOpacity, setFooterNightOpacity] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('BOARDING');
  const [activeNavId, setActiveNavId] = useState<string>('');
  const [passportVisible, setPassportVisible] = useState<boolean>(false);

  // Easter Eggs State
  const [shadeInitialClosed, setShadeInitialClosed] = useState<boolean>(true);
  const [shadePulledDown, setShadePulledDown] = useState<boolean>(false);
  const [captainToast, setCaptainToast] = useState<string | null>(null);
  const [fallingStamps, setFallingStamps] = useState<
    { id: number; country: string; code: string; left: number; delay: number }[]
  >([]);
  const [foundEggs, setFoundEggs] = useState<{
    captain: boolean;
    shade: boolean;
    home: boolean;
  }>({
    captain: false,
    shade: false,
    home: false,
  });
  const [easterModalOpen, setEasterModalOpen] = useState<boolean>(false);
  const planeClickCountRef = useRef<{ count: number; timer: number | null }>({
    count: 0,
    timer: null,
  });
  const typedBufferRef = useRef<string>('');

  // Owner & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [crewModalOpen, setCrewModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Not saved, retrying'>('Saved');
  const [backupsList, setBackupsList] = useState<
    { id: string; label: string; createdAt: string; payload: SiteData }[]
  >([]);
  const [showBackupsDropdown, setShowBackupsDropdown] = useState<boolean>(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const easterModalRef = useRef<HTMLDivElement | null>(null);

  // Open window shade on initial load
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShadeInitialClosed(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  // Listen to live Firestore updates on site/content
  useEffect(() => {
    const contentRef = doc(db, 'site', 'content');
    const unsubscribe = onSnapshot(
      contentRef,
      (snap) => {
        if (snap.exists() && !isLocalChangeRef.current) {
          const remote = snap.data() as Partial<SiteData>;
          setData((prev) => ({
            site: remote.site || prev.site,
            about: remote.about || prev.about,
            author: remote.author || prev.author,
            tips: Array.isArray(remote.tips) ? remote.tips : prev.tips,
            entries: Array.isArray(remote.entries) ? remote.entries : prev.entries,
            updatedAt: remote.updatedAt,
          }));
        }
      },
      (err) => {
        // If offline or unavailable, continue gracefully in read-only with embedded data
        console.warn('Live snapshot listener warning:', err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Firebase Auth listener & Owner verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsOwner(false);
        return;
      }
      const email = (user.email || '').toLowerCase();
      const allowedOwner = OWNER_EMAIL.toLowerCase();
      if (allowedOwner && email !== allowedOwner) {
        setAuthError('This account cannot edit this site.');
        await signOut(auth);
        setCurrentUser(null);
        setIsOwner(false);
        return;
      }
      setAuthError(null);
      setCurrentUser(user);
      setIsOwner(true);
      setCrewModalOpen(false);
    });
    return () => unsubscribe();
  }, []);

  // Load backups when owner signs in
  const loadBackups = useCallback(async () => {
    if (!isOwner) return;
    try {
      const snap = await getDocs(collection(db, 'backups'));
      const items: { id: string; label: string; createdAt: string; payload: SiteData }[] = [];
      snap.forEach((d) => {
        const raw = d.data() as SiteData & { createdAt: string; label?: string };
        items.push({
          id: d.id,
          label: raw.label || raw.createdAt || d.id,
          createdAt: raw.createdAt || d.id,
          payload: {
            site: raw.site,
            about: raw.about,
            author: raw.author,
            tips: raw.tips || [],
            entries: raw.entries,
          },
        });
      });
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setBackupsList(items.slice(0, 5));
    } catch {
      // Ignore if no backups yet
    }
  }, [isOwner]);

  useEffect(() => {
    if (isOwner) {
      loadBackups();
    }
  }, [isOwner, loadBackups]);

  // Persist to Firestore + keep last 5 backups
  const persistSiteContent = useCallback(
    async (nextData: SiteData) => {
      if (!isOwner) return;
      setSaveStatus('Saving...');
      const nowIso = new Date().toISOString();
      const backupId = 'bk_' + Date.now();
      const payloadToSave = {
        site: nextData.site,
        about: nextData.about,
        author: nextData.author,
        tips: nextData.tips,
        entries: nextData.entries,
        updatedAt: nowIso,
      };

      try {
        await setDoc(doc(db, 'site', 'content'), payloadToSave);

        // Save backup copy & prune to last 5
        await setDoc(doc(db, 'backups', backupId), {
          site: nextData.site,
          about: nextData.about,
          author: nextData.author,
          tips: nextData.tips,
          entries: nextData.entries,
          createdAt: nowIso,
          label: new Date().toLocaleString(),
        });

        const snap = await getDocs(collection(db, 'backups'));
        const docsList: { id: string; createdAt: string }[] = [];
        snap.forEach((d) => {
          docsList.push({ id: d.id, createdAt: String(d.data().createdAt || d.id) });
        });
        docsList.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        if (docsList.length > 5) {
          const toRemove = docsList.slice(5);
          for (const old of toRemove) {
            await deleteDoc(doc(db, 'backups', old.id));
          }
        }
        await loadBackups();
        isLocalChangeRef.current = false;
        setSaveStatus('Saved');
      } catch (err) {
        setSaveStatus('Not saved, retrying');
        if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = window.setTimeout(() => {
          persistSiteContent(nextData);
        }, 3000);
        try {
          handleFirestoreError(err, OperationType.WRITE, 'site/content');
        } catch {
          // Logged by handleFirestoreError
        }
      }
    },
    [isOwner, loadBackups]
  );

  // Trigger 1.5s debounced autosave on any owner edit
  const scheduleAutosave = useCallback(
    (updater: (prev: SiteData) => SiteData) => {
      isLocalChangeRef.current = true;
      setSaveStatus('Saving...');
      setData((prev) => {
        const updated = updater(prev);
        if (autosaveTimerRef.current) {
          window.clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = window.setTimeout(() => {
          persistSiteContent(updated);
        }, 1500);
        return updated;
      });
    },
    [persistSiteContent]
  );

  // Keyboard shortcut Ctrl+Shift+E to open Crew modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setCrewModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Easter Egg 3: Type "home" anywhere outside inputs
  const triggerHomeEasterEgg = useCallback((withSound: boolean) => {
    if (withSound) playCabinChime('stamp');
    setFoundEggs((prev) => ({ ...prev, home: true }));
    const route = DEFAULT_DATA.site.route;
    const stamps = route.map((stop, idx) => ({
      id: Date.now() + idx,
      country: stop.country,
      code: stop.code,
      left: 14 + idx * 17,
      delay: idx * 180,
    }));
    setFallingStamps(stamps);
    window.setTimeout(() => {
      setFallingStamps([]);
    }, 3400);
  }, []);

  useEffect(() => {
    const onKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.length === 1) {
        typedBufferRef.current = (typedBufferRef.current + e.key.toLowerCase()).slice(-4);
        if (typedBufferRef.current === 'home') {
          typedBufferRef.current = '';
          triggerHomeEasterEgg(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, [triggerHomeEasterEgg]);

  // Easter Egg 1: Captain announcement (click top-bar plane 3 times)
  const triggerCaptainEasterEgg = useCallback(() => {
    playCabinChime('ding-dong');
    setFoundEggs((prev) => ({ ...prev, captain: true }));
    setCaptainToast(
      'CAPTAIN SPEAKING · Welcome aboard Flight WS 009 from BEY to DSS. Keep your window shade open.'
    );
    window.setTimeout(() => {
      setCaptainToast(null);
    }, 5000);
  }, []);

  const handleTopPlaneClick = () => {
    const state = planeClickCountRef.current;
    state.count += 1;
    if (state.timer) window.clearTimeout(state.timer);
    if (state.count >= 3) {
      state.count = 0;
      triggerCaptainEasterEgg();
    } else {
      state.timer = window.setTimeout(() => {
        state.count = 0;
      }, 900);
    }
  };

  // Easter Egg 2: Window shade toggle in Hero
  const triggerShadeEasterEgg = useCallback((scrollToHeroFirst = false) => {
    if (scrollToHeroFirst) {
      const heroEl = document.getElementById('hero');
      heroEl?.scrollIntoView({ behavior: 'smooth' });
    }
    playCabinChime('shade');
    setFoundEggs((prev) => ({ ...prev, shade: true }));
    setShadePulledDown((prev) => !prev);
  }, []);

  // Scroll Progress, Lerp & IntersectionObserver (Replays animations when entering viewport)
  useEffect(() => {
    let rafId: number | null = null;
    let currentLerp = 0;
    let targetLerp = 0;

    const updateOnScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight =
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) -
        window.innerHeight;
      targetLerp = docHeight > 0 ? Math.max(0, Math.min(1, scrollTop / docHeight)) : 0;

      const heroEl = document.getElementById('hero');
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height * 0.75, 1)));
        setHeroDayOpacity(ratio);
      }

      const footerEl = document.getElementById('footer');
      if (footerEl) {
        const fRect = footerEl.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (window.innerHeight - fRect.top) / Math.max(fRect.height, 1))
        );
        setFooterNightOpacity(ratio);
      }

      // Detect stage & active nav link
      const triggerY = window.innerHeight * 0.38;
      let detectedStage = 'BOARDING';
      let detectedId = '';

      const aboutEl = document.getElementById('about');
      if (aboutEl && aboutEl.getBoundingClientRect().top <= triggerY) {
        detectedId = 'about';
        detectedStage = 'PRE-FLIGHT';
      }

      const articles = document.querySelectorAll('.entry-article:not([hidden])');
      articles.forEach((art) => {
        const r = art.getBoundingClientRect();
        if (r.top <= triggerY) {
          detectedId = art.id;
          detectedStage = (art.getAttribute('data-stage') || 'CRUISING').toUpperCase();
        }
      });

      if (footerEl && footerEl.getBoundingClientRect().top <= window.innerHeight * 0.65) {
        detectedStage = 'LANDED';
      }

      setCurrentStage(detectedStage);
      setActiveNavId(detectedId);

      if (!rafId) {
        const tick = () => {
          const diff = targetLerp - currentLerp;
          if (Math.abs(diff) > 0.0005) {
            currentLerp += diff * 0.14;
            setScrollProgress(currentLerp);
            rafId = requestAnimationFrame(tick);
          } else {
            currentLerp = targetLerp;
            setScrollProgress(currentLerp);
            rafId = null;
          }
        };
        rafId = requestAnimationFrame(tick);
      }
    };

    updateOnScroll();
    window.addEventListener('scroll', updateOnScroll, { passive: true });
    window.addEventListener('resize', updateOnScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateOnScroll);
      window.removeEventListener('resize', updateOnScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // IntersectionObserver for `.reveal` and Author Passport stamps (replays every time section enters viewport)
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => obs.observe(el));

    const passportEl = document.getElementById('author-passport-section');
    const passObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setPassportVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    if (passportEl) passObs.observe(passportEl);

    return () => {
      obs.disconnect();
      passObs.disconnect();
    };
  }, [activeGenre]);

  // Modal Escape & Focus Trap for "Hidden in this flight"
  useEffect(() => {
    if (!easterModalOpen && !crewModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEasterModalOpen(false);
        setCrewModalOpen(false);
      }
      if (e.key === 'Tab' && easterModalOpen && easterModalRef.current) {
        const focusables = easterModalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [easterModalOpen, crewModalOpen]);

  // Upload & compress photo to Firestore `media/{id}`
  const handlePhotoUpload = async (
    file: File,
    targetKey: string,
    onMediaRefReady: (mediaRef: string) => void
  ) => {
    if (!isOwner) return;
    setUploadingTarget(targetKey);
    try {
      const dataUrl = await compressImageToJpegDataUrl(file);
      const mediaId = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const nowIso = new Date().toISOString();
      await setDoc(doc(db, 'media', mediaId), {
        dataUrl,
        createdAt: nowIso,
      });
      const refString = `media:${mediaId}`;
      mediaMemoryCache.set(refString, dataUrl);
      onMediaRefReady(refString);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'media');
      } catch {
        // Handled
      }
    } finally {
      setUploadingTarget(null);
    }
  };

  // Download JSON backup
  const handleDownloadBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `window-seat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derived flight calculations
  const route = data.site.route || DEFAULT_DATA.site.route;
  const rawAltitude = 35000 * Math.sin(scrollProgress * Math.PI);
  const roundedAltitude = Math.max(0, Math.round(rawAltitude / 100) * 100);
  const formattedAltitude = roundedAltitude.toLocaleString('en-US');

  // Map scrollProgress across the 4 legs: 0..1 -> leg 0..3
  const numLegs = Math.max(1, route.length - 1);
  const legIndex = Math.min(numLegs - 1, Math.floor(scrollProgress * numLegs));
  const currentFromStop = route[legIndex] || route[0];
  const currentToStop = route[legIndex + 1] || route[route.length - 1];
  const nowOverCountry =
    scrollProgress >= 0.96 ? route[route.length - 1].country : currentFromStop.country;

  const genres = ['All', ...Array.from(new Set(data.entries.map((e) => e.genre).filter(Boolean)))];
  const canEdit = isOwner && isEditMode;
  const foundCount =
    (foundEggs.captain ? 1 : 0) + (foundEggs.shade ? 1 : 0) + (foundEggs.home ? 1 : 0);

  return (
    <div id="top">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Captain Announcement Banner (Easter Egg 1) */}
      {captainToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#101B2B] text-[#F2EFE9] font-mono text-xs px-4 py-2.5 rounded shadow-lg border border-[#E4572E] flex items-center gap-2 max-w-[92vw]"
        >
          <span className="seatbelt-dot" />
          <span>{captainToast}</span>
        </div>
      )}

      {/* Falling Country Stamps (Easter Egg 3) */}
      {fallingStamps.map((stamp) => (
        <div
          key={stamp.id}
          className="falling-stamp"
          style={{
            left: `${stamp.left}%`,
            animationDelay: `${stamp.delay}ms`,
          }}
        >
          {stamp.country} · {stamp.code}
        </div>
      ))}

      {/* ====================================================================
          OWNER CREW PANEL (Fixed Top Bar when Owner is Signed In)
          ==================================================================== */}
      {isOwner && (
        <div className="sticky top-0 z-[110] bg-[#101B2B] text-[#F2EFE9] border-b border-[#D4CFC3]/25 px-4 py-2 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[#E4572E] font-medium">CREW DECK</span>
            <button
              type="button"
              onClick={() => setIsEditMode((p) => !p)}
              className="px-2.5 py-1 rounded border border-[#D4CFC3]/40 hover:bg-[#F2EFE9] hover:text-[#101B2B] transition-colors cursor-pointer"
            >
              {isEditMode ? 'Mode: Edit (Click to Preview)' : 'Mode: Preview (Click to Edit)'}
            </button>
            <span
              className={`px-2 py-0.5 rounded ${
                saveStatus === 'Saved'
                  ? 'bg-emerald-900/50 text-emerald-200'
                  : saveStatus === 'Saving...'
                  ? 'bg-amber-900/50 text-amber-200'
                  : 'bg-red-900/60 text-red-200'
              }`}
            >
              {saveStatus}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setShowBackupsDropdown((p) => !p)}
              className="px-2.5 py-1 rounded border border-[#D4CFC3]/40 hover:bg-[#F2EFE9]/10 cursor-pointer"
            >
              Restore previous version ({backupsList.length}/5)
            </button>

            {showBackupsDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-[#101B2B] border border-[#D4CFC3]/40 rounded shadow-xl p-2 z-50">
                <div className="text-[11px] text-[#D4CFC3] mb-1.5 pb-1 border-b border-[#D4CFC3]/20">
                  Last 5 automatic backups:
                </div>
                {backupsList.length === 0 ? (
                  <div className="text-[11px] text-[#5B6677] py-2">No backups saved yet.</div>
                ) : (
                  <ul className="space-y-1">
                    {backupsList.map((bk) => (
                      <li key={bk.id} className="flex items-center justify-between gap-2 py-1">
                        <span className="truncate text-[11px]">{bk.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            scheduleAutosave(() => bk.payload);
                            setShowBackupsDropdown(false);
                          }}
                          className="px-2 py-0.5 bg-[#E4572E] text-white rounded text-[10px] shrink-0 cursor-pointer"
                        >
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-2.5 py-1 rounded border border-[#D4CFC3]/40 hover:bg-[#F2EFE9]/10 cursor-pointer"
            >
              Download backup
            </button>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="px-2.5 py-1 rounded bg-[#E4572E] text-white hover:opacity-90 cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          1. STICKY NAVIGATION (56px, 5 route dots + plane icon)
          ==================================================================== */}
      <header className="site-header" role="banner">
        <nav className="nav-container" aria-label="Flight stages navigation">
          <a href="#top" className="nav-brand">
            {data.site.title}
          </a>

          <ul className="nav-links-desktop">
            <li className="nav-item">
              <a
                href="#about"
                className={`nav-link ${activeNavId === 'about' ? 'is-active' : ''}`}
              >
                About
              </a>
            </li>
            {data.entries.map((entry) => {
              const hiddenByFilter = activeGenre !== 'All' && entry.genre !== activeGenre;
              if (hiddenByFilter) return null;
              return (
                <li key={entry.id} className="nav-item">
                  <a
                    href={`#${entry.id}`}
                    className={`nav-link ${activeNavId === entry.id ? 'is-active' : ''}`}
                    aria-label={`Entry ${entry.number}: ${entry.title}`}
                  >
                    {entry.number}
                  </a>
                  <span className="nav-tooltip" role="tooltip">
                    {entry.title}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="nav-telemetry" aria-live="polite">
            {currentStage} {formattedAltitude} FT
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMobileMenuOpen((p) => !p)}
          >
            <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </nav>

        {/* Mobile Nav Panel */}
        <div className="mobile-nav-panel" id="mobile-nav-panel" hidden={!mobileMenuOpen}>
          <ul className="mobile-nav-list">
            <li className="mobile-nav-item">
              <a
                href="#about"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-num">00</span>
                <span className="mobile-nav-title">About — {data.about.title}</span>
              </a>
            </li>
            {data.entries.map((entry) => {
              const hiddenByFilter = activeGenre !== 'All' && entry.genre !== activeGenre;
              if (hiddenByFilter) return null;
              return (
                <li key={entry.id} className="mobile-nav-item">
                  <a
                    href={`#${entry.id}`}
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-nav-num">{entry.number}</span>
                    <span className="mobile-nav-title">{entry.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Dashed Route Line with 5 Stop Dots & Moving Plane */}
        <div className="nav-route-track">
          {route.map((stop, idx) => {
            const stopPos = 2 + (idx / Math.max(1, route.length - 1)) * 96;
            const planePos = 2 + scrollProgress * 96;
            const isPassed = planePos >= stopPos - 0.5;
            return (
              <span
                key={stop.code}
                className={`nav-route-dot ${isPassed ? 'is-passed' : ''}`}
                style={{ left: `${stopPos}%` }}
                title={`${stop.country} (${stop.code})`}
              />
            );
          })}
          <button
            type="button"
            className="nav-plane-marker"
            style={{ left: `${(2 + scrollProgress * 96).toFixed(2)}%` }}
            onClick={handleTopPlaneClick}
            aria-label="Flight progress indicator"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                transform="rotate(90 12 12)"
              />
            </svg>
          </button>
        </div>
      </header>

      <main id="main-content">
        {/* ==================================================================
            2. HERO SECTION
            ================================================================== */}
        <section className="hero-section" id="hero" aria-labelledby="hero-heading">
          <div className="hero-grid">
            <div className="hero-text-col reveal is-visible">
              <p className="hero-eyebrow">
                <span className="seatbelt-dot" aria-hidden="true" />
                <span>
                  FLIGHT WS 009 · {route.map((r) => r.code).join(' › ')}
                </span>
              </p>

              {canEdit ? (
                <input
                  type="text"
                  value={data.site.title}
                  onChange={(e) =>
                    scheduleAutosave((prev) => ({
                      ...prev,
                      site: { ...prev.site, title: e.target.value },
                    }))
                  }
                  className="hero-title editable-field bg-transparent w-full"
                  aria-label="Site title"
                />
              ) : (
                <h1 className="hero-title" id="hero-heading">
                  {data.site.title}
                </h1>
              )}

              <p className="hero-route-countries">
                {route.map((r) => r.country).join(' · ')}
              </p>

              {canEdit ? (
                <input
                  type="text"
                  value={data.site.tagline}
                  onChange={(e) =>
                    scheduleAutosave((prev) => ({
                      ...prev,
                      site: { ...prev.site, tagline: e.target.value },
                    }))
                  }
                  className="hero-tagline editable-field bg-transparent w-full block"
                  aria-label="Site tagline"
                />
              ) : (
                <p className="hero-tagline">{data.site.tagline}</p>
              )}

              <a href="#about" className="hero-begin-link">
                <span>Begin</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            {/* Focus Mode Selector 1 Target: main#main-content > section#hero > div > div:nth-of-type(2) */}
            <div className="hero-window-col">
              <div
                className="plane-window-outer"
                role="img"
                aria-label="View through an oval airplane cabin window showing the wing and drifting clouds against a dawn sky turning into day"
              >
                <div className="plane-window-inner">
                  <div className="sky-layer sky-dawn" />
                  <div
                    className="sky-layer sky-day"
                    style={{ opacity: heroDayOpacity }}
                  />

                  <div className="window-clouds" aria-hidden="true">
                    <svg className="cloud-track" viewBox="0 0 400 120" fill="none">
                      <path
                        d="M40 85h110c14 0 25-11 25-25 0-12-9-22-20-24-4-16-18-28-35-28-19 0-34 14-36 32-3-1-6-2-9-2-14 0-25 11-25 25 0 1 0 2 .2 3C44 68 40 76 40 85z"
                        fill="#FFFFFF"
                        fillOpacity="0.65"
                      />
                      <path
                        d="M240 95h95c11 0 20-9 20-20 0-10-7-18-16-19-3-13-14-23-29-23-15 0-28 11-29 26-2-1-5-1-8-1-11 0-20 9-20 20 0 1 0 1 .1 2-5 1-8.1 7-8.1 15z"
                        fill="#FFFFFF"
                        fillOpacity="0.5"
                      />
                    </svg>
                    <svg
                      className="cloud-track cloud-track-slow"
                      viewBox="0 0 400 120"
                      fill="none"
                    >
                      <path
                        d="M90 80h120c12 0 22-10 22-22 0-11-8-20-18-21-4-14-16-25-32-25-17 0-31 13-33 29-3-1-5-1-8-1-12 0-22 10-22 22 0 1 0 2 .2 2C109 66 90 72 90 80z"
                        fill="#FFFFFF"
                        fillOpacity="0.45"
                      />
                    </svg>
                  </div>

                  <svg
                    className="window-wing"
                    viewBox="0 0 240 80"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 62 L240 26 L240 80 L0 80 Z"
                      fill="#101B2B"
                      fillOpacity="0.82"
                    />
                    <path
                      d="M0 62 L240 26 L240 31 L0 66 Z"
                      fill="#D4CFC3"
                      fillOpacity="0.55"
                    />
                    <rect x="218" y="18" width="5" height="10" fill="#E4572E" rx="1" />
                  </svg>

                  {/* Interactive Window Shade (Easter Egg 2) */}
                  <div
                    className={`window-shade ${
                      shadeInitialClosed ? 'is-initial-closed' : ''
                    } ${shadePulledDown ? 'is-pulled-down' : ''}`}
                    onClick={() => triggerShadeEasterEgg(false)}
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle airplane window shade"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        triggerShadeEasterEgg(false);
                      }
                    }}
                  >
                    <div className="shade-handle" />
                  </div>

                  <div className="window-breather" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            FLIGHT MAP SECTION (Straight 5-stop route line after Hero)
            ================================================================== */}
        <section className="flight-map-section reveal" aria-label="Flight route map">
          <div className="flight-map-header">
            <span className="flight-map-kicker">
              FLIGHT PATH · {route.map((s) => s.code).join(' › ')}
            </span>
            <span className="flight-map-kicker">
              NOW OVER: {nowOverCountry} · {currentFromStop.code} › {currentToStop.code}
            </span>
          </div>

          <div className="flight-map-track-wrap">
            <div className="flight-map-line-container">
              <div
                className="flight-map-line-progress"
                style={{ width: `${(scrollProgress * 100).toFixed(2)}%` }}
              />

              {route.map((stop, idx) => {
                const posPercent = (idx / Math.max(1, route.length - 1)) * 100;
                const isPassed = scrollProgress * 100 >= posPercent - 1;
                const isSelected = selectedStopIndex === idx;
                return (
                  <button
                    key={stop.code}
                    type="button"
                    className={`flight-map-stop ${isPassed ? 'is-passed' : ''} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    style={{ left: `${posPercent}%` }}
                    onClick={() =>
                      setSelectedStopIndex((prev) => (prev === idx ? null : idx))
                    }
                    aria-label={`Stop ${idx + 1}: ${stop.country} (${stop.code})`}
                  >
                    <span className="flight-map-stop-popover">
                      Stop 0{idx + 1} · {stop.country} ({stop.code})
                    </span>
                    <span className="flight-map-stop-dot" />
                    <span className="flight-map-stop-meta">
                      <span className="flight-map-stop-code">{stop.code}</span>
                      <span className="flight-map-stop-country">{stop.country}</span>
                    </span>
                  </button>
                );
              })}

              <div
                className="flight-map-plane"
                style={{ left: `${(scrollProgress * 100).toFixed(2)}%` }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                    transform="rotate(90 12 12)"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            3. ABOUT SECTION ("Why Window Seat?")
            ================================================================== */}
        <div className="reading-column">
          <section className="about-section reveal" id="about" aria-labelledby="about-heading">
            {canEdit ? (
              <input
                type="text"
                value={data.about.title}
                onChange={(e) =>
                  scheduleAutosave((prev) => ({
                    ...prev,
                    about: { ...prev.about, title: e.target.value },
                  }))
                }
                className="section-heading editable-field bg-transparent w-full"
              />
            ) : (
              <h2 className="section-heading" id="about-heading">
                {data.about.title}
              </h2>
            )}

            <div className="signal-rule" aria-hidden="true" />

            {/* Americanah Expandable Tag */}
            <div className="americanah-wrapper">
              <button
                type="button"
                className="americanah-pill"
                aria-expanded={Boolean(expandedAmericanah['about'])}
                onClick={() =>
                  setExpandedAmericanah((p) => ({ ...p, about: !p.about }))
                }
              >
                <span>Americanah</span>
                <span className="americanah-pill-icon" aria-hidden="true">
                  +
                </span>
              </button>

              {(expandedAmericanah['about'] || canEdit) && (
                <div className="americanah-note-box">
                  <span className="americanah-note-label">Literary connection</span>
                  {canEdit ? (
                    <textarea
                      rows={2}
                      value={data.about.americanahNote}
                      onChange={(e) =>
                        scheduleAutosave((prev) => ({
                          ...prev,
                          about: { ...prev.about, americanahNote: e.target.value },
                        }))
                      }
                      className="editable-field bg-transparent w-full text-sm"
                    />
                  ) : (
                    <p>{data.about.americanahNote}</p>
                  )}
                </div>
              )}
            </div>

            {/* About Body Text */}
            {canEdit ? (
              <textarea
                rows={4}
                placeholder="Write About text here (paragraphs separated by blank line)..."
                value={data.about.text}
                onChange={(e) =>
                  scheduleAutosave((prev) => ({
                    ...prev,
                    about: { ...prev.about, text: e.target.value },
                  }))
                }
                className="editable-field bg-transparent w-full p-2 text-base"
              />
            ) : data.about.text.trim() ? (
              <div className="prose">
                {data.about.text
                  .trim()
                  .split(/\n\s*\n/)
                  .map((p, i) => (
                    <p key={i}>{p.trim()}</p>
                  ))}
              </div>
            ) : (
              <p className="coming-soon">Coming soon</p>
            )}

            {/* About Optional Photo */}
            {data.about.photo?.src && (
              <figure className="photo-figure mt-6">
                <ResolvedImage
                  src={data.about.photo.src}
                  alt={data.about.photo.alt || data.about.title}
                />
                {(data.about.photo.caption || canEdit) && (
                  <figcaption className="photo-caption">
                    {canEdit ? (
                      <input
                        type="text"
                        placeholder="Photo caption..."
                        value={data.about.photo.caption}
                        onChange={(e) =>
                          scheduleAutosave((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              photo: prev.about.photo
                                ? { ...prev.about.photo, caption: e.target.value }
                                : null,
                            },
                          }))
                        }
                        className="editable-field bg-transparent w-full"
                      />
                    ) : (
                      data.about.photo.caption
                    )}
                  </figcaption>
                )}
              </figure>
            )}

            {canEdit && (
              <div className="mt-4 flex items-center gap-3 font-mono text-xs">
                <label className="px-3 py-1.5 border border-[#D4CFC3] rounded bg-[#E7E3DA] cursor-pointer hover:border-[#101B2B]">
                  {uploadingTarget === 'about-photo'
                    ? 'Compressing & uploading...'
                    : data.about.photo?.src
                    ? 'Replace About Photo'
                    : '+ Upload About Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      handlePhotoUpload(f, 'about-photo', (refStr) => {
                        scheduleAutosave((prev) => ({
                          ...prev,
                          about: {
                            ...prev.about,
                            photo: {
                              src: refStr,
                              alt: prev.about.title,
                              caption: prev.about.photo?.caption || '',
                            },
                          },
                        }));
                      });
                    }}
                  />
                </label>
                {data.about.photo?.src && (
                  <button
                    type="button"
                    onClick={() =>
                      scheduleAutosave((prev) => ({
                        ...prev,
                        about: { ...prev.about, photo: null },
                      }))
                    }
                    className="text-[#E4572E] underline cursor-pointer"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ================================================================
              4. GENRE FILTER
              ================================================================ */}
          <section className="filter-section reveal" aria-label="Filter entries by genre">
            <span className="filter-label">Filter by genre</span>
            <div className="filter-chips" role="group" aria-label="Entry genres">
              {genres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className={`filter-chip ${activeGenre === genre ? 'is-active' : ''}`}
                  aria-pressed={activeGenre === genre}
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          {/* ================================================================
              5. THE 9 ENTRIES (With Boarding Pass Header Bands)
              ================================================================ */}
          <div className="entries-container">
            {data.entries.map((entry, entryIdx) => {
              const isHidden = activeGenre !== 'All' && entry.genre !== activeGenre;
              const isArrived =
                entry.number === '09' ||
                (entry.fromCode === 'DSS' && entry.toCode === 'DSS');
              const isPoetry = entry.genre.toLowerCase() === 'poetry';
              const isPhotoEssay = entry.genre.toLowerCase() === 'photo essay';
              const isVideoPost = entry.genre.toLowerCase() === 'video post';

              return (
                <article
                  key={entry.id}
                  id={entry.id}
                  data-genre={entry.genre}
                  data-stage={entry.stage}
                  hidden={isHidden}
                  className="entry-article reveal"
                >
                  {/* Boarding Pass Header Band */}
                  <div className="boarding-pass">
                    <div className="bp-top">
                      <div className="bp-number">{entry.number}</div>

                      <div className="bp-meta-grid">
                        <div className="bp-field">
                          <span className="bp-label">STAGE</span>
                          {canEdit ? (
                            <input
                              type="text"
                              value={entry.stage}
                              onChange={(e) => {
                                const val = e.target.value;
                                scheduleAutosave((prev) => {
                                  const next = [...prev.entries];
                                  next[entryIdx] = { ...next[entryIdx], stage: val };
                                  return { ...prev, entries: next };
                                });
                              }}
                              className="bp-value editable-field bg-transparent w-32"
                            />
                          ) : (
                            <span className="bp-value">{entry.stage}</span>
                          )}
                        </div>

                        <div className="bp-field">
                          <span className="bp-label">GENRE</span>
                          {canEdit ? (
                            <input
                              type="text"
                              value={entry.genre}
                              onChange={(e) => {
                                const val = e.target.value;
                                scheduleAutosave((prev) => {
                                  const next = [...prev.entries];
                                  next[entryIdx] = { ...next[entryIdx], genre: val };
                                  return { ...prev, entries: next };
                                });
                              }}
                              className="bp-value editable-field bg-transparent w-36"
                            />
                          ) : (
                            <span className="bp-value">{entry.genre}</span>
                          )}
                        </div>

                        <div className="bp-field">
                          <span className="bp-label">ROUTE</span>
                          {canEdit ? (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <span>FROM</span>
                              <input
                                type="text"
                                value={entry.fromCode}
                                maxLength={4}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  scheduleAutosave((prev) => {
                                    const next = [...prev.entries];
                                    next[entryIdx] = { ...next[entryIdx], fromCode: val };
                                    return { ...prev, entries: next };
                                  });
                                }}
                                className="editable-field bg-transparent w-11 uppercase font-medium"
                              />
                              <span>TO</span>
                              <input
                                type="text"
                                value={entry.toCode}
                                maxLength={4}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  scheduleAutosave((prev) => {
                                    const next = [...prev.entries];
                                    next[entryIdx] = { ...next[entryIdx], toCode: val };
                                    return { ...prev, entries: next };
                                  });
                                }}
                                className="editable-field bg-transparent w-11 uppercase font-medium"
                              />
                            </div>
                          ) : (
                            <span className="bp-value">
                              FROM {entry.fromCode} TO {entry.toCode}
                              {isArrived ? (
                                <span className="bp-arrived-badge ml-2">· ARRIVED</span>
                              ) : null}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bp-seat-box">
                        <span className="bp-label">SEAT</span>
                        <span className="bp-seat-val">{entry.number}A</span>
                      </div>
                    </div>

                    <div className="bp-perforation" aria-hidden="true">
                      <span className="bp-notch bp-notch-left" />
                      <div className="bp-perforation-line" />
                      <span className="bp-notch bp-notch-right" />
                    </div>

                    <div className="bp-stub">
                      <span>FLIGHT WS 009 · WINDOW SEAT</span>
                      <span>
                        FROM {entry.fromCode} TO {entry.toCode}
                        {isArrived ? ' · ARRIVED' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Entry Title */}
                  {canEdit ? (
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleAutosave((prev) => {
                          const next = [...prev.entries];
                          next[entryIdx] = { ...next[entryIdx], title: val };
                          return { ...prev, entries: next };
                        });
                      }}
                      className="entry-title editable-field bg-transparent w-full"
                    />
                  ) : (
                    <h2 className="entry-title">{entry.title}</h2>
                  )}

                  {/* Americanah Tag */}
                  {entry.americanah && (
                    <div className="americanah-wrapper">
                      <button
                        type="button"
                        className="americanah-pill"
                        aria-expanded={Boolean(expandedAmericanah[entry.id])}
                        onClick={() =>
                          setExpandedAmericanah((p) => ({
                            ...p,
                            [entry.id]: !p[entry.id],
                          }))
                        }
                      >
                        <span>Americanah</span>
                        <span className="americanah-pill-icon" aria-hidden="true">
                          +
                        </span>
                      </button>

                      {(expandedAmericanah[entry.id] || canEdit) && (
                        <div className="americanah-note-box">
                          <span className="americanah-note-label">Literary connection</span>
                          {canEdit ? (
                            <textarea
                              rows={2}
                              value={entry.americanahNote}
                              onChange={(e) => {
                                const val = e.target.value;
                                scheduleAutosave((prev) => {
                                  const next = [...prev.entries];
                                  next[entryIdx] = {
                                    ...next[entryIdx],
                                    americanahNote: val,
                                  };
                                  return { ...prev, entries: next };
                                });
                              }}
                              className="editable-field bg-transparent w-full text-sm"
                            />
                          ) : (
                            <p>{entry.americanahNote}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Entry Text */}
                  {canEdit ? (
                    <textarea
                      rows={5}
                      placeholder="Entry text (leave empty to show 'Coming soon')..."
                      value={entry.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleAutosave((prev) => {
                          const next = [...prev.entries];
                          next[entryIdx] = { ...next[entryIdx], text: val };
                          return { ...prev, entries: next };
                        });
                      }}
                      className="editable-field bg-transparent w-full p-2 text-base mt-2"
                    />
                  ) : entry.text.trim() ? (
                    <div className={isPoetry ? 'prose prose-poetry' : 'prose'}>
                      {entry.text
                        .trim()
                        .split(/\n\s*\n/)
                        .map((para, pIdx) => (
                          <p key={pIdx}>{para.trim()}</p>
                        ))}
                    </div>
                  ) : (
                    <p className="coming-soon">Coming soon</p>
                  )}

                  {/* Photos or 3 Plane Window Placeholders for Photo Essay */}
                  {entry.photos && entry.photos.length > 0 ? (
                    <div className="entry-photos">
                      {entry.photos.map((photo, pIdx) => (
                        <figure key={pIdx} className="photo-figure">
                          <ResolvedImage
                            src={photo.src}
                            alt={photo.alt || entry.title}
                          />
                          {(photo.caption || canEdit) && (
                            <figcaption className="photo-caption flex items-center justify-between gap-2">
                              {canEdit ? (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Caption..."
                                    value={photo.caption}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      scheduleAutosave((prev) => {
                                        const next = [...prev.entries];
                                        const photosCopy = [...next[entryIdx].photos];
                                        photosCopy[pIdx] = {
                                          ...photosCopy[pIdx],
                                          caption: val,
                                        };
                                        next[entryIdx] = {
                                          ...next[entryIdx],
                                          photos: photosCopy,
                                        };
                                        return { ...prev, entries: next };
                                      });
                                    }}
                                    className="editable-field bg-transparent w-full"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      scheduleAutosave((prev) => {
                                        const next = [...prev.entries];
                                        const photosCopy = next[entryIdx].photos.filter(
                                          (_, idx) => idx !== pIdx
                                        );
                                        next[entryIdx] = {
                                          ...next[entryIdx],
                                          photos: photosCopy,
                                        };
                                        return { ...prev, entries: next };
                                      })
                                    }
                                    className="text-[#E4572E] shrink-0 cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </>
                              ) : (
                                photo.caption
                              )}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  ) : isPhotoEssay ? (
                    <div className="window-placeholders-grid">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="window-placeholder-frame">
                          <div className="window-placeholder-inner">
                            <span className="window-placeholder-label">Window 0{n}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {canEdit && (
                    <div className="mt-3 font-mono text-xs flex flex-wrap items-center gap-3">
                      <label className="px-3 py-1 border border-[#D4CFC3] rounded bg-[#E7E3DA] cursor-pointer hover:border-[#101B2B]">
                        {uploadingTarget === entry.id
                          ? 'Compressing & uploading...'
                          : '+ Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            handlePhotoUpload(f, entry.id, (refStr) => {
                              scheduleAutosave((prev) => {
                                const next = [...prev.entries];
                                next[entryIdx] = {
                                  ...next[entryIdx],
                                  photos: [
                                    ...(next[entryIdx].photos || []),
                                    { src: refStr, alt: entry.title, caption: '' },
                                  ],
                                };
                                return { ...prev, entries: next };
                              });
                            });
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Video Post or Pasted Video URL */}
                  {(Boolean(entry.videoUrl?.trim()) || isVideoPost || canEdit) && (
                    <div className="entry-video">
                      {canEdit && (
                        <input
                          type="url"
                          placeholder="Paste YouTube embed URL (e.g. https://www.youtube.com/embed/...)"
                          value={entry.videoUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            scheduleAutosave((prev) => {
                              const next = [...prev.entries];
                              next[entryIdx] = { ...next[entryIdx], videoUrl: val };
                              return { ...prev, entries: next };
                            });
                          }}
                          className="editable-field bg-transparent w-full font-mono text-xs p-1.5 mb-2"
                        />
                      )}
                      {(Boolean(entry.videoUrl?.trim()) || isVideoPost) && (
                        <div className="video-aspect-box">
                          {entry.videoUrl?.trim() ? (
                            <iframe
                              src={entry.videoUrl.trim()}
                              title={entry.title}
                              loading="lazy"
                              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <span className="video-placeholder-text">
                              Video coming soon
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio Player (Pasted link) */}
                  {(Boolean(entry.audioUrl?.trim()) || canEdit) && (
                    <div className="mt-3">
                      {canEdit && (
                        <input
                          type="url"
                          placeholder="Paste audio URL (optional)..."
                          value={entry.audioUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            scheduleAutosave((prev) => {
                              const next = [...prev.entries];
                              next[entryIdx] = { ...next[entryIdx], audioUrl: val };
                              return { ...prev, entries: next };
                            });
                          }}
                          className="editable-field bg-transparent w-full font-mono text-xs p-1.5 mb-2"
                        />
                      )}
                      {entry.audioUrl?.trim() && (
                        <div className="entry-audio">
                          <audio controls preload="metadata" src={entry.audioUrl.trim()} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Q&A Interview Section */}
                  {((entry.qa && entry.qa.length > 0) || canEdit) && (
                    <div className="entry-qa">
                      {entry.qa?.map((qaItem, qIdx) => (
                        <div key={qIdx} className="qa-item">
                          {canEdit ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Question..."
                                value={qaItem.q}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  scheduleAutosave((prev) => {
                                    const next = [...prev.entries];
                                    const qaCopy = [...next[entryIdx].qa];
                                    qaCopy[qIdx] = { ...qaCopy[qIdx], q: val };
                                    next[entryIdx] = { ...next[entryIdx], qa: qaCopy };
                                    return { ...prev, entries: next };
                                  });
                                }}
                                className="qa-question editable-field bg-transparent w-full"
                              />
                              <textarea
                                rows={2}
                                placeholder="Answer..."
                                value={qaItem.a}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  scheduleAutosave((prev) => {
                                    const next = [...prev.entries];
                                    const qaCopy = [...next[entryIdx].qa];
                                    qaCopy[qIdx] = { ...qaCopy[qIdx], a: val };
                                    next[entryIdx] = { ...next[entryIdx], qa: qaCopy };
                                    return { ...prev, entries: next };
                                  });
                                }}
                                className="qa-answer editable-field bg-transparent w-full"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  scheduleAutosave((prev) => {
                                    const next = [...prev.entries];
                                    next[entryIdx] = {
                                      ...next[entryIdx],
                                      qa: next[entryIdx].qa.filter((_, i) => i !== qIdx),
                                    };
                                    return { ...prev, entries: next };
                                  })
                                }
                                className="font-mono text-xs text-[#E4572E] underline cursor-pointer"
                              >
                                Remove Q&A pair
                              </button>
                            </div>
                          ) : (
                            <>
                              {qaItem.q && <p className="qa-question">{qaItem.q}</p>}
                              {qaItem.a && <p className="qa-answer">{qaItem.a}</p>}
                            </>
                          )}
                        </div>
                      ))}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() =>
                            scheduleAutosave((prev) => {
                              const next = [...prev.entries];
                              next[entryIdx] = {
                                ...next[entryIdx],
                                qa: [...(next[entryIdx].qa || []), { q: '', a: '' }],
                              };
                              return { ...prev, entries: next };
                            })
                          }
                          className="font-mono text-xs px-3 py-1 border border-[#D4CFC3] rounded bg-[#E7E3DA] self-start cursor-pointer"
                        >
                          + Add Q&A Question
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* ================================================================
              CABIN TIPS SECTION (Editable in Owner Mode)
              ================================================================ */}
          <section className="tips-section reveal" aria-labelledby="tips-heading">
            <h2 className="section-heading" id="tips-heading">
              Safety Card & Notes for Transit
            </h2>
            <div className="signal-rule" aria-hidden="true" />
            <ol className="space-y-3 font-sans text-base list-decimal list-inside">
              {data.tips.map((tip, idx) => (
                <li key={idx} className="py-1 border-b border-[#D4CFC3]/60">
                  {canEdit ? (
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleAutosave((prev) => {
                          const nextTips = [...prev.tips];
                          nextTips[idx] = val;
                          return { ...prev, tips: nextTips };
                        });
                      }}
                      className="editable-field bg-transparent w-[90%]"
                    />
                  ) : (
                    <span>{tip}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* ================================================================
              AUTHOR SECTION & 5 ROUTE PASSPORT STAMPS
              ================================================================ */}
          <section
            className={`author-section reveal ${
              passportVisible ? 'passport-section-visible' : ''
            }`}
            id="author-passport-section"
            aria-labelledby="author-heading"
          >
            <h2 className="section-heading" id="author-heading">
              {data.author.title}
            </h2>
            <div className="signal-rule" aria-hidden="true" />

            <div className="passport-card">
              <div className="passport-top">
                <div className="passport-photo-box">
                  {data.author.photo ? (
                    <ResolvedImage src={data.author.photo} alt="Author portrait" />
                  ) : (
                    <span>PASSPORT PHOTO</span>
                  )}
                </div>

                <div>
                  <div className="font-mono text-xs text-[#5B6677] uppercase tracking-wider mb-1">
                    PASSENGER MANIFEST · FLIGHT WS 009
                  </div>
                  <div className="font-mono text-sm font-medium text-[#101B2B] mb-2">
                    Nationality: {data.author.nationality || 'Somewhere'}
                  </div>

                  {canEdit ? (
                    <textarea
                      rows={3}
                      placeholder="Author note (leave empty for placeholder)..."
                      value={data.author.note}
                      onChange={(e) =>
                        scheduleAutosave((prev) => ({
                          ...prev,
                          author: { ...prev.author, note: e.target.value },
                        }))
                      }
                      className="editable-field bg-transparent w-full text-sm p-1"
                    />
                  ) : data.author.note.trim() ? (
                    <p className="text-sm text-[#101B2B]">{data.author.note}</p>
                  ) : (
                    <p className="coming-soon">Coming soon</p>
                  )}

                  {canEdit && (
                    <div className="mt-2 font-mono text-xs">
                      <label className="px-2.5 py-1 border border-[#D4CFC3] rounded bg-[#F2EFE9] cursor-pointer">
                        {uploadingTarget === 'author-photo'
                          ? 'Uploading...'
                          : '+ Upload Portrait'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            handlePhotoUpload(f, 'author-photo', (refStr) => {
                              scheduleAutosave((prev) => ({
                                ...prev,
                                author: { ...prev.author, photo: refStr },
                              }));
                            });
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 5 Passport Stamps in Route Order */}
              <div className="passport-stamps-grid" aria-label="Passport entry stamps">
                {route.map((stop, idx) => (
                  <div
                    key={stop.code}
                    className="passport-stamp"
                    style={{ transitionDelay: `${idx * 140}ms` }}
                  >
                    <span className="text-xs font-medium tracking-widest">
                      {stop.code}
                    </span>
                    <span className="text-[11px] uppercase">{stop.country}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ====================================================================
          6. FOOTER ("Landed.", Welcome to Senegal · DSS, Dusk->Night Window,
             Discreet "click me" Baggage Tag, & Discreet "Crew only" Link)
          ==================================================================== */}
      <footer className="site-footer" id="footer" role="contentinfo">
        {/* Focus Mode Selector 2 Target: footer#footer > div:nth-of-type(1) */}
        <div className="footer-inner reveal">
          <h2 className="footer-title">Landed.</h2>
          <p className="footer-welcome">Welcome to Senegal · DSS</p>

          <div
            className="footer-window-outer"
            role="img"
            aria-label="Airplane window at night showing distant city lights on the horizon"
          >
            <div className="footer-window-inner">
              <div className="sky-layer sky-dusk" />
              <div
                className="sky-layer sky-night"
                style={{ opacity: footerNightOpacity }}
              />

              <svg
                className="city-lights-svg"
                viewBox="0 0 200 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 68 Q 100 62 200 68 L 200 100 L 0 100 Z" fill="#070D1F" />
                <circle cx="28" cy="74" r="1.5" fill="#F7C9A0" opacity="0.9" />
                <circle cx="36" cy="75" r="1.2" fill="#E4572E" opacity="0.8" />
                <circle cx="48" cy="72" r="1.6" fill="#F7C9A0" opacity="0.95" />
                <circle cx="55" cy="76" r="1.1" fill="#F7B27A" opacity="0.75" />
                <circle cx="67" cy="73" r="1.5" fill="#F7C9A0" opacity="0.85" />
                <circle cx="74" cy="78" r="1.8" fill="#F7B27A" opacity="0.9" />
                <circle cx="84" cy="74" r="1.2" fill="#FFFFFF" opacity="0.8" />
                <circle cx="92" cy="71" r="1.5" fill="#F7C9A0" opacity="0.95" />
                <circle cx="101" cy="75" r="2.0" fill="#E4572E" opacity="0.85" />
                <circle cx="109" cy="72" r="1.4" fill="#F7C9A0" opacity="0.9" />
                <circle cx="117" cy="77" r="1.6" fill="#F7B27A" opacity="0.8" />
                <circle cx="126" cy="73" r="1.3" fill="#F7C9A0" opacity="0.9" />
                <circle cx="135" cy="75" r="1.7" fill="#FFFFFF" opacity="0.7" />
                <circle cx="144" cy="79" r="1.4" fill="#F7B27A" opacity="0.85" />
                <circle cx="156" cy="74" r="1.5" fill="#F7C9A0" opacity="0.9" />
                <circle cx="168" cy="76" r="1.2" fill="#E4572E" opacity="0.75" />
              </svg>

              <div className="window-breather" aria-hidden="true" />
            </div>
          </div>

          <p className="footer-credit">
            Inspired by Ifemelu&apos;s blog in Americanah by Chimamanda Ngozi Adichie.
          </p>

          {/* Discreet Baggage Tag Button ("click me") */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <button
              type="button"
              className="baggage-tag-btn"
              onClick={() => setEasterModalOpen(true)}
            >
              <span>BAGGAGE TAG · click me</span>
            </button>

            <a href="#top" className="back-to-top">
              Back to top ↑
            </a>
          </div>

          {/* Discreet Crew Only Link */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setCrewModalOpen(true);
              }}
              className="font-mono text-[11px] text-[#5B6677] hover:text-[#101B2B] underline cursor-pointer bg-transparent border-0"
            >
              Crew only
            </button>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          FIXED FLIGHT TRACKER BAR (Visible on all screen sizes)
          ==================================================================== */}
      <div className="flight-tracker-bar" role="region" aria-label="Live flight tracker">
        <div>
          NOW OVER: {nowOverCountry} · {currentFromStop.code} › {currentToStop.code}
        </div>
        <div className="flex items-center gap-4">
          <span>ALT {formattedAltitude} FT</span>
          <span>{Math.round(scrollProgress * 100)}%</span>
        </div>
      </div>

      {/* ====================================================================
          EASTER EGG MODAL ("Hidden in this flight")
          ==================================================================== */}
      {easterModalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-[#101B2B]/60 flex items-center justify-center p-4"
          onClick={() => setEasterModalOpen(false)}
        >
          <div
            ref={easterModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="easter-modal-title"
            className="bg-[#F2EFE9] border border-[#D4CFC3] rounded-md max-w-md w-full p-6 shadow-2xl text-[#101B2B]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between border-b border-[#D4CFC3] pb-3 mb-4">
              <h3 id="easter-modal-title" className="font-serif text-2xl">
                Hidden in this flight
              </h3>
              <span className="font-mono text-xs text-[#5B6677]">
                Found: {foundCount}/3
              </span>
            </div>

            <ol className="space-y-4 text-sm">
              <li className="flex items-center justify-between gap-3 pb-3 border-b border-[#D4CFC3]/60">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>1. The captain</span>
                    {foundEggs.captain && (
                      <span className="text-[#E4572E] font-mono text-xs" aria-label="Found">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6677]">
                    Click the plane in the top bar 3 times.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEasterModalOpen(false);
                    triggerCaptainEasterEgg();
                  }}
                  className="font-mono text-xs px-3 py-1.5 bg-[#101B2B] text-[#F2EFE9] rounded shrink-0 cursor-pointer"
                >
                  Try it
                </button>
              </li>

              <li className="flex items-center justify-between gap-3 pb-3 border-b border-[#D4CFC3]/60">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>2. The window shade</span>
                    {foundEggs.shade && (
                      <span className="text-[#E4572E] font-mono text-xs" aria-label="Found">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6677]">
                    Click the window shade in the hero.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEasterModalOpen(false);
                    triggerShadeEasterEgg(true);
                  }}
                  className="font-mono text-xs px-3 py-1.5 bg-[#101B2B] text-[#F2EFE9] rounded shrink-0 cursor-pointer"
                >
                  Try it
                </button>
              </li>

              <li className="flex items-center justify-between gap-3 pb-2">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>3. Welcome home</span>
                    {foundEggs.home && (
                      <span className="text-[#E4572E] font-mono text-xs" aria-label="Found">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6677]">Type the word home.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEasterModalOpen(false);
                    triggerHomeEasterEgg(true);
                  }}
                  className="font-mono text-xs px-3 py-1.5 bg-[#101B2B] text-[#F2EFE9] rounded shrink-0 cursor-pointer"
                >
                  Try it
                </button>
              </li>
            </ol>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setEasterModalOpen(false)}
                className="font-mono text-xs px-4 py-1.5 border border-[#D4CFC3] rounded hover:bg-[#E7E3DA] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CREW LOGIN MODAL (Google Sign-In Only, No Password)
          ==================================================================== */}
      {crewModalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-[#101B2B]/60 flex items-center justify-center p-4"
          onClick={() => setCrewModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crew-modal-title"
            className="bg-[#F2EFE9] border border-[#D4CFC3] rounded-md max-w-sm w-full p-6 shadow-2xl text-[#101B2B]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="crew-modal-title" className="font-serif text-2xl mb-2">
              Crew Sign-In
            </h3>
            <p className="text-xs text-[#5B6677] mb-4">
              Owner access for editing and live autosave.
            </p>

            {authError && (
              <div
                role="alert"
                className="mb-4 p-2.5 bg-red-100 border border-red-300 text-red-900 font-mono text-xs rounded"
              >
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInWithPopup(auth, googleProvider);
                } catch (err) {
                  setAuthError(
                    err instanceof Error ? err.message : 'Google Sign-In failed.'
                  );
                }
              }}
              className="w-full py-2.5 px-4 bg-[#101B2B] text-[#F2EFE9] font-mono text-xs uppercase tracking-wider rounded hover:bg-[#2F6DB5] transition-colors cursor-pointer"
            >
              Sign in with Google
            </button>

            {currentUser && (
              <div className="mt-3 font-mono text-xs text-[#5B6677] text-center">
                Signed in as {currentUser.email}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCrewModalOpen(false)}
                className="font-mono text-xs px-3 py-1 border border-[#D4CFC3] rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
