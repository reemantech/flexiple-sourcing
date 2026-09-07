import type { Filters, Profile } from "./schemas";
import profilesData from "@/data/profiles.json";

const ALL_PROFILES = profilesData as Profile[];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function profileHasSkill(profile: Profile, skill: string): boolean {
  const target = norm(skill);
  return profile.skills.some((s) => norm(s).includes(target) || target.includes(norm(s)));
}

function profileMatchesLocation(profile: Profile, locations: string[]): boolean {
  if (locations.length === 0) return true;
  return locations.some((loc) => norm(profile.location).includes(norm(loc)));
}

function profileMatchesCompanyType(profile: Profile, types: string[]): boolean {
  if (types.length === 0) return true;
  const allTypes = [
    profile.current_company_type,
    ...profile.past_companies.map((c) => c.company_type),
  ];
  return types.some((t) => allTypes.includes(t as any));
}

export function applyFilters(filters: Filters): Profile[] {
  return ALL_PROFILES.filter((profile) => {
    if (filters.skills_all.length > 0) {
      if (!filters.skills_all.every((s) => profileHasSkill(profile, s))) return false;
    }
    if (filters.skills_any.length > 0) {
      if (!filters.skills_any.some((s) => profileHasSkill(profile, s))) return false;
    }
    if (
      filters.min_years_experience !== null &&
      profile.years_experience < filters.min_years_experience
    )
      return false;
    if (
      filters.max_years_experience !== null &&
      profile.years_experience > filters.max_years_experience
    )
      return false;
    if (!profileMatchesLocation(profile, filters.locations)) return false;
    if (!profileMatchesCompanyType(profile, filters.company_types)) return false;
    return true;
  });
}

export function getAllProfiles(): Profile[] {
  return ALL_PROFILES;
}
