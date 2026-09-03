import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipPicker } from "@/components/onboarding/ChipPicker";

import { INDIA_STATES, citiesForState } from "@/lib/india-locations";
import {
  ALL_SKILLS,
  AVAILABILITY_OPTIONS,
  BUSINESS_TYPES,
  DOCUMENT_TYPES,
  LEAD_TIME_OPTIONS,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STEPS,
  PRICING_MODELS,
  QUALIFICATIONS,
  SEGMENTS,
  SERVICES,
  SERVICE_MODES,
  SERVICE_RADIUS_OPTIONS,
  SKILL_LEVELS,
  TECHNICIAN_TYPES,
  WEEK_DAYS,
  WORKSHOP_TOOLS,
  categoriesForSegments,
} from "@/lib/technician-catalog";
import { brandsForCategories } from "@/lib/equipment-brands";

import {
  createCatalogRequest,
  getOnboardingState,
  saveOnboardingStep,
  submitOnboarding,
  uploadOnboardingFile,
} from "@/lib/onboarding.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/register-technician")({
  head: () => ({
    meta: [
      { title: "Technician Onboarding — FixNear India" },
      {
        name: "description",
        content:
          "Complete the 16-step FixNear technician onboarding: skills, equipment, brands, service area, documents and payment details.",
      },
      { property: "og:title", content: "Technician Onboarding — FixNear India" },
      {
        property: "og:description",
        content: "Join FixNear India as a verified technician and receive local repair jobs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterTechnicianPage,
});

type EquipmentPick = { segment: string; category: string; equipment: string };
type Draft = Record<string, any>;

const emptyDraft: Draft = {
  fullName: "",
  phone: "",
  whatsappNumber: "",
  technicianType: "Individual Technician",
  displayName: "",
  headline: "",
  description: "",
  businessName: "",
  experienceYears: "",
  experienceMonths: "0",
  skillLevel: "Intermediate",
  segments: [],
  equipment: [] as EquipmentPick[],
  skills: [],
  brands: [],
  services: [],
  qualifications: [],
  certifications: [],
  serviceAreas: [],
  serviceModes: [],
  availability: { days: [], from: "09:00", to: "18:00", options: [], leadTime: "Same Day" },
  pricing: { model: "Per Visit", visitCharge: "", hourlyRate: "", minCharge: "", notes: "" },
  workshop: { hasWorkshop: false, address: "", tools: [] },
  business: { businessType: "Proprietorship", gstNumber: "", udyam: "", registrationNumber: "" },
  documents: [],
  payment: { accountHolderName: "", accountNumber: "", ifsc: "", upiId: "" },
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function RegisterTechnicianPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const loadState = useServerFn(getOnboardingState);
  const doSave = useServerFn(saveOnboardingStep);
  const doUpload = useServerFn(uploadOnboardingFile);
  const doSubmit = useServerFn(submitOnboarding);
  const doCatalogRequest = useServerFn(createCatalogRequest);

  const { data: state, isLoading } = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: () => loadState(),
    enabled: isAuthenticated,
  });

  const [step, setStep] = useState(1);
  const [equipmentTab, setEquipmentTab] = useState<string | null>(null);
  const [brandTab, setBrandTab] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);


  useEffect(() => {
    if (!state || hydrated) return;
    const saved = (state.draft?.data as Draft) ?? {};
    setDraft({
      ...emptyDraft,
      ...saved,
      fullName: saved.fullName || state.profile?.full_name || "",
      phone: saved.phone || state.profile?.phone || "",
    });
    setStep(state.draft?.current_step ?? 1);
    setHydrated(true);
  }, [state, hydrated]);

  const set = (patch: Draft) => setDraft((prev) => ({ ...prev, ...patch }));
  const setNested = (key: string, patch: Draft) =>
    setDraft((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...patch } }));

  const toggleIn = (key: string, value: string) =>
    setDraft((prev) => {
      const list: string[] = prev[key] ?? [];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const completion = useMemo(() => {
    const checks = [
      !!draft.fullName && !!draft.phone,
      !!draft.technicianType,
      (draft.segments ?? []).length > 0,
      (draft.equipment ?? []).length > 0,
      (draft.brands ?? []).length > 0,
      (draft.services ?? []).length > 0,
      !!draft.experienceYears,
      true,
      (draft.serviceAreas ?? []).length > 0,
      (draft.serviceModes ?? []).length > 0,
      (draft.availability?.days ?? []).length > 0,
      !!draft.pricing?.model,
      !!draft.business?.businessType,
      (draft.documents ?? []).length > 0,
      !!draft.payment?.accountNumber || !!draft.payment?.upiId,
      true,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  const persist = async (nextStep: number) => {
    setSaving(true);
    try {
      await doSave({ data: { currentStep: nextStep, completionPercent: completion, data: draft } });
    } catch (err: any) {
      toast.error(err.message || "Could not save progress");
    } finally {
      setSaving(false);
    }
  };

  const validateStep = (target: number): string[] => {
    const errs: string[] = [];
    const digits = (v: any) => String(v ?? "").replace(/\D/g, "");

    switch (target) {
      case 1: {
        if (String(draft.fullName ?? "").trim().length < 2) errs.push("Enter your full name (at least 2 characters).");
        if (digits(draft.phone).length !== 10) errs.push("Enter a valid 10-digit phone number.");
        if (draft.whatsappNumber && digits(draft.whatsappNumber).length !== 10)
          errs.push("WhatsApp number must be 10 digits.");
        if (!draft.technicianType) errs.push("Select your technician type.");
        break;
      }
      case 2: {
        if (String(draft.displayName ?? "").trim().length < 3) errs.push("Add a public display name (min 3 characters).");
        const years = Number(draft.experienceYears);
        if (draft.experienceYears === "" || Number.isNaN(years) || years < 0 || years > 60)
          errs.push("Total experience must be between 0 and 60 years.");
        const months = draft.experienceMonths === "" || draft.experienceMonths === undefined ? 0 : Number(draft.experienceMonths);
        if (Number.isNaN(months) || months < 0 || months > 11) errs.push("Additional months must be between 0 and 11.");
        if (String(draft.headline ?? "").trim().length < 10) errs.push("Write a headline of at least 10 characters.");
        if (!draft.skillLevel) errs.push("Select your overall skill level.");
        break;
      }
      case 3:
        if ((draft.segments ?? []).length === 0) errs.push("Select at least one service segment.");
        break;
      case 4:
        if ((draft.equipment ?? []).length === 0) errs.push("Select at least one equipment you can repair.");
        if ((draft.skills ?? []).length === 0) errs.push("Select at least one technical skill.");
        break;
      case 5:
        if ((draft.brands ?? []).length === 0) errs.push("Select at least one brand you can service.");
        break;
      case 6:
        if ((draft.services ?? []).length === 0) errs.push("Select at least one service you offer.");
        break;
      case 7:
        (draft.qualifications ?? []).forEach((q: any, i: number) => {
          if (!q?.qualification) errs.push(`Qualification ${i + 1}: select a qualification.`);
          if (q?.year && (Number(q.year) < 1950 || Number(q.year) > new Date().getFullYear()))
            errs.push(`Qualification ${i + 1}: enter a valid year.`);
        });
        break;
      case 8:
        (draft.certifications ?? []).forEach((c: any, i: number) => {
          if (!String(c?.name ?? "").trim()) errs.push(`Certification ${i + 1}: add the certification name.`);
          if (!String(c?.issuingOrganization ?? "").trim())
            errs.push(`Certification ${i + 1}: add the issuing organization.`);
          if (c?.issueDate && c?.expiryDate && c.expiryDate < c.issueDate)
            errs.push(`Certification ${i + 1}: expiry date cannot be before the issue date.`);
        });
        break;
      case 9: {
        const areas = draft.serviceAreas ?? [];
        if (areas.length === 0) errs.push("Add at least one service area.");
        areas.forEach((a: any, i: number) => {
          if (!a?.state) errs.push(`Service area ${i + 1}: select a state.`);
          if (!a?.city) errs.push(`Service area ${i + 1}: select a city.`);
          if (digits(a?.pincode).length !== 6) errs.push(`Service area ${i + 1}: enter a valid 6-digit pincode.`);
        });
        break;
      }
      case 10:
        if ((draft.serviceModes ?? []).length === 0) errs.push("Select at least one service mode.");
        break;
      case 11: {
        if ((draft.availability?.days ?? []).length === 0) errs.push("Select your working days.");
        const from = draft.availability?.from;
        const to = draft.availability?.to;
        if (!from || !to) errs.push("Set both your available from and until times.");
        else if (from >= to) errs.push("Available until must be later than available from.");
        if (!draft.availability?.leadTime) errs.push("Select your typical response time.");
        break;
      }
      case 12: {
        if (!draft.pricing?.model) errs.push("Select a pricing model.");
        const nums: [string, any][] = [
          ["Visit charge", draft.pricing?.visitCharge],
          ["Hourly rate", draft.pricing?.hourlyRate],
          ["Minimum charge", draft.pricing?.minCharge],
        ];
        nums.forEach(([label, value]) => {
          if (value !== "" && value !== undefined && value !== null && (Number.isNaN(Number(value)) || Number(value) < 0))
            errs.push(`${label} must be a positive amount.`);
        });
        if (!draft.pricing?.visitCharge && !draft.pricing?.hourlyRate && !draft.pricing?.minCharge)
          errs.push("Add at least one charge (visit, hourly or minimum).");
        break;
      }
      case 13: {
        if (!draft.business?.businessType) errs.push("Select your business type.");
        if (draft.workshop?.hasWorkshop && String(draft.workshop?.address ?? "").trim().length < 10)
          errs.push("Add your workshop address (at least 10 characters).");
        const gst = String(draft.business?.gstNumber ?? "").trim();
        if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(gst))
          errs.push("GST number format looks invalid.");
        break;
      }
      case 14: {
        const docs = draft.documents ?? [];
        if (docs.length === 0) errs.push("Add at least one verification document.");
        docs.forEach((d: any, i: number) => {
          if (!d?.documentType) errs.push(`Document ${i + 1}: select the document type.`);
          if (!d?.filePath) errs.push(`Document ${i + 1}: upload the file (or remove the row).`);
        });
        break;
      }
      case 15: {
        const upi = String(draft.payment?.upiId ?? "").trim();
        const account = digits(draft.payment?.accountNumber);
        const ifsc = String(draft.payment?.ifsc ?? "").trim();
        if (!upi && !account) errs.push("Provide either a UPI ID or a bank account number.");
        if (upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi)) errs.push("Enter a valid UPI ID (e.g. name@bank).");
        if (account) {
          if (account.length < 9 || account.length > 18) errs.push("Account number must be 9–18 digits.");
          if (!String(draft.payment?.accountHolderName ?? "").trim())
            errs.push("Add the account holder name.");
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) errs.push("Enter a valid IFSC code (e.g. HDFC0001234).");
        }
        break;
      }
      default:
        break;
    }
    return errs;
  };

  const goNext = async () => {
    const errs = validateStep(step);
    if (errs.length > 0) {
      setStepErrors(errs);
      toast.error(errs[0]!);
      return;
    }
    setStepErrors([]);
    const next = Math.min(step + 1, 16);
    setStep(next);
    await persist(next);
  };

  const goBack = async () => {
    setStepErrors([]);
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    await persist(prev);
  };


  const handleUpload = async (file: File, kind: string) => {
    const base64 = await fileToBase64(file);
    return doUpload({
      data: { base64, fileName: file.name, contentType: file.type || "application/octet-stream", kind },
    });
  };

  const handleSubmitApplication = async () => {
    for (let s = 1; s <= 15; s += 1) {
      const errs = validateStep(s);
      if (errs.length > 0) {
        setStep(s);
        setStepErrors(errs);
        toast.error(`Step ${s}: ${errs[0]}`);
        return;
      }
    }
    setStepErrors([]);
    const readyDocs = (draft.documents ?? []).filter((d: any) => d?.filePath);
    if (readyDocs.length === 0) {
      toast.error("Add at least one document and wait for the upload to finish");
      setStep(14);
      return;
    }

    const payload = { ...draft, documents: readyDocs };
    setSubmitting(true);
    try {
      await doSave({ data: { currentStep: 16, completionPercent: completion, data: payload } });
      const res: any = await doSubmit({ data: { data: payload } });
      toast.success(
        res?.alreadySubmitted
          ? "Your application is already submitted and under review."
          : "Application submitted — our team will review it shortly.",
      );
      navigate({ to: "/dashboard" });

    } catch (err: any) {
      toast.error(err.message || "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };


  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Join as a technician</h1>
        <p className="mt-3 text-muted-foreground">
          Create an account or sign in first, then complete your technician onboarding.
        </p>
        <Link to="/auth">
          <Button size="lg" className="mt-8">
            Sign in to continue
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !hydrated) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const technicianStatus = state?.technician?.onboarding_status as string | undefined;
  const locked =
    !!technicianStatus &&
    !["draft", "profile_incomplete", "verification_required", "rejected"].includes(technicianStatus);

  if (locked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wrench className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4 text-2xl">
              {ONBOARDING_STATUS_LABELS[technicianStatus!] ?? "Application submitted"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {state?.technician?.is_approved
                ? "Your technician profile is live. You can start accepting nearby repair jobs."
                : "Your application has been received and is being reviewed by our verification team."}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {state?.technician?.review_notes ? (
              <p className="rounded-lg bg-muted p-3 text-sm">{state.technician.review_notes}</p>
            ) : null}
            <Link to={state?.technician?.is_approved ? "/available-jobs" : "/dashboard"}>
              <Button className="w-full">
                {state?.technician?.is_approved ? "View nearby repair jobs" : "Back to dashboard"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const equipmentOptions = categoriesForSegments(draft.segments ?? []);
  const activeEquipmentTab =
    equipmentTab && equipmentOptions.some((o) => `${o.segment.id}||${o.category.name}` === equipmentTab)
      ? equipmentTab
      : equipmentOptions.length > 0
        ? `${equipmentOptions[0]!.segment.id}||${equipmentOptions[0]!.category.name}`
        : null;
  const activeEquipmentCategory =
    equipmentOptions.find(({ segment, category }) => `${segment.id}||${category.name}` === activeEquipmentTab) ?? null;

  const selectedEquipmentCategories: string[] = Array.from(
    new Set((draft.equipment ?? []).map((p: EquipmentPick) => String(p.category))),
  );
  const brandGroups = brandsForCategories(selectedEquipmentCategories);
  const activeBrandTab =
    brandTab && brandGroups.some((g) => g.category === brandTab)
      ? brandTab
      : (brandGroups[0]?.category ?? null);
  const activeBrandGroup = brandGroups.find((g) => g.category === activeBrandTab) ?? null;


  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        {technicianStatus === "verification_required" && state?.technician?.review_notes ? (
          <div className="mb-6 rounded-xl border border-border bg-muted p-4 text-sm">
            <p className="font-medium">Changes requested by our review team</p>
            <p className="mt-1 text-muted-foreground">{state.technician.review_notes}</p>
          </div>
        ) : null}

        <div className="mb-6">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">
              Step {step} of 16 {saving ? "• saving…" : ""}
            </p>
            <p className="text-sm font-medium">{completion}% complete</p>
          </div>
          <Progress value={(step / 16) * 100} className="mt-2" />
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{ONBOARDING_STEPS[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {stepErrors.length > 0 && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
                  <p className="font-medium text-destructive">Please fix the following before continuing</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive">
                    {stepErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input value={draft.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Rahul Sharma" />
                  </Field>
                  <Field label="Phone">
                    <Input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="9876543210" />
                  </Field>
                  <Field label="WhatsApp number (optional)">
                    <Input value={draft.whatsappNumber} onChange={(e) => set({ whatsappNumber: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input value={state?.email ?? ""} readOnly disabled />
                  </Field>
                  <Field label="Technician type" className="sm:col-span-2">
                    <Choice
                      value={draft.technicianType}
                      options={[...TECHNICIAN_TYPES]}
                      onChange={(v) => set({ technicianType: v })}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Public display name">
                      <Input value={draft.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder="Rahul — AC & Refrigeration" />
                    </Field>
                    <Field label="Business / shop name (optional)">
                      <Input value={draft.businessName} onChange={(e) => set({ businessName: e.target.value })} />
                    </Field>
                    <Field label="Total experience (years)">
                      <Input type="number" min={0} max={60} value={draft.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} />
                    </Field>
                    <Field label="Additional months">
                      <Input type="number" min={0} max={11} value={draft.experienceMonths} onChange={(e) => set({ experienceMonths: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Headline">
                    <Input value={draft.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Inverter AC specialist with 8 years of field experience" />
                  </Field>
                  <Field label="About your work">
                    <Textarea rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
                  </Field>
                  <Field label="Overall skill level">
                    <Choice value={draft.skillLevel} options={[...SKILL_LEVELS]} onChange={(v) => set({ skillLevel: v })} />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Pick every segment you work in. Equipment options depend on this.</p>
                  {SEGMENTS.map((segment) => {
                    const active = (draft.segments ?? []).includes(segment.id);
                    return (
                      <button
                        key={segment.id}
                        type="button"
                        onClick={() => toggleIn("segments", segment.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                          active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                        }`}
                      >
                        <span>
                          <span className="font-medium">{segment.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {segment.categories.length} categories
                          </span>
                        </span>
                        {active && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  {equipmentOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Select a service segment first.</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Choose a category to see its equipment</p>
                        <div className="flex flex-wrap gap-1.5">
                          {equipmentOptions.map(({ segment, category }) => {
                            const key = `${segment.id}||${category.name}`;
                            const count = (draft.equipment ?? []).filter(
                              (p: EquipmentPick) => p.segment === segment.id && p.category === category.name,
                            ).length;
                            const active = key === activeEquipmentTab;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setEquipmentTab(key)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:bg-muted"
                                }`}
                              >
                                {category.name}
                                {count > 0 && (
                                  <span
                                    className={`rounded-full px-1.5 text-[10px] ${
                                      active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {activeEquipmentCategory ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            {activeEquipmentCategory.segment.label} • {activeEquipmentCategory.category.name}
                          </p>
                          <ChipPicker
                            options={activeEquipmentCategory.category.equipment}
                            selected={(draft.equipment ?? [])
                              .filter(
                                (p: EquipmentPick) =>
                                  p.segment === activeEquipmentCategory.segment.id &&
                                  p.category === activeEquipmentCategory.category.name,
                              )
                              .map((p: EquipmentPick) => p.equipment)}
                            placeholder={`Search ${activeEquipmentCategory.category.name} equipment…`}
                            onToggle={(equipment) =>
                              setDraft((prev) => {
                                const segmentId = activeEquipmentCategory.segment.id;
                                const categoryName = activeEquipmentCategory.category.name;
                                const list: EquipmentPick[] = prev.equipment ?? [];
                                const exists = list.some(
                                  (p) =>
                                    p.segment === segmentId && p.category === categoryName && p.equipment === equipment,
                                );
                                return {
                                  ...prev,
                                  equipment: exists
                                    ? list.filter(
                                        (p) =>
                                          !(
                                            p.segment === segmentId &&
                                            p.category === categoryName &&
                                            p.equipment === equipment
                                          ),
                                      )
                                    : [...list, { segment: segmentId, category: categoryName, equipment }],
                                };
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Technical skills</p>
                    <ChipPicker
                      options={ALL_SKILLS}
                      selected={draft.skills ?? []}
                      placeholder="Search skills…"
                      onToggle={(v) => toggleIn("skills", v)}
                    />
                  </div>

                  <MissingItem kind="equipment" onSubmit={doCatalogRequest} />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  {brandGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Select your equipment in the previous step to see the brands that make it.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Brands are matched to the equipment you selected. Pick the ones you can confidently service.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {brandGroups.map((group) => {
                          const active = group.category === activeBrandTab;
                          const count = (draft.brands ?? []).filter((b: string) => group.brands.includes(b)).length;
                          return (
                            <button
                              key={group.category}
                              type="button"
                              onClick={() => setBrandTab(group.category)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:bg-muted"
                              }`}
                            >
                              {group.category}
                              {count > 0 && (
                                <span
                                  className={`rounded-full px-1.5 text-[10px] ${
                                    active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {activeBrandGroup ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{activeBrandGroup.category} brands</p>
                          <ChipPicker
                            options={activeBrandGroup.brands}
                            selected={(draft.brands ?? []).filter((b: string) => activeBrandGroup.brands.includes(b))}
                            placeholder={`Search ${activeBrandGroup.category} brands…`}
                            onToggle={(v) => toggleIn("brands", v)}
                          />
                        </div>
                      ) : null}

                      {(draft.brands ?? []).length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {(draft.brands ?? []).length} brand(s) selected in total.
                        </p>
                      )}
                    </>
                  )}
                  <MissingItem kind="brand" onSubmit={doCatalogRequest} />
                </div>
              )}


              {step === 6 && (
                <ChipPicker
                  options={SERVICES}
                  selected={draft.services ?? []}
                  placeholder="Search services…"
                  suggested={POPULAR_SERVICES}
                  suggestedLabel="Most offered services"
                  onSelectMany={(values) => addMany("services", values)}
                  onClear={() => set({ services: [] })}
                  onCustomAdd={(name) => requestCatalog("service", name)}
                  onToggle={(v) => toggleIn("services", v)}
                />
              )}


              {step === 7 && (
                <RowEditor
                  items={draft.qualifications ?? []}
                  onChange={(items) => set({ qualifications: items })}
                  addLabel="Add qualification"
                  empty={{ qualification: QUALIFICATIONS[0], institute: "", year: "" }}
                  render={(item, update) => (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Choice value={item.qualification} options={QUALIFICATIONS} onChange={(v) => update({ qualification: v })} />
                      <Input placeholder="Institute" value={item.institute} onChange={(e) => update({ institute: e.target.value })} />
                      <Input placeholder="Year" type="number" value={item.year} onChange={(e) => update({ year: e.target.value })} />
                    </div>
                  )}
                />
              )}

              {step === 8 && (
                <RowEditor
                  items={draft.certifications ?? []}
                  onChange={(items) => set({ certifications: items })}
                  addLabel="Add certification"
                  empty={{ name: "", issuingOrganization: "", certificateNumber: "", issueDate: "", expiryDate: "", filePath: "" }}
                  render={(item, update) => (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="Certification name" value={item.name} onChange={(e) => update({ name: e.target.value })} />
                      <Input placeholder="Issuing organization" value={item.issuingOrganization} onChange={(e) => update({ issuingOrganization: e.target.value })} />
                      <Input placeholder="Certificate number" value={item.certificateNumber} onChange={(e) => update({ certificateNumber: e.target.value })} />
                      <div className="grid grid-cols-2 gap-3">
                        <Input type="date" value={item.issueDate} onChange={(e) => update({ issueDate: e.target.value })} />
                        <Input type="date" value={item.expiryDate} onChange={(e) => update({ expiryDate: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const res = await handleUpload(file, "certificate");
                              update({ filePath: res.path });
                              toast.success("Certificate uploaded");
                            } catch (err: any) {
                              toast.error(err.message || "Upload failed");
                            }
                          }}
                        />
                        {item.filePath ? <p className="mt-1 text-xs text-muted-foreground">Uploaded ✓</p> : null}
                      </div>
                    </div>
                  )}
                />
              )}

              {step === 9 && (
                <RowEditor
                  items={draft.serviceAreas ?? []}
                  onChange={(items) => set({ serviceAreas: items })}
                  addLabel="Add service area"
                  empty={{ state: "", city: "", district: "", pincode: "", locality: "", radiusKm: 10, panIndia: false }}
                  render={(item, update) => (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Choice
                        value={item.state}
                        options={INDIA_STATES}
                        placeholder="Select state"
                        onChange={(v) => update({ state: v, city: "" })}
                      />
                      <Choice
                        value={item.city}
                        options={citiesForState(item.state)}
                        placeholder={item.state ? "Select city" : "Select a state first"}
                        onChange={(v) => update({ city: v })}
                      />
                      <Input placeholder="District (optional)" value={item.district} onChange={(e) => update({ district: e.target.value })} />
                      <Input placeholder="Pincode" value={item.pincode} onChange={(e) => update({ pincode: e.target.value })} />
                      <Input placeholder="Locality (optional)" value={item.locality} onChange={(e) => update({ locality: e.target.value })} />
                      <Choice
                        value={String(item.radiusKm)}
                        options={SERVICE_RADIUS_OPTIONS.map((r) => String(r))}
                        onChange={(v) => update({ radiusKm: Number(v) })}
                      />
                      <label className="flex items-center gap-2 text-sm sm:col-span-2">
                        <Switch checked={!!item.panIndia} onCheckedChange={(v) => update({ panIndia: v })} />
                        Available pan-India for this expertise
                      </label>
                    </div>
                  )}
                />
              )}

              {step === 10 && (
                <div className="space-y-2">
                  {SERVICE_MODES.map((mode) => (
                    <label key={mode} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                      <Checkbox
                        checked={(draft.serviceModes ?? []).includes(mode)}
                        onCheckedChange={() => toggleIn("serviceModes", mode)}
                      />
                      {mode}
                    </label>
                  ))}
                </div>
              )}

              {step === 11 && (
                <div className="space-y-5">
                  <Field label="Working days">
                    <div className="flex flex-wrap gap-2">
                      {WEEK_DAYS.map((day) => {
                        const active = (draft.availability?.days ?? []).includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              setNested("availability", {
                                days: active
                                  ? (draft.availability?.days ?? []).filter((d: string) => d !== day)
                                  : [...(draft.availability?.days ?? []), day],
                              })
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Available from">
                      <Input type="time" value={draft.availability?.from ?? ""} onChange={(e) => setNested("availability", { from: e.target.value })} />
                    </Field>
                    <Field label="Available until">
                      <Input type="time" value={draft.availability?.to ?? ""} onChange={(e) => setNested("availability", { to: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Service options">
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_OPTIONS.map((option) => {
                        const active = (draft.availability?.options ?? []).includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setNested("availability", {
                                options: active
                                  ? (draft.availability?.options ?? []).filter((o: string) => o !== option)
                                  : [...(draft.availability?.options ?? []), option],
                              })
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Typical response time">
                    <Choice
                      value={draft.availability?.leadTime}
                      options={[...LEAD_TIME_OPTIONS]}
                      onChange={(v) => setNested("availability", { leadTime: v })}
                    />
                  </Field>
                </div>
              )}

              {step === 12 && (
                <div className="space-y-4">
                  <Field label="Pricing model">
                    <Choice value={draft.pricing?.model} options={[...PRICING_MODELS]} onChange={(v) => setNested("pricing", { model: v })} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Visit charge (₹)">
                      <Input type="number" min={0} value={draft.pricing?.visitCharge ?? ""} onChange={(e) => setNested("pricing", { visitCharge: e.target.value })} />
                    </Field>
                    <Field label="Hourly rate (₹)">
                      <Input type="number" min={0} value={draft.pricing?.hourlyRate ?? ""} onChange={(e) => setNested("pricing", { hourlyRate: e.target.value })} />
                    </Field>
                    <Field label="Minimum charge (₹)">
                      <Input type="number" min={0} value={draft.pricing?.minCharge ?? ""} onChange={(e) => setNested("pricing", { minCharge: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Pricing notes">
                    <Textarea rows={3} value={draft.pricing?.notes ?? ""} onChange={(e) => setNested("pricing", { notes: e.target.value })} />
                  </Field>
                </div>
              )}

              {step === 13 && (
                <div className="space-y-5">
                  <label className="flex items-center gap-3 text-sm">
                    <Switch checked={!!draft.workshop?.hasWorkshop} onCheckedChange={(v) => setNested("workshop", { hasWorkshop: v })} />
                    I have a workshop / service centre
                  </label>
                  {draft.workshop?.hasWorkshop ? (
                    <>
                      <Field label="Workshop address">
                        <Textarea rows={3} value={draft.workshop?.address ?? ""} onChange={(e) => setNested("workshop", { address: e.target.value })} />
                      </Field>
                      <Field label="Tools & equipment available">
                        <div className="flex flex-wrap gap-2">
                          {WORKSHOP_TOOLS.map((tool) => {
                            const active = (draft.workshop?.tools ?? []).includes(tool);
                            return (
                              <button
                                key={tool}
                                type="button"
                                onClick={() =>
                                  setNested("workshop", {
                                    tools: active
                                      ? (draft.workshop?.tools ?? []).filter((t: string) => t !== tool)
                                      : [...(draft.workshop?.tools ?? []), tool],
                                  })
                                }
                                className={`rounded-full border px-3 py-1.5 text-xs ${
                                  active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                                }`}
                              >
                                {tool}
                              </button>
                            );
                          })}
                        </div>
                      </Field>
                    </>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Business type">
                      <Choice value={draft.business?.businessType} options={[...BUSINESS_TYPES]} onChange={(v) => setNested("business", { businessType: v })} />
                    </Field>
                    <Field label="GST number (optional)">
                      <Input value={draft.business?.gstNumber ?? ""} onChange={(e) => setNested("business", { gstNumber: e.target.value.toUpperCase() })} />
                    </Field>
                    <Field label="Udyam number (optional)">
                      <Input value={draft.business?.udyam ?? ""} onChange={(e) => setNested("business", { udyam: e.target.value })} />
                    </Field>
                    <Field label="Registration number (optional)">
                      <Input value={draft.business?.registrationNumber ?? ""} onChange={(e) => setNested("business", { registrationNumber: e.target.value })} />
                    </Field>
                  </div>
                </div>
              )}

              {step === 14 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Documents are stored privately and only visible to you and our verification team. Government ID and
                    PAN are mandatory for verification.
                  </p>
                  <RowEditor
                    items={draft.documents ?? []}
                    onChange={(items) => set({ documents: items })}
                    addLabel="Add document"
                    empty={{ documentType: DOCUMENT_TYPES[0], filePath: "", fileName: "" }}
                    render={(item, update) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Choice value={item.documentType} options={DOCUMENT_TYPES} onChange={(v) => update({ documentType: v })} />
                        <div>
                          <Input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await handleUpload(file, item.documentType || "document");
                                update({ filePath: res.path, fileName: res.fileName });
                                toast.success("Document uploaded");
                              } catch (err: any) {
                                toast.error(err.message || "Upload failed");
                              }
                            }}
                          />
                          {item.filePath ? <p className="mt-1 text-xs text-muted-foreground">{item.fileName} ✓</p> : null}
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {step === 15 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Payment details are private and used only to settle your completed jobs.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Account holder name">
                      <Input value={draft.payment?.accountHolderName ?? ""} onChange={(e) => setNested("payment", { accountHolderName: e.target.value })} />
                    </Field>
                    <Field label="Account number">
                      <Input value={draft.payment?.accountNumber ?? ""} onChange={(e) => setNested("payment", { accountNumber: e.target.value })} />
                    </Field>
                    <Field label="IFSC code">
                      <Input value={draft.payment?.ifsc ?? ""} onChange={(e) => setNested("payment", { ifsc: e.target.value.toUpperCase() })} />
                    </Field>
                    <Field label="UPI ID">
                      <Input value={draft.payment?.upiId ?? ""} onChange={(e) => setNested("payment", { upiId: e.target.value })} />
                    </Field>
                  </div>
                </div>
              )}

              {step === 16 && (
                <div className="space-y-4">
                  <Review label="Name" value={draft.fullName} onEdit={() => setStep(1)} />
                  <Review label="Phone" value={draft.phone} onEdit={() => setStep(1)} />
                  <Review label="Technician type" value={draft.technicianType} onEdit={() => setStep(1)} />
                  <Review label="Experience" value={`${draft.experienceYears || 0} years`} onEdit={() => setStep(2)} />
                  <Review
                    label="Segments"
                    value={(draft.segments ?? []).map((s: string) => SEGMENTS.find((x) => x.id === s)?.label ?? s).join(", ")}
                    onEdit={() => setStep(3)}
                  />
                  <Review label="Equipment" value={`${(draft.equipment ?? []).length} items`} onEdit={() => setStep(4)} />
                  <Review label="Skills" value={`${(draft.skills ?? []).length} selected`} onEdit={() => setStep(4)} />
                  <Review label="Brands" value={`${(draft.brands ?? []).length} selected`} onEdit={() => setStep(5)} />
                  <Review label="Services" value={(draft.services ?? []).join(", ")} onEdit={() => setStep(6)} />
                  <Review label="Qualifications" value={`${(draft.qualifications ?? []).length} added`} onEdit={() => setStep(7)} />
                  <Review label="Certifications" value={`${(draft.certifications ?? []).length} added`} onEdit={() => setStep(8)} />
                  <Review
                    label="Service areas"
                    value={(draft.serviceAreas ?? []).map((a: any) => `${a.city}, ${a.state}`).join(" • ")}
                    onEdit={() => setStep(9)}
                  />
                  <Review label="Service modes" value={(draft.serviceModes ?? []).join(", ")} onEdit={() => setStep(10)} />
                  <Review label="Availability" value={(draft.availability?.days ?? []).join(", ")} onEdit={() => setStep(11)} />
                  <Review label="Pricing" value={draft.pricing?.model} onEdit={() => setStep(12)} />
                  <Review label="Business" value={draft.business?.businessType} onEdit={() => setStep(13)} />
                  <Review label="Documents" value={`${(draft.documents ?? []).length} uploaded`} onEdit={() => setStep(14)} />
                  <Review
                    label="Payment"
                    value={draft.payment?.upiId || draft.payment?.accountNumber ? "Provided" : "Not provided"}
                    onEdit={() => setStep(15)}
                  />

                  <Button className="w-full" size="lg" disabled={submitting} onClick={handleSubmitApplication}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit application for verification
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-5">
                <Button variant="outline" onClick={goBack} disabled={step === 1}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => persist(step)} disabled={saving}>
                    Save & finish later
                  </Button>
                  {step < 16 ? (
                    <Button onClick={goNext}>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Choice({
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  value?: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RowEditor({
  items,
  onChange,
  render,
  empty,
  addLabel,
}: {
  items: any[];
  onChange: (items: any[]) => void;
  render: (item: any, update: (patch: any) => void) => React.ReactNode;
  empty: any;
  addLabel: string;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-border p-4">
          {render(item, (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))))}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-destructive"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={() => onChange([...items, { ...empty }])}>
        <Plus className="mr-2 h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}

function Review({ label, value, onEdit }: { label: string; value?: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{value || "—"}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

function MissingItem({
  kind,
  onSubmit,
}: {
  kind: "equipment" | "brand" | "skill" | "service" | "category";
  onSubmit: (args: { data: any }) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Can&apos;t find your {kind}? Request it
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
      <p className="text-sm font-medium">Request a new {kind}</p>
      <Input placeholder={`${kind} name`} value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea rows={2} placeholder="Details (model number, maker, etc.)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy || name.trim().length < 2}
          onClick={async () => {
            setBusy(true);
            try {
              await onSubmit({ data: { kind, name: name.trim(), description } });
              toast.success("Request sent to our catalog team");
              setOpen(false);
              setName("");
              setDescription("");
            } catch (err: any) {
              toast.error(err.message || "Could not send request");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          Send request
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <Badge variant="outline">Reviewed manually within 48 hours</Badge>
    </div>
  );
}
