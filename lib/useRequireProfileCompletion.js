import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasResumeFile(user) {
  const resume = user?.privateMetadata?.resumeFile;
  if (!resume || typeof resume !== "object") return false;
  const dataUrl = sanitizeString(resume.dataUrl);
  const name = sanitizeString(resume.name);
  if (!dataUrl || !name) return false;
  const size = Number(resume.size);
  if (Number.isFinite(size) && size <= 0) {
    return false;
  }
  if (Number.isFinite(size) && size > MAX_RESUME_SIZE_BYTES * 2) {
    // If somehow an oversized resume snuck in, treat as incomplete so they re-upload.
    return false;
  }
  return true;
}

function isJobseekerProfileComplete(user) {
  if (!user) return false;
  const pm = user.publicMetadata || {};
  const hasFlag = Boolean(pm.hasCompletedJobseekerProfile);
  const fullName = sanitizeString(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`);
  const trade = sanitizeString(pm.trade);
  const zip = sanitizeString(pm.zip);
  return Boolean(hasFlag && fullName && trade && zip && hasResumeFile(user));
}

function isEmployerProfileComplete(user) {
  if (!user) return false;
  const pm = user.publicMetadata || {};
  const hasFlag = Boolean(pm.hasCompletedEmployerProfile);
  const companyName = sanitizeString(pm.companyName);
  const companyEmail = sanitizeString(pm.companyContactEmail);
  const website = sanitizeString(pm.companyWebsite);
  const phone = sanitizeString(pm.companyPhone);
  return Boolean(hasFlag && companyName && companyEmail && website && phone);
}

const ROLE_CONFIG = {
  jobseeker: {
    profilePath: "/jobseeker/profile",
    onboardingPath: "/jobseeker/profile?onboarding=1",
    isComplete: isJobseekerProfileComplete,
  },
  employer: {
    profilePath: "/employer/profile",
    onboardingPath: "/employer/profile?onboarding=1",
    isComplete: isEmployerProfileComplete,
  },
};

export function useRequireProfileCompletion(role) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const config = role ? ROLE_CONFIG[role] : undefined;

  const status = useMemo(() => {
    if (!config || !role) {
      return "complete";
    }

    if (!isLoaded || !isSignedIn || !user) {
      return "loading";
    }

    return config.isComplete(user) ? "complete" : "incomplete";
  }, [config, isLoaded, isSignedIn, role, user]);

  useEffect(() => {
    if (!config || !role) {
      return;
    }

    if (status !== "incomplete") {
      return;
    }

    if (!router.isReady) {
      return;
    }

    const profilePath = config.profilePath;
    const onboardingPath = config.onboardingPath;

    if (router.pathname === profilePath) {
      return;
    }

    const current = router.asPath;
    if (current === onboardingPath) {
      return;
    }

    router.replace(onboardingPath);
  }, [config, role, router, status]);

  return { status };
}

export function isJobseekerProfileCompleteForUser(user) {
  return isJobseekerProfileComplete(user);
}

export function isEmployerProfileCompleteForUser(user) {
  return isEmployerProfileComplete(user);
}
