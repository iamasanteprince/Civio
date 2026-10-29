import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ChevronDown, CloudUpload, FileDown, Plus, Trash2, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CivioUser } from '@/types';
import { APPLYBOARD_PARTNER_URL } from '@/data/applyBoard';

const STORAGE_KEY = 'civiohub-resume-draft-v1';
const CLOUD_TITLE = 'My Academic CV';
const SIGN_IN_PROMPT = 'Create an account or sign in to save your CV to the cloud and access it from any device.';
const ENGLISH_SNIPPET =
  'Degree and secondary education conducted entirely in English; satisfies institutional language requirements without IELTS/TOEFL.';

interface Personal {
  fullName: string;
  target: string;
  email: string;
  phone: string;
  location: string;
  link: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
  gpa: string;
  highlights: string;
}

interface Experience {
  id: string;
  role: string;
  organization: string;
  start: string;
  end: string;
  bullets: string;
}

interface Skills {
  languages: string;
  methods: string;
  technical: string;
}

interface Draft {
  personal: Personal;
  education: Education[];
  englishNote: string;
  experience: Experience[];
  skills: Skills;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const emptyEducation = (): Education => ({ id: newId(), institution: '', degree: '', year: '', gpa: '', highlights: '' });
const emptyExperience = (): Experience => ({ id: newId(), role: '', organization: '', start: '', end: '', bullets: '' });

const emptyDraft = (): Draft => ({
  personal: { fullName: '', target: '', email: '', phone: '', location: '', link: '' },
  education: [emptyEducation()],
  englishNote: '',
  experience: [emptyExperience()],
  skills: { languages: '', methods: '', technical: '' },
});

const str = (value: unknown, max = 2000) => (typeof value === 'string' ? value.slice(0, max) : '');

function parseDraft(input: unknown): Draft {
  const base = emptyDraft();
  if (!input || typeof input !== 'object') return base;
  const data = input as Partial<Record<keyof Draft, unknown>>;
  const personal = (data.personal ?? {}) as Record<string, unknown>;
  const skills = (data.skills ?? {}) as Record<string, unknown>;
  const education = Array.isArray(data.education)
    ? data.education.slice(0, 10).map((item: Record<string, unknown>) => ({
        id: str(item?.id, 40) || newId(),
        institution: str(item?.institution, 200),
        degree: str(item?.degree, 200),
        year: str(item?.year, 20),
        gpa: str(item?.gpa, 60),
        highlights: str(item?.highlights),
      }))
    : base.education;
  const experience = Array.isArray(data.experience)
    ? data.experience.slice(0, 15).map((item: Record<string, unknown>) => ({
        id: str(item?.id, 40) || newId(),
        role: str(item?.role, 200),
        organization: str(item?.organization, 200),
        start: str(item?.start, 30),
        end: str(item?.end, 30),
        bullets: str(item?.bullets, 3000),
      }))
    : base.experience;
  return {
    personal: {
      fullName: str(personal.fullName, 120),
      target: str(personal.target, 200),
      email: str(personal.email, 200),
      phone: str(personal.phone, 50),
      location: str(personal.location, 120),
      link: str(personal.link, 300),
    },
    education: education.length ? education : base.education,
    englishNote: str(data.englishNote, 600),
    experience: experience.length ? experience : base.experience,
    skills: {
      languages: str(skills.languages, 500),
      methods: str(skills.methods, 500),
      technical: str(skills.technical, 500),
    },
  };
}

function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseDraft(JSON.parse(raw)) : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-stone-900 focus:ring-0';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-stone-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function Drawer({
  index,
  title,
  open,
  onToggle,
  children,
}: {
  index: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = `resume-panel-${index}`;
  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-xs">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        >
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{index} /</span>
            <span className="font-serif text-base font-semibold text-stone-900">{title}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <div id={panelId} className="space-y-3 border-t border-stone-200 px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}

function lines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[\s•\-–*]+/, '').trim())
    .filter(Boolean);
}

function PreviewSection({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-5 border-t border-stone-200 pt-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {index} / {title}
      </h3>
      {children}
    </section>
  );
}

export default function ResumeBuilder({
  onClose,
  currentUser = null,
  onRequestSignIn,
}: {
  onClose?: () => void;
  currentUser?: CivioUser | null;
  onRequestSignIn?: (message?: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [openSection, setOpenSection] = useState<string | null>('01');
  const [cloudStatus, setCloudStatus] = useState<{ kind: 'saving' | 'saved' | 'error'; message: string } | null>(null);
  const initialDraftRef = useRef(draft);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const userId = currentUser?.id ?? null;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage may be unavailable (private mode or quota); the draft stays in memory.
    }
  }, [draft]);

  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    void supabase
      .from('resumes')
      .select('data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        // Skip if the user already started typing while the request was in flight.
        if (draftRef.current !== initialDraftRef.current) return;
        setDraft(parseDraft(data.data));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (cloudStatus?.kind !== 'saved') return;
    const timer = window.setTimeout(() => setCloudStatus(null), 3000);
    return () => window.clearTimeout(timer);
  }, [cloudStatus]);

  const saveToCloud = async () => {
    if (!userId || !supabase) {
      onRequestSignIn?.(SIGN_IN_PROMPT);
      return;
    }
    setCloudStatus({ kind: 'saving', message: 'Saving…' });
    const { error } = await supabase.from('resumes').upsert(
      {
        user_id: userId,
        title: CLOUD_TITLE,
        data: draftRef.current,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,title' }
    );
    setCloudStatus(error ? { kind: 'error', message: 'Could not save. Your draft is still stored on this device.' } : { kind: 'saved', message: 'Saved to cloud' });
  };

  const toggle = (id: string) => setOpenSection((current) => (current === id ? null : id));

  const setPersonal = (key: keyof Personal, value: string) =>
    setDraft((prev) => ({ ...prev, personal: { ...prev.personal, [key]: value } }));
  const setSkills = (key: keyof Skills, value: string) =>
    setDraft((prev) => ({ ...prev, skills: { ...prev.skills, [key]: value } }));
  const updateEducation = (id: string, key: keyof Education, value: string) =>
    setDraft((prev) => ({
      ...prev,
      education: prev.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  const updateExperience = (id: string, key: keyof Experience, value: string) =>
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));

  const snippetActive = draft.englishNote.includes(ENGLISH_SNIPPET);
  const toggleSnippet = () =>
    setDraft((prev) => {
      if (prev.englishNote.includes(ENGLISH_SNIPPET)) {
        return { ...prev, englishNote: prev.englishNote.replace(ENGLISH_SNIPPET, '').trim() };
      }
      const existing = prev.englishNote.trim();
      return { ...prev, englishNote: existing ? `${existing} ${ENGLISH_SNIPPET}` : ENGLISH_SNIPPET };
    });

  const clearDraft = () => {
    if (window.confirm('Clear all resume fields? This cannot be undone.')) {
      setDraft(emptyDraft());
    }
  };

  const { personal, education, experience, skills, englishNote } = draft;
  const contact = [personal.email, personal.phone, personal.location, personal.link].filter(Boolean);
  const shownEducation = education.filter((e) => e.institution || e.degree || e.year || e.gpa || e.highlights);
  const shownExperience = experience.filter((e) => e.role || e.organization || e.bullets);
  const skillRows = [
    ['Languages', skills.languages],
    ['Research methods', skills.methods],
    ['Technical', skills.technical],
  ].filter(([, value]) => value.trim());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <header className="mb-8 border-b border-stone-200 pb-6 print:hidden">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
          </button>
        )}
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">06 / Academic CV Builder</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
          Build an application-ready academic CV
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Fill in each dossier section and watch the paper preview update. Your draft is saved on this device, so it survives a refresh.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="w-full max-w-xl space-y-3 print:hidden">
          <Drawer index="01" title="Personal Dossier" open={openSection === '01'} onToggle={() => toggle('01')}>
            <Field label="Full name" htmlFor="cv-name">
              <input id="cv-name" className={inputClass} maxLength={120} value={personal.fullName} onChange={(e) => setPersonal('fullName', e.target.value)} placeholder="Ama Mensah" autoComplete="name" />
            </Field>
            <Field label="Target country / program" htmlFor="cv-target">
              <input id="cv-target" className={inputClass} maxLength={200} value={personal.target} onChange={(e) => setPersonal('target', e.target.value)} placeholder="MSc Public Health, Germany" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact email" htmlFor="cv-email">
                <input id="cv-email" type="email" className={inputClass} maxLength={200} value={personal.email} onChange={(e) => setPersonal('email', e.target.value)} autoComplete="email" />
              </Field>
              <Field label="Phone" htmlFor="cv-phone">
                <input id="cv-phone" type="tel" className={inputClass} maxLength={50} value={personal.phone} onChange={(e) => setPersonal('phone', e.target.value)} autoComplete="tel" />
              </Field>
            </div>
            <Field label="Location" htmlFor="cv-location">
              <input id="cv-location" className={inputClass} maxLength={120} value={personal.location} onChange={(e) => setPersonal('location', e.target.value)} placeholder="Accra, Ghana" />
            </Field>
            <Field label="LinkedIn / portfolio" htmlFor="cv-link">
              <input id="cv-link" className={inputClass} maxLength={300} value={personal.link} onChange={(e) => setPersonal('link', e.target.value)} placeholder="linkedin.com/in/yourname" />
            </Field>
          </Drawer>

          <Drawer index="02" title="Academic Qualifications" open={openSection === '02'} onToggle={() => toggle('02')}>
            {education.map((item, i) => (
              <div key={item.id} className="space-y-3 rounded-lg border border-stone-200 bg-[#faf9f6] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">Qualification {i + 1}</span>
                  {education.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove qualification ${i + 1}`}
                      onClick={() => setDraft((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== item.id) }))}
                      className="rounded p-1 text-stone-400 transition-colors hover:text-stone-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Field label="Institution" htmlFor={`cv-edu-inst-${item.id}`}>
                  <input id={`cv-edu-inst-${item.id}`} className={inputClass} maxLength={200} value={item.institution} onChange={(e) => updateEducation(item.id, 'institution', e.target.value)} />
                </Field>
                <Field label="Degree" htmlFor={`cv-edu-degree-${item.id}`}>
                  <input id={`cv-edu-degree-${item.id}`} className={inputClass} maxLength={200} value={item.degree} onChange={(e) => updateEducation(item.id, 'degree', e.target.value)} placeholder="BSc Biochemistry" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Graduation year" htmlFor={`cv-edu-year-${item.id}`}>
                    <input id={`cv-edu-year-${item.id}`} className={inputClass} maxLength={20} value={item.year} onChange={(e) => updateEducation(item.id, 'year', e.target.value)} placeholder="2025" />
                  </Field>
                  <Field label="GPA / classification" htmlFor={`cv-edu-gpa-${item.id}`}>
                    <input id={`cv-edu-gpa-${item.id}`} className={inputClass} maxLength={60} value={item.gpa} onChange={(e) => updateEducation(item.id, 'gpa', e.target.value)} placeholder="First Class (3.8/4.0)" />
                  </Field>
                </div>
                <Field label="Highlights (WASSCE/WAEC results, honours)" htmlFor={`cv-edu-hl-${item.id}`}>
                  <textarea id={`cv-edu-hl-${item.id}`} rows={2} className={inputClass} maxLength={2000} value={item.highlights} onChange={(e) => updateEducation(item.id, 'highlights', e.target.value)} placeholder="WASSCE: A1 in Mathematics, Physics, Chemistry" />
                </Field>
              </div>
            ))}
            {education.length < 10 && (
              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 transition-colors hover:text-stone-900"
              >
                <Plus className="h-3.5 w-3.5" /> Add qualification
              </button>
            )}

            <div className="rounded-lg border border-stone-200 p-3">
              <Field label="English proficiency / medium of instruction note" htmlFor="cv-english">
                <textarea id="cv-english" rows={3} className={inputClass} maxLength={600} value={englishNote} onChange={(e) => setDraft((prev) => ({ ...prev, englishNote: e.target.value }))} />
              </Field>
              <button
                type="button"
                onClick={toggleSnippet}
                aria-pressed={snippetActive}
                className={`mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  snippetActive
                    ? 'border-[#003574] bg-[#003574] text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-stone-900'
                }`}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {snippetActive ? 'English-medium statement added' : 'Insert English-medium statement'}
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
                Only use this if it is true for you, and confirm each institution accepts it in place of IELTS/TOEFL.
              </p>
            </div>
          </Drawer>

          <Drawer index="03" title="Research & Experience" open={openSection === '03'} onToggle={() => toggle('03')}>
            {experience.map((item, i) => (
              <div key={item.id} className="space-y-3 rounded-lg border border-stone-200 bg-[#faf9f6] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">Entry {i + 1}</span>
                  {experience.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove entry ${i + 1}`}
                      onClick={() => setDraft((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== item.id) }))}
                      className="rounded p-1 text-stone-400 transition-colors hover:text-stone-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Field label="Role / project" htmlFor={`cv-exp-role-${item.id}`}>
                  <input id={`cv-exp-role-${item.id}`} className={inputClass} maxLength={200} value={item.role} onChange={(e) => updateExperience(item.id, 'role', e.target.value)} />
                </Field>
                <Field label="Organization" htmlFor={`cv-exp-org-${item.id}`}>
                  <input id={`cv-exp-org-${item.id}`} className={inputClass} maxLength={200} value={item.organization} onChange={(e) => updateExperience(item.id, 'organization', e.target.value)} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Start" htmlFor={`cv-exp-start-${item.id}`}>
                    <input id={`cv-exp-start-${item.id}`} className={inputClass} maxLength={30} value={item.start} onChange={(e) => updateExperience(item.id, 'start', e.target.value)} placeholder="Jan 2024" />
                  </Field>
                  <Field label="End" htmlFor={`cv-exp-end-${item.id}`}>
                    <input id={`cv-exp-end-${item.id}`} className={inputClass} maxLength={30} value={item.end} onChange={(e) => updateExperience(item.id, 'end', e.target.value)} placeholder="Present" />
                  </Field>
                </div>
                <Field label="Achievements (one per line, quantify where possible)" htmlFor={`cv-exp-bullets-${item.id}`}>
                  <textarea id={`cv-exp-bullets-${item.id}`} rows={4} className={inputClass} maxLength={3000} value={item.bullets} onChange={(e) => updateExperience(item.id, 'bullets', e.target.value)} placeholder={'Analysed 400+ survey responses using R\nReduced processing time by 30%'} />
                </Field>
              </div>
            ))}
            {experience.length < 15 && (
              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, experience: [...prev.experience, emptyExperience()] }))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 transition-colors hover:text-stone-900"
              >
                <Plus className="h-3.5 w-3.5" /> Add entry
              </button>
            )}
          </Drawer>

          <Drawer index="04" title="Skills & Regional Equivalencies" open={openSection === '04'} onToggle={() => toggle('04')}>
            <Field label="Language proficiencies" htmlFor="cv-lang">
              <input id="cv-lang" className={inputClass} maxLength={500} value={skills.languages} onChange={(e) => setSkills('languages', e.target.value)} placeholder="English (fluent), Twi (native), French (basic)" />
            </Field>
            <Field label="Research methods" htmlFor="cv-methods">
              <input id="cv-methods" className={inputClass} maxLength={500} value={skills.methods} onChange={(e) => setSkills('methods', e.target.value)} placeholder="Survey design, qualitative interviewing" />
            </Field>
            <Field label="Technical competencies" htmlFor="cv-tech">
              <input id="cv-tech" className={inputClass} maxLength={500} value={skills.technical} onChange={(e) => setSkills('technical', e.target.value)} placeholder="R, SPSS, Excel, LaTeX" />
            </Field>
          </Drawer>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void saveToCloud()}
              disabled={cloudStatus?.kind === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 transition-colors hover:border-stone-900 disabled:opacity-60"
            >
              <CloudUpload className="h-4 w-4" />
              {currentUser ? 'Save Draft' : 'Save to Account'}
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="text-xs font-medium text-stone-500 underline-offset-2 transition-colors hover:text-stone-900 hover:underline"
            >
              Clear draft
            </button>
          </div>
          <div role="status" aria-live="polite" className="min-h-[1rem]">
            {cloudStatus && (
              <p className={`text-xs font-medium ${cloudStatus.kind === 'error' ? 'text-rose-400' : 'text-stone-600'}`}>
                {cloudStatus.message}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between print:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Live preview</p>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#003574] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#002756]"
            >
              <FileDown className="h-4 w-4" /> Export PDF
            </button>
          </div>
          <div className="mb-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center print:hidden">
            <h2 className="text-base font-semibold text-stone-900">Your Academic CV is Ready</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Match your profile with over 1,500 accredited universities worldwide and submit your application with verified fee-waiver support.
            </p>
            <a
              href={APPLYBOARD_PARTNER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 transition shadow-sm"
            >
              Launch University Application Portal →
            </a>
          </div>

          <article id="cv-preview" className="rounded-xl border border-stone-200 bg-white p-6 font-serif text-stone-900 shadow-sm sm:p-8">
            <header className="border-b border-stone-200 pb-4 text-center">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {personal.fullName.trim() || <span className="text-stone-400">Your Name</span>}
              </h2>
              {personal.target.trim() && <p className="mt-1 text-sm italic text-stone-600">{personal.target}</p>}
              {contact.length > 0 && (
                <p className="mt-2 break-words text-xs text-stone-600">{contact.join('  ·  ')}</p>
              )}
            </header>

            {shownEducation.length > 0 && (
              <PreviewSection index="01" title="Education">
                <div className="space-y-3">
                  {shownEducation.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold">{item.degree || item.institution}</p>
                        {item.year && <p className="shrink-0 text-xs text-stone-600">{item.year}</p>}
                      </div>
                      {item.degree && item.institution && <p className="text-sm italic text-stone-700">{item.institution}</p>}
                      {item.gpa && <p className="text-xs text-stone-600">{item.gpa}</p>}
                      {item.highlights.trim() && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-stone-700">{item.highlights}</p>}
                    </div>
                  ))}
                  {englishNote.trim() && <p className="text-xs italic leading-relaxed text-stone-700">{englishNote}</p>}
                </div>
              </PreviewSection>
            )}

            {shownEducation.length === 0 && englishNote.trim() && (
              <PreviewSection index="01" title="Education">
                <p className="text-xs italic leading-relaxed text-stone-700">{englishNote}</p>
              </PreviewSection>
            )}

            {shownExperience.length > 0 && (
              <PreviewSection index="02" title="Experience">
                <div className="space-y-4">
                  {shownExperience.map((item) => {
                    const dates = [item.start, item.end].filter(Boolean).join(' – ');
                    const bullets = lines(item.bullets);
                    return (
                      <div key={item.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold">{item.role || item.organization}</p>
                          {dates && <p className="shrink-0 text-xs text-stone-600">{dates}</p>}
                        </div>
                        {item.role && item.organization && <p className="text-sm italic text-stone-700">{item.organization}</p>}
                        {bullets.length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs leading-relaxed text-stone-700">
                            {bullets.map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </PreviewSection>
            )}

            {skillRows.length > 0 && (
              <PreviewSection index="03" title="Skills">
                <dl className="space-y-1 text-xs leading-relaxed text-stone-700">
                  {skillRows.map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="w-32 shrink-0 font-semibold text-stone-900">{label}</dt>
                      <dd className="min-w-0 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </PreviewSection>
            )}

            {!personal.fullName.trim() && shownEducation.length === 0 && shownExperience.length === 0 && skillRows.length === 0 && !englishNote.trim() && (
              <p className="mt-6 text-center text-sm text-stone-400">Start filling in the sections to see your CV take shape.</p>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
